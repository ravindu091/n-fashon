'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, DollarSign, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { addSalePaymentAction } from '@/actions/sale.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface SaleDetailClientProps {
  sale: any
}

export function SaleDetailClient({ sale }: SaleDetailClientProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(sale.outstandingBalance)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPayment(true)
    await addSalePaymentAction(sale._id, Number(paymentAmount))
    setIsSubmittingPayment(false)
    setIsPaymentOpen(false)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {sale.saleNumber}
              </span>
              <Badge variant="success">Confirmed</Badge>
              <Badge variant={sale.paymentStatus === 'paid' ? 'success' : 'warning'}>
                Payment: {sale.paymentStatus}
              </Badge>
              <Badge variant="neutral">Channel: {sale.channel}</Badge>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
              Customer: {sale.customerName || 'Walk-in'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/sales/${sale._id}/receipt`} className="btn btn-outline text-xs">
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Receipt
          </Link>

          {sale.outstandingBalance > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
            >
              Add Payment
            </Button>
          )}

          <Link href="/returns/new" className="btn btn-ghost text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Process Return
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Sale Total</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(sale.totalAmount)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Batch COGS Snapshot</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(sale.totalCOGS)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Realized Gross Profit</p>
          <p className="text-base font-bold text-emerald-600 mt-1">{formatCurrency(sale.grossProfit)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Outstanding Receivable</p>
          <p className={`text-base font-bold mt-1 ${sale.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(sale.outstandingBalance)}
          </p>
        </div>
      </div>

      {/* Sale Line Items Table with Snapshot Costs */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Purchased Items & Batch Cost Basis</h2>
          <p className="text-xs text-[var(--foreground-muted)]">
            Traceable to the specific purchase batches from which stock was deducted.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Garment Name</th>
                <th>Variant Code</th>
                <th>Size / Color</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Unit Landed Cost (Snapshot)</th>
                <th>Line Total</th>
                <th>Line Profit</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line: any, idx: number) => {
                const profit = line.lineTotal - line.lineCOGS
                return (
                  <tr key={idx}>
                    <td className="text-xs font-bold text-[var(--foreground)]">{line.productName}</td>
                    <td className="font-mono text-xs text-[var(--foreground-muted)]">{line.variantCode}</td>
                    <td className="text-xs">{line.size} / {line.color}</td>
                    <td className="text-xs font-bold">{line.qty} pcs</td>
                    <td className="text-xs font-semibold">{formatCurrency(line.unitSellingPrice)}</td>
                    <td className="text-xs font-mono text-[var(--foreground-muted)]">{formatCurrency(line.unitCostSnapshot)}</td>
                    <td className="text-xs font-bold text-[var(--foreground)]">{formatCurrency(line.lineTotal)}</td>
                    <td className="text-xs font-bold text-emerald-600">{formatCurrency(profit)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Footer */}
        <div className="p-4 bg-slate-50 border-t border-[var(--border)] flex justify-end">
          <div className="w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--foreground-muted)]">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.deliveryCharge > 0 && (
              <div className="flex justify-between text-[var(--foreground-muted)]">
                <span>Delivery Charge:</span>
                <span>+{formatCurrency(sale.deliveryCharge)}</span>
              </div>
            )}
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
              <span>Order Total:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-700 font-semibold pt-1">
              <span>Amount Received:</span>
              <span>{formatCurrency(sale.amountReceived)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold">
              <span>Outstanding Balance:</span>
              <span>{formatCurrency(sale.outstandingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Customer Payment" maxWidth="sm">
        <form onSubmit={handlePayment} className="space-y-4">
          <Input
            label="Payment Amount (LKR)"
            type="number"
            min="0.01"
            max={sale.outstandingBalance}
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            required
            helperText={`Max receivable: LKR ${sale.outstandingBalance.toLocaleString()}`}
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
    </div>
  )
}
