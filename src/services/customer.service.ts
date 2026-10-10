import 'server-only'
import connectDB from '@/lib/mongodb'
import { Customer, ICustomer } from '@/models/Customer'
import { generateCustomerCode } from '@/services/codegen.service'
import type { PaginatedResult } from '@/types'

export interface CustomerData {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export interface CustomerFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export async function createCustomer(data: CustomerData, _userId: string) {
  await connectDB()
  const code = await generateCustomerCode()
  const customer = await Customer.create({
    ...data,
    code,
    status: 'active',
    totalPurchases: 0,
    outstandingBalance: 0,
  })
  return customer
}

export async function updateCustomer(id: string, data: Partial<CustomerData>) {
  await connectDB()
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!customer) throw new Error('Customer not found')
  return customer
}

export async function getCustomers(filters: CustomerFilters): Promise<PaginatedResult<ICustomer>> {
  await connectDB()
  const { search, status = 'active', page = 1, limit = 20 } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (search) query.$text = { $search: search }

  const skip = (page - 1) * limit
  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(query),
  ])

  return {
    data: customers as unknown as ICustomer[],
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

export async function getCustomerById(id: string) {
  await connectDB()
  const customer = await Customer.findById(id).lean()
  if (!customer) return null
  return customer
}

export async function getCustomerSaleHistory(customerId: string, page = 1, limit = 20) {
  await connectDB()
  // Dynamic import to avoid circular deps — Sale model must exist
  const { Sale } = await import('@/models/Sale')
  const skip = (page - 1) * limit
  const [sales, total] = await Promise.all([
    Sale.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments({ customerId }),
  ])
  return {
    data: sales,
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
