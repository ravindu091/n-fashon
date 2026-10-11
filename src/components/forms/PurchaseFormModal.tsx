'use client'

import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
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

  const variantOptions = useMemo(() => {
    return variants.map((v) => ({
      value: v._id,
      label: `${v.productName} (${v.size} / ${v.color})`,
      sublabel: `Code: ${v.code} | Base Price: LKR ${v.defaultSellingPrice.toLocaleString()}`,
      searchTerms: `${v.productName} ${v.code} ${v.size} ${v.color} ${v.productCode || ''}`,
    }))
  }, [variants])

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Supplier Purchase Order" maxWidth="3xl">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <div>
            <label className="label">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="filter-select w-full text-xs h-[38px]"
              required
            >
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Supplier Invoice # (Optional)"
              placeholder="e.g. INV-9821 (optional)"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-[var(--border)] rounded-lg p-3 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <span className="text-xs font-bold text-[var(--foreground)]">Ordered Garments & Costs</span>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                Select variants, order quantities, and unit buying costs
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddLine}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Line
            </Button>
          </div>

          {/* Table Column Headers (Desktop/Tablet) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-1.5 text-[11px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider bg-slate-100/70 rounded-t border-b border-[var(--border)]">
            <div className="sm:col-span-5">Garment Variant</div>
            <div className="sm:col-span-2">Ordered Qty</div>
            <div className="sm:col-span-2">Unit Cost (LKR)</div>
            <div className="sm:col-span-2 text-right">Subtotal</div>
            <div className="sm:col-span-1 text-center">Action</div>
          </div>

          {/* Line Rows */}
          <div className="space-y-2 mt-1 sm:mt-0">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 items-center bg-white rounded border border-[var(--border)] shadow-xs"
              >
                {/* Variant Selector with live search */}
                <div className="sm:col-span-5">
                  <div className="sm:hidden text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                    Variant
                  </div>
                  <SearchableSelect
                    options={variantOptions}
                    value={line.variantId}
                    onChange={(val) => handleLineChange(idx, 'variantId', val)}
                    placeholder="Search and select variant..."
                    searchPlaceholder="Type name, code, size, color..."
                  />
                </div>

                {/* Ordered Qty */}
                <div className="sm:col-span-2">
                  <div className="sm:hidden text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                    Ordered Qty
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={line.orderedQty}
                    onChange={(e) => handleLineChange(idx, 'orderedQty', Number(e.target.value))}
                    className="input text-xs h-[38px] w-full"
                    required
                  />
                </div>

                {/* Unit Cost */}
                <div className="sm:col-span-2">
                  <div className="sm:hidden text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                    Buying Cost (LKR)
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitBuyingCost}
                    onChange={(e) => handleLineChange(idx, 'unitBuyingCost', Number(e.target.value))}
                    className="input text-xs h-[38px] w-full"
                    required
                  />
                </div>

                {/* Subtotal */}
                <div className="sm:col-span-2 text-left sm:text-right">
                  <div className="sm:hidden text-[11px] font-semibold text-[var(--foreground-muted)] mb-1">
                    Subtotal
                  </div>
                  <div className="text-xs font-bold text-[var(--foreground)] truncate sm:pr-1">
                    LKR {(line.orderedQty * line.unitBuyingCost).toLocaleString()}
                  </div>
                </div>

                {/* Trash button */}
                <div className="sm:col-span-1 flex justify-center sm:justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-20 transition-colors rounded hover:bg-red-50"
                    title="Remove line item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Summary & Allocations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch p-3 bg-slate-50 rounded-lg border border-[var(--border)]">
          <Input
            label="Shipping / Freight (LKR)"
            type="number"
            min="0"
            value={shippingCost}
            onChange={(e) => setShippingCost(Number(e.target.value))}
            placeholder="0"
          />

          <Input
            label="Discount (LKR)"
            type="number"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            placeholder="0"
          />

          <div className="flex flex-col justify-center p-3 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-800 text-right">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-0.5">
              <span>Items Subtotal:</span>
              <span>LKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200">Net Total Cost:</span>
              <span className="text-base font-bold text-emerald-400">
                LKR {totalCost.toLocaleString()}
              </span>
            </div>
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
