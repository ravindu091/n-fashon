import 'server-only'
import connectDB from '@/lib/mongodb'
import { StockBatch, IStockBatch } from '@/models/StockBatch'
import { StockMovement } from '@/models/StockMovement'
import type { PaginatedResult, MovementType } from '@/types'
import { Types } from 'mongoose'

export interface BatchFilters {
  search?: string
  productId?: string
  variantId?: string
  supplierId?: string
  status?: string
  dateFrom?: string | Date
  dateTo?: string | Date
  page?: number
  limit?: number
}

export async function getStockBatches(filters: BatchFilters): Promise<PaginatedResult<IStockBatch>> {
  await connectDB()
  const {
    search,
    productId,
    variantId,
    supplierId,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (productId) query.productId = new Types.ObjectId(productId)
  if (variantId) query.variantId = new Types.ObjectId(variantId)
  if (supplierId) query.supplierId = new Types.ObjectId(supplierId)

  if (search) {
    query.$or = [
      { batchCode: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
      { variantCode: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
    ]
  }

  if (dateFrom || dateTo) {
    query.receivedDate = {}
    if (dateFrom) (query.receivedDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.receivedDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [batches, total] = await Promise.all([
    StockBatch.find(query).sort({ receivedDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    StockBatch.countDocuments(query),
  ])

  return {
    data: batches as unknown as IStockBatch[],
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

export async function getBatchById(id: string) {
  await connectDB()
  const batch = await StockBatch.findById(id).lean()
  if (!batch) return null

  // Fetch movements for this batch
  const movements = await StockMovement.find({ batchId: id })
    .sort({ createdAt: -1 })
    .lean()

  return {
    ...batch,
    movements,
  }
}

export async function adjustStock(
  batchId: string,
  qtyChange: number,
  reason: string,
  movementType: MovementType = 'manual_adjustment',
  userId: string,
  userName: string = 'User',
  notes?: string
) {
  await connectDB()
  if (qtyChange === 0) {
    throw new Error('Quantity change must be non-zero.')
  }
  if (!reason || reason.trim().length === 0) {
    throw new Error('A mandatory reason is required for any manual stock adjustment.')
  }

  const batch = await StockBatch.findById(batchId)
  if (!batch) throw new Error('Stock batch not found')

  const beforeQty = batch.remainingQty
  const afterQty = beforeQty + qtyChange

  if (afterQty < 0) {
    throw new Error(`Adjustment of ${qtyChange} exceeds remaining stock of ${beforeQty}`)
  }

  batch.remainingQty = afterQty
  if (afterQty === 0) {
    batch.status = 'depleted'
  } else if (batch.status === 'depleted' && afterQty > 0) {
    batch.status = 'active'
  }
  await batch.save()

  // Create movement record
  const movement = await StockMovement.create({
    variantId: batch.variantId,
    batchId: batch._id,
    productId: batch.productId,
    variantCode: batch.variantCode,
    productName: batch.productName,
    size: batch.size,
    color: batch.color,
    type: movementType,
    qtyChange,
    beforeQty,
    afterQty,
    referenceType: 'ManualAdjustment',
    referenceId: batch._id,
    referenceNumber: batch.batchCode,
    reason,
    notes,
    userId,
    userName,
  })

  return { batch, movement }
}

export async function getInventorySummary() {
  await connectDB()
  const result: { _id: null; totalPieces: number; totalCostValue: number }[] = await StockBatch.aggregate([
    { $match: { status: 'active', remainingQty: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        totalPieces: { $sum: '$remainingQty' },
        totalCostValue: { $sum: { $multiply: ['$remainingQty', '$landedUnitCost'] } },
      },
    },
  ])

  return {
    totalPieces: result[0]?.totalPieces ?? 0,
    totalCostValue: Math.round((result[0]?.totalCostValue ?? 0) * 100) / 100,
  }
}
