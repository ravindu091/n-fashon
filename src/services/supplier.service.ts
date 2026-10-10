import 'server-only'
import connectDB from '@/lib/mongodb'
import { Supplier, ISupplier } from '@/models/Supplier'
import { Purchase } from '@/models/Purchase'
import { generateSupplierCode } from '@/services/codegen.service'
import type { PaginatedResult } from '@/types'

export interface SupplierData {
  name: string
  contactPerson?: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export interface SupplierFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export async function createSupplier(data: SupplierData, _userId: string) {
  await connectDB()
  const code = await generateSupplierCode()
  const supplier = await Supplier.create({
    ...data,
    code,
    status: 'active',
    totalPurchases: 0,
    outstandingBalance: 0,
  })
  return supplier
}

export async function updateSupplier(id: string, data: Partial<SupplierData>) {
  await connectDB()
  const supplier = await Supplier.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!supplier) throw new Error('Supplier not found')
  return supplier
}

export async function archiveSupplier(id: string): Promise<{ supplier: ISupplier; hasOutstandingBalance: boolean }> {
  await connectDB()
  const supplier = await Supplier.findById(id)
  if (!supplier) throw new Error('Supplier not found')

  const hasOutstandingBalance = supplier.outstandingBalance > 0

  supplier.status = 'archived'
  await supplier.save()

  return { supplier, hasOutstandingBalance }
}

export async function getSuppliers(filters: SupplierFilters): Promise<PaginatedResult<ISupplier>> {
  await connectDB()
  const { search, status, page = 1, limit = 20 } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (search) query.$text = { $search: search }

  const skip = (page - 1) * limit
  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(query),
  ])

  return {
    data: suppliers as unknown as ISupplier[],
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

export async function getSupplierById(id: string) {
  await connectDB()
  const supplier = await Supplier.findById(id).lean()
  if (!supplier) return null
  return supplier
}

export async function getSupplierPurchaseHistory(
  supplierId: string,
  page = 1,
  limit = 20
) {
  await connectDB()
  const skip = (page - 1) * limit
  const [purchases, total] = await Promise.all([
    Purchase.find({ supplierId })
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Purchase.countDocuments({ supplierId }),
  ])

  return {
    data: purchases,
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
