import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Sale } from '@/models/Sale'
import { arrayToCSV } from '@/utils/csv'
import { formatDate } from '@/utils/date'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const query: Record<string, unknown> = { status: 'confirmed' }
  if (dateFrom || dateTo) {
    query.saleDate = {}
    if (dateFrom) (query.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const sales = await Sale.find(query).sort({ saleDate: -1 }).lean()

  const flatRows: Record<string, unknown>[] = []
  sales.forEach((s) => {
    s.lines.forEach((l) => {
      flatRows.push({
        saleNumber: s.saleNumber,
        saleDate: formatDate(s.saleDate),
        customerName: s.customerName || 'Walk-in',
        channel: s.channel,
        productName: l.productName,
        variantCode: l.variantCode,
        size: l.size,
        color: l.color,
        qty: l.qty,
        unitSellingPrice: l.unitSellingPrice,
        unitCostSnapshot: l.unitCostSnapshot,
        lineTotal: l.lineTotal,
        lineCOGS: l.lineCOGS,
        lineProfit: l.lineTotal - l.lineCOGS,
        paymentStatus: s.paymentStatus,
      })
    })
  })

  const headers = [
    { label: 'Sale Number', key: 'saleNumber' },
    { label: 'Date', key: 'saleDate' },
    { label: 'Customer', key: 'customerName' },
    { label: 'Channel', key: 'channel' },
    { label: 'Garment Name', key: 'productName' },
    { label: 'Variant Code', key: 'variantCode' },
    { label: 'Size', key: 'size' },
    { label: 'Color', key: 'color' },
    { label: 'Qty', key: 'qty' },
    { label: 'Unit Selling Price', key: 'unitSellingPrice' },
    { label: 'Batch Landed Cost', key: 'unitCostSnapshot' },
    { label: 'Line Revenue', key: 'lineTotal' },
    { label: 'Line COGS', key: 'lineCOGS' },
    { label: 'Line Gross Profit', key: 'lineProfit' },
    { label: 'Payment Status', key: 'paymentStatus' },
  ]

  const csv = arrayToCSV(headers, flatRows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sales-report-${dateFrom || 'all'}.csv"`,
    },
  })
}
