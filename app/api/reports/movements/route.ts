import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { StockMovement } from '@/models/StockMovement'
import { arrayToCSV } from '@/utils/csv'
import { formatDateTime } from '@/utils/date'

export async function GET(_req: NextRequest) {
  await connectDB()

  const movements = await StockMovement.find()
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean()

  const rows = movements.map((m) => ({
    timestamp: formatDateTime(m.createdAt),
    type: m.type,
    productName: m.productName,
    variantCode: m.variantCode,
    size: m.size,
    color: m.color,
    qtyChange: m.qtyChange,
    beforeQty: m.beforeQty,
    afterQty: m.afterQty,
    referenceNumber: m.referenceNumber || '-',
    reason: m.reason || '-',
    userName: m.userName || '-',
  }))

  const headers = [
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'Movement Type', key: 'type' },
    { label: 'Garment Name', key: 'productName' },
    { label: 'Variant Code', key: 'variantCode' },
    { label: 'Size', key: 'size' },
    { label: 'Color', key: 'color' },
    { label: 'Quantity Change', key: 'qtyChange' },
    { label: 'Before Balance', key: 'beforeQty' },
    { label: 'After Balance', key: 'afterQty' },
    { label: 'Reference #', key: 'referenceNumber' },
    { label: 'Reason / Audit Notes', key: 'reason' },
    { label: 'Executed By', key: 'userName' },
  ]

  const csv = arrayToCSV(headers, rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="stock-movements-ledger.csv"',
    },
  })
}
