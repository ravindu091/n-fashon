'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createReturnAction } from '@/actions/return.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import type { ReturnCondition } from '@/types'

interface NewReturnClientProps {
  sales: any[]
}

interface ReturnLineDraft {
  saleLineId: string
  qty: number
  condition: ReturnCondition
  refundAmount: number
}

export function NewReturnClient({ sales }: NewReturnClientProps) {
  const router = useRouter()

  const [selectedSaleId, setSelectedSaleId] = useState(sales[0]?._id || '')
  const [returnLines, setReturnLines] = useState<Record<string, ReturnLineDraft>>({})
  const [reason, setReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSale = sales.find((s) => s._id === selectedSaleId)

  const handleQtyChange = (line: any, qty: number) => {
    const clamped = Math.max(0, Math.min(qty, line.qty))
    setReturnLines((prev) => ({
      ...prev,
      [line._id]: {
        saleLineId: line._id,
        qty: clamped,
        condition: prev[line._id]?.condition || 'resellable',
        refundAmount: clamped * line.unitSellingPrice,
      },
    }))
  }

  const handleConditionChange = (lineId: string, condition: ReturnCondition) => {
    setReturnLines((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || { saleLineId: lineId, qty: 1, refundAmount: 0 }),
        condition,
      },
    }))
  }

  const totalRefund = Object.values(returnLines).reduce((acc, l) => acc + (l.qty > 0 ? l.refundAmount : 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a mandatory reason for the customer return.')
      return
    }

    const validLines = Object.values(returnLines).filter((l) => l.qty > 0)
    if (validLines.length === 0) {
      setError('Please specify at least one item quantity to return.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await createReturnAction({
        saleId: selectedSaleId,
        lines: validLines,
        reason,
        refundMethod,
        notes: notes || undefined,
      })

      if (!res.success) throw new Error(res.error)
      router.push('/returns')
    } catch (err: unknown) {
      setError((err as Error).message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/returns" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Process Customer Return / Exchange</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Restock resellable items into their original purchase batches or quarantine damaged stock.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Select Original Sale */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            Step 1: Locate Original Sale Order
          </h2>
          <div>
            <label className="label">Select Sale #</label>
            <select
              value={selectedSaleId}
              onChange={(e) => {
                setSelectedSaleId(e.target.value)
                setReturnLines({})
              }}
              className="input text-xs"
              required
            >
              {sales.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.saleNumber} — {formatDate(s.saleDate)} — {s.customerName || 'Walk-in'} (Total: LKR {s.totalAmount})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Line Item Selection & Condition Inspection */}
        {activeSale && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Step 2: Select Items & Inspection Condition</h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                Garments marked as "Resellable" will automatically be returned to available inventory in their source batch.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Garment</th>
                    <th>Size / Color</th>
                    <th>Price</th>
                    <th>Purchased Qty</th>
                    <th className="w-24">Return Qty</th>
                    <th>Garment Condition</th>
                    <th>Refund (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSale.lines.map((line: any) => {
                    const lineState = returnLines[line._id] || { qty: 0, condition: 'resellable', refundAmount: 0 }

                    return (
                      <tr key={line._id.toString()}>
                        <td className="text-xs font-bold text-[var(--foreground)]">{line.productName}</td>
                        <td className="text-xs">{line.size} / {line.color}</td>
                        <td className="text-xs">{formatCurrency(line.unitSellingPrice)}</td>
                        <td className="text-xs font-bold">{line.qty} pcs</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={line.qty}
                            value={lineState.qty}
                            onChange={(e) => handleQtyChange(line, Number(e.target.value))}
                            className="input text-xs py-1 text-center font-bold"
                          />
                        </td>
                        <td>
                          <select
                            value={lineState.condition}
                            onChange={(e) => handleConditionChange(line._id, e.target.value as ReturnCondition)}
                            className="input text-xs py-1"
                            disabled={lineState.qty === 0}
                          >
                            <option value="resellable">Resellable (Restock)</option>
                            <option value="damaged">Damaged (Quarantine)</option>
                            <option value="defective">Defective (Quarantine)</option>
                            <option value="other">Other</option>
                          </select>
                        </td>
                        <td className="text-xs font-bold text-red-600">
                          {formatCurrency(lineState.qty > 0 ? lineState.refundAmount : 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[var(--border)] flex justify-end">
              <span className="text-xs font-bold text-[var(--foreground)]">
                Total Refund to Customer: <span className="text-red-600 text-sm ml-2">{formatCurrency(totalRefund)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Return Reason & Refund Details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Step 3: Reason & Settlement
          </h2>

          <div>
            <label className="label">Mandatory Return Reason <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="input text-xs"
              placeholder="e.g. Size exchange requested, Defective seam discovered by customer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Refund Settlement Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="input text-xs"
              >
                <option value="cash">Cash Refund</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Store Credit / Deduct Outstanding</option>
              </select>
            </div>

            <Input
              label="Additional Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inspection notes"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isSubmitting}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Complete Return & Adjust Inventory
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
