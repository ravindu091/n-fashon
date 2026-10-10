import React from 'react'
import { PackageOpen } from 'lucide-react'

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title = 'No items found',
  description = 'Get started by creating your first record.',
  icon = <PackageOpen className="w-10 h-10 text-[var(--foreground-muted)]" />,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-white">
      <div className="mb-3 p-3 bg-slate-50 rounded-full">{icon}</div>
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="text-xs text-[var(--foreground-muted)] max-w-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
