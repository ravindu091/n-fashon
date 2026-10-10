'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createVariantAction, updateVariantAction } from '@/actions/variant.actions'

interface VariantFormModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  defaultPrice: number
  initialData?: {
    _id: string
    size: string
    color: string
    defaultSellingPrice: number
    promoPrice?: number
    wholesalePrice?: number
    reorderLevel?: number
  }
}

export function VariantFormModal({
  isOpen,
  onClose,
  productId,
  defaultPrice,
  initialData,
}: VariantFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const size = formData.get('size') as string
    const color = formData.get('color') as string
    const defaultSellingPrice = Number(formData.get('defaultSellingPrice'))
    const promoPrice = formData.get('promoPrice') ? Number(formData.get('promoPrice')) : undefined
    const wholesalePrice = formData.get('wholesalePrice') ? Number(formData.get('wholesalePrice')) : undefined
    const reorderLevel = Number(formData.get('reorderLevel')) || 3

    try {
      if (isEdit && initialData) {
        const res = await updateVariantAction(initialData._id, productId, {
          size,
          color,
          defaultSellingPrice,
          promoPrice,
          wholesalePrice,
          reorderLevel,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createVariantAction(productId, {
          size,
          color,
          defaultSellingPrice,
          promoPrice,
          wholesalePrice,
          reorderLevel,
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Variant' : 'Add Size/Color Variant'} maxWidth="sm">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Size"
            name="size"
            placeholder="e.g. M, L, Free Size"
            defaultValue={initialData?.size}
            required
          />

          <Input
            label="Color"
            name="color"
            placeholder="e.g. Black, Navy"
            defaultValue={initialData?.color}
            required
          />
        </div>

        <Input
          label="Default Selling Price (LKR)"
          name="defaultSellingPrice"
          type="number"
          min="0"
          step="0.01"
          defaultValue={initialData?.defaultSellingPrice ?? defaultPrice}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Promo Price (Optional)"
            name="promoPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Discounted price"
            defaultValue={initialData?.promoPrice}
          />

          <Input
            label="Reorder Alert Level"
            name="reorderLevel"
            type="number"
            min="0"
            defaultValue={initialData?.reorderLevel ?? 3}
            helperText="Alert when stock <= this"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Variant' : 'Create Variant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
