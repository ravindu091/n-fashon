'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ShoppingBag, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PurchaseFormModal } from '@/components/forms/PurchaseFormModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useInstantFilter } from '@/hooks/useInstantFilter'

interface PurchaseListClientProps {
  initialPurchases: any[]
  suppliers: any[]
  variants: any[]
  currentSearch?: string
  currentStatus?: string
  currentPaymentStatus?: string
}

export function PurchaseListClient({
  initialPurchases,
  suppliers,
  variants,
  currentSearch = '',
  currentStatus = '',
  currentPaymentStatus = '',
}: PurchaseListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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
    status: currentStatus,
    paymentStatus: currentPaymentStatus,
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received':
        return 'success'
      case 'partially_received':
        return 'info'
      case 'ordered':
        return 'primary'
      case 'cancelled':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Purchase Orders</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Manage incoming supplier orders, batch generation, and landed costs.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Purchase Order
        </Button>
      </div>

      {/* Standardized Filter Bar with Instant Preview */}
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
              placeholder="Search by purchase #, supplier, or invoice..."
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
            value={filters.status || ''}
            onChange={(e) => onSelectChange('status', e.target.value)}
            className="filter-select w-full sm:w-auto min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            name="paymentStatus"
            value={filters.paymentStatus || ''}
            onChange={(e) => onSelectChange('paymentStatus', e.target.value)}
            className="filter-select w-full sm:w-auto min-w-[170px] font-semibold text-[var(--foreground)]"
          >
            <option value="">All Payment Statuses</option>
            <option value="outstanding">⚠️ Outstanding Balance</option>
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

      {/* Purchase Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total Cost</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No purchase orders recorded yet. Click "New Purchase Order" to record stock.
                  </td>
                </tr>
              ) : (
                initialPurchases.map((p) => (
                  <tr key={p._id.toString()}>
                    <td className="font-mono font-bold text-xs">
                      <Link href={`/purchases/${p._id}`} className="text-[var(--accent)] hover:underline">
                        {p.purchaseNumber}
                      </Link>
                    </td>
                    <td className="text-xs font-semibold">{p.supplierName}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(p.purchaseDate)}</td>
                    <td className="text-xs font-semibold">{formatCurrency(p.totalCost)}</td>
                    <td className="text-xs text-green-600 font-medium">{formatCurrency(p.amountPaid)}</td>
                    <td className="text-xs text-red-600 font-medium">{formatCurrency(p.outstandingBalance)}</td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(p.status)}>
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={p.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {p.paymentStatus}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Link href={`/purchases/${p._id}`} className="btn btn-outline text-xs px-2.5 py-1">
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

      <PurchaseFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        suppliers={suppliers}
        variants={variants}
      />
    </div>
  )
}
