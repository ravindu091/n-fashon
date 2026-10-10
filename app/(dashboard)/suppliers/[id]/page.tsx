import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck, ShoppingBag } from 'lucide-react'
import { getSupplierById, getSupplierPurchaseHistory } from '@/services/supplier.service'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import connectDB from '@/lib/mongodb'


export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const [supplier, purchasesRes] = await Promise.all([
    getSupplierById(id),
    getSupplierPurchaseHistory(id),
  ])

  if (!supplier) notFound()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {supplier.code}
            </span>
            <Badge variant="success">{supplier.status}</Badge>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
            {supplier.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Contact Person</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{supplier.contactPerson || '-'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Phone</p>
          <p className="text-base font-mono font-bold text-[var(--foreground)] mt-1">{supplier.phone}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Total Volume</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(supplier.totalPurchases)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Outstanding Balance</p>
          <p className={`text-base font-bold mt-1 ${supplier.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(supplier.outstandingBalance)}
          </p>
        </div>
      </div>

      {/* Purchase History */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Purchase Orders from this Supplier</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Date</th>
                <th>Total Cost</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchasesRes.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[var(--foreground-muted)]">
                    No purchase orders recorded for this supplier.
                  </td>
                </tr>
              ) : (
                purchasesRes.data.map((p: any) => (
                  <tr key={p._id.toString()}>
                    <td className="font-mono text-xs font-bold">
                      <Link href={`/purchases/${p._id}`} className="text-[var(--accent)] hover:underline">
                        {p.purchaseNumber}
                      </Link>
                    </td>
                    <td className="text-xs">{formatDate(p.purchaseDate)}</td>
                    <td className="text-xs font-semibold">{formatCurrency(p.totalCost)}</td>
                    <td className="text-xs text-green-600 font-medium">{formatCurrency(p.amountPaid)}</td>
                    <td className="text-xs text-red-600 font-medium">{formatCurrency(p.outstandingBalance)}</td>
                    <td>
                      <Badge variant="neutral">{p.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
