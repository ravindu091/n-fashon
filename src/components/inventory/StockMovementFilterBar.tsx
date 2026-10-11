'use client'

import React from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useInstantFilter } from '@/hooks/useInstantFilter'

interface StockMovementFilterBarProps {
  currentSearch?: string
  currentType?: string
}

export function StockMovementFilterBar({
  currentSearch = '',
  currentType = '',
}: StockMovementFilterBarProps) {
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
    type: currentType,
  })

  return (
    <div className="filter-bar">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
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
            placeholder="Search by variant code, garment name, or reference #..."
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
          name="type"
          value={filters.type || ''}
          onChange={(e) => onSelectChange('type', e.target.value)}
          className="filter-select w-full sm:w-60"
        >
          <option value="">All Movement Types</option>
          <option value="purchase_receipt">Purchase Receipt (+)</option>
          <option value="sale">Sale Order (-)</option>
          <option value="customer_return">Customer Return (+)</option>
          <option value="damaged">Damaged Stock</option>
          <option value="missing">Missing Stock</option>
          <option value="manual_adjustment">Manual Adjustment</option>
          <option value="stock_correction">Stock Correction</option>
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
              title="Clear all filters"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
