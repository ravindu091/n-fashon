import 'server-only'
import connectDB from '@/lib/mongodb'
import { ProductVariant, IProductVariant } from '@/models/ProductVariant'
import { Product } from '@/models/Product'
import { StockBatch } from '@/models/StockBatch'
import { generateVariantCode } from '@/services/codegen.service'

export interface VariantData {
  size: string
  color: string
  defaultSellingPrice: number
  promoPrice?: number
  wholesalePrice?: number
  reorderLevel?: number
}

export async function createVariant(productId: string, data: VariantData, _userId: string) {
  await connectDB()

  const product = await Product.findById(productId)
  if (!product) throw new Error('Product not found')

  // Ensure uniqueness by size+color combination
  const existing = await ProductVariant.findOne({ productId, size: data.size, color: data.color })
  if (existing) throw new Error(`Variant with size "${data.size}" and color "${data.color}" already exists for this product`)

  // Generate a unique variant code
  let code = await generateVariantCode(product.code, data.color, data.size)
  // Check collision — append numeric suffix if needed
  const collision = await ProductVariant.findOne({ code })
  if (collision) {
    const seq = await ProductVariant.countDocuments({ productId })
    code = `${code}-${seq + 1}`
  }

  const variant = await ProductVariant.create({
    ...data,
    code,
    productId,
    reorderLevel: data.reorderLevel ?? 3,
    status: 'active',
  })
  return variant
}

export async function updateVariant(id: string, data: Partial<VariantData>) {
  await connectDB()
  const variant = await ProductVariant.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!variant) throw new Error('Variant not found')
  return variant
}

export async function getVariantsByProduct(productId: string) {
  await connectDB()
  const variants = await ProductVariant.find({ productId }).sort({ createdAt: -1 }).lean()

  // Attach current stock to each variant
  const variantIds = variants.map((v) => v._id)
  const stockAgg: { _id: unknown; remainingQty: number }[] = await StockBatch.aggregate([
    { $match: { variantId: { $in: variantIds }, status: 'active' } },
    { $group: { _id: '$variantId', remainingQty: { $sum: '$remainingQty' } } },
  ])
  const stockMap = new Map(stockAgg.map((s) => [String(s._id), s.remainingQty]))

  return variants.map((v) => ({
    ...v,
    currentStock: stockMap.get(String(v._id)) ?? 0,
  }))
}

export async function getVariantStock(variantId: string): Promise<number> {
  await connectDB()
  const result: { _id: null; total: number }[] = await StockBatch.aggregate([
    { $match: { variantId, status: 'active' } },
    { $group: { _id: null, total: { $sum: '$remainingQty' } } },
  ])
  return result[0]?.total ?? 0
}

export async function getLowStockVariants(threshold = 5): Promise<any[]> {
  await connectDB()
  const variants = await ProductVariant.find({ status: 'active' }).lean()
  const variantIds = variants.map((v) => v._id)

  const stockAgg: { _id: unknown; remainingQty: number }[] = await StockBatch.aggregate([
    { $match: { variantId: { $in: variantIds }, status: 'active' } },
    { $group: { _id: '$variantId', remainingQty: { $sum: '$remainingQty' } } },
  ])
  const stockMap = new Map(stockAgg.map((s) => [String(s._id), s.remainingQty]))

  return variants
    .map((v) => ({ ...(v as unknown as IProductVariant), currentStock: stockMap.get(String(v._id)) ?? 0 }))
    .filter((v) => v.currentStock <= threshold)
}

export async function toggleVariantStatus(id: string) {
  await connectDB()
  const variant = await ProductVariant.findById(id)
  if (!variant) throw new Error('Variant not found')
  variant.status = variant.status === 'active' ? 'inactive' : 'active'
  await variant.save()
  return variant
}

export async function deleteVariant(id: string): Promise<{ success: boolean }> {
  await connectDB()
  const variant = await ProductVariant.findById(id)
  if (!variant) throw new Error('Variant not found')

  // Check for active stock batches with positive remaining quantity
  const activeBatches = await StockBatch.find({
    variantId: id,
    status: 'active',
    remainingQty: { $gt: 0 },
  })

  if (activeBatches.length > 0) {
    const totalRemaining = activeBatches.reduce((sum, b) => sum + b.remainingQty, 0)
    throw new Error(
      `Cannot delete variant "${variant.code}". It currently has ${totalRemaining} unit(s) of active stock in inventory. Please adjust stock before deleting, or deactivate it instead.`
    )
  }

  // Delete depleted batches associated with this variant
  await StockBatch.deleteMany({ variantId: id })

  // Delete variant document
  await ProductVariant.findByIdAndDelete(id)

  return { success: true }
}

