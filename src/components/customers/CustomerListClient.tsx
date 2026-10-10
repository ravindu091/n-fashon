'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CustomerFormModal } from '@/components/forms/CustomerFormModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface CustomerListClientProps {
  initialCustomers: any[]
  currentSearch?: string
}

export function CustomerListClient({
  initialCustomers,
  currentSearch = '',
}: CustomerListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Customer Registry</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Manage contact details, order history, and credit/receivable balances.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Customer
        </Button>
      </div>

      {/* Standardized Filter Bar */}
      <div className="filter-bar">
        <form method="GET" className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search by customer name, phone, or code..."
              className="filter-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="filter-btn btn-primary">
              Filter
            </button>
            {currentSearch && (
              <a href="/customers" className="filter-btn btn-outline text-slate-600 hover:text-slate-900" title="Clear search">
                Reset
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Delivery Address</th>
                <th>Total Purchases</th>
                <th>Outstanding Balance</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No customers found. Click "Add Customer" to register your clients.
                  </td>
                </tr>
              ) : (
                initialCustomers.map((c) => (
                  <tr key={c._id.toString()}>
                    <td className="font-mono font-bold text-xs">{c.code}</td>
                    <td className="text-xs font-semibold text-[var(--foreground)]">{c.name}</td>
                    <td className="text-xs font-mono">{c.phone}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{c.email || '-'}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{c.address || '-'}</td>
                    <td className="text-xs font-semibold">{formatCurrency(c.totalPurchases)}</td>
                    <td className={`text-xs font-bold ${c.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatCurrency(c.outstandingBalance)}
                    </td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(c.createdAt)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setEditingCustomer(c)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Edit Customer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerFormModal
        isOpen={isCreateOpen || !!editingCustomer}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingCustomer(null)
        }}
        initialData={editingCustomer}
      />
    </div>
  )
}
