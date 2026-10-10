import 'server-only'
import connectDB from '@/lib/mongodb'
import { Return, IReturn, IReturnLine } from '@/models/Return'
import { Sale } from '@/models/Sale'
import { Customer } from '@/models/Customer'
import { StockBatch } from '@/models/StockBatch'
import { StockMovement } from '@/models/StockMovement'
import { generateReturnNumber } from '@/services/codegen.service'
import { restockBatch } from '@/services/inventory.service'
import type { PaginatedResult, ReturnCondition, PaymentStatus } from '@/types'
import { Types } from 'mongoose'

export interface CreateReturnLineInput {
  saleLineId: string
  qty: number
  condition: ReturnCondition
  refundAmount: number
}

export interface CreateReturnInput {
  saleId: string
  returnDate?: Date | string
  lines: CreateReturnLineInput[]
  reason: string
  refundMethod?: string
  paymentRefundStatus?: PaymentStatus
  linkedReplacementSaleId?: string
  notes?: string
}

export interface ReturnFilters {
  search?: string
  saleId?: string
  status?: string
  dateFrom?: string | Date
  dateTo?: string | Date
  page?: number
  limit?: number
}

export async function createReturn(data: CreateReturnInput, userId: string, userName: string = 'User') {
  await connectDB()

  const sale = await Sale.findById(data.saleId)
  if (!sale) throw new Error('Original sale not found')

  if (!data.lines || data.lines.length === 0) {
    throw new Error('At least one return item is required.')
  }

  // Fetch all existing returns for this sale to ensure customer doesn't return more than purchased
  const existingReturns = await Return.find({ saleId: sale._id }).lean()
  const previouslyReturnedMap = new Map<string, number>()
  for (const ret of existingReturns) {
    for (const rLine of ret.lines) {
      const prev = previouslyReturnedMap.get(rLine.saleLineId.toString()) ?? 0
      previouslyReturnedMap.set(rLine.saleLineId.toString(), prev + rLine.qty)
    }
  }

  const returnDate = data.returnDate ? new Date(data.returnDate) : new Date()
  const returnNumber = await generateReturnNumber(returnDate)

  let totalRefund = 0
  const processedLines: IReturnLine[] = []

  for (const lineInput of data.lines) {
    if (lineInput.qty <= 0) continue

    const saleLine = sale.lines.find((l) => (l as unknown as { _id: Types.ObjectId })._id.toString() === lineInput.saleLineId)
    if (!saleLine) {
      throw new Error(`Sale line ${lineInput.saleLineId} not found on sale ${sale.saleNumber}`)
    }

    const alreadyReturned = previouslyReturnedMap.get(lineInput.saleLineId) ?? 0
    const maxReturnable = saleLine.qty - alreadyReturned

    if (lineInput.qty > maxReturnable) {
      throw new Error(
        `Cannot return ${lineInput.qty} units of ${saleLine.variantCode}. Only ${maxReturnable} units remain eligible for return.`
      )
    }

    const isResellable = lineInput.condition === 'resellable'

    const variantMeta = {
      variantId: saleLine.variantId,
      productId: saleLine.productId,
      variantCode: saleLine.variantCode,
      productName: saleLine.productName,
      size: saleLine.size,
      color: saleLine.color,
    }

    if (isResellable) {
      // Return to available stock in original batch
      await restockBatch(
        saleLine.batchId,
        lineInput.qty,
        'Return',
        new Types.ObjectId(),
        returnNumber,
        userId,
        userName,
        variantMeta
      )
    } else {
      // Record damaged movement without increasing sellable stock
      const batch = await StockBatch.findById(saleLine.batchId)
      await StockMovement.create({
        variantId: saleLine.variantId,
        batchId: saleLine.batchId,
        productId: saleLine.productId,
        variantCode: saleLine.variantCode,
        productName: saleLine.productName,
        size: saleLine.size,
        color: saleLine.color,
        type: 'damaged',
        qtyChange: 0,
        beforeQty: batch?.remainingQty ?? 0,
        afterQty: batch?.remainingQty ?? 0,
        referenceType: 'Return',
        referenceId: sale._id,
        referenceNumber: returnNumber,
        reason: `Customer return (${lineInput.condition}): ${data.reason}`,
        userId,
        userName,
      })
    }

    totalRefund += lineInput.refundAmount

    processedLines.push({
      saleLineId: (saleLine as unknown as { _id: Types.ObjectId })._id,
      variantId: saleLine.variantId,
      batchId: saleLine.batchId,
      productId: saleLine.productId,
      variantCode: saleLine.variantCode,
      productName: saleLine.productName,
      size: saleLine.size,
      color: saleLine.color,
      qty: lineInput.qty,
      unitSellingPrice: saleLine.unitSellingPrice,
      refundAmount: lineInput.refundAmount,
      condition: lineInput.condition,
      restocked: isResellable,
    } as IReturnLine)
  }

  const ret = await Return.create({
    returnNumber,
    saleId: sale._id,
    saleNumber: sale.saleNumber,
    returnDate,
    customerId: sale.customerId,
    customerName: sale.customerName,
    lines: processedLines,
    totalRefundAmount: totalRefund,
    paymentRefundStatus: data.paymentRefundStatus ?? 'unpaid',
    refundMethod: data.refundMethod,
    reason: data.reason,
    status: 'completed',
    linkedReplacementSaleId: data.linkedReplacementSaleId ? new Types.ObjectId(data.linkedReplacementSaleId) : undefined,
    notes: data.notes,
    createdBy: userId,
  })

  // Adjust customer outstanding balance if refund reduces credit
  if (sale.customerId && totalRefund > 0) {
    await Customer.findByIdAndUpdate(sale.customerId, {
      $inc: { outstandingBalance: -totalRefund },
    })
  }

  return ret
}

export async function getReturns(filters: ReturnFilters): Promise<PaginatedResult<IReturn>> {
  await connectDB()
  const { search, saleId, status, dateFrom, dateTo, page = 1, limit = 20 } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (saleId) query.saleId = new Types.ObjectId(saleId)

  if (search) {
    query.$or = [
      { returnNumber: { $regex: search, $options: 'i' } },
      { saleNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
    ]
  }

  if (dateFrom || dateTo) {
    query.returnDate = {}
    if (dateFrom) (query.returnDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.returnDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [returns, total] = await Promise.all([
    Return.find(query).sort({ returnDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Return.countDocuments(query),
  ])

  return {
    data: returns as unknown as IReturn[],
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

export async function getReturnById(id: string) {
  await connectDB()
  const ret = await Return.findById(id).lean()
  if (!ret) return null
  return ret
}
