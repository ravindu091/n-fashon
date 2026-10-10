import React from 'react'
import Link from 'next/link'
import { Plus, Search, ShoppingCart, Eye } from 'lucide-react'
import { getSales } from '@/services/sales.service'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import connectDB from '@/lib/mongodb'


export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; channel?: string; paymentStatus?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const salesRes = await getSales({
    search: params.search,
    channel: params.channel,
    paymentStatus: params.paymentStatus,
    page: params.page ? Number(params.page) : 1,
    limit: 50,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Sales Orders</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Record customer orders, track sales channels, and verify realized profit margins.
          </p>
        </div>
        <Link href="/sales/new" className="btn btn-primary text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Record New Sale
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="Search by sale #, customer name, or garment..."
              className="input pl-9 text-xs"
            />
          </div>
          <select name="channel" defaultValue={params.channel || ''} className="input sm:w-40 text-xs">
            <option value="">All Channels</option>
            <option value="physical">Physical</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="other">Other</option>
          </select>
          <select name="paymentStatus" defaultValue={params.paymentStatus || ''} className="input sm:w-44 text-xs font-semibold">
            <option value="">All Payment Statuses</option>
            <option value="outstanding">⚠️ Outstanding (Unpaid & Partial)</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Total Revenue</th>
                <th>Batch COGS</th>
                <th>Gross Profit</th>
                <th>Payment</th>
                <th>Outstanding</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {salesRes.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No sales found matching criteria. Click "Record New Sale" to complete a checkout.
                  </td>
                </tr>
              ) : (
                salesRes.data.map((sale) => (
                  <tr key={sale._id.toString()}>
                    <td className="font-mono font-bold text-xs">
                      <Link href={`/sales/${sale._id}`} className="text-[var(--accent)] hover:underline">
                        {sale.saleNumber}
                      </Link>
                    </td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(sale.saleDate)}</td>
                    <td className="text-xs font-semibold">{sale.customerName || 'Walk-in'}</td>
                    <td>
                      <Badge variant="neutral" className="capitalize">
                        {sale.channel}
                      </Badge>
                    </td>
                    <td className="text-xs font-bold text-[var(--foreground)]">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatCurrency(sale.totalCOGS)}</td>
                    <td className="text-xs font-bold text-emerald-600">{formatCurrency(sale.grossProfit)}</td>
                    <td>
                      <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                        {sale.paymentStatus}
                      </Badge>
                    </td>
                    <td className={`text-xs font-semibold ${sale.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {formatCurrency(sale.outstandingBalance)}
                    </td>
                    <td className="text-right">
                      <Link href={`/sales/${sale._id}`} className="btn btn-outline text-xs px-2.5 py-1">
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
    </div>
  )
}
