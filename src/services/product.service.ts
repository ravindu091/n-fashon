import 'server-only'
import connectDB from '@/lib/mongodb'
import { Product, IProduct } from '@/models/Product'
import { ProductVariant } from '@/models/ProductVariant'
import { StockBatch } from '@/models/StockBatch'
import { generateProductCode } from '@/services/codegen.service'
import type { PaginatedResult } from '@/types'

import { Settings, clearSettingsCache, getSettings } from '@/models/Settings'

export interface ProductFilters {
  search?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}

export interface ProductData {
  name: string
  description?: string
  category: string
  brand?: string
  defaultSellingPrice: number
  colors?: string[]
  sizes?: string[]
  images?: string[]
}

export async function createProduct(data: ProductData, userId: string) {
  await connectDB()
  const trimmedCategory = data.category?.trim() || 'Other'

  // Persist category to store settings if not already present
  if (trimmedCategory) {
    const settings = await getSettings()
    if (!settings.categories.includes(trimmedCategory)) {
      await Settings.updateOne({}, { $addToSet: { categories: trimmedCategory } })
      clearSettingsCache()
    }
  }

  const code = await generateProductCode(trimmedCategory)
  const product = await Product.create({
    ...data,
    category: trimmedCategory,
    code,
    colors: data.colors ?? [],
    sizes: data.sizes ?? [],
    images: data.images ?? [],
    status: 'active',
  })
  return product
}

export async function updateProduct(id: string, data: Partial<ProductData>) {
  await connectDB()
  // Prevent code changes — strip it out if accidentally passed
  const { ...safeData } = data as Partial<ProductData> & { code?: string }
  delete safeData.code

  if (safeData.category) {
    safeData.category = safeData.category.trim()
    const settings = await getSettings()
    if (!settings.categories.includes(safeData.category)) {
      await Settings.updateOne({}, { $addToSet: { categories: safeData.category } })
      clearSettingsCache()
    }
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: safeData },
    { new: true, runValidators: true }
  )
  if (!product) throw new Error('Product not found')
  return product
}

export async function archiveProduct(id: string): Promise<{ product: IProduct; hasActiveStock: boolean }> {
  await connectDB()
  const product = await Product.findById(id)
  if (!product) throw new Error('Product not found')

  // Check for active stock batches
  const activeStock = await StockBatch.findOne({
    productId: id,
    status: 'active',
    remainingQty: { $gt: 0 },
  })
  const hasActiveStock = !!activeStock

  product.status = 'archived'
  await product.save()

  return { product, hasActiveStock }
}

export async function getProducts(filters: ProductFilters): Promise<PaginatedResult<any>> {
  await connectDB()
  const {
    search,
    category,
    status = 'active',
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (category) query.category = category
  if (search) {
    query.$text = { $search: search }
  }

  const skip = (page - 1) * limit
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ])

  // Fetch variant counts in a single aggregate
  const productIds = products.map((p) => p._id)
  const variantCounts: { _id: unknown; count: number }[] = await ProductVariant.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: '$productId', count: { $sum: 1 } } },
  ])
  const countMap = new Map(variantCounts.map((v) => [String(v._id), v.count]))

  const data = products.map((p) => ({
    ...(p as unknown as IProduct),
    variantCount: countMap.get(String(p._id)) ?? 0,
  }))

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  }
}

export async function getProductById(id: string) {
  await connectDB()
  const product = await Product.findById(id).lean()
  if (!product) return null
  return product
}

export async function getProductWithVariants(id: string) {
  await connectDB()
  const product = await Product.findById(id).lean()
  if (!product) return null

  const variants = await ProductVariant.find({ productId: id }).lean()

  // Get remaining stock per variant
  const variantIds = variants.map((v) => v._id)
  const stockAgg: { _id: unknown; remainingQty: number }[] = await StockBatch.aggregate([
    { $match: { variantId: { $in: variantIds }, status: 'active' } },
    { $group: { _id: '$variantId', remainingQty: { $sum: '$remainingQty' } } },
  ])
  const stockMap = new Map(stockAgg.map((s) => [String(s._id), s.remainingQty]))

  const variantsWithStock = variants.map((v) => ({
    ...v,
    currentStock: stockMap.get(String(v._id)) ?? 0,
  }))

  return { product, variants: variantsWithStock }
}
