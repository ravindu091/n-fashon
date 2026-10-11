'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ShoppingCart, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { confirmSaleAction } from '@/actions/sale.actions'
import { formatCurrency } from '@/utils/currency'
import type { SaleChannel } from '@/types'

interface NewSaleClientProps {
  customers: { _id: string; name: string; phone: string }[]
  variants: {
    _id: string
    code: string
    productId: string
    productName: string
    size: string
    color: string
    defaultSellingPrice: number
    promoPrice?: number
    currentStock: number
    oldestBatchCost: number
  }[]
  channels: string[]
}

interface CartItem {
  variantId: string
  qty: number
  unitSellingPrice: number
  discountAmount: number
}

export function NewSaleClient({ customers, variants, channels }: NewSaleClientProps) {
  const router = useRouter()

  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [channel, setChannel] = useState<SaleChannel>('physical')
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [orderDiscount, setOrderDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState(0)
  const [notes, setNotes] = useState('')

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?._id || '')
  const [addQty, setAddQty] = useState(1)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeVariant = variants.find((v) => v._id === selectedVariantId)

  const variantOptions = useMemo(() => {
    return variants.map((v) => {
      const isOutOfStock = v.currentStock === 0
      return {
        value: v._id,
        label: `${v.productName} (${v.size} / ${v.color})`,
        sublabel: `Code: ${v.code} | LKR ${(v.promoPrice || v.defaultSellingPrice).toLocaleString()}`,
        badge: isOutOfStock ? '0 pcs' : `${v.currentStock} in stock`,
        badgeVariant: isOutOfStock
          ? ('danger' as const)
          : v.currentStock <= 3
          ? ('warning' as const)
          : ('success' as const),
        disabled: isOutOfStock,
        searchTerms: `${v.productName} ${v.code} ${v.size} ${v.color}`,
      }
    })
  }, [variants])

  const handleAddToCart = () => {
    if (!activeVariant) return

    if (addQty <= 0) {
      setError('Quantity must be at least 1.')
      return
    }

    if (addQty > activeVariant.currentStock) {
      setError(`Cannot add ${addQty} pcs. Only ${activeVariant.currentStock} pcs available in stock.`)
      return
    }

    // Check if variant already in cart
    const existingIndex = cart.findIndex((item) => item.variantId === activeVariant._id)
    if (existingIndex >= 0) {
      const updated = [...cart]
      const totalRequested = updated[existingIndex].qty + addQty
      if (totalRequested > activeVariant.currentStock) {
        setError(`Cannot add ${addQty} more. Total in cart exceeds available stock (${activeVariant.currentStock}).`)
        return
      }
      updated[existingIndex].qty = totalRequested
      setCart(updated)
    } else {
      setCart([
        ...cart,
        {
          variantId: activeVariant._id,
          qty: addQty,
          unitSellingPrice: activeVariant.promoPrice || activeVariant.defaultSellingPrice,
          discountAmount: 0,
        },
      ])
    }

    setError(null)
    setAddQty(1)
  }

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handleUpdateCartItem = (index: number, field: keyof CartItem, val: number) => {
    const updated = [...cart]
    updated[index] = { ...updated[index], [field]: val }
    setCart(updated)
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.unitSellingPrice * item.qty - item.discountAmount), 0)
  const totalAmount = Math.max(0, subtotal - orderDiscount + deliveryCharge)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Please add at least one garment to the order.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const idempotencyKey = crypto.randomUUID()

    try {
      const res = await confirmSaleAction({
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        channel,
        lines: cart.map((c) => ({
          variantId: c.variantId,
          qty: c.qty,
          unitSellingPrice: c.unitSellingPrice,
          discountAmount: c.discountAmount,
        })),
        discountAmount: orderDiscount,
        deliveryCharge,
        paymentMethod,
        amountReceived,
        notes: notes || undefined,
        idempotencyKey,
      })

      if (!res.success) throw new Error(res.error)
      router.push(`/sales/${(res.data as any)._id}`)
    } catch (err: unknown) {
      setError((err as Error).message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Record New Sale</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Create a sale order, deduct FIFO inventory atomically, and capture landed batch cost snapshot.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Picker & Cart Items (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add to Cart Bar */}
          <div className="card p-4 space-y-3 bg-slate-50/50">
            <h2 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Select Garment & Variant
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="label text-[11px]">Choose Available Variant</label>
                <SearchableSelect
                  options={variantOptions}
                  value={selectedVariantId}
                  onChange={(val) => setSelectedVariantId(val)}
                  placeholder="Search garment name, SKU, size, or color..."
                  searchPlaceholder="Type garment name, code, size, color..."
                />
              </div>

              <div>
                <label className="label text-[11px]">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={activeVariant?.currentStock || 1}
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  className="input text-xs font-bold"
                />
              </div>
            </div>

            {activeVariant && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[var(--foreground-muted)]">
                  Available in Stock: <strong className={activeVariant.currentStock === 0 ? 'text-red-600' : 'text-emerald-600'}>{activeVariant.currentStock} pcs</strong>
                </span>
                <Button type="button" size="sm" onClick={handleAddToCart} disabled={activeVariant.currentStock === 0} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add to Cart
                </Button>
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--foreground)]">Order Cart Items ({cart.length})</h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-600 hover:underline">
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-10 text-center text-xs text-[var(--foreground-muted)]">
                Cart is empty. Select a garment variant above and click "Add to Cart".
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {cart.map((item, idx) => {
                  const v = variants.find((variant) => variant._id === item.variantId)
                  const lineTotal = item.unitSellingPrice * item.qty - item.discountAmount
                  const isBelowCost = v && item.unitSellingPrice < v.oldestBatchCost

                  return (
                    <div key={idx} className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex-1 w-full sm:w-auto">
                        <p className="font-bold text-[var(--foreground)]">{v?.productName}</p>
                        <p className="font-mono text-[10px] text-[var(--foreground-muted)]">
                          {v?.code} ({v?.size} / {v?.color})
                        </p>
                        {isBelowCost && (
                          <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            Warning: Selling price is below estimated batch cost ({formatCurrency(v.oldestBatchCost)})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="w-20">
                          <label className="text-[10px] text-[var(--foreground-muted)] block">Qty</label>
                          <input
                            type="number"
                            min="1"
                            max={v?.currentStock || 1}
                            value={item.qty}
                            onChange={(e) => handleUpdateCartItem(idx, 'qty', Number(e.target.value))}
                            className="input text-xs py-1 text-center font-bold"
                          />
                        </div>

                        <div className="w-28">
                          <label className="text-[10px] text-[var(--foreground-muted)] block">Price (LKR)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitSellingPrice}
                            onChange={(e) => handleUpdateCartItem(idx, 'unitSellingPrice', Number(e.target.value))}
                            className="input text-xs py-1 text-right font-bold"
                          />
                        </div>

                        <div className="w-24 text-right">
                          <label className="text-[10px] text-[var(--foreground-muted)] block">Total</label>
                          <span className="font-bold text-[var(--foreground)]">{formatCurrency(lineTotal)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Checkout & Customer Form (1 col) */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            Order Checkout & Payment
          </h2>

          <div>
            <label className="label">Customer (Optional)</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                const cust = customers.find((c) => c._id === e.target.value)
                if (cust) setCustomerName(cust.name)
              }}
              className="input text-xs"
            >
              <option value="">Walk-in / Anonymous Customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {!customerId && (
            <Input
              label="Walk-in Customer Name"
              placeholder="e.g. Ruwan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Sales Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SaleChannel)}
                className="input text-xs"
              >
                {channels.map((ch) => (
                  <option key={ch} value={ch.toLowerCase()}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input text-xs"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card / POS</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Delivery Charge"
              type="number"
              min="0"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(Number(e.target.value))}
            />
            <Input
              label="Order Discount"
              type="number"
              min="0"
              value={orderDiscount}
              onChange={(e) => setOrderDiscount(Number(e.target.value))}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-[var(--border)] space-y-1 text-xs">
            <div className="flex justify-between text-[var(--foreground-muted)]">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between text-[var(--foreground-muted)]">
                <span>Delivery:</span>
                <span>+{formatCurrency(deliveryCharge)}</span>
              </div>
            )}
            {orderDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(orderDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
              <span>Final Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Input
            label="Amount Received (LKR)"
            type="number"
            min="0"
            step="0.01"
            value={amountReceived}
            onChange={(e) => setAmountReceived(Number(e.target.value))}
            helperText={`Outstanding will be: ${formatCurrency(Math.max(0, totalAmount - amountReceived))}`}
          />

          <div>
            <label className="label">Notes / Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input text-xs"
              placeholder="Delivery notes, courier tracking number..."
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5"
            disabled={cart.length === 0}
            isLoading={isSubmitting}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
          >
            Confirm & Deduct Stock
          </Button>
        </form>
      </div>
    </div>
  )
}
