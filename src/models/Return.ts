import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { ReturnCondition, ReturnStatus, PaymentStatus } from '@/types'

export interface IReturnLine {
  _id: Types.ObjectId
  saleLineId: Types.ObjectId
  variantId: Types.ObjectId
  batchId: Types.ObjectId
  productId: Types.ObjectId
  variantCode: string
  productName: string
  size: string
  color: string
  qty: number
  unitSellingPrice: number
  refundAmount: number
  condition: ReturnCondition
  restocked: boolean
}

export interface IReturn extends Document {
  _id: Types.ObjectId
  returnNumber: string
  saleId: Types.ObjectId
  saleNumber: string
  returnDate: Date
  customerId?: Types.ObjectId
  customerName?: string
  lines: IReturnLine[]
  totalRefundAmount: number
  paymentRefundStatus: PaymentStatus
  refundMethod?: string
  reason: string
  status: ReturnStatus
  linkedReplacementSaleId?: Types.ObjectId
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const ReturnLineSchema = new Schema<IReturnLine>(
  {
    saleLineId:       { type: Schema.Types.ObjectId, required: true },
    variantId:        { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    batchId:          { type: Schema.Types.ObjectId, ref: 'StockBatch', required: true },
    productId:        { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantCode:      { type: String, required: true },
    productName:      { type: String, required: true },
    size:             { type: String, required: true },
    color:            { type: String, required: true },
    qty:              { type: Number, required: true, min: 1 },
    unitSellingPrice: { type: Number, required: true, min: 0 },
    refundAmount:     { type: Number, required: true, min: 0 },
    condition:        { type: String, enum: ['resellable','damaged','defective','other'], required: true },
    restocked:        { type: Boolean, default: false },
  },
  { _id: true }
)

const ReturnSchema = new Schema<IReturn>(
  {
    returnNumber:           { type: String, required: true, unique: true },
    saleId:                 { type: Schema.Types.ObjectId, ref: 'Sale', required: true },
    saleNumber:             { type: String, required: true },
    returnDate:             { type: Date, required: true },
    customerId:             { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName:           { type: String },
    lines:                  { type: [ReturnLineSchema], default: [] },
    totalRefundAmount:      { type: Number, default: 0, min: 0 },
    paymentRefundStatus:    { type: String, enum: ['unpaid','partial','paid','refunded'], default: 'unpaid' },
    refundMethod:           { type: String },
    reason:                 { type: String, required: true },
    status:                 { type: String, enum: ['pending','approved','completed','rejected'], default: 'pending' },
    linkedReplacementSaleId:{ type: Schema.Types.ObjectId, ref: 'Sale' },
    notes:                  { type: String },
    createdBy:              { type: String, required: true },
  },
  { timestamps: true }
)

ReturnSchema.index({ saleId: 1 })
ReturnSchema.index({ returnDate: -1 })

export const Return: Model<IReturn> =
  models.Return ?? model<IReturn>('Return', ReturnSchema)
