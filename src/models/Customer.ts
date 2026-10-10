import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { CustomerStatus } from '@/types'

export interface ICustomer extends Document {
  _id: Types.ObjectId
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  status: CustomerStatus
  totalPurchases: number
  outstandingBalance: number
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    code:               { type: String, required: true, unique: true, uppercase: true },
    name:               { type: String, required: true, trim: true },
    phone:              { type: String, required: true, trim: true },
    email:              { type: String, trim: true, lowercase: true },
    address:            { type: String, trim: true },
    notes:              { type: String },
    status:             { type: String, enum: ['active','archived'], default: 'active' },
    totalPurchases:     { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
)

CustomerSchema.index({ code: 1 }, { unique: true })
CustomerSchema.index({ name: 'text', phone: 'text' })
CustomerSchema.index({ status: 1 })

export const Customer: Model<ICustomer> =
  models.Customer ?? model<ICustomer>('Customer', CustomerSchema)
