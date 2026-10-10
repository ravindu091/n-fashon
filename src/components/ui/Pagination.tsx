'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@/types'

export interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = meta

  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-white text-xs text-[var(--foreground-muted)]">
      <div>
        Showing <span className="font-semibold text-[var(--foreground)]">{start}</span> to{' '}
        <span className="font-semibold text-[var(--foreground)]">{end}</span> of{' '}
        <span className="font-semibold text-[var(--foreground)]">{total}</span> results
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded border border-[var(--border)] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 font-medium text-[var(--foreground)]">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={!meta.hasNext}
          onClick={() => onPageChange(page + 1)}
          className="p-1 rounded border border-[var(--border)] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
