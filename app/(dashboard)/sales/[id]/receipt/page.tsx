import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { getSaleById } from '@/services/sales.service'
import { getSettings } from '@/models/Settings'
import { formatCurrency } from '@/utils/currency'
import { formatDate, formatDateTime } from '@/utils/date'
import connectDB from '@/lib/mongodb'


export default async function SaleReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const [sale, settings] = await Promise.all([
    getSaleById(id),
    getSettings(),
  ])

  if (!sale) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top action bar (hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/sales/${sale._id}`} className="btn btn-outline text-xs">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Sale
        </Link>
        <button
          onClick={() => {}}
          className="btn btn-primary text-xs"
          // Client component wrapper or inline script for print
          id="print-btn"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print Receipt
        </button>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />

      {/* Printable Receipt Paper Card */}
      <div className="card p-8 bg-white border border-[var(--border)] shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="text-center border-b border-[var(--border)] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{settings.businessName}</h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Clothing Reselling & Retail</p>
          {settings.contactPhone && (
            <p className="text-xs text-[var(--foreground-muted)]">Tel: {settings.contactPhone}</p>
          )}
          {settings.address && (
            <p className="text-xs text-[var(--foreground-muted)]">{settings.address}</p>
          )}
        </div>

        {/* Receipt Meta */}
        <div className="py-4 border-b border-[var(--border)] grid grid-cols-2 gap-2 text-xs">
          <div>
            <p><span className="text-[var(--foreground-muted)]">Receipt #:</span> <strong className="font-mono">{sale.saleNumber}</strong></p>
            <p><span className="text-[var(--foreground-muted)]">Date:</span> {formatDateTime(sale.saleDate)}</p>
            <p><span className="text-[var(--foreground-muted)]">Channel:</span> <strong className="capitalize">{sale.channel}</strong></p>
          </div>
          <div className="text-right">
            <p><span className="text-[var(--foreground-muted)]">Customer:</span> <strong>{sale.customerName || 'Walk-in'}</strong></p>
            <p><span className="text-[var(--foreground-muted)]">Payment Method:</span> <strong className="capitalize">{sale.paymentMethod}</strong></p>
            <p><span className="text-[var(--foreground-muted)]">Status:</span> <strong className="uppercase text-emerald-700">{sale.paymentStatus}</strong></p>
          </div>
        </div>

        {/* Itemized Lines */}
        <div className="py-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--foreground-muted)]">
                <th className="py-2">Item</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.lines.map((line: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2.5">
                    <p className="font-bold text-[var(--foreground)]">{line.productName}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)] font-mono">
                      {line.size} / {line.color} ({line.variantCode})
                    </p>
                  </td>
                  <td className="py-2.5 text-center font-bold">{line.qty}</td>
                  <td className="py-2.5 text-right">{formatCurrency(line.unitSellingPrice)}</td>
                  <td className="py-2.5 text-right font-bold">{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-[var(--border)] pt-4 space-y-1.5 text-xs">
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
            <span>Total Amount:</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Amount Paid:</span>
            <span>{formatCurrency(sale.amountReceived)}</span>
          </div>
          {sale.outstandingBalance > 0 && (
            <div className="flex justify-between text-red-600 font-bold">
              <span>Outstanding Balance:</span>
              <span>{formatCurrency(sale.outstandingBalance)}</span>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-dashed border-[var(--border)] text-center text-[11px] text-[var(--foreground-muted)]">
          <p className="font-medium text-[var(--foreground)]">{settings.receiptFooter}</p>
          <p className="mt-1">Returns accepted within 7 days with valid condition inspection.</p>
        </div>
      </div>
    </div>
  )
}
