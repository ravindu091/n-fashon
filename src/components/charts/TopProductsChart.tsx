'use client'

import React from 'react'
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

interface TopProductsChartProps {
  data: { productName: string; totalRevenue: number; totalQtySold: number }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[var(--foreground-muted)]">
        No product sales recorded yet.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
          <YAxis
            type="category"
            dataKey="productName"
            width={90}
            tick={{ fontSize: 11, fill: '#0F172A' }}
            stroke="#CBD5E1"
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              name === 'Revenue' ? formatCurrency(Number(value) || 0) : String(value),
              String(name),
            ]}
            contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
          />
          <Bar dataKey="totalRevenue" name="Revenue" fill="#1E3A6E" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
