'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Truck, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SupplierFormModal } from '@/components/forms/SupplierFormModal'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface SupplierListClientProps {
  initialSuppliers: any[]
  currentSearch?: string
}

export function SupplierListClient({
  initialSuppliers,
  currentSearch = '',
}: SupplierListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Suppliers & Vendors</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Track garment manufacturers, contact persons, total purchase volumes, and outstanding payables.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Supplier
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
              placeholder="Search by supplier name, phone, or code..."
              className="filter-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="filter-btn btn-primary">
              Filter
            </button>
            {currentSearch && (
              <a href="/suppliers" className="filter-btn btn-outline text-slate-600 hover:text-slate-900" title="Clear search">
                Reset
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Suppliers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier / Business</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Total Purchases</th>
                <th>Outstanding Payable</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No suppliers found. Click "Add Supplier" to register your vendor contacts.
                  </td>
                </tr>
              ) : (
                initialSuppliers.map((s) => (
                  <tr key={s._id.toString()}>
                    <td className="font-mono font-bold text-xs">
                      <Link href={`/suppliers/${s._id}`} className="text-[var(--accent)] hover:underline">
                        {s.code}
                      </Link>
                    </td>
                    <td className="text-xs font-semibold text-[var(--foreground)]">
                      <Link href={`/suppliers/${s._id}`} className="hover:text-[var(--accent)]">
                        {s.name}
                      </Link>
                    </td>
                    <td className="text-xs">{s.contactPerson || '-'}</td>
                    <td className="text-xs font-mono">{s.phone}</td>
                    <td className="text-xs font-semibold">{formatCurrency(s.totalPurchases)}</td>
                    <td className={`text-xs font-bold ${s.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatCurrency(s.outstandingBalance)}
                    </td>
                    <td>
                      <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => setEditingSupplier(s)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Edit Supplier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/suppliers/${s._id}`}
                        className="btn btn-outline text-xs px-2 py-0.5"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierFormModal
        isOpen={isCreateOpen || !!editingSupplier}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingSupplier(null)
        }}
        initialData={editingSupplier}
      />
    </div>
  )
}
