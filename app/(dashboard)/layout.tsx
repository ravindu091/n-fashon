import React from 'react'
import { cookies } from 'next/headers'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Reading cookies marks all child dashboard routes as dynamic on-demand rendering (ƒ Dynamic)
  await cookies()

  return <DashboardShell>{children}</DashboardShell>
}
