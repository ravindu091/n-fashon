import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { SupplierStatus } from '@/types'

export interface ISupplier extends Document {
  _id: Types.ObjectId
  code: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  status: SupplierStatus
  totalPurchases: number
  outstandingBalance: number
  advanceBalance: number
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>(
  {
    code:               { type: String, required: true, unique: true, uppercase: true },
    name:               { type: String, required: true, trim: true },
    contactPerson:      { type: String, trim: true },
    phone:              { type: String, trim: true },
    email:              { type: String, trim: true, lowercase: true },
    address:            { type: String, trim: true },
    notes:              { type: String },
    status:             { type: String, enum: ['active','inactive','archived'], default: 'active' },
    totalPurchases:     { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0 },
    advanceBalance:     { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

SupplierSchema.index({ name: 'text', phone: 'text' })
SupplierSchema.index({ status: 1 })

export const Supplier: Model<ISupplier> =
  models.Supplier ?? model<ISupplier>('Supplier', SupplierSchema)
