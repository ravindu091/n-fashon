import React from 'react'
import {
  getDashboardKPIs,
  getDailySales,
  getRevenueByProduct,
} from '@/services/reports.service'
import { getSales } from '@/services/sales.service'
import { StockMovement } from '@/models/StockMovement'
import connectDB from '@/lib/mongodb'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { SalesChart } from '@/components/charts/SalesChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { formatCurrency, formatNumber } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Truck,
  PlusCircle,
  ShoppingBag,
  ArrowRight,
  Shirt,
} from 'lucide-react'
import { subDays } from 'date-fns'


export default async function DashboardPage() {
  await connectDB()

  const thirtyDaysAgo = subDays(new Date(), 30)
  const today = new Date()

  const [kpis, dailySales, topProducts, recentSalesRes, recentMovements] = await Promise.all([
    getDashboardKPIs(),
    getDailySales(thirtyDaysAgo, today),
    getRevenueByProduct(thirtyDaysAgo, today, 5),
    getSales({ limit: 5 }),
    StockMovement.find().sort({ createdAt: -1 }).limit(5).lean(),
  ])

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Live business overview, inventory levels, and financial performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/new" className="btn btn-primary text-xs">
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Record Sale
          </Link>
          <Link href="/purchases" className="btn btn-outline text-xs">
            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
            New Purchase
          </Link>
        </div>
      </div>

      {/* Row 1: Primary Financial & Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Sales"
          value={formatCurrency(kpis.todayRevenue)}
          subtitle={`${kpis.todayCount} completed order(s)`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="Current Month Sales"
          value={formatCurrency(kpis.monthRevenue)}
          subtitle="Revenue earned this month"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          title="Month Gross Profit"
          value={formatCurrency(kpis.monthGrossProfit)}
          subtitle={`Net: ${formatCurrency(kpis.monthNetProfit)}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Available Pieces"
          value={`${formatNumber(kpis.totalPieces)} pcs`}
          subtitle={`Valuation: ${formatCurrency(kpis.inventoryValue)}`}
          icon={<Package className="w-5 h-5" />}
        />
      </div>

      {/* Row 2: Secondary Alert & Balance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Inventory Cost Value"
          value={formatCurrency(kpis.inventoryValue)}
          subtitle="At landed batch cost"
          icon={<Shirt className="w-5 h-5" />}
        />
        <KpiCard
          title="Low Stock Alerts"
          value={`${kpis.lowStockCount} items`}
          subtitle="Requires replenishment"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
        <KpiCard
          title="Customer Outstanding"
          value={formatCurrency(kpis.customerOutstanding)}
          subtitle="Uncollected payments"
          icon={<Users className="w-5 h-5" />}
        />
        <KpiCard
          title="Supplier Outstanding"
          value={formatCurrency(kpis.supplierOutstanding)}
          subtitle="Payable purchase balances"
          icon={<Truck className="w-5 h-5 text-red-500" />}
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">Revenue & Gross Profit Trend</h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">Past 30 days performance</p>
            </div>
            <Link href="/reports" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">
              Full Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <SalesChart data={dailySales} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)]">Top Selling Garments</h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">Highest revenue products</p>
            </div>
          </div>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Row 4: Recent Sales & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Recent Sales</h2>
            <Link href="/sales" className="text-xs text-[var(--accent)] hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSalesRes.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-[var(--foreground-muted)]">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSalesRes.data.map((sale) => (
                    <tr key={sale._id.toString()}>
                      <td className="font-mono text-xs font-semibold">
                        <Link href={`/sales/${sale._id}`} className="text-[var(--accent)] hover:underline">
                          {sale.saleNumber}
                        </Link>
                      </td>
                      <td className="text-xs">{formatDate(sale.saleDate)}</td>
                      <td className="text-xs">{sale.customerName || 'Walk-in Customer'}</td>
                      <td className="text-xs font-semibold">{formatCurrency(sale.totalAmount)}</td>
                      <td>
                        <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Stock Movements */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Latest Stock Ledger Movements</h2>
            <Link href="/stock-movements" className="text-xs text-[var(--accent)] hover:underline">
              Full Ledger
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Garment / Variant</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Balance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-[var(--foreground-muted)]">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentMovements.map((m) => (
                    <tr key={m._id.toString()}>
                      <td className="text-xs">
                        <p className="font-semibold">{m.productName}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] font-mono">{m.variantCode}</p>
                      </td>
                      <td>
                        <Badge variant={m.qtyChange > 0 ? 'success' : 'danger'}>
                          {m.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className={`text-xs font-bold ${m.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange}
                      </td>
                      <td className="text-xs font-mono">{m.afterQty}</td>
                      <td className="text-xs text-[var(--foreground-muted)]">{formatDate(m.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
