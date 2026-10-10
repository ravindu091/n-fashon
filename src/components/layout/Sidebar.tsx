'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  RotateCcw,
  BarChart3,
  History,
  Settings,
  Menu,
  ChevronLeft,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Shirt },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/batches', label: 'Stock Batches', icon: Layers },
  { href: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/returns', label: 'Returns & Exchanges', icon: RotateCcw },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/stock-movements', label: 'Movement History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''} z-50 flex flex-col justify-between`}
      >
        <div>
          {/* Logo & brand header */}
          <div className="h-[60px] border-b border-slate-700/60 flex items-center justify-between px-4">
            {!collapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0">
                  NF
                </div>
                <div className="truncate">
                  <h1 className="font-bold text-sm text-white tracking-tight leading-none">N-Fashion</h1>
                  <span className="text-[10px] text-slate-400 font-medium">Reselling ERP</span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center font-bold text-white text-sm mx-auto shadow-sm">
                NF
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation link list */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100dvh-130px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer / logout */}
        <div className="p-3 border-t border-slate-700/60">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className={`w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
