'use client'

import React, { useState, useMemo } from 'react'
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  ShieldCheck,
  Boxes,
  ShoppingCart,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Power,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserFormModal } from '@/components/forms/UserFormModal'
import { deleteUserAction, toggleUserStatusAction } from '@/actions/user.actions'
import { formatDate, formatDateTime } from '@/utils/date'
import type { SafeUser, UserStats, UserRole } from '@/types'
import { useRouter } from 'next/navigation'

interface UserListClientProps {
  initialUsers: SafeUser[]
  stats: UserStats
  currentUserId: string
  initialSearch?: string
  initialRole?: string
  initialStatus?: string
}

export function UserListClient({
  initialUsers,
  stats,
  currentUserId,
  initialSearch = '',
  initialRole = 'all',
  initialStatus = 'all',
}: UserListClientProps) {
  const router = useRouter()

  const [search, setSearch] = useState(initialSearch)
  const [roleFilter, setRoleFilter] = useState(initialRole)
  const [statusFilter, setStatusFilter] = useState(initialStatus)

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null)

  // Confirm dialogs
  const [deletingUser, setDeletingUser] = useState<SafeUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusTogglingUser, setStatusTogglingUser] = useState<SafeUser | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  // Notification / error feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filter users based on search and selected filters
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((u) => {
      const matchSearch =
        !search.trim() ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())

      const matchRole = roleFilter === 'all' || u.role === roleFilter

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive)

      return matchSearch && matchRole && matchStatus
    })
  }, [initialUsers, search, roleFilter, statusFilter])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleOpenEdit = (user: SafeUser) => {
    setEditingUser(user)
    setIsFormOpen(true)
    setFeedback(null)
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setIsDeleting(true)
    try {
      const res = await deleteUserAction(deletingUser._id)
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete user')
      }
      setFeedback({ type: 'success', message: `User "${deletingUser.name}" was successfully removed.` })
      setDeletingUser(null)
      router.refresh()
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message })
      setDeletingUser(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!statusTogglingUser) return
    setIsToggling(true)
    try {
      const res = await toggleUserStatusAction(statusTogglingUser._id)
      if (!res.success) {
        throw new Error(res.error || 'Failed to update user status')
      }
      const newStatus = res.data?.isActive ? 'activated' : 'deactivated'
      setFeedback({
        type: 'success',
        message: `Account for "${statusTogglingUser.name}" has been ${newStatus}.`,
      })
      setStatusTogglingUser(null)
      router.refresh()
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message })
      setStatusTogglingUser(null)
    } finally {
      setIsToggling(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </span>
        )
      case 'inventory_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Boxes className="w-3.5 h-3.5" />
            Inventory Manager
          </span>
        )
      case 'sales_staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShoppingCart className="w-3.5 h-3.5" />
            Sales Staff
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Create and manage staff accounts, assign operational roles, and safeguard system credentials.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          leftIcon={<UserPlus className="w-4 h-4" />}
          variant="primary"
        >
          Add New User
        </Button>
      </div>

      {/* Alert / Feedback message */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Accounts"
          value={stats.total}
          subtitle={`${stats.activeCount} active, ${stats.inactiveCount} inactive`}
          icon={<UsersIcon className="w-5 h-5 text-slate-600" />}
        />
        <KpiCard
          title="Administrators"
          value={stats.adminCount}
          subtitle="Full access & security"
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
        />
        <KpiCard
          title="Inventory Staff"
          value={stats.inventoryCount}
          subtitle="Stock & purchases"
          icon={<Boxes className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Sales / POS Staff"
          value={stats.salesCount}
          subtitle="Sales & receipts"
          icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Standardized Filter and Search Bar */}
      <div className="filter-bar">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name or email address..."
              className="filter-input pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select w-full sm:w-auto min-w-[160px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="inventory_manager">Inventory Managers</option>
              <option value="sales_staff">Sales Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select w-full sm:w-auto min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                className="filter-btn btn-outline text-slate-600 hover:text-slate-900"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>System Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Account Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user._id === currentUserId
                  return (
                    <tr key={user._id} className={!user.isActive ? 'opacity-65' : ''}>
                      {/* User Info */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : user.role === 'inventory_manager'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[var(--foreground)] truncate">
                                {user.name}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[var(--foreground-muted)] font-mono block truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>{renderRoleBadge(user.role)}</td>

                      {/* Status */}
                      <td>
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="text-xs text-[var(--foreground-muted)]">
                        {user.lastLoginAt ? (
                          <span title={formatDateTime(user.lastLoginAt)}>
                            {formatDateTime(user.lastLoginAt)}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Never logged in</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="text-xs text-[var(--foreground-muted)]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[var(--primary)] transition-colors"
                            title="Edit user details or reset password"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Toggle Active status */}
                          <button
                            onClick={() => setStatusTogglingUser(user)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : user.isActive
                                ? 'hover:bg-amber-50 text-slate-600 hover:text-amber-600'
                                : 'hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'
                            }`}
                            title={
                              isSelf
                                ? 'Cannot deactivate your own account'
                                : user.isActive
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'hover:bg-red-50 text-slate-600 hover:text-red-600'
                            }`}
                            title={isSelf ? 'Cannot delete your own account' : 'Delete user account'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Create & Edit) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingUser}
        currentUserId={currentUserId}
        onSuccess={() => {
          setFeedback({
            type: 'success',
            message: editingUser
              ? `User "${editingUser.name}" updated successfully.`
              : 'New user account created successfully.',
          })
          router.refresh()
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for "${deletingUser?.name}" (${deletingUser?.email})? This action cannot be undone.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Confirm Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={!!statusTogglingUser}
        onClose={() => setStatusTogglingUser(null)}
        onConfirm={handleToggleStatus}
        title={statusTogglingUser?.isActive ? 'Deactivate User Account' : 'Activate User Account'}
        message={
          statusTogglingUser?.isActive
            ? `Deactivating "${statusTogglingUser?.name}" will revoke their access to the system immediately. You can re-activate this account anytime.`
            : `Activating "${statusTogglingUser?.name}" will restore their login access.`
        }
        confirmText={statusTogglingUser?.isActive ? 'Deactivate Account' : 'Activate Account'}
        variant={statusTogglingUser?.isActive ? 'danger' : 'primary'}
        isLoading={isToggling}
      />
    </div>
  )
}
