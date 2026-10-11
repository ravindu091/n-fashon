'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Layers, Package, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdjustStockModal } from '@/components/forms/AdjustStockModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useInstantFilter } from '@/hooks/useInstantFilter'

interface BatchListClientProps {
  initialBatches: any[]
  currentSearch?: string
  currentStatus?: string
}

export function BatchListClient({
  initialBatches,
  currentSearch = '',
  currentStatus = 'active',
}: BatchListClientProps) {
  const [adjustingBatch, setAdjustingBatch] = useState<any | null>(null)

  const {
    filters,
    isPending,
    hasActiveFilters,
    onSearchChange,
    onSelectChange,
    onReset,
    onSubmit,
  } = useInstantFilter(
    {
      search: currentSearch,
      status: currentStatus,
    },
    {
      defaultValues: { status: 'active' },
    }
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Stock Purchase Batches</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Traceable inventory units preserving specific purchase landed costs and remaining balances.
          </p>
        </div>
      </div>

      {/* Standardized Filter Bar with Instant Preview */}
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
              placeholder="Search by batch code, garment name, variant, or supplier..."
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
            name="status"
            value={filters.status || 'active'}
            onChange={(e) => onSelectChange('status', e.target.value)}
            className="filter-select w-full sm:w-56"
          >
            <option value="">All Statuses</option>
            <option value="active">Active (Available)</option>
            <option value="depleted">Depleted (Zero Remaining)</option>
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

      {/* Batches Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Garment / Variant</th>
                <th>Supplier</th>
                <th>Received Date</th>
                <th>Starting</th>
                <th>Remaining</th>
                <th>Landed Unit Cost</th>
                <th>Batch Valuation</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No stock batches found. Batches are generated when purchase orders are physically received.
                  </td>
                </tr>
              ) : (
                initialBatches.map((b) => (
                  <tr key={b._id.toString()}>
                    <td className="font-mono font-bold text-xs">
                      <Link href={`/batches/${b._id}`} className="text-[var(--accent)] hover:underline">
                        {b.batchCode}
                      </Link>
                    </td>
                    <td className="text-xs">
                      <p className="font-semibold text-[var(--foreground)]">{b.productName}</p>
                      <p className="font-mono text-[10px] text-[var(--foreground-muted)]">{b.variantCode} ({b.size}/{b.color})</p>
                    </td>
                    <td className="text-xs">{b.supplierName}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(b.receivedDate)}</td>
                    <td className="text-xs font-semibold">{b.startingQty} pcs</td>
                    <td className="text-xs font-bold text-emerald-600">{b.remainingQty} pcs</td>
                    <td className="text-xs">{formatCurrency(b.landedUnitCost)}</td>
                    <td className="text-xs font-semibold">{formatCurrency(b.remainingQty * b.landedUnitCost)}</td>
                    <td>
                      <Badge variant={b.status === 'active' ? 'success' : 'neutral'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdjustingBatch(b)}
                        className="text-xs py-1 px-2.5"
                      >
                        Adjust
                      </Button>
                      <Link href={`/batches/${b._id}`} className="btn btn-ghost text-xs py-1 px-2">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdjustStockModal
        isOpen={!!adjustingBatch}
        onClose={() => setAdjustingBatch(null)}
        batch={adjustingBatch}
      />
    </div>
  )
}
