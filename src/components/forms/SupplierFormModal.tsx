'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createSupplierAction, updateSupplierAction } from '@/actions/supplier.actions'

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    _id: string
    name: string
    contactPerson?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
  }
}

export function SupplierFormModal({ isOpen, onClose, initialData }: SupplierFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const contactPerson = (formData.get('contactPerson') as string) || undefined
    const phone = (formData.get('phone') as string)?.trim() || undefined
    const email = (formData.get('email') as string) || undefined
    const address = (formData.get('address') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined

    try {
      if (isEdit && initialData) {
        const res = await updateSupplierAction(initialData._id, {
          name,
          contactPerson,
          phone,
          email,
          address,
          notes,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createSupplierAction({
          name,
          contactPerson,
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Supplier' : 'Add New Supplier'} maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Business / Supplier Name"
          name="name"
          placeholder="e.g. Colombo Garments Ltd"
          defaultValue={initialData?.name}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Contact Person"
            name="contactPerson"
            placeholder="e.g. Kamal Perera"
            defaultValue={initialData?.contactPerson}
          />
          <Input
            label="Phone Number (Optional)"
            name="phone"
            placeholder="e.g. 0771234567"
            defaultValue={initialData?.phone}
          />
        </div>

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="supplier@example.com"
          defaultValue={initialData?.email}
        />

        <Input
          label="Address"
          name="address"
          placeholder="Factory or shop address"
          defaultValue={initialData?.address}
        />

        <div>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            rows={2}
            className="input"
            placeholder="Payment terms, delivery schedules, notes"
            defaultValue={initialData?.notes}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
