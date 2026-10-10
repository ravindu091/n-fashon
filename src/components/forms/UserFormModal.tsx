'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createUserAction, updateUserAction } from '@/actions/user.actions'
import type { SafeUser, UserRole } from '@/types'
import { Shield, Eye, EyeOff } from 'lucide-react'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: SafeUser | null
  currentUserId?: string
}

export function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  currentUserId,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('sales_staff')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(true)

  const isEdit = !!initialData
  const isSelf = isEdit && initialData?._id === currentUserId

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setEmail(initialData.email || '')
      setRole(initialData.role || 'sales_staff')
      setIsActive(initialData.isActive)
      setPassword('')
    } else {
      setName('')
      setEmail('')
      setRole('sales_staff')
      setIsActive(true)
      setPassword('')
    }
    setError(null)
    setShowPassword(false)
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEdit && initialData) {
        const payload: {
          name: string
          email: string
          role: UserRole
          isActive: boolean
          password?: string
        } = {
          name,
          email,
          role,
          isActive,
        }
        if (password.trim().length > 0) {
          if (password.trim().length < 6) {
            throw new Error('New password must be at least 6 characters.')
          }
          payload.password = password.trim()
        }

        const res = await updateUserAction(initialData._id, payload)
        if (!res.success) {
          throw new Error(res.error || 'Failed to update user')
        }
      } else {
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }

        const res = await createUserAction({
          name,
          email,
          role,
          password,
          isActive,
        })
        if (!res.success) {
          throw new Error(res.error || 'Failed to create user')
        }
      }

      onClose()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit User: ${initialData?.name}` : 'Create New User'}
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kasun Fernando"
          required
        />

        {/* Email Address */}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. kasun@nfashion.lk"
          helperText="Used for system login credentials"
          required
        />

        {/* Role selection */}
        <div>
          <label className="label">
            User Role <span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSelf}
            className="input text-xs"
            required
          >
            <option value="admin">Administrator (Full Access & Settings)</option>
            <option value="inventory_manager">Inventory Manager (Stock, Batches, Purchases)</option>
            <option value="sales_staff">Sales Staff (POS, Sales & Receipts)</option>
          </select>
          {isSelf && (
            <p className="text-[11px] text-amber-600 mt-1">
              You cannot alter your own Administrator role to avoid locking out the system.
            </p>
          )}
        </div>

        {/* Password */}
        <div className="w-full">
          <label className="label">
            {isEdit ? 'Reset Password (Optional)' : 'Password'}
            {!isEdit && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Leave blank to keep existing password' : 'Min 6 characters'}
              className="input pr-10 text-xs"
              required={!isEdit}
              minLength={isEdit && !password ? undefined : 6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
            {isEdit
              ? 'Only enter a new password if you want to reset this user\'s password.'
              : 'Password must contain at least 6 characters.'}
          </p>
        </div>

        {/* Status Toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSelf}
              className="rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)] w-4 h-4"
            />
            <span className="text-xs font-medium text-[var(--foreground)]">
              Account Active (Enabled for login)
            </span>
          </label>
          {isSelf && (
            <p className="text-[11px] text-amber-600 ml-6 mt-0.5">
              You cannot deactivate your own account while logged in.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
