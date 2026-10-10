import 'server-only'
import connectDB from '@/lib/mongodb'
import { nextSequence } from '@/models/SequenceCounter'
import { format } from 'date-fns'

// ── Category prefix map ────────────────────────────────────────────────────────
const CATEGORY_PREFIXES: Record<string, string> = {
  'T-Shirts':  'TSH',
  'Shirts':    'SHT',
  'Trousers':  'TRS',
  'Jeans':     'JNS',
  'Dresses':   'DRS',
  'Skirts':    'SKT',
  'Hoodies':   'HDY',
  'Jackets':   'JKT',
  'Shorts':    'SHR',
  'Other':     'OTH',
}

export function getCategoryPrefix(category: string): string {
  return CATEGORY_PREFIXES[category] ?? category.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X')
}

/** Generate product code: TSH-0001 */
export async function generateProductCode(category: string): Promise<string> {
  await connectDB()
  const prefix = getCategoryPrefix(category)
  const seq = await nextSequence(`PROD-${prefix}`)
  return `${prefix}-${String(seq).padStart(4, '0')}`
}

/** Generate variant code: TSH-0001-BLK-M */
export async function generateVariantCode(productCode: string, color: string, size: string): Promise<string> {
  const colorCode = color.toUpperCase().replace(/\s+/g, '').slice(0, 3)
  const sizeCode  = size.toUpperCase().replace('FREE SIZE', 'FREE').replace(/\s+/g, '-')
  return `${productCode}-${colorCode}-${sizeCode}`
}

/** Generate batch code: BAT-20261010-0001 */
export async function generateBatchCode(date: Date = new Date()): Promise<string> {
  await connectDB()
  const dateStr = format(date, 'yyyyMMdd')
  const key = `BAT-${dateStr}`
  const seq = await nextSequence(key)
  return `${key}-${String(seq).padStart(4, '0')}`
}

/** Generate purchase number: PO-20261010-0001 */
export async function generatePurchaseNumber(date: Date = new Date()): Promise<string> {
  await connectDB()
  const dateStr = format(date, 'yyyyMMdd')
  const key = `PO-${dateStr}`
  const seq = await nextSequence(key)
  return `PO-${dateStr}-${String(seq).padStart(4, '0')}`
}

/** Generate sale number: SALE-20261010-0001 */
export async function generateSaleNumber(date: Date = new Date()): Promise<string> {
  await connectDB()
  const dateStr = format(date, 'yyyyMMdd')
  const key = `SALE-${dateStr}`
  const seq = await nextSequence(key)
  return `SALE-${dateStr}-${String(seq).padStart(4, '0')}`
}

/** Generate return number: RET-20261010-0001 */
export async function generateReturnNumber(date: Date = new Date()): Promise<string> {
  await connectDB()
  const dateStr = format(date, 'yyyyMMdd')
  const key = `RET-${dateStr}`
  const seq = await nextSequence(key)
  return `RET-${dateStr}-${String(seq).padStart(4, '0')}`
}

/** Generate supplier code: SUP-0001 */
export async function generateSupplierCode(): Promise<string> {
  await connectDB()
  const seq = await nextSequence('SUP')
  return `SUP-${String(seq).padStart(4, '0')}`
}

/** Generate customer code: CUST-0001 */
export async function generateCustomerCode(): Promise<string> {
  await connectDB()
  const seq = await nextSequence('CUST')
  return `CUST-${String(seq).padStart(4, '0')}`
}

/** Generate expense number: EXP-20261010-0001 */
export async function generateExpenseNumber(date: Date = new Date()): Promise<string> {
  await connectDB()
  const dateStr = format(date, 'yyyyMMdd')
  const key = `EXP-${dateStr}`
  const seq = await nextSequence(key)
  return `EXP-${dateStr}-${String(seq).padStart(4, '0')}`
}
