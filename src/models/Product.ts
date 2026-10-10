import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { ProductStatus } from '@/types'

// ─── Product ──────────────────────────────────────────────────────────────────
export interface IProduct extends Document {
  _id: Types.ObjectId
  code: string
  name: string
  description?: string
  category: string
  brand?: string
  images: string[]
  colors: string[]
  sizes: string[]
  defaultSellingPrice: number
  status: ProductStatus
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    code:                { type: String, required: true, unique: true, uppercase: true, trim: true },
    name:                { type: String, required: true, trim: true },
    description:         { type: String, trim: true },
    category:            { type: String, required: true, trim: true },
    brand:               { type: String, trim: true },
    images:              { type: [String], default: [] },
    colors:              { type: [String], default: [] },
    sizes:               { type: [String], default: [] },
    defaultSellingPrice: { type: Number, required: true, min: 0 },
    status:              { type: String, enum: ['active','archived'], default: 'active' },
  },
  { timestamps: true }
)

ProductSchema.index({ name: 'text', code: 'text' })
ProductSchema.index({ category: 1, status: 1 })
ProductSchema.index({ status: 1, createdAt: -1 })

export const Product: Model<IProduct> =
  models.Product ?? model<IProduct>('Product', ProductSchema)
