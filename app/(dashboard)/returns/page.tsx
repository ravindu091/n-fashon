import React from 'react'
import Link from 'next/link'
import { Plus, Search, RotateCcw } from 'lucide-react'
import { getReturns } from '@/services/returns.service'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { ReturnsFilterBar } from '@/components/returns/ReturnsFilterBar'
import connectDB from '@/lib/mongodb'


export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const returnsRes = await getReturns({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 50,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Returns & Exchanges</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Trace returned garments, restocking decisions, and customer refunds.
          </p>
        </div>
        <Link href="/returns/new" className="btn btn-primary text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Process Return
        </Link>
      </div>

      {/* Standardized Filter Bar with Instant Preview */}
      <ReturnsFilterBar currentSearch={params.search} />

      {/* Returns Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Return #</th>
                <th>Date</th>
                <th>Sale Order #</th>
                <th>Customer</th>
                <th>Returned Items</th>
                <th>Refund Amount</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returnsRes.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No return records found. Click "Process Return" to record customer returns.
                  </td>
                </tr>
              ) : (
                returnsRes.data.map((r) => (
                  <tr key={r._id.toString()}>
                    <td className="font-mono font-bold text-xs">{r.returnNumber}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(r.returnDate)}</td>
                    <td className="font-mono text-xs font-semibold">
                      <Link href={`/sales/${r.saleId}`} className="text-[var(--accent)] hover:underline">
                        {r.saleNumber}
                      </Link>
                    </td>
                    <td className="text-xs font-semibold">{r.customerName || 'Walk-in'}</td>
                    <td className="text-xs">
                      {r.lines.map((l: any, i: number) => (
                        <div key={i} className="text-[11px]">
                          {l.productName} ({l.size}/{l.color}) × {l.qty}
                          {l.restocked ? (
                            <span className="text-emerald-600 font-semibold ml-1">[Restocked]</span>
                          ) : (
                            <span className="text-red-500 font-semibold ml-1">[{l.condition}]</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="text-xs font-bold text-red-600">{formatCurrency(r.totalRefundAmount)}</td>
                    <td className="text-xs max-w-xs truncate">{r.reason}</td>
                    <td>
                      <Badge variant="success">{r.status}</Badge>
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
