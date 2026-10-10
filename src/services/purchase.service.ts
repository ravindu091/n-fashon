import 'server-only'
import connectDB from '@/lib/mongodb'
import { Purchase, IPurchase, IPurchaseLine } from '@/models/Purchase'
import { Supplier } from '@/models/Supplier'
import { StockBatch } from '@/models/StockBatch'
import { StockMovement } from '@/models/StockMovement'
import { generatePurchaseNumber, generateBatchCode } from '@/services/codegen.service'
import type { PaginatedResult, PurchaseStatus, PaymentStatus } from '@/types'
import { Types } from 'mongoose'

export interface CreatePurchaseLineInput {
  variantId: string
  productId: string
  productCode: string
  variantCode: string
  productName: string
  size: string
  color: string
  orderedQty: number
  unitBuyingCost: number
}

export interface CreatePurchaseInput {
  supplierId: string
  supplierName: string
  supplierInvoiceNumber?: string
  purchaseDate: Date | string
  expectedDeliveryDate?: Date | string
  lines: CreatePurchaseLineInput[]
  discountAmount?: number
  shippingCost?: number
  otherCosts?: number
  notes?: string
}

export interface PurchaseFilters {
  search?: string
  supplierId?: string
  status?: string
  paymentStatus?: string
  dateFrom?: string | Date
  dateTo?: string | Date
  page?: number
  limit?: number
}

export async function createPurchase(data: CreatePurchaseInput, userId: string) {
  await connectDB()

  if (!data.lines || data.lines.length === 0) {
    throw new Error('At least one line item is required.')
  }

  const purchaseNumber = await generatePurchaseNumber(new Date(data.purchaseDate))

  let subtotal = 0
  const processedLines: IPurchaseLine[] = data.lines.map((l) => {
    const lineTotal = l.orderedQty * l.unitBuyingCost
    subtotal += lineTotal
    return {
      variantId: new Types.ObjectId(l.variantId),
      productId: new Types.ObjectId(l.productId),
      productCode: l.productCode,
      variantCode: l.variantCode,
      productName: l.productName,
      size: l.size,
      color: l.color,
      orderedQty: l.orderedQty,
      receivedQty: 0,
      unitBuyingCost: l.unitBuyingCost,
      lineTotal,
    } as IPurchaseLine
  })

  const discount = data.discountAmount ?? 0
  const shipping = data.shippingCost ?? 0
  const other = data.otherCosts ?? 0
  const totalCost = Math.max(0, subtotal - discount + shipping + other)

  const purchase = await Purchase.create({
    purchaseNumber,
    supplierId: new Types.ObjectId(data.supplierId),
    supplierName: data.supplierName,
    supplierInvoiceNumber: data.supplierInvoiceNumber,
    purchaseDate: new Date(data.purchaseDate),
    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
    lines: processedLines,
    subtotal,
    discountAmount: discount,
    shippingCost: shipping,
    otherCosts: other,
    totalCost,
    amountPaid: 0,
    outstandingBalance: totalCost,
    paymentStatus: 'unpaid',
    status: 'draft',
    notes: data.notes,
    createdBy: userId,
  })

  // Update supplier totalPurchases and balance
  await Supplier.findByIdAndUpdate(data.supplierId, {
    $inc: {
      totalPurchases: totalCost,
      outstandingBalance: totalCost,
    },
  })

  return purchase
}

export async function markOrdered(purchaseId: string) {
  await connectDB()
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')
  if (purchase.status !== 'draft') {
    throw new Error(`Cannot mark as ordered from status: ${purchase.status}`)
  }

  purchase.status = 'ordered'
  await purchase.save()
  return purchase
}

export interface ReceiveLineItemInput {
  lineId: string
  receivedQty: number
}

export async function receivePurchaseLines(
  purchaseId: string,
  receipts: ReceiveLineItemInput[],
  userId: string,
  userName: string = 'User'
) {
  await connectDB()
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  if (purchase.status === 'draft') {
    throw new Error('Please mark purchase as Ordered before receiving stock.')
  }
  if (purchase.status === 'cancelled') {
    throw new Error('Cannot receive stock for a cancelled purchase.')
  }

  const totalOrderedQty = purchase.lines.reduce((sum, l) => sum + l.orderedQty, 0)
  const shippingPerUnit = totalOrderedQty > 0 ? purchase.shippingCost / totalOrderedQty : 0
  const otherCostPerUnit = totalOrderedQty > 0 ? purchase.otherCosts / totalOrderedQty : 0

  const receiptDate = new Date()

  for (const receipt of receipts) {
    if (receipt.receivedQty <= 0) continue

    const line = purchase.lines.find((l) => (l as unknown as { _id: Types.ObjectId })._id.toString() === receipt.lineId)
    if (!line) {
      throw new Error(`Line ${receipt.lineId} not found in purchase`)
    }

    const maxReceivable = line.orderedQty - line.receivedQty
    if (receipt.receivedQty > maxReceivable) {
      throw new Error(
        `Received qty (${receipt.receivedQty}) exceeds remaining ordered qty (${maxReceivable}) for ${line.variantCode}`
      )
    }

    // Allocate landed cost per unit
    const landedUnitCost = Math.round((line.unitBuyingCost + shippingPerUnit + otherCostPerUnit) * 100) / 100
    const batchCode = await generateBatchCode(receiptDate)

    const batch = await StockBatch.create({
      batchCode,
      purchaseId: purchase._id,
      purchaseLineId: (line as unknown as { _id: Types.ObjectId })._id,
      productId: line.productId,
      variantId: line.variantId,
      supplierId: purchase.supplierId,
      productCode: line.productCode,
      variantCode: line.variantCode,
      productName: line.productName,
      size: line.size,
      color: line.color,
      supplierName: purchase.supplierName,
      purchaseDate: purchase.purchaseDate,
      receivedDate: receiptDate,
      startingQty: receipt.receivedQty,
      remainingQty: receipt.receivedQty,
      unitBuyingCost: line.unitBuyingCost,
      allocatedShippingPerUnit: shippingPerUnit,
      allocatedOtherCostPerUnit: otherCostPerUnit,
      landedUnitCost,
      status: 'active',
    })

    // Create auditable StockMovement record
    await StockMovement.create({
      variantId: line.variantId,
      batchId: batch._id,
      productId: line.productId,
      variantCode: line.variantCode,
      productName: line.productName,
      size: line.size,
      color: line.color,
      type: 'purchase_receipt',
      qtyChange: receipt.receivedQty,
      beforeQty: 0,
      afterQty: receipt.receivedQty,
      referenceType: 'Purchase',
      referenceId: purchase._id,
      referenceNumber: purchase.purchaseNumber,
      reason: `Stock receipt for ${purchase.purchaseNumber}`,
      userId,
      userName,
      idempotencyKey: `rcv-${purchase._id}-${batch._id}`,
    })

    line.receivedQty += receipt.receivedQty
  }

  // Update status based on total received vs ordered
  const allOrdered = purchase.lines.reduce((s, l) => s + l.orderedQty, 0)
  const allReceived = purchase.lines.reduce((s, l) => s + l.receivedQty, 0)

  if (allReceived >= allOrdered) {
    purchase.status = 'received'
  } else if (allReceived > 0) {
    purchase.status = 'partially_received'
  }

  await purchase.save()
  return purchase
}

export async function addPurchasePayment(
  purchaseId: string,
  amount: number,
  _paymentMethod: string = 'bank_transfer',
  _userId: string
) {
  await connectDB()
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  if (amount <= 0) throw new Error('Payment amount must be greater than zero')
  if (amount > purchase.outstandingBalance) {
    throw new Error(`Payment cannot exceed outstanding balance of ${purchase.outstandingBalance}`)
  }

  purchase.amountPaid += amount
  purchase.outstandingBalance -= amount

  if (purchase.outstandingBalance <= 0) {
    purchase.paymentStatus = 'paid'
  } else {
    purchase.paymentStatus = 'partial'
  }

  await purchase.save()

  // Update supplier outstanding balance
  await Supplier.findByIdAndUpdate(purchase.supplierId, {
    $inc: { outstandingBalance: -amount },
  })

  return purchase
}

export async function cancelPurchase(purchaseId: string, _userId: string) {
  await connectDB()
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  const anyReceived = purchase.lines.some((l) => l.receivedQty > 0)
  if (anyReceived) {
    throw new Error('Cannot cancel a purchase with received stock. Reversals must be used instead.')
  }

  // Reverse supplier impact
  await Supplier.findByIdAndUpdate(purchase.supplierId, {
    $inc: {
      totalPurchases: -purchase.totalCost,
      outstandingBalance: -purchase.outstandingBalance,
    },
  })

  purchase.status = 'cancelled'
  await purchase.save()
  return purchase
}

export async function getPurchases(filters: PurchaseFilters): Promise<PaginatedResult<IPurchase>> {
  await connectDB()
  const {
    search,
    supplierId,
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (paymentStatus) {
    if (paymentStatus === 'outstanding') {
      query.outstandingBalance = { $gt: 0 }
    } else {
      query.paymentStatus = paymentStatus
    }
  }
  if (supplierId) query.supplierId = new Types.ObjectId(supplierId)

  if (search) {
    query.$or = [
      { purchaseNumber: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
      { supplierInvoiceNumber: { $regex: search, $options: 'i' } },
    ]
  }

  if (dateFrom || dateTo) {
    query.purchaseDate = {}
    if (dateFrom) (query.purchaseDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.purchaseDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [purchases, total] = await Promise.all([
    Purchase.find(query).sort({ purchaseDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Purchase.countDocuments(query),
  ])

  return {
    data: purchases as unknown as IPurchase[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  }
}

export async function getPurchaseById(id: string) {
  await connectDB()
  const purchase = await Purchase.findById(id).lean()
  if (!purchase) return null
  return purchase
}
