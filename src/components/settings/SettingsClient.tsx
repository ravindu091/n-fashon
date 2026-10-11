'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateSettingsAction } from '@/actions/settings.actions'
import { Check, Settings, Save } from 'lucide-react'
import { DatabaseBackupCard } from '@/components/backup/DatabaseBackupCard'

interface SettingsClientProps {
  settings: any
  backupStatus?: {
    lastBackupDate: string | null
    daysSinceLastBackup: number | null
    isOverdue: boolean
  }
}

export function SettingsClient({ settings, backupStatus }: SettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const businessName = formData.get('businessName') as string
    const currency = formData.get('currency') as string
    const timezone = formData.get('timezone') as string
    const lowStockThreshold = Number(formData.get('lowStockThreshold'))
    const contactPhone = formData.get('contactPhone') as string
    const address = formData.get('address') as string
    const receiptFooter = formData.get('receiptFooter') as string

    const categories = (formData.get('categories') as string)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const sizes = (formData.get('sizes') as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const colors = (formData.get('colors') as string)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const channels = (formData.get('channels') as string)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const expenseCategories = (formData.get('expenseCategories') as string)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    try {
      const res = await updateSettingsAction({
        businessName,
        currency,
        timezone,
        lowStockThreshold,
        contactPhone,
        address,
        receiptFooter,
        categories,
        sizes,
        colors,
        channels,
        expenseCategories,
      })

      if (!res.success) throw new Error(res.error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Business Configuration & Settings</h1>
        <p className="text-xs text-[var(--foreground-muted)]">
          Configure business rules, categories, standard sizing, channels, and receipt footers.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Company & Regional Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              name="businessName"
              defaultValue={settings.businessName}
              required
            />
            <Input
              label="Operating Currency"
              name="currency"
              defaultValue={settings.currency}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              name="contactPhone"
              defaultValue={settings.contactPhone}
            />
            <Input
              label="Timezone"
              name="timezone"
              defaultValue={settings.timezone}
              required
            />
          </div>

          <Input
            label="Store / Business Address"
            name="address"
            defaultValue={settings.address}
          />
        </div>

        {/* Categories, Sizes, Colors */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Product Options & Taxonomy
          </h2>

          <Input
            label="Product Categories (comma-separated)"
            name="categories"
            defaultValue={settings.categories?.join(', ')}
            helperText="Categories used in catalog and code generation"
          />

          <Input
            label="Garment Sizes (comma-separated)"
            name="sizes"
            defaultValue={settings.sizes?.join(', ')}
            helperText="Standard sizing options (e.g. XS, S, M, L, XL, XXL, Free Size)"
          />

          <Input
            label="Color Palette (comma-separated)"
            name="colors"
            defaultValue={settings.colors?.join(', ')}
            helperText="Standard garment color options"
          />
        </div>

        {/* Operational Channels & Expenses */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Sales Channels & Inventory Thresholds
          </h2>

          <Input
            label="Sales Channels (comma-separated)"
            name="channels"
            defaultValue={settings.channels?.join(', ')}
            helperText="Channels used for order attribution (e.g. Facebook, Instagram, WhatsApp, Physical)"
          />

          <Input
            label="Expense Categories (comma-separated)"
            name="expenseCategories"
            defaultValue={settings.expenseCategories?.join(', ')}
            helperText="Operating cost categories"
          />

          <Input
            label="Global Low-Stock Alert Threshold (Pieces)"
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={settings.lowStockThreshold}
            helperText="Garments with total stock at or below this value will trigger dashboard warnings"
          />
        </div>

        {/* Receipt Setup */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Sales Receipt Details
          </h2>

          <div>
            <label className="label">Receipt Footer Note</label>
            <textarea
              name="receiptFooter"
              rows={2}
              className="input text-xs"
              defaultValue={settings.receiptFooter}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
            Save ERP Configuration
          </Button>
        </div>
      </form>

      {/* Database Backup & Disaster Recovery */}
      <DatabaseBackupCard
        lastBackupDate={backupStatus?.lastBackupDate || settings.lastBackupDate}
        daysSinceLastBackup={backupStatus?.daysSinceLastBackup}
        isOverdue={backupStatus?.isOverdue}
      />
    </div>
  )
}

