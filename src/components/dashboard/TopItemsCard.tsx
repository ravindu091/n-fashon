'use client'

import React, { useState } from 'react'
import { TopProfitItemsChart, ProfitItem } from '@/components/charts/TopProfitItemsChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'

interface TopItemsCardProps {
  profitProducts: ProfitItem[]
  profitVariants?: ProfitItem[]
  revenueProducts: { productName: string; totalRevenue: number; totalQtySold: number }[]
}

export function TopItemsCard({
  profitProducts = [],
  profitVariants = [],
  revenueProducts = [],
}: TopItemsCardProps) {
  const [metric, setMetric] = useState<'profit' | 'revenue'>('profit')

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            {metric === 'profit' ? 'Best Profit Items' : 'Top Selling Garments'}
          </h2>
          <p className="text-[11px] text-[var(--foreground-muted)]">
            {metric === 'profit'
              ? 'Ranked by highest net gross profit earned'
              : 'Ranked by highest total sales revenue'}
          </p>
        </div>

        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMetric('profit')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              metric === 'profit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Best Profit
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              metric === 'revenue'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue
          </button>
        </div>
      </div>

      {metric === 'profit' ? (
        <TopProfitItemsChart productsData={profitProducts} variantsData={profitVariants} />
      ) : (
        <TopProductsChart data={revenueProducts} />
      )}
    </div>
  )
}
