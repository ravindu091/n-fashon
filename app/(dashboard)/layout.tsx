import React from 'react'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Reading cookies marks all child dashboard routes as dynamic on-demand rendering (ƒ Dynamic)
  await cookies()
  const session = await getSession()
  let user = null

  if (session?.userId) {
    try {
      await connectDB()
      const userDoc = await User.findById(session.userId).select('name email role').lean()
      if (userDoc) {
        user = {
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role,
        }
      }
    } catch {
      // Fallback gracefully
    }
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
