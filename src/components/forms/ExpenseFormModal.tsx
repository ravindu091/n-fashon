'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createExpenseAction } from '@/actions/expense.actions'

const DEFAULT_CATEGORIES = [
  'Advertising',
  'Packaging',
  'Delivery',
  'Transport',
  'Internet & Telephone',
  'Platform Fees',
  'Rent',
  'Utilities',
  'Other',
]

interface ExpenseFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExpenseFormModal({ isOpen, onClose }: ExpenseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))
    const date = (formData.get('date') as string) || new Date().toISOString()
    const paymentMethod = (formData.get('paymentMethod') as string) || 'cash'
    const payee = (formData.get('payee') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined

    try {
      const res = await createExpenseAction({
        category,
        description,
        amount,
        date,
        paymentMethod,
        payee,
        notes,
      })
      if (!res.success) throw new Error(res.error)
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Business Expense" maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category <span className="text-red-500">*</span></label>
            <select name="category" className="input" defaultValue={DEFAULT_CATEGORIES[0]} required>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <Input
          label="Description"
          name="description"
          placeholder="e.g. Facebook Ads campaign, Courier packaging boxes"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (LKR)"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="e.g. 4500"
            required
          />

          <div>
            <label className="label">Payment Method</label>
            <select name="paymentMethod" className="input" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <Input
          label="Payee / Vendor (Optional)"
          name="payee"
          placeholder="e.g. Meta Ads, Box Pack Co."
        />

        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            name="notes"
            rows={2}
            className="input"
            placeholder="Invoice numbers, tax notes"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Record Expense
          </Button>
        </div>
      </form>
    </Modal>
  )
}
