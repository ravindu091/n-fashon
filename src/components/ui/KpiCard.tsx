import React from 'react'

export interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  className?: string
}

export function KpiCard({ title, value, subtitle, icon, trend, className = '' }: KpiCardProps) {
  return (
    <div className={`kpi-card flex items-start justify-between ${className}`}>
      <div>
        <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--foreground-muted)] mt-1.5">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}%</span>
            {trend.label && <span className="font-normal text-[var(--foreground-muted)]">{trend.label}</span>}
          </p>
        )}
      </div>
      <div className="kpi-icon">{icon}</div>
    </div>
  )
}
