'use client'

import React, { useState } from 'react'
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Boxes,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { SalesChart } from '@/components/charts/SalesChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/currency'

interface ReportsClientProps {
  summary: {
    totalRevenue: number
    totalProductSales: number
    totalCOGS: number
    grossProfit: number
    operatingExpenses: number
    netProfit: number
    grossMarginPercent: number
    totalSalesCount: number
    avgOrderValue: number
  }
  productProfits: {
    productName: string
    productCode: string
    totalQtySold: number
    totalRevenue: number
    totalCOGS: number
    grossProfit: number
  }[]
  channelBreakdown: { _id: string; revenue: number; count: number }[]
  inventoryValuation: {
    totalPieces: number
    totalValuation: number
    byCategory: { category: string; pieces: number; valuation: number }[]
  }
  dailyTrends: { date: string; revenue: number; grossProfit: number }[]
  dateFrom: string
  dateTo: string
}

export function ReportsClient({
  summary,
  productProfits,
  channelBreakdown,
  inventoryValuation,
  dailyTrends,
  dateFrom,
  dateTo,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<'profit' | 'sales' | 'inventory'>('profit')

  return (
    <div className="space-y-6">
      {/* Header & Date Range Form */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Reports & Profit Analytics</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Audited financial calculations, true FIFO gross profit, operating net profit, and inventory assets.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <form method="GET" className="flex items-center gap-2">
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="input text-xs py-1.5"
            />
            <span className="text-xs text-[var(--foreground-muted)]">to</span>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="input text-xs py-1.5"
            />
            <Button type="submit" variant="outline" size="sm">
              Apply Range
            </Button>
          </form>

          <a
            href={`/api/reports/sales?dateFrom=${dateFrom}&dateTo=${dateTo}`}
            download
            className="btn btn-primary text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profit')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'profit'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          Financial & Profitability Summary
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'sales'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          Product Sales & Channels
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'inventory'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          Inventory Asset Valuation
        </button>
      </div>

      {/* TAB 1: PROFITABILITY */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Net Product Revenue"
              value={formatCurrency(summary.totalRevenue)}
              subtitle={`${summary.totalSalesCount} completed sales`}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
            />
            <KpiCard
              title="Cost of Goods Sold (COGS)"
              value={formatCurrency(summary.totalCOGS)}
              subtitle="Landed batch cost basis"
              icon={<Boxes className="w-5 h-5" />}
            />
            <KpiCard
              title="Realized Gross Profit"
              value={formatCurrency(summary.grossProfit)}
              subtitle={`Margin: ${formatPercent(summary.grossMarginPercent)}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            />
            <KpiCard
              title="Net Business Profit"
              value={formatCurrency(summary.netProfit)}
              subtitle={`Less ${formatCurrency(summary.operatingExpenses)} op expenses`}
              icon={<Percent className="w-5 h-5 text-emerald-700" />}
            />
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-[var(--foreground)] mb-1">Daily Revenue & Profit Progression</h2>
            <p className="text-xs text-[var(--foreground-muted)] mb-4">Selected date interval</p>
            <SalesChart data={dailyTrends} />
          </div>

          {/* Product Profitability Breakdown */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Product Profitability Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Code</th>
                    <th>Qty Sold</th>
                    <th>Total Revenue</th>
                    <th>Cost Basis (COGS)</th>
                    <th>Gross Profit</th>
                    <th>Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {productProfits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-[var(--foreground-muted)]">
                        No product sales recorded in this date range.
                      </td>
                    </tr>
                  ) : (
                    productProfits.map((item, i) => {
                      const margin = item.totalRevenue > 0 ? ((item.grossProfit / item.totalRevenue) * 100) : 0
                      return (
                        <tr key={i}>
                          <td className="text-xs font-semibold">{item.productName}</td>
                          <td className="font-mono text-xs">{item.productCode}</td>
                          <td className="text-xs font-bold">{item.totalQtySold} pcs</td>
                          <td className="text-xs font-semibold">{formatCurrency(item.totalRevenue)}</td>
                          <td className="text-xs text-[var(--foreground-muted)]">{formatCurrency(item.totalCOGS)}</td>
                          <td className="text-xs font-bold text-emerald-600">{formatCurrency(item.grossProfit)}</td>
                          <td className="text-xs font-bold">{formatPercent(margin)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & CHANNELS */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="text-sm font-bold text-[var(--foreground)] mb-3">Top Products by Revenue</h2>
              <TopProductsChart
                data={productProfits.map((p) => ({
                  productName: p.productName,
                  totalRevenue: p.totalRevenue,
                  totalQtySold: p.totalQtySold,
                }))}
              />
            </div>

            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
                Sales by Channel Performance
              </h2>
              <div className="space-y-3">
                {channelBreakdown.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-muted)] py-4">No channel data available.</p>
                ) : (
                  channelBreakdown.map((ch) => (
                    <div key={ch._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-[var(--border)]">
                      <div>
                        <p className="text-xs font-bold text-[var(--foreground)] capitalize">{ch._id}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">{ch.count} order(s)</p>
                      </div>
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {formatCurrency(ch.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY VALUATION */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Total Available Stock"
              value={`${formatNumber(inventoryValuation.totalPieces)} pcs`}
              subtitle="Active batch garments"
              icon={<Boxes className="w-5 h-5 text-emerald-600" />}
            />
            <KpiCard
              title="Total Inventory Asset Valuation"
              value={formatCurrency(inventoryValuation.totalValuation)}
              subtitle="Calculated from actual landed costs"
              icon={<DollarSign className="w-5 h-5" />}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Inventory Asset Valuation by Category</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>In-Stock Pieces</th>
                    <th>Landed Cost Asset Value</th>
                    <th>% of Total Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryValuation.byCategory.map((cat, idx) => {
                    const pct = inventoryValuation.totalValuation > 0
                      ? (cat.valuation / inventoryValuation.totalValuation) * 100
                      : 0
                    return (
                      <tr key={idx}>
                        <td className="text-xs font-bold">{cat.category}</td>
                        <td className="text-xs font-semibold">{cat.pieces} pcs</td>
                        <td className="text-xs font-bold text-[var(--foreground)]">{formatCurrency(cat.valuation)}</td>
                        <td className="text-xs font-mono">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
