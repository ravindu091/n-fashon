'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Layers, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AdjustStockModal } from '@/components/forms/AdjustStockModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

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

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search by batch code, garment name, variant, or supplier..."
              className="input pl-9 text-xs"
            />
          </div>
          <select name="status" defaultValue={currentStatus} className="input sm:w-44 text-xs">
            <option value="">All Statuses</option>
            <option value="active">Active (Available)</option>
            <option value="depleted">Depleted (Zero Remaining)</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
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
