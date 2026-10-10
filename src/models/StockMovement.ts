import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { MovementType } from '@/types'

export interface IStockMovement extends Document {
  _id: Types.ObjectId
  variantId: Types.ObjectId
  batchId: Types.ObjectId
  productId: Types.ObjectId
  variantCode: string
  productName: string
  size: string
  color: string
  type: MovementType
  qtyChange: number       // positive = in, negative = out
  beforeQty: number
  afterQty: number
  referenceType?: string  // 'Purchase' | 'Sale' | 'Return' | 'Expense'
  referenceId?: Types.ObjectId
  referenceNumber?: string
  reason?: string
  notes?: string
  userId: string
  userName?: string
  idempotencyKey?: string
  createdAt: Date
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    variantId:       { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    batchId:         { type: Schema.Types.ObjectId, ref: 'StockBatch', required: true },
    productId:       { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantCode:     { type: String, required: true },
    productName:     { type: String, required: true },
    size:            { type: String, required: true },
    color:           { type: String, required: true },
    type:            { type: String, enum: ['purchase_receipt','sale','customer_return','supplier_return','damaged','missing','manual_adjustment','stock_correction','reversal'], required: true },
    qtyChange:       { type: Number, required: true },
    beforeQty:       { type: Number, required: true },
    afterQty:        { type: Number, required: true },
    referenceType:   { type: String },
    referenceId:     { type: Schema.Types.ObjectId },
    referenceNumber: { type: String },
    reason:          { type: String },
    notes:           { type: String },
    userId:          { type: String, required: true },
    userName:        { type: String },
    idempotencyKey:  { type: String, unique: true, sparse: true },
  },
  { timestamps: true, versionKey: false }
)

// StockMovements are append-only — never updated
StockMovementSchema.index({ variantId: 1, createdAt: -1 })
StockMovementSchema.index({ batchId: 1, createdAt: -1 })
StockMovementSchema.index({ referenceId: 1 })
StockMovementSchema.index({ type: 1, createdAt: -1 })

export const StockMovement: Model<IStockMovement> =
  models.StockMovement ?? model<IStockMovement>('StockMovement', StockMovementSchema)
