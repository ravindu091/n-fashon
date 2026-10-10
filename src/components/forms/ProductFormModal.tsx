'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createProductAction, updateProductAction } from '@/actions/product.actions'
import { Plus, ArrowLeft } from 'lucide-react'

const DEFAULT_CATEGORIES = [
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
  categories?: string[]
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

export function ProductFormModal({
  isOpen,
  onClose,
  categories = [],
  initialData,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!initialData

  // Category state: choose from list or type custom
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')

  // Build unique list of categories from props, defaults, and the product being edited
  const availableCategories = useMemo(() => {
    const list = new Set<string>()
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        if (c && c.trim()) list.add(c.trim())
      })
    } else {
      DEFAULT_CATEGORIES.forEach((c) => list.add(c))
    }
    if (initialData?.category && initialData.category.trim()) {
      list.add(initialData.category.trim())
    }
    return Array.from(list)
  }, [categories, initialData?.category])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (initialData?.category) {
        setSelectedCategory(initialData.category.trim())
        setIsCustomCategory(false)
        setCustomCategory('')
      } else {
        setSelectedCategory(availableCategories[0] || 'T-Shirts')
        setIsCustomCategory(false)
        setCustomCategory('')
      }
    }
  }, [isOpen, initialData, availableCategories])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    // Determine final category
    const finalCategory = isCustomCategory ? customCategory.trim() : selectedCategory.trim()

    if (!finalCategory) {
      setError('Please specify or select a category for this garment.')
      setIsSubmitting(false)
      return
    }

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
          category: finalCategory,
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
          category: finalCategory,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add New Product'}
      maxWidth="md"
    >
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dynamic Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">
                Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory)
                  if (!isCustomCategory) {
                    setCustomCategory('')
                  }
                }}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                {isCustomCategory ? (
                  <>
                    <ArrowLeft className="w-3 h-3" /> Select from list
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> New category
                  </>
                )}
              </button>
            </div>

            {isCustomCategory ? (
              <div>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Sarees, Crop Tops, Sportswear..."
                  className="input text-xs"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">
                  New category will be automatically saved to your store settings.
                </p>
              </div>
            ) : (
              <select
                value={selectedCategory}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setIsCustomCategory(true)
                    setCustomCategory('')
                  } else {
                    setSelectedCategory(e.target.value)
                  }
                }}
                className="input text-xs"
                required
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new__">+ Type New Category...</option>
              </select>
            )}
          </div>

          <Input
            label="Brand (Optional)"
            name="brand"
            placeholder="e.g. Zara, H&M, Cotton Collection"
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
            className="input text-xs"
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
