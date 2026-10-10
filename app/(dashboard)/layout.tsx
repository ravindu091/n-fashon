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
    if (session.name) {
      // Fast path: instant resolution directly from encrypted JWT token (0ms DB latency)
      user = {
        name: session.name,
        role: session.role,
      }
    } else {
      // Fallback for sessions created before name was saved in JWT
      try {
        await connectDB()
        const userDoc = await User.findById(session.userId).select('name role').lean()
        if (userDoc) {
          user = {
            name: userDoc.name,
            role: userDoc.role,
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
