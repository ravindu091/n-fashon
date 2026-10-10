'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createCustomerAction, updateCustomerAction } from '@/actions/customer.actions'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    _id: string
    name: string
    phone: string
    email?: string
    address?: string
    notes?: string
  }
}

export function CustomerFormModal({ isOpen, onClose, initialData }: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = (formData.get('email') as string) || undefined
    const address = (formData.get('address') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined

    try {
      if (isEdit && initialData) {
        const res = await updateCustomerAction(initialData._id, {
          name,
          phone,
          email,
          address,
          notes,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createCustomerAction({
          name,
          phone,
          email,
          address,
          notes,
        })
        if (!res.success) throw new Error(res.error)
      }
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add New Customer'} maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Customer Full Name"
          name="name"
          placeholder="e.g. Kasun Jayawardena"
          defaultValue={initialData?.name}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            name="phone"
            placeholder="e.g. 0719876543"
            defaultValue={initialData?.phone}
            required
          />
          <Input
            label="Email (Optional)"
            name="email"
            type="email"
            placeholder="kasun@example.com"
            defaultValue={initialData?.email}
          />
        </div>

        <Input
          label="Delivery Address"
          name="address"
          placeholder="Address for orders and deliveries"
          defaultValue={initialData?.address}
        />

        <div>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="input"
            placeholder="Preferred styles, sizing notes, delivery instructions"
            defaultValue={initialData?.notes}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
