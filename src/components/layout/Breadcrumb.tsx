import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-4">
      <Link href="/dashboard" className="hover:text-[var(--foreground)] flex items-center gap-1 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--foreground)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[var(--foreground)]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
