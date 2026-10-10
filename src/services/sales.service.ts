import 'server-only'
import connectDB from '@/lib/mongodb'
import { Sale, ISale, ISaleLine } from '@/models/Sale'
import { Customer } from '@/models/Customer'
import { ProductVariant } from '@/models/ProductVariant'
import { Product } from '@/models/Product'
import { StockBatch } from '@/models/StockBatch'
import { generateSaleNumber } from '@/services/codegen.service'
import { planFifoAllocation, applyFifoAllocation } from '@/services/inventory.service'
import type { PaginatedResult, SaleChannel, PaymentStatus } from '@/types'
import { Types } from 'mongoose'

export interface CreateSaleLineInput {
  variantId: string
  qty: number
  unitSellingPrice: number
  discountAmount?: number
  manualBatchId?: string
}

export interface CreateSaleInput {
  customerId?: string
  customerName?: string
  channel: SaleChannel
  saleDate?: Date | string
  lines: CreateSaleLineInput[]
  discountAmount?: number
  deliveryCharge?: number
  taxAmount?: number
  paymentMethod: string
  amountReceived: number
  notes?: string
  idempotencyKey: string
}

export interface SaleFilters {
  search?: string
  customerId?: string
  channel?: string
  status?: string
  paymentStatus?: string
  dateFrom?: string | Date
  dateTo?: string | Date
  page?: number
  limit?: number
}

export async function confirmSale(data: CreateSaleInput, userId: string, userName: string = 'User') {
  await connectDB()

  // 1. Idempotency check
  if (!data.idempotencyKey) {
    throw new Error('Idempotency key is required to confirm a sale.')
  }
  const existingSale = await Sale.findOne({ idempotencyKey: data.idempotencyKey })
  if (existingSale) {
    return existingSale
  }

  if (!data.lines || data.lines.length === 0) {
    throw new Error('At least one line item is required.')
  }

  const saleDate = data.saleDate ? new Date(data.saleDate) : new Date()
  const saleNumber = await generateSaleNumber(saleDate)

  // 2. Process each line item and allocate stock
  const processedLines: ISaleLine[] = []
  let calculatedSubtotal = 0
  let calculatedTotalCOGS = 0

  // Pre-fetch all variants and their parent products
  for (const lineInput of data.lines) {
    if (lineInput.qty <= 0) {
      throw new Error('Quantity must be at least 1.')
    }
    if (lineInput.unitSellingPrice < 0) {
      throw new Error('Selling price cannot be negative.')
    }

    const variant = await ProductVariant.findById(lineInput.variantId)
    if (!variant) throw new Error(`Variant ${lineInput.variantId} not found`)

    const product = await Product.findById(variant.productId)
    if (!product) throw new Error(`Product for variant ${variant.code} not found`)

    let allocations: { batchId: Types.ObjectId; batchCode: string; qty: number; unitCostSnapshot: number; lineCOGS: number }[] = []

    if (lineInput.manualBatchId) {
      // Manual batch selection
      const batch = await StockBatch.findById(lineInput.manualBatchId)
      if (!batch || batch.status !== 'active' || batch.remainingQty < lineInput.qty) {
        throw new Error(`Selected batch ${batch?.batchCode ?? lineInput.manualBatchId} does not have sufficient stock (${batch?.remainingQty ?? 0} available).`)
      }
      allocations = [{
        batchId: batch._id as Types.ObjectId,
        batchCode: batch.batchCode,
        qty: lineInput.qty,
        unitCostSnapshot: batch.landedUnitCost,
        lineCOGS: lineInput.qty * batch.landedUnitCost,
      }]
    } else {
      // FIFO automatic allocation
      allocations = await planFifoAllocation(variant._id as Types.ObjectId, lineInput.qty)
    }

    const variantMeta = {
      variantId: variant._id as Types.ObjectId,
      productId: product._id as Types.ObjectId,
      variantCode: variant.code,
      productName: product.name,
      size: variant.size,
      color: variant.color,
    }

    // Apply allocation (deduct from batches and record StockMovements)
    await applyFifoAllocation(
      allocations,
      'sale',
      'Sale',
      new Types.ObjectId(),
      saleNumber,
      userId,
      userName,
      variantMeta,
      data.idempotencyKey
    )

    // Calculate line items (one line per batch allocation to preserve batch traceability)
    for (const alloc of allocations) {
      const lineDiscount = lineInput.discountAmount ? (lineInput.discountAmount * (alloc.qty / lineInput.qty)) : 0
      const lineTotal = Math.max(0, (lineInput.unitSellingPrice * alloc.qty) - lineDiscount)

      calculatedSubtotal += lineTotal
      calculatedTotalCOGS += alloc.lineCOGS

      processedLines.push({
        variantId: variant._id as Types.ObjectId,
        batchId: alloc.batchId,
        productId: product._id as Types.ObjectId,
        productCode: product.code,
        variantCode: variant.code,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        qty: alloc.qty,
        unitSellingPrice: lineInput.unitSellingPrice,
        unitCostSnapshot: alloc.unitCostSnapshot,
        discountAmount: lineDiscount,
        lineTotal,
        lineCOGS: alloc.lineCOGS,
      } as ISaleLine)
    }
  }

  const orderDiscount = data.discountAmount ?? 0
  const delivery = data.deliveryCharge ?? 0
  const tax = data.taxAmount ?? 0
  const totalAmount = Math.max(0, calculatedSubtotal - orderDiscount + delivery + tax)

  // Gross profit is net sales revenue minus COGS
  const netRevenue = Math.max(0, calculatedSubtotal - orderDiscount)
  const grossProfit = Math.round((netRevenue - calculatedTotalCOGS) * 100) / 100

  const amountReceived = data.amountReceived ?? 0
  const outstandingBalance = Math.max(0, totalAmount - amountReceived)

  let paymentStatus: PaymentStatus = 'unpaid'
  if (amountReceived >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid'
  } else if (amountReceived > 0) {
    paymentStatus = 'partial'
  }

  const sale = await Sale.create({
    saleNumber,
    saleDate,
    customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
    customerName: data.customerName,
    channel: data.channel,
    lines: processedLines,
    subtotal: calculatedSubtotal,
    discountAmount: orderDiscount,
    deliveryCharge: delivery,
    taxAmount: tax,
    totalAmount,
    totalCOGS: calculatedTotalCOGS,
    grossProfit,
    paymentMethod: data.paymentMethod,
    paymentStatus,
    amountReceived,
    outstandingBalance,
    status: 'confirmed',
    notes: data.notes,
    createdBy: userId,
    idempotencyKey: data.idempotencyKey,
  })

  // Update customer balance if customer attached
  if (data.customerId) {
    await Customer.findByIdAndUpdate(data.customerId, {
      $inc: {
        totalPurchases: totalAmount,
        outstandingBalance,
      },
    })
  }

  return sale
}

export async function addSalePayment(saleId: string, amount: number, _paymentMethod: string = 'cash', _userId: string) {
  await connectDB()
  const sale = await Sale.findById(saleId)
  if (!sale) throw new Error('Sale not found')

  if (amount <= 0) throw new Error('Payment amount must be greater than zero')
  if (amount > sale.outstandingBalance) {
    throw new Error(`Amount exceeds outstanding balance of ${sale.outstandingBalance}`)
  }

  sale.amountReceived += amount
  sale.outstandingBalance -= amount

  if (sale.outstandingBalance <= 0) {
    sale.paymentStatus = 'paid'
  } else {
    sale.paymentStatus = 'partial'
  }

  await sale.save()

  if (sale.customerId) {
    await Customer.findByIdAndUpdate(sale.customerId, {
      $inc: { outstandingBalance: -amount },
    })
  }

  return sale
}

export async function getSales(filters: SaleFilters): Promise<PaginatedResult<ISale>> {
  await connectDB()
  const {
    search,
    customerId,
    channel,
    status,
    paymentStatus,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (paymentStatus) {
    if (paymentStatus === 'outstanding') {
      query.outstandingBalance = { $gt: 0 }
    } else {
      query.paymentStatus = paymentStatus
    }
  }
  if (channel) query.channel = channel
  if (customerId) query.customerId = new Types.ObjectId(customerId)

  if (search) {
    query.$or = [
      { saleNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { 'lines.productName': { $regex: search, $options: 'i' } },
      { 'lines.variantCode': { $regex: search, $options: 'i' } },
    ]
  }

  if (dateFrom || dateTo) {
    query.saleDate = {}
    if (dateFrom) (query.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [sales, total] = await Promise.all([
    Sale.find(query).sort({ saleDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments(query),
  ])

  return {
    data: sales as unknown as ISale[],
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

export async function getSaleById(id: string) {
  await connectDB()
  const sale = await Sale.findById(id).lean()
  if (!sale) return null
  return sale
}
