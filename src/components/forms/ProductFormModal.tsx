'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createProductAction, updateProductAction } from '@/actions/product.actions'

const CATEGORIES = [
  'T-Shirts',
  'Shirts',
  'Trousers',
  'Jeans',
  'Dresses',
  'Skirts',
  'Hoodies',
  'Jackets',
  'Shorts',
  'Other',
]

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    _id: string
    name: string
    description?: string
    category: string
    brand?: string
    defaultSellingPrice: number
    colors?: string[]
    sizes?: string[]
  }
}

export function ProductFormModal({ isOpen, onClose, initialData }: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const description = (formData.get('description') as string) || undefined
    const brand = (formData.get('brand') as string) || undefined
    const defaultSellingPrice = Number(formData.get('defaultSellingPrice'))

    const colors = ((formData.get('colors') as string) || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const sizes = ((formData.get('sizes') as string) || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      if (isEdit && initialData) {
        const res = await updateProductAction(initialData._id, {
          name,
          category,
          description,
          brand,
          defaultSellingPrice,
          colors,
          sizes,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createProductAction({
          name,
          category,
          description,
          brand,
          defaultSellingPrice,
          colors,
          sizes,
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add New Product'} maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Product Name"
          name="name"
          placeholder="e.g. Oversized Heavyweight Tee"
          defaultValue={initialData?.name}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select
              name="category"
              className="input"
              defaultValue={initialData?.category || CATEGORIES[0]}
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Brand (Optional)"
            name="brand"
            placeholder="e.g. Zara, H&M"
            defaultValue={initialData?.brand}
          />
        </div>

        <Input
          label="Default Selling Price (LKR)"
          name="defaultSellingPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 2500"
          defaultValue={initialData?.defaultSellingPrice}
          required
        />

        <div>
          <Input
            label="Available Colors (comma separated)"
            name="colors"
            placeholder="Black, White, Navy Blue"
            defaultValue={initialData?.colors?.join(', ')}
            helperText="e.g. Black, White, Charcoal"
          />
        </div>

        <div>
          <Input
            label="Available Sizes (comma separated)"
            name="sizes"
            placeholder="S, M, L, XL, Free Size"
            defaultValue={initialData?.sizes?.join(', ')}
            helperText="e.g. S, M, L, Free Size"
          />
        </div>

        <div>
          <label className="label">Description (Optional)</label>
          <textarea
            name="description"
            rows={2}
            className="input"
            placeholder="Notes on fabric, fit, or supplier details"
            defaultValue={initialData?.description}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
