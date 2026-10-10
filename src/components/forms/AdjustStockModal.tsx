'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { adjustStockAction } from '@/actions/batch.actions'
import type { MovementType } from '@/types'

interface AdjustStockModalProps {
  isOpen: boolean
  onClose: () => void
  batch: {
    _id: string
    batchCode: string
    variantCode: string
    productName: string
    size: string
    color: string
    remainingQty: number
  } | null
}

export function AdjustStockModal({ isOpen, onClose, batch }: AdjustStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!batch) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const qtyChange = Number(formData.get('qtyChange'))
    const reason = formData.get('reason') as string
    const type = formData.get('type') as MovementType
    const notes = (formData.get('notes') as string) || undefined

    try {
      const res = await adjustStockAction(batch._id, qtyChange, reason, type, notes)
      if (!res.success) throw new Error(res.error)
      onClose()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${batch.batchCode}`} maxWidth="sm">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-[var(--border)] text-xs space-y-1">
        <p className="font-semibold text-[var(--foreground)]">{batch.productName}</p>
        <p className="text-[var(--foreground-muted)]">
          Variant: <span className="font-mono">{batch.variantCode}</span> ({batch.size} / {batch.color})
        </p>
        <p className="text-[var(--foreground-muted)]">
          Current Remaining Stock: <span className="font-bold text-[var(--foreground)]">{batch.remainingQty} pcs</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Adjustment Type <span className="text-red-500">*</span></label>
          <select name="type" className="input" defaultValue="manual_adjustment">
            <option value="manual_adjustment">Manual Adjustment</option>
            <option value="damaged">Damaged Garment (Deduct)</option>
            <option value="missing">Missing Inventory (Deduct)</option>
            <option value="stock_correction">Stock Count Correction</option>
          </select>
        </div>

        <Input
          label="Quantity Change (+ to add, - to deduct)"
          name="qtyChange"
          type="number"
          placeholder="e.g. -2 or +5"
          required
          helperText="Negative number reduces stock, positive adds."
        />

        <div>
          <label className="label">Mandatory Reason <span className="text-red-500">*</span></label>
          <textarea
            name="reason"
            rows={2}
            className="input"
            placeholder="Audit explanation (e.g. Found 2 pieces damaged during monthly stocktaking)"
            required
          />
        </div>

        <Input
          label="Additional Notes (Optional)"
          name="notes"
          placeholder="Optional references"
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Apply Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
