'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UseInstantFilterOptions {
  debounceMs?: number
  defaultValues?: Record<string, string>
}

export function useInstantFilter(
  initialParams: Record<string, string | undefined>,
  options: UseInstantFilterOptions = {}
) {
  const { debounceMs = 280, defaultValues = {} } = options
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Local state for instant input reflection
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    Object.entries(initialParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        init[k] = v
      }
    })
    return init
  })

  // Sync if external props change
  useEffect(() => {
    const updated: Record<string, string> = {}
    Object.entries(initialParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        updated[k] = v
      }
    })
    setFilters(updated)
  }, [JSON.stringify(initialParams)])

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Navigate with new params
  const applyParams = useCallback(
    (newFilters: Record<string, string>) => {
      const sp = new URLSearchParams()
      Object.entries(newFilters).forEach(([k, v]) => {
        const defaultVal = defaultValues[k]
        if (v && v.trim() !== '' && v !== 'all' && (defaultVal === undefined || v !== defaultVal)) {
          sp.set(k, v.trim())
        }
      })
      const q = sp.toString()
      const url = q ? `${pathname}?${q}` : pathname
      startTransition(() => {
        router.replace(url, { scroll: false })
      })
    },
    [pathname, router, defaultValues]
  )

  // Live search input change (debounced)
  const onSearchChange = useCallback(
    (value: string, key = 'search') => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        if (!value.trim()) delete next[key]

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          applyParams(next)
        }, debounceMs)

        return next
      })
    },
    [applyParams, debounceMs]
  )

  // Live select dropdown change (immediate)
  const onSelectChange = useCallback(
    (key: string, value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        if (!value || value === 'all' || value === '') {
          delete next[key]
        }
        applyParams(next)
        return next
      })
    },
    [applyParams]
  )

  // Reset all filters
  const onReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFilters({})
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }, [pathname, router])

  // Explicit submit (e.g. Enter key or click filter)
  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (timerRef.current) clearTimeout(timerRef.current)
      applyParams(filters)
    },
    [applyParams, filters]
  )

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
    const defaultVal = defaultValues[k]
    return v && v.trim() !== '' && v !== 'all' && (defaultVal === undefined || v !== defaultVal)
  })

  return {
    filters,
    isPending,
    hasActiveFilters,
    onSearchChange,
    onSelectChange,
    onReset,
    onSubmit,
  }
}
