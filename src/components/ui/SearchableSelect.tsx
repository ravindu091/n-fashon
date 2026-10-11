'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

export interface SearchableOption {
  value: string
  label: string
  sublabel?: string
  badge?: string
  badgeVariant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info'
  disabled?: boolean
  searchTerms?: string
}

export interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  className = '',
  emptyMessage = 'No options found',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value)
  }, [options, value])

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase().trim()
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q)
      const matchSublabel = opt.sublabel?.toLowerCase().includes(q)
      const matchSearchTerms = opt.searchTerms?.toLowerCase().includes(q)
      return matchLabel || matchSublabel || matchSearchTerms
    })
  }, [options, query])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0
        scrollItemIntoView(next)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1
        scrollItemIntoView(next)
        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = filteredOptions[highlightedIndex]
      if (target && !target.disabled) {
        onChange(target.value)
        setIsOpen(false)
      }
    }
  }

  const scrollItemIntoView = (index: number) => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-option-item]')
    const target = items[index] as HTMLElement | undefined
    if (target) {
      target.scrollIntoView({ block: 'nearest' })
    }
  }

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'info':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'primary':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-[38px] px-3 py-1.5 flex items-center justify-between text-left text-xs rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-card text-[var(--foreground)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-500/10 ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-slate-400 cursor-pointer'
        } ${isOpen ? 'border-[var(--accent)] ring-2 ring-blue-500/10' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="font-medium text-[var(--foreground)] truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-[var(--foreground-muted)] shrink-0 truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-[var(--placeholder)] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getBadgeStyle(
                selectedOption.badgeVariant
              )}`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full z-50 bg-white rounded-lg border border-[var(--border)] shadow-xl overflow-hidden animate-in fade-in duration-100 min-w-[280px]">
          {/* Search Box */}
          <div className="p-2 border-b border-[var(--border)] bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-7 text-xs rounded border border-[var(--border-strong)] bg-white text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-blue-500/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100/60" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--foreground-muted)]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHighlighted = idx === highlightedIndex

                return (
                  <div
                    key={opt.value}
                    data-option-item
                    onClick={() => {
                      if (!opt.disabled) {
                        onChange(opt.value)
                        setIsOpen(false)
                      }
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                    className={`px-2.5 py-2 rounded text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isSelected
                        ? 'bg-blue-50 text-blue-900 font-medium'
                        : isHighlighted
                        ? 'bg-slate-100 text-[var(--foreground)]'
                        : 'text-[var(--foreground)] hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      {opt.sublabel && (
                        <div className="text-[11px] text-[var(--foreground-muted)] mt-0.5 truncate font-normal">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>

                    {opt.badge && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(
                          opt.badgeVariant
                        )}`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
