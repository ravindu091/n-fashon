import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { VariantStatus } from '@/types'

export interface IProductVariant extends Document {
  _id: Types.ObjectId
  code: string
  productId: Types.ObjectId
  size: string
  color: string
  defaultSellingPrice: number
  promoPrice?: number
  wholesalePrice?: number
  reorderLevel: number
  status: VariantStatus
  createdAt: Date
  updatedAt: Date
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    code:                { type: String, required: true, unique: true, uppercase: true, trim: true },
    productId:           { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    size:                { type: String, required: true, trim: true },
    color:               { type: String, required: true, trim: true },
    defaultSellingPrice: { type: Number, required: true, min: 0 },
    promoPrice:          { type: Number, min: 0 },
    wholesalePrice:      { type: Number, min: 0 },
    reorderLevel:        { type: Number, default: 3, min: 0 },
    status:              { type: String, enum: ['active','inactive'], default: 'active' },
  },
  { timestamps: true }
)

ProductVariantSchema.index({ productId: 1, status: 1 })
ProductVariantSchema.index({ productId: 1, size: 1, color: 1 }, { unique: true })

export const ProductVariant: Model<IProductVariant> =
  models.ProductVariant ?? model<IProductVariant>('ProductVariant', ProductVariantSchema)
