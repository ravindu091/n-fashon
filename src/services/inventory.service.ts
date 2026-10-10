import 'server-only'
import connectDB from '@/lib/mongodb'
import { StockBatch } from '@/models/StockBatch'
import { StockMovement } from '@/models/StockMovement'
import type { Types } from 'mongoose'
import type { MovementType } from '@/types'

export interface FifoAllocation {
  batchId: Types.ObjectId
  batchCode: string
  qty: number
  unitCostSnapshot: number
  lineCOGS: number
}

/**
 * Allocate qty from available batches using FIFO (oldest receivedDate first).
 * Does NOT update the database — just computes the allocation plan.
 * Throws if insufficient stock.
 */
export async function planFifoAllocation(
  variantId: Types.ObjectId,
  totalQtyNeeded: number
): Promise<FifoAllocation[]> {
  await connectDB()

  const batches = await StockBatch.find({
    variantId,
    status: 'active',
    remainingQty: { $gt: 0 },
  })
    .sort({ receivedDate: 1, createdAt: 1 }) // FIFO: oldest first
    .lean()

  const plan: FifoAllocation[] = []
  let remaining = totalQtyNeeded

  for (const batch of batches) {
    if (remaining <= 0) break
    const take = Math.min(remaining, batch.remainingQty)
    plan.push({
      batchId:          batch._id as Types.ObjectId,
      batchCode:        batch.batchCode,
      qty:              take,
      unitCostSnapshot: batch.landedUnitCost,
      lineCOGS:         take * batch.landedUnitCost,
    })
    remaining -= take
  }

  if (remaining > 0) {
    throw new Error(`Insufficient stock: need ${totalQtyNeeded} but only ${totalQtyNeeded - remaining} available`)
  }

  return plan
}

/**
 * Apply a FIFO allocation plan — atomically deduct from batches.
 * Uses conditional $inc to prevent going below zero.
 * Must be called inside a MongoDB session/transaction when possible.
 */
export async function applyFifoAllocation(
  allocations: FifoAllocation[],
  movementType: MovementType,
  referenceType: string,
  referenceId: Types.ObjectId,
  referenceNumber: string,
  userId: string,
  userName: string,
  variantMeta: { variantId: Types.ObjectId; productId: Types.ObjectId; variantCode: string; productName: string; size: string; color: string },
  idempotencyPrefix: string
): Promise<void> {
  await connectDB()

  for (const alloc of allocations) {
    // Atomic: only deduct if enough stock remains
    const updated = await StockBatch.findOneAndUpdate(
      { _id: alloc.batchId, remainingQty: { $gte: alloc.qty } },
      { $inc: { remainingQty: -alloc.qty } },
      { new: true }
    )

    if (!updated) {
      throw new Error(`Concurrent stock conflict on batch ${alloc.batchCode}`)
    }

    // Mark batch as depleted if empty
    if (updated.remainingQty === 0) {
      await StockBatch.findByIdAndUpdate(alloc.batchId, { status: 'depleted' })
    }

    const beforeQty = updated.remainingQty + alloc.qty

    // Create movement record
    await StockMovement.create({
      variantId:       variantMeta.variantId,
      batchId:         alloc.batchId,
      productId:       variantMeta.productId,
      variantCode:     variantMeta.variantCode,
      productName:     variantMeta.productName,
      size:            variantMeta.size,
      color:           variantMeta.color,
      type:            movementType,
      qtyChange:       -alloc.qty,
      beforeQty,
      afterQty:        updated.remainingQty,
      referenceType,
      referenceId,
      referenceNumber,
      userId,
      userName,
      idempotencyKey:  `${idempotencyPrefix}-${alloc.batchId.toString()}`,
    })
  }
}

/**
 * Restock from a return — increase remainingQty on a batch.
 */
export async function restockBatch(
  batchId: Types.ObjectId,
  qty: number,
  referenceType: string,
  referenceId: Types.ObjectId,
  referenceNumber: string,
  userId: string,
  userName: string,
  variantMeta: { variantId: Types.ObjectId; productId: Types.ObjectId; variantCode: string; productName: string; size: string; color: string }
): Promise<void> {
  await connectDB()

  const updated = await StockBatch.findByIdAndUpdate(
    batchId,
    { $inc: { remainingQty: qty }, status: 'active' },
    { new: true }
  )

  if (!updated) throw new Error(`Batch ${batchId} not found`)

  await StockMovement.create({
    variantId:       variantMeta.variantId,
    batchId,
    productId:       variantMeta.productId,
    variantCode:     variantMeta.variantCode,
    productName:     variantMeta.productName,
    size:            variantMeta.size,
    color:           variantMeta.color,
    type:            'customer_return' as MovementType,
    qtyChange:       qty,
    beforeQty:       updated.remainingQty - qty,
    afterQty:        updated.remainingQty,
    referenceType,
    referenceId,
    referenceNumber,
    userId,
    userName,
  })
}

/** Get total available stock for a variant (sum of active batch remainingQty) */
export async function getVariantStock(variantId: Types.ObjectId): Promise<number> {
  await connectDB()
  const result = await StockBatch.aggregate([
    { $match: { variantId, status: 'active', remainingQty: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$remainingQty' } } },
  ])
  return result[0]?.total ?? 0
}
