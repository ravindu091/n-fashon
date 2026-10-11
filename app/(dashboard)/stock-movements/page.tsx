import React from 'react'
import connectDB from '@/lib/mongodb'
import { StockMovement } from '@/models/StockMovement'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Search, Download, History } from 'lucide-react'
import { formatDateTime } from '@/utils/date'
import { StockMovementFilterBar } from '@/components/inventory/StockMovementFilterBar'


export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const query: Record<string, unknown> = {}
  if (params.type) query.type = params.type

  if (params.search) {
    query.$or = [
      { variantCode: { $regex: params.search, $options: 'i' } },
      { productName: { $regex: params.search, $options: 'i' } },
      { referenceNumber: { $regex: params.search, $options: 'i' } },
      { reason: { $regex: params.search, $options: 'i' } },
    ]
  }

  const movements = await StockMovement.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Stock Movement Audit Ledger</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Immutable transaction history of every physical stock increment and deduction in the system.
          </p>
        </div>
        <a href="/api/reports/movements" download className="btn btn-outline text-xs">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Ledger (CSV)
        </a>
      </div>

      {/* Standardized Filter Bar with Instant Preview */}
      <StockMovementFilterBar
        currentSearch={params.search}
        currentType={params.type}
      />

      {/* Movement Ledger Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Garment / Variant</th>
                <th>Change</th>
                <th>Before</th>
                <th>After</th>
                <th>Reference #</th>
                <th>Reason / Audit Notes</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No stock movements logged. Movements are recorded automatically on purchase receipts, sales, adjustments, and returns.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id.toString()}>
                    <td className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatDateTime(m.createdAt)}
                    </td>
                    <td>
                      <Badge variant={m.qtyChange > 0 ? 'success' : 'danger'}>
                        {m.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="text-xs">
                      <p className="font-bold text-[var(--foreground)]">{m.productName}</p>
                      <p className="font-mono text-[10px] text-[var(--foreground-muted)]">
                        {m.variantCode} ({m.size} / {m.color})
                      </p>
                    </td>
                    <td className={`text-xs font-bold ${m.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                    </td>
                    <td className="text-xs font-mono">{m.beforeQty}</td>
                    <td className="text-xs font-mono font-bold text-[var(--foreground)]">{m.afterQty}</td>
                    <td className="font-mono text-xs text-[var(--accent)]">{m.referenceNumber || '-'}</td>
                    <td className="text-xs max-w-xs">{m.reason || m.notes || '-'}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{m.userName || 'System'}</td>
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
