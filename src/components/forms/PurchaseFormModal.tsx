'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'
import { createPurchaseAction } from '@/actions/purchase.actions'

interface PurchaseFormModalProps {
  isOpen: boolean
  onClose: () => void
  suppliers: { _id: string; name: string }[]
  variants: {
    _id: string
    code: string
    productId: string
    productCode?: string
    productName: string
    size: string
    color: string
    defaultSellingPrice: number
  }[]
}

interface PurchaseLineDraft {
  variantId: string
  orderedQty: number
  unitBuyingCost: number
}

export function PurchaseFormModal({
  isOpen,
  onClose,
  suppliers,
  variants,
}: PurchaseFormModalProps) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?._id || '')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDate, setExpectedDate] = useState('')
  const [shippingCost, setShippingCost] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [otherCosts, setOtherCosts] = useState(0)
  const [notes, setNotes] = useState('')

  const [lines, setLines] = useState<PurchaseLineDraft[]>([
    { variantId: variants[0]?._id || '', orderedQty: 10, unitBuyingCost: 500 },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddLine = () => {
    if (variants.length === 0) return
    setLines([...lines, { variantId: variants[0]._id, orderedQty: 10, unitBuyingCost: 500 }])
  }

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const handleLineChange = (index: number, field: keyof PurchaseLineDraft, val: unknown) => {
    const updated = [...lines]
    updated[index] = { ...updated[index], [field]: val }
    setLines(updated)
  }

  const subtotal = lines.reduce((acc, l) => acc + (l.orderedQty * l.unitBuyingCost), 0)
  const totalCost = Math.max(0, subtotal - discountAmount + shippingCost + otherCosts)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const selectedSupplier = suppliers.find((s) => s._id === supplierId)
    if (!selectedSupplier) {
      setError('Please select a valid supplier.')
      setIsSubmitting(false)
      return
    }

    try {
      const processedLines = lines.map((l) => {
        const v = variants.find((item) => item._id === l.variantId)
        if (!v) throw new Error('Variant not found')
        return {
          variantId: v._id,
          productId: v.productId,
          productCode: v.productCode || 'PROD',
          variantCode: v.code,
          productName: v.productName,
          size: v.size,
          color: v.color,
          orderedQty: Number(l.orderedQty),
          unitBuyingCost: Number(l.unitBuyingCost),
        }
      })

      const res = await createPurchaseAction({
        supplierId,
        supplierName: selectedSupplier.name,
        supplierInvoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        expectedDeliveryDate: expectedDate || undefined,
        lines: processedLines,
        shippingCost: Number(shippingCost),
        discountAmount: Number(discountAmount),
        otherCosts: Number(otherCosts),
        notes: notes || undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Supplier Purchase Order" maxWidth="xl">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Supplier <span className="text-red-500">*</span></label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="input text-xs"
              required
            >
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Supplier Invoice # (Optional)"
            placeholder="e.g. INV-9821 (optional)"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />

          <Input
            label="Purchase Date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>

        {/* Line Items Table */}
        <div className="border border-[var(--border)] rounded-lg p-3 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--foreground)]">Ordered Garments & Costs</span>
            <Button type="button" size="sm" variant="outline" onClick={handleAddLine} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Line
            </Button>
          </div>

          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-end gap-2 bg-white p-2 rounded border border-[var(--border)]">
                <div className="flex-1 w-full">
                  <label className="label text-[11px]">Variant</label>
                  <select
                    value={line.variantId}
                    onChange={(e) => handleLineChange(idx, 'variantId', e.target.value)}
                    className="input text-xs"
                  >
                    {variants.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.productName} ({v.code} - {v.size} / {v.color})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="label text-[11px]">Ordered Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={line.orderedQty}
                    onChange={(e) => handleLineChange(idx, 'orderedQty', Number(e.target.value))}
                    className="input text-xs"
                    required
                  />
                </div>

                <div className="w-32">
                  <label className="label text-[11px]">Buying Cost (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitBuyingCost}
                    onChange={(e) => handleLineChange(idx, 'unitBuyingCost', Number(e.target.value))}
                    className="input text-xs"
                    required
                  />
                </div>

                <div className="w-24 text-right pr-2 pb-2">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">Subtotal</span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {(line.orderedQty * line.unitBuyingCost).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  disabled={lines.length <= 1}
                  className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary & Allocations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-[var(--border)]">
          <Input
            label="Shipping / Freight (LKR)"
            type="number"
            min="0"
            value={shippingCost}
            onChange={(e) => setShippingCost(Number(e.target.value))}
            helperText="Allocated to unit landed costs"
          />

          <Input
            label="Discount (LKR)"
            type="number"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
          />

          <div className="flex flex-col justify-end p-2 bg-white rounded border border-[var(--border)] text-right">
            <span className="text-[11px] text-[var(--foreground-muted)]">Net Total Purchase Cost</span>
            <span className="text-base font-bold text-[var(--foreground)]">
              LKR {totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <label className="label">Notes / Terms</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input text-xs"
            placeholder="Payment agreements, expected delivery notes"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save as Draft Purchase
          </Button>
        </div>
      </form>
    </Modal>
  )
}
