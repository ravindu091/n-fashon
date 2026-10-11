'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/currency'
import { checkPurchaseReversalEligibilityAction, reversePurchaseOrderAction } from '@/actions/purchase.actions'
import type { PurchaseReversalEligibility } from '@/types'
import { AlertTriangle, CheckCircle, RotateCcw, Loader2, ArrowRight } from 'lucide-react'

interface PurchaseReversalModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: {
    _id: string
    purchaseNumber: string
    supplierName: string
    totalCost: number
    amountPaid: number
    outstandingBalance: number
    status: string
  }
}

export function PurchaseReversalModal({
  isOpen,
  onClose,
  purchase,
}: PurchaseReversalModalProps) {
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false)
  const [eligibility, setEligibility] = useState<PurchaseReversalEligibility | null>(null)
  const [reason, setReason] = useState('')
  const [refundOption, setRefundOption] = useState<'credit' | 'refund'>('credit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError(null)
      setIsLoadingEligibility(true)
      checkPurchaseReversalEligibilityAction(purchase._id)
        .then((res) => {
          if (res.success && res.data) {
            setEligibility(res.data as PurchaseReversalEligibility)
          } else {
            setError(res.error || 'Failed to inspect purchase order eligibility.')
          }
        })
        .catch((err) => {
          setError((err as Error).message)
        })
        .finally(() => {
          setIsLoadingEligibility(false)
        })
    }
  }, [isOpen, purchase._id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason for reversing this purchase order.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await reversePurchaseOrderAction(purchase._id, reason.trim(), refundOption)
      if (!res.success) {
        throw new Error(res.error || 'Failed to reverse purchase order')
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
      title={`Reverse Purchase Order ${purchase.purchaseNumber}`}
      maxWidth="2xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingEligibility ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-[var(--foreground-muted)]">
            Inspecting inventory batches and sales order allocations for {purchase.purchaseNumber}...
          </p>
        </div>
      ) : eligibility && !eligibility.canReverse ? (
        /* Blocked State: Items sold in customer sales */
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-sm font-semibold">Reversal Blocked: Stock Already Sold</strong>
              <p>
                {eligibility.blockReason ||
                  'Some items from this purchase order have already been sold in customer sales orders.'}
              </p>
            </div>
          </div>

          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
            <div className="p-3 bg-slate-50 border-b border-[var(--border)] text-xs font-semibold text-[var(--foreground)]">
              Stock Batch Consumption Status
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[11px] font-semibold text-[var(--foreground-muted)] uppercase">
                  <tr>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Garment Variant</th>
                    <th className="p-2 text-right">Received</th>
                    <th className="p-2 text-right">Sold in Sales</th>
                    <th className="p-2 text-right">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eligibility.batches.map((b) => (
                    <tr key={b.batchId} className={b.isConsumed ? 'bg-amber-50/50' : ''}>
                      <td className="p-2 font-mono font-bold text-slate-700">{b.batchCode}</td>
                      <td className="p-2">
                        {b.productName} ({b.size}/{b.color})
                      </td>
                      <td className="p-2 text-right font-medium">{b.startingQty} pcs</td>
                      <td className="p-2 text-right font-bold text-red-600">
                        {b.soldQty > 0 ? `${b.soldQty} pcs sold` : '0 pcs'}
                      </td>
                      <td className="p-2 text-right font-medium text-emerald-700">{b.remainingQty} pcs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            To preserve accurate FIFO costing and financial integrity, purchase orders cannot be reversed once physical
            garments have been dispatched to customers.
          </p>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : eligibility ? (
        /* Eligible State */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-sm font-semibold">100% Stock Available for Reversal</strong>
              <p>
                {eligibility.isReceived
                  ? `All ${eligibility.totalReceivedQty} received garments across ${eligibility.batches.length} stock batches are intact and untouched in warehouse inventory.`
                  : `This purchase order has not been physically received yet and can be cleanly cancelled.`}
              </p>
            </div>
          </div>

          {/* Financial & Inventory Rollback Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-[var(--border)] text-xs">
            <div>
              <span className="text-[10px] text-[var(--foreground-muted)] block uppercase font-semibold">
                Total PO Value
              </span>
              <span className="text-sm font-bold text-[var(--foreground)]">
                {formatCurrency(eligibility.totalCost)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--foreground-muted)] block uppercase font-semibold">
                Supplier Balance Impact
              </span>
              <span className="text-sm font-bold text-red-600">
                -{formatCurrency(eligibility.outstandingBalance)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--foreground-muted)] block uppercase font-semibold">
                Stock Deduction
              </span>
              <span className="text-sm font-bold text-amber-700">
                {eligibility.isReceived ? `-${eligibility.totalReceivedQty} pcs` : '0 pcs (Unreceived)'}
              </span>
            </div>
          </div>

          {/* Supplier Payment Reconciliation Option */}
          {eligibility.amountPaid > 0 && (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60 space-y-2 text-xs">
              <span className="font-semibold text-blue-900 block">
                Supplier Payments Recorded: {formatCurrency(eligibility.amountPaid)}
              </span>
              <p className="text-blue-800 text-[11px]">
                You have already paid {formatCurrency(eligibility.amountPaid)} to {purchase.supplierName} for this order.
                How would you like to reconcile this payment?
              </p>
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundOption"
                    value="credit"
                    checked={refundOption === 'credit'}
                    onChange={() => setRefundOption('credit')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Retain as Supplier Credit (Recommended)</span>
                    <span className="text-[11px] text-slate-600 block">
                      Deducts full {formatCurrency(eligibility.totalCost)} from supplier account, crediting{' '}
                      {formatCurrency(eligibility.amountPaid)} toward future orders.
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundOption"
                    value="refund"
                    checked={refundOption === 'refund'}
                    onChange={() => setRefundOption('refund')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Supplier Refund Issued</span>
                    <span className="text-[11px] text-slate-600 block">
                      The supplier has refunded the {formatCurrency(eligibility.amountPaid)} in cash/bank transfer.
                      Only the unpaid balance of {formatCurrency(eligibility.outstandingBalance)} is erased.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Mandatory Reversal Reason */}
          <div>
            <label className="label text-xs">
              Reason for Reversal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input text-xs"
              placeholder="e.g. Returned to supplier due to fabric flaws; or order cancelled with vendor."
              required
            />
          </div>

          <div className="p-3 bg-red-50/50 rounded border border-red-200 text-[11px] text-red-800 leading-relaxed">
            <strong>Warning:</strong> Reversing this purchase order will permanently mark linked stock batches as
            returned, record negative audit entries in the stock movement ledger, and adjust supplier accounts.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmitting}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Confirm Reversal
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
