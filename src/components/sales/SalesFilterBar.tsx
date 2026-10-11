'use client'

import React from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useInstantFilter } from '@/hooks/useInstantFilter'

interface SalesFilterBarProps {
  currentSearch?: string
  currentChannel?: string
  currentPaymentStatus?: string
}

export function SalesFilterBar({
  currentSearch = '',
  currentChannel = '',
  currentPaymentStatus = '',
}: SalesFilterBarProps) {
  const {
    filters,
    isPending,
    hasActiveFilters,
    onSearchChange,
    onSelectChange,
    onReset,
    onSubmit,
  } = useInstantFilter({
    search: currentSearch,
    channel: currentChannel,
    paymentStatus: currentPaymentStatus,
  })

  return (
    <div className="filter-bar">
      <form onSubmit={onSubmit} className="flex flex-col lg:flex-row lg:items-center gap-2.5 w-full">
        <div className="relative flex-1 min-w-[220px]">
          {isPending ? (
            <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin pointer-events-none" />
          ) : (
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          )}
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by sale #, customer name, or garment..."
            className="filter-input pr-8"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          name="channel"
          value={filters.channel || ''}
          onChange={(e) => onSelectChange('channel', e.target.value)}
          className="filter-select w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All Channels</option>
          <option value="physical">Physical</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="other">Other</option>
        </select>
        <select
          name="paymentStatus"
          value={filters.paymentStatus || ''}
          onChange={(e) => onSelectChange('paymentStatus', e.target.value)}
          className="filter-select w-full sm:w-auto min-w-[160px] font-semibold"
        >
          <option value="">All Payment Statuses</option>
          <option value="outstanding">⚠️ Outstanding</option>
          <option value="paid">Paid in Full</option>
          <option value="partial">Partially Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <div className="flex items-center gap-2">
          <button type="submit" className="filter-btn btn-primary" title="Search filter preview">
            Filter
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="filter-btn btn-outline text-slate-600 hover:text-slate-900"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
