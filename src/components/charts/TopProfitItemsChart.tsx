'use client'

import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/utils/currency'
import { TrendingUp, Layers, Shirt } from 'lucide-react'

export interface ProfitItem {
  productName: string
  productCode?: string
  totalQtySold: number
  totalRevenue: number
  totalCOGS?: number
  grossProfit: number
  marginPercent?: number
}

interface TopProfitItemsChartProps {
  productsData: ProfitItem[]
  variantsData?: ProfitItem[]
}

export function TopProfitItemsChart({ productsData = [], variantsData = [] }: TopProfitItemsChartProps) {
  const [viewMode, setViewMode] = useState<'product' | 'variant'>('product')

  const activeData = viewMode === 'product' ? productsData : variantsData.length > 0 ? variantsData : productsData

  if (!activeData || activeData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-[var(--foreground-muted)] gap-1">
        <TrendingUp className="w-6 h-6 text-slate-300 mb-1" />
        <span>No sales profit data recorded yet.</span>
        <span className="text-[10px] text-slate-400">Record confirmed sales to see top profitable items.</span>
      </div>
    )
  }

  const topPerformer = activeData[0]

  return (
    <div className="space-y-3 w-full">
      {/* Header controls: Top performer badge & Mode switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {topPerformer ? (
          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
            <span className="font-bold">#1 Top Profit:</span>
            <span className="truncate max-w-[150px] font-medium" title={topPerformer.productName}>
              {topPerformer.productName}
            </span>
            <strong className="font-mono text-emerald-700">+{formatCurrency(topPerformer.grossProfit)}</strong>
          </div>
        ) : <div />}

        {variantsData.length > 0 && (
          <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('product')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                viewMode === 'product'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              By Product
            </button>
            <button
              type="button"
              onClick={() => setViewMode('variant')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                viewMode === 'variant'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              By Variant
            </button>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748B' }}
              stroke="#CBD5E1"
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="productName"
              width={100}
              tick={{ fontSize: 11, fill: '#0F172A' }}
              stroke="#CBD5E1"
              tickFormatter={(name) => (name.length > 13 ? `${name.substring(0, 12)}…` : name)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const item = payload[0].payload as ProfitItem
                return (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 min-w-[200px]">
                    <div className="border-b border-slate-100 pb-1">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      {item.productCode && (
                        <p className="font-mono text-[10px] text-slate-400">{item.productCode}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 font-semibold pt-0.5">
                      <span>Gross Profit:</span>
                      <span className="font-mono font-bold text-sm">+{formatCurrency(item.grossProfit)}</span>
                    </div>
                    {item.marginPercent !== undefined && (
                      <div className="flex justify-between items-center text-slate-600 text-[11px]">
                        <span>Profit Margin:</span>
                        <span className="font-mono font-bold text-emerald-600">{item.marginPercent}%</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span>Total Revenue:</span>
                      <span className="font-mono">{formatCurrency(item.totalRevenue)}</span>
                    </div>
                    {item.totalCOGS !== undefined && (
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Cost Basis (COGS):</span>
                        <span className="font-mono">{formatCurrency(item.totalCOGS)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-500 text-[11px] pt-0.5 border-t border-slate-100">
                      <span>Quantity Sold:</span>
                      <span className="font-bold">{item.totalQtySold} pcs</span>
                    </div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="grossProfit"
              name="Gross Profit"
              fill="#10B981"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
