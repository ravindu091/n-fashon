'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PurchaseFormModal } from '@/components/forms/PurchaseFormModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface PurchaseListClientProps {
  initialPurchases: any[]
  suppliers: any[]
  variants: any[]
  currentSearch?: string
  currentStatus?: string
}

export function PurchaseListClient({
  initialPurchases,
  suppliers,
  variants,
  currentSearch = '',
  currentStatus = '',
}: PurchaseListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search by purchase #, supplier, or invoice..."
              className="input pl-9 text-xs"
            />
          </div>
          <select name="status" defaultValue={currentStatus} className="input sm:w-44 text-xs">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
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
