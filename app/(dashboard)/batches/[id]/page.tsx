import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Layers, History, ShieldCheck } from 'lucide-react'
import { getBatchById } from '@/services/batch.service'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import connectDB from '@/lib/mongodb'


export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const batch = await getBatchById(id)
  if (!batch) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/batches" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {batch.batchCode}
            </span>
            <Badge variant={batch.status === 'active' ? 'success' : 'neutral'}>
              {batch.status}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
            {batch.productName} ({batch.size} / {batch.color})
          </h1>
        </div>
      </div>

      {/* Batch Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Starting Stock</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{batch.startingQty} pcs</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Remaining Stock</p>
          <p className="text-base font-bold text-emerald-600 mt-1">{batch.remainingQty} pcs</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Landed Unit Cost</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(batch.landedUnitCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Total Landed Value</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(batch.remainingQty * batch.landedUnitCost)}</p>
        </div>
      </div>

      {/* Cost Allocation Audit Card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Landed Cost Traceability</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-[var(--border)]">
          <div>
            <span className="text-[var(--foreground-muted)] block">Unit Buying Cost:</span>
            <span className="font-semibold text-sm">{formatCurrency(batch.unitBuyingCost)}</span>
          </div>
          <div>
            <span className="text-[var(--foreground-muted)] block">Allocated Shipping / Piece:</span>
            <span className="font-semibold text-sm">+{formatCurrency(batch.allocatedShippingPerUnit)}</span>
          </div>
          <div>
            <span className="text-[var(--foreground-muted)] block">Final Landed Cost Basis:</span>
            <span className="font-bold text-sm text-emerald-600">={formatCurrency(batch.landedUnitCost)}</span>
          </div>
        </div>
        <div className="text-xs text-[var(--foreground-muted)]">
          Supplier: <strong>{batch.supplierName}</strong> | Received on: <strong>{formatDate(batch.receivedDate)}</strong>
        </div>
      </div>

      {/* Movement History on this Batch */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--foreground-muted)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">Batch Movement History</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Movement Type</th>
                <th>Quantity Change</th>
                <th>Before</th>
                <th>After</th>
                <th>Reference</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {batch.movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[var(--foreground-muted)]">
                    No movements logged for this batch yet.
                  </td>
                </tr>
              ) : (
                batch.movements.map((m: any) => (
                  <tr key={m._id.toString()}>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDateTime(m.createdAt)}</td>
                    <td>
                      <Badge variant={m.qtyChange > 0 ? 'success' : 'danger'}>
                        {m.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className={`text-xs font-bold ${m.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                    </td>
                    <td className="text-xs font-mono">{m.beforeQty}</td>
                    <td className="text-xs font-mono">{m.afterQty}</td>
                    <td className="text-xs font-mono text-[var(--accent)]">{m.referenceNumber || '-'}</td>
                    <td className="text-xs">{m.reason || '-'}</td>
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
