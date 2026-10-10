import React from 'react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { getUsers, getUserStats } from '@/services/user.service'
import { UserListClient } from '@/components/users/UserListClient'
import connectDB from '@/lib/mongodb'

export const metadata = {
  title: 'User Management | N-Fashion ERP',
  description: 'Manage system users, roles, and access credentials',
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string }>
}) {
  let session
  try {
    session = await requireAuth(['admin'])
  } catch {
    redirect('/dashboard')
  }

  await connectDB()
  const params = await searchParams

  const [users, stats] = await Promise.all([
    getUsers({
      search: params.search,
      role: params.role,
      status: params.status,
    }),
    getUserStats(),
  ])

  return (
    <UserListClient
      initialUsers={users}
      stats={stats}
      currentUserId={session.userId}
      initialSearch={params.search || ''}
      initialRole={params.role || 'all'}
      initialStatus={params.status || 'all'}
    />
  )
}
