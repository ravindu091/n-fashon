import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { SaleStatus, SaleChannel, PaymentStatus } from '@/types'

export interface ISaleLine {
  _id: Types.ObjectId
  variantId: Types.ObjectId
  batchId: Types.ObjectId
  productId: Types.ObjectId
  productCode: string
  variantCode: string
  productName: string
  size: string
  color: string
  qty: number
  unitSellingPrice: number   // actual price at time of sale
  unitCostSnapshot: number   // landed cost from batch — immutable
  discountAmount: number
  lineTotal: number          // (unitSellingPrice - discountPerUnit) * qty
  lineCOGS: number           // unitCostSnapshot * qty
}

export interface ISale extends Document {
  _id: Types.ObjectId
  saleNumber: string
  saleDate: Date
  customerId?: Types.ObjectId
  customerName?: string
  channel: SaleChannel
  lines: ISaleLine[]
  subtotal: number
  discountAmount: number
  deliveryCharge: number
  taxAmount: number
  totalAmount: number
  totalCOGS: number
  grossProfit: number
  paymentMethod: string
  paymentStatus: PaymentStatus
  amountReceived: number
  outstandingBalance: number
  status: SaleStatus
  notes?: string
  createdBy: string
  idempotencyKey: string
  createdAt: Date
  updatedAt: Date
}

const SaleLineSchema = new Schema<ISaleLine>(
  {
    variantId:        { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    batchId:          { type: Schema.Types.ObjectId, ref: 'StockBatch', required: true },
    productId:        { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productCode:      { type: String, required: true },
    variantCode:      { type: String, required: true },
    productName:      { type: String, required: true },
    size:             { type: String, required: true },
    color:            { type: String, required: true },
    qty:              { type: Number, required: true, min: 1 },
    unitSellingPrice: { type: Number, required: true, min: 0 },
    unitCostSnapshot: { type: Number, required: true, min: 0 },
    discountAmount:   { type: Number, default: 0, min: 0 },
    lineTotal:        { type: Number, required: true, min: 0 },
    lineCOGS:         { type: Number, required: true, min: 0 },
  },
  { _id: true }
)

const SaleSchema = new Schema<ISale>(
  {
    saleNumber:       { type: String, required: true, unique: true },
    saleDate:         { type: Date, required: true },
    customerId:       { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName:     { type: String },
    channel:          { type: String, enum: ['facebook','instagram','whatsapp','physical','other'], default: 'physical' },
    lines:            { type: [SaleLineSchema], default: [] },
    subtotal:         { type: Number, default: 0, min: 0 },
    discountAmount:   { type: Number, default: 0, min: 0 },
    deliveryCharge:   { type: Number, default: 0, min: 0 },
    taxAmount:        { type: Number, default: 0, min: 0 },
    totalAmount:      { type: Number, default: 0, min: 0 },
    totalCOGS:        { type: Number, default: 0, min: 0 },
    grossProfit:      { type: Number, default: 0 },
    paymentMethod:    { type: String, default: 'cash' },
    paymentStatus:    { type: String, enum: ['unpaid','partial','paid','refunded'], default: 'unpaid' },
    amountReceived:   { type: Number, default: 0, min: 0 },
    outstandingBalance:{ type: Number, default: 0 },
    status:           { type: String, enum: ['pending','confirmed','cancelled','refunded'], default: 'pending' },
    notes:            { type: String },
    createdBy:        { type: String, required: true },
    idempotencyKey:   { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

SaleSchema.index({ saleNumber: 1 }, { unique: true })
SaleSchema.index({ idempotencyKey: 1 }, { unique: true })
SaleSchema.index({ saleDate: -1 })
SaleSchema.index({ customerId: 1 })
SaleSchema.index({ status: 1, saleDate: -1 })
SaleSchema.index({ channel: 1, saleDate: -1 })

export const Sale: Model<ISale> =
  models.Sale ?? model<ISale>('Sale', SaleSchema)
