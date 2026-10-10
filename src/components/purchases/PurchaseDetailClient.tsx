'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, PackageCheck, DollarSign, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { markOrderedAction, addPurchasePaymentAction, cancelPurchaseAction } from '@/actions/purchase.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface PurchaseDetailClientProps {
  purchase: any
}

export function PurchaseDetailClient({ purchase }: PurchaseDetailClientProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(purchase.outstandingBalance)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const [isMarkingOrdered, setIsMarkingOrdered] = useState(false)

  const handleMarkOrdered = async () => {
    setIsMarkingOrdered(true)
    await markOrderedAction(purchase._id)
    setIsMarkingOrdered(false)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPayment(true)
    await addPurchasePaymentAction(purchase._id, Number(paymentAmount))
    setIsSubmittingPayment(false)
    setIsPaymentOpen(false)
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    await cancelPurchaseAction(purchase._id)
    setIsCancelling(false)
    setIsCancelOpen(false)
  }

  const canReceive = purchase.status === 'ordered' || purchase.status === 'partially_received'
  const canCancel = purchase.status === 'draft' || (purchase.status === 'ordered' && purchase.lines.every((l: any) => l.receivedQty === 0))

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/purchases" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {purchase.purchaseNumber}
              </span>
              <Badge variant={purchase.status === 'received' ? 'success' : purchase.status === 'partially_received' ? 'info' : 'neutral'}>
                {purchase.status.replace('_', ' ')}
              </Badge>
              <Badge variant={purchase.paymentStatus === 'paid' ? 'success' : 'warning'}>
                Payment: {purchase.paymentStatus}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
              Supplier: {purchase.supplierName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {purchase.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkOrdered}
              isLoading={isMarkingOrdered}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Mark as Ordered
            </Button>
          )}

          {canReceive && (
            <Link href={`/purchases/${purchase._id}/receive`} className="btn btn-accent text-xs">
              <PackageCheck className="w-3.5 h-3.5 mr-1" />
              Receive Stock
            </Link>
          )}

          {purchase.outstandingBalance > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
            >
              Record Payment
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelOpen(true)}
              className="text-red-600 hover:bg-red-50"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Cancel PO
            </Button>
          )}
        </div>
      </div>

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Purchase Date</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatDate(purchase.purchaseDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Supplier Invoice #</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{purchase.supplierInvoiceNumber || 'None'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Total Cost</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(purchase.totalCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Outstanding Payable</p>
          <p className={`text-base font-bold mt-1 ${purchase.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(purchase.outstandingBalance)}
          </p>
        </div>
      </div>

      {/* Ordered Line Items Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Purchased Garments & Receipt Progress</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Trace quantities ordered versus physical stock received into batches.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Garment</th>
                <th>Variant Code</th>
                <th>Size / Color</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Buying Price</th>
                <th>Line Total</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {purchase.lines.map((line: any) => {
                const percent = Math.min(100, Math.round((line.receivedQty / line.orderedQty) * 100))
                return (
                  <tr key={line._id.toString()}>
                    <td className="text-xs font-semibold">{line.productName}</td>
                    <td className="font-mono text-xs text-[var(--foreground-muted)]">{line.variantCode}</td>
                    <td className="text-xs">{line.size} / {line.color}</td>
                    <td className="text-xs font-bold">{line.orderedQty} pcs</td>
                    <td className="text-xs font-bold text-emerald-600">{line.receivedQty} pcs</td>
                    <td className="text-xs">{formatCurrency(line.unitBuyingCost)}</td>
                    <td className="text-xs font-semibold">{formatCurrency(line.lineTotal)}</td>
                    <td className="w-32">
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--foreground-muted)] font-medium">
                        {percent}% received
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Cost Summary Breakdown Footer */}
        <div className="p-4 bg-slate-50 border-t border-[var(--border)] flex justify-end">
          <div className="w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--foreground-muted)]">
              <span>Subtotal:</span>
              <span>{formatCurrency(purchase.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--foreground-muted)]">
              <span>Allocated Shipping/Freight:</span>
              <span>+{formatCurrency(purchase.shippingCost)}</span>
            </div>
            {purchase.otherCosts > 0 && (
              <div className="flex justify-between text-[var(--foreground-muted)]">
                <span>Other Acquisition Costs:</span>
                <span>+{formatCurrency(purchase.otherCosts)}</span>
              </div>
            )}
            {purchase.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(purchase.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
              <span>Total Purchase Cost:</span>
              <span>{formatCurrency(purchase.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Supplier Payment" maxWidth="sm">
        <form onSubmit={handlePayment} className="space-y-4">
          <Input
            label="Payment Amount (LKR)"
            type="number"
            min="0.01"
            max={purchase.outstandingBalance}
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            required
            helperText={`Max payable: LKR ${purchase.outstandingBalance.toLocaleString()}`}
          />
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isSubmittingPayment}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingPayment}>
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Purchase Order"
        message="Are you sure you want to cancel this purchase order? This action cannot be undone."
        confirmText="Cancel PO"
        isLoading={isCancelling}
      />
    </div>
  )
}
