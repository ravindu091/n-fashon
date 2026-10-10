import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { BatchStatus } from '@/types'

export interface IStockBatch extends Document {
  _id: Types.ObjectId
  batchCode: string
  purchaseId: Types.ObjectId
  purchaseLineId: Types.ObjectId
  productId: Types.ObjectId
  variantId: Types.ObjectId
  supplierId: Types.ObjectId
  // Snapshot strings for display without joins
  productCode: string
  variantCode: string
  productName: string
  size: string
  color: string
  supplierName: string
  purchaseDate: Date
  receivedDate: Date
  startingQty: number
  remainingQty: number
  unitBuyingCost: number
  allocatedShippingPerUnit: number
  allocatedOtherCostPerUnit: number
  landedUnitCost: number
  status: BatchStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const StockBatchSchema = new Schema<IStockBatch>(
  {
    batchCode:                { type: String, required: true, unique: true },
    purchaseId:               { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
    purchaseLineId:           { type: Schema.Types.ObjectId, required: true },
    productId:                { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId:                { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    supplierId:               { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    productCode:              { type: String, required: true },
    variantCode:              { type: String, required: true },
    productName:              { type: String, required: true },
    size:                     { type: String, required: true },
    color:                    { type: String, required: true },
    supplierName:             { type: String, required: true },
    purchaseDate:             { type: Date, required: true },
    receivedDate:             { type: Date, required: true },
    startingQty:              { type: Number, required: true, min: 1 },
    remainingQty:             { type: Number, required: true, min: 0 },
    unitBuyingCost:           { type: Number, required: true, min: 0 },
    allocatedShippingPerUnit: { type: Number, default: 0, min: 0 },
    allocatedOtherCostPerUnit:{ type: Number, default: 0, min: 0 },
    landedUnitCost:           { type: Number, required: true, min: 0 },
    status:                   { type: String, enum: ['active','depleted','returned','damaged'], default: 'active' },
    notes:                    { type: String },
  },
  { timestamps: true }
)

// Critical: FIFO query — oldest active batch first, for a given variant
StockBatchSchema.index({ variantId: 1, status: 1, receivedDate: 1 })
StockBatchSchema.index({ productId: 1, status: 1 })
StockBatchSchema.index({ supplierId: 1 })
StockBatchSchema.index({ purchaseId: 1 })
StockBatchSchema.index({ receivedDate: -1 })

export const StockBatch: Model<IStockBatch> =
  models.StockBatch ?? model<IStockBatch>('StockBatch', StockBatchSchema)
