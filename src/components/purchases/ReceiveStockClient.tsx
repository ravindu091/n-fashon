'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackageCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { receivePurchaseLinesAction } from '@/actions/purchase.actions'
import { formatCurrency } from '@/utils/currency'

interface ReceiveStockClientProps {
  purchase: any
}

export function ReceiveStockClient({ purchase }: ReceiveStockClientProps) {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    purchase.lines.forEach((l: any) => {
      const remaining = l.orderedQty - l.receivedQty
      init[l._id.toString()] = remaining > 0 ? remaining : 0
    })
    return init
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQtyChange = (lineId: string, val: number, max: number) => {
    const clamped = Math.max(0, Math.min(val, max))
    setReceipts((prev) => ({ ...prev, [lineId]: clamped }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = Object.entries(receipts)
      .filter(([_, qty]) => qty > 0)
      .map(([lineId, receivedQty]) => ({
        lineId,
        receivedQty,
      }))

    if (payload.length === 0) {
      setError('Please enter at least one quantity to receive into stock.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await receivePurchaseLinesAction(purchase._id, payload)
      if (!res.success) throw new Error(res.error)
      router.push(`/purchases/${purchase._id}`)
    } catch (err: unknown) {
      setError((err as Error).message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/purchases/${purchase._id}`} className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {purchase.purchaseNumber}
          </span>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
            Receive Physical Stock from {purchase.supplierName}
          </h1>
        </div>
      </div>

      <div className="card p-4 bg-blue-50/50 border-blue-200 text-xs text-blue-900 leading-relaxed">
        <strong>Batch Traceability & Landed Cost:</strong> Each confirmed receipt line will generate a separate traceable stock batch with allocated freight/shipping costs. The quantities confirmed below will become available in real-time inventory.
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Delivery Verification Lines</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Garment / Variant</th>
                <th>Size / Color</th>
                <th>Buying Price</th>
                <th>Ordered</th>
                <th>Already Received</th>
                <th>Pending Delivery</th>
                <th className="w-40 text-right">Confirm Receiving Now</th>
              </tr>
            </thead>
            <tbody>
              {purchase.lines.map((line: any) => {
                const pending = line.orderedQty - line.receivedQty
                const isFullyReceived = pending <= 0

                return (
                  <tr key={line._id.toString()} className={isFullyReceived ? 'opacity-50' : ''}>
                    <td className="text-xs">
                      <p className="font-bold">{line.productName}</p>
                      <p className="font-mono text-[10px] text-[var(--foreground-muted)]">{line.variantCode}</p>
                    </td>
                    <td className="text-xs">{line.size} / {line.color}</td>
                    <td className="text-xs">{formatCurrency(line.unitBuyingCost)}</td>
                    <td className="text-xs font-bold">{line.orderedQty} pcs</td>
                    <td className="text-xs font-semibold text-emerald-600">{line.receivedQty} pcs</td>
                    <td className="text-xs font-bold text-amber-600">{pending} pcs</td>
                    <td className="text-right">
                      {isFullyReceived ? (
                        <span className="text-xs text-emerald-600 font-semibold">Completed</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={pending}
                          value={receipts[line._id.toString()] ?? 0}
                          onChange={(e) => handleQtyChange(line._id.toString(), Number(e.target.value), pending)}
                          className="input w-28 text-right text-xs font-bold py-1"
                          required
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-[var(--border)] flex items-center justify-between">
          <Link href={`/purchases/${purchase._id}`} className="btn btn-outline text-xs">
            Cancel
          </Link>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<PackageCheck className="w-4 h-4" />}>
            Generate Stock Batches & Update Inventory
          </Button>
        </div>
      </form>
    </div>
  )
}
