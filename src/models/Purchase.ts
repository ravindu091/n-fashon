import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { PurchaseStatus, PaymentStatus } from '@/types'

// Embedded line item
export interface IPurchaseLine {
  variantId: Types.ObjectId
  productId: Types.ObjectId
  productCode: string
  variantCode: string
  productName: string
  size: string
  color: string
  orderedQty: number
  receivedQty: number
  unitBuyingCost: number
  lineTotal: number
}

export interface IPurchase extends Document {
  _id: Types.ObjectId
  purchaseNumber: string
  supplierId: Types.ObjectId
  supplierName: string
  supplierInvoiceNumber?: string
  purchaseDate: Date
  expectedDeliveryDate?: Date
  lines: IPurchaseLine[]
  subtotal: number
  discountAmount: number
  shippingCost: number
  otherCosts: number
  totalCost: number
  amountPaid: number
  outstandingBalance: number
  paymentStatus: PaymentStatus
  status: PurchaseStatus
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const PurchaseLineSchema = new Schema<IPurchaseLine>(
  {
    variantId:      { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    productId:      { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productCode:    { type: String, required: true },
    variantCode:    { type: String, required: true },
    productName:    { type: String, required: true },
    size:           { type: String, required: true },
    color:          { type: String, required: true },
    orderedQty:     { type: Number, required: true, min: 1 },
    receivedQty:    { type: Number, default: 0, min: 0 },
    unitBuyingCost: { type: Number, required: true, min: 0 },
    lineTotal:      { type: Number, required: true, min: 0 },
  },
  { _id: true }
)

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseNumber:         { type: String, required: true, unique: true },
    supplierId:             { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName:           { type: String, required: true },
    supplierInvoiceNumber:  { type: String, trim: true },
    purchaseDate:           { type: Date, required: true },
    expectedDeliveryDate:   { type: Date },
    lines:                  { type: [PurchaseLineSchema], default: [] },
    subtotal:               { type: Number, default: 0, min: 0 },
    discountAmount:         { type: Number, default: 0, min: 0 },
    shippingCost:           { type: Number, default: 0, min: 0 },
    otherCosts:             { type: Number, default: 0, min: 0 },
    totalCost:              { type: Number, default: 0, min: 0 },
    amountPaid:             { type: Number, default: 0, min: 0 },
    outstandingBalance:     { type: Number, default: 0 },
    paymentStatus:          { type: String, enum: ['unpaid','partial','paid','refunded'], default: 'unpaid' },
    status:                 { type: String, enum: ['draft','ordered','partially_received','received','cancelled'], default: 'draft' },
    notes:                  { type: String },
    createdBy:              { type: String, required: true },
  },
  { timestamps: true }
)

PurchaseSchema.index({ supplierId: 1, status: 1 })
PurchaseSchema.index({ purchaseDate: -1 })
PurchaseSchema.index({ status: 1, paymentStatus: 1 })

export const Purchase: Model<IPurchase> =
  models.Purchase ?? model<IPurchase>('Purchase', PurchaseSchema)
