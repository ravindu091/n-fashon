'use client'

import React from 'react'
import { Menu, Bell, User } from 'lucide-react'

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="topnav justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs font-medium text-[var(--foreground-muted)] hidden sm:inline">
          Clothing Reselling Management System
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center text-xs font-semibold">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">Admin User</p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Store Owner</p>
          </div>
        </div>
      </div>
    </header>
  )
}
