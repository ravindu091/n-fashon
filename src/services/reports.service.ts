import 'server-only'
import connectDB from '@/lib/mongodb'
import { Sale } from '@/models/Sale'
import { Expense } from '@/models/Expense'
import { StockBatch } from '@/models/StockBatch'
import { ProductVariant } from '@/models/ProductVariant'
import { Supplier } from '@/models/Supplier'
import { Customer } from '@/models/Customer'
import { getSettings } from '@/models/Settings'
import { safeDivide, calcGrossMargin } from '@/utils/currency'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns'

export async function getSalesSummary(dateFrom?: string | Date, dateTo?: string | Date) {
  await connectDB()

  const saleMatch: Record<string, unknown> = { status: 'confirmed' }
  const expenseMatch: Record<string, unknown> = { status: 'paid', isAcquisitionCost: false }

  if (dateFrom || dateTo) {
    const dateRange: Record<string, unknown> = {}
    if (dateFrom) dateRange.$gte = new Date(dateFrom)
    if (dateTo) dateRange.$lte = new Date(dateTo)

    saleMatch.saleDate = dateRange
    expenseMatch.date = dateRange
  }

  const [salesAgg, expensesAgg] = await Promise.all([
    Sale.aggregate([
      { $match: saleMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalProductSales: { $sum: '$subtotal' },
          totalDiscounts: { $sum: '$discountAmount' },
          totalDeliveryRevenue: { $sum: '$deliveryCharge' },
          totalTax: { $sum: '$taxAmount' },
          totalCOGS: { $sum: '$totalCOGS' },
          totalGrossProfit: { $sum: '$grossProfit' },
          totalSalesCount: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ]),
  ])

  const salesData = salesAgg[0] ?? {
    totalRevenue: 0,
    totalProductSales: 0,
    totalDiscounts: 0,
    totalDeliveryRevenue: 0,
    totalTax: 0,
    totalCOGS: 0,
    totalGrossProfit: 0,
    totalSalesCount: 0,
  }

  const operatingExpenses = expensesAgg[0]?.totalExpenses ?? 0
  const grossProfit = Math.round(salesData.totalGrossProfit * 100) / 100
  const netProfit = Math.round((grossProfit - operatingExpenses) * 100) / 100
  const grossMarginPercent = calcGrossMargin(salesData.totalProductSales - salesData.totalDiscounts, salesData.totalCOGS)
  const avgOrderValue = safeDivide(salesData.totalRevenue, salesData.totalSalesCount)

  return {
    totalRevenue: Math.round(salesData.totalRevenue * 100) / 100,
    totalProductSales: Math.round(salesData.totalProductSales * 100) / 100,
    totalCOGS: Math.round(salesData.totalCOGS * 100) / 100,
    grossProfit,
    operatingExpenses: Math.round(operatingExpenses * 100) / 100,
    netProfit,
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    totalSalesCount: salesData.totalSalesCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
  }
}

export async function getRevenueByProduct(dateFrom?: string | Date, dateTo?: string | Date, limit = 10) {
  await connectDB()
  const match: Record<string, unknown> = { status: 'confirmed' }
  if (dateFrom || dateTo) {
    match.saleDate = {}
    if (dateFrom) (match.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (match.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  return Sale.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.productId',
        productName: { $first: '$lines.productName' },
        productCode: { $first: '$lines.productCode' },
        totalQtySold: { $sum: '$lines.qty' },
        totalRevenue: { $sum: '$lines.lineTotal' },
        totalCOGS: { $sum: '$lines.lineCOGS' },
      },
    },
    {
      $project: {
        productName: 1,
        productCode: 1,
        totalQtySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalCOGS: { $round: ['$totalCOGS', 2] },
        grossProfit: { $round: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, 2] },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
  ])
}

export async function getTopProfitableProducts(dateFrom?: string | Date, dateTo?: string | Date, limit = 5) {
  await connectDB()
  const match: Record<string, unknown> = { status: 'confirmed' }
  if (dateFrom || dateTo) {
    match.saleDate = {}
    if (dateFrom) (match.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (match.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  return Sale.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.productId',
        productName: { $first: '$lines.productName' },
        productCode: { $first: '$lines.productCode' },
        totalQtySold: { $sum: '$lines.qty' },
        totalRevenue: { $sum: '$lines.lineTotal' },
        totalCOGS: { $sum: '$lines.lineCOGS' },
      },
    },
    {
      $project: {
        productName: 1,
        productCode: 1,
        totalQtySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalCOGS: { $round: ['$totalCOGS', 2] },
        grossProfit: { $round: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, 2] },
        marginPercent: {
          $cond: [
            { $gt: ['$totalRevenue', 0] },
            { $round: [{ $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, '$totalRevenue'] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { grossProfit: -1 } },
    { $limit: limit },
  ])
}

export async function getTopProfitableVariants(dateFrom?: string | Date, dateTo?: string | Date, limit = 5) {
  await connectDB()
  const match: Record<string, unknown> = { status: 'confirmed' }
  if (dateFrom || dateTo) {
    match.saleDate = {}
    if (dateFrom) (match.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (match.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  return Sale.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.variantId',
        productName: { $first: '$lines.productName' },
        productCode: { $first: '$lines.productCode' },
        variantCode: { $first: '$lines.variantCode' },
        size: { $first: '$lines.size' },
        color: { $first: '$lines.color' },
        totalQtySold: { $sum: '$lines.qty' },
        totalRevenue: { $sum: '$lines.lineTotal' },
        totalCOGS: { $sum: '$lines.lineCOGS' },
      },
    },
    {
      $project: {
        productName: {
          $concat: ['$productName', ' (', '$size', '/', '$color', ')'],
        },
        productCode: '$variantCode',
        totalQtySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalCOGS: { $round: ['$totalCOGS', 2] },
        grossProfit: { $round: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, 2] },
        marginPercent: {
          $cond: [
            { $gt: ['$totalRevenue', 0] },
            { $round: [{ $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCOGS'] }, '$totalRevenue'] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { grossProfit: -1 } },
    { $limit: limit },
  ])
}

export async function getSalesByChannel(dateFrom?: string | Date, dateTo?: string | Date) {
  await connectDB()
  const match: Record<string, unknown> = { status: 'confirmed' }
  if (dateFrom || dateTo) {
    match.saleDate = {}
    if (dateFrom) (match.saleDate as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (match.saleDate as Record<string, unknown>).$lte = new Date(dateTo)
  }

  return Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$channel',
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ])
}

export async function getDailySales(dateFrom: string | Date, dateTo: string | Date) {
  await connectDB()
  return Sale.aggregate([
    {
      $match: {
        status: 'confirmed',
        saleDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        revenue: { $sum: '$totalAmount' },
        grossProfit: { $sum: '$grossProfit' },
        salesCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        revenue: { $round: ['$revenue', 2] },
        grossProfit: { $round: ['$grossProfit', 2] },
        salesCount: 1,
      },
    },
  ])
}

export async function getInventoryValuation() {
  await connectDB()
  const [totalAgg, categoryAgg] = await Promise.all([
    StockBatch.aggregate([
      { $match: { status: 'active', remainingQty: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalPieces: { $sum: '$remainingQty' },
          totalValue: { $sum: { $multiply: ['$remainingQty', '$landedUnitCost'] } },
        },
      },
    ]),
    StockBatch.aggregate([
      { $match: { status: 'active', remainingQty: { $gt: 0 } } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category',
          pieces: { $sum: '$remainingQty' },
          valuation: { $sum: { $multiply: ['$remainingQty', '$landedUnitCost'] } },
        },
      },
      { $sort: { valuation: -1 } },
    ]),
  ])

  return {
    totalPieces: totalAgg[0]?.totalPieces ?? 0,
    totalValuation: Math.round((totalAgg[0]?.totalValue ?? 0) * 100) / 100,
    byCategory: categoryAgg.map((c) => ({
      category: c._id ?? 'Uncategorized',
      pieces: c.pieces,
      valuation: Math.round(c.valuation * 100) / 100,
    })),
  }
}

export async function getDashboardKPIs() {
  await connectDB()
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const settings = await getSettings()
  const lowStockThreshold = settings.lowStockThreshold ?? 3

  const [
    todaySalesAgg,
    monthSalesAgg,
    monthExpensesAgg,
    inventoryAgg,
    lowStockAgg,
    suppliersAgg,
    customersAgg,
    supplierAdvanceAgg,
  ] = await Promise.all([
    // Today's Sales
    Sale.aggregate([
      { $match: { status: 'confirmed', saleDate: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Current Month's Sales
    Sale.aggregate([
      { $match: { status: 'confirmed', saleDate: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          grossProfit: { $sum: '$grossProfit' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Current Month's Operating Expenses
    Expense.aggregate([
      { $match: { status: 'paid', isAcquisitionCost: false, date: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
    // Available Pieces and Inventory Valuation at landed cost
    StockBatch.aggregate([
      { $match: { status: 'active', remainingQty: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalPieces: { $sum: '$remainingQty' },
          totalValue: { $sum: { $multiply: ['$remainingQty', '$landedUnitCost'] } },
        },
      },
    ]),
    // Low stock variants calculation
    StockBatch.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$variantId',
          totalStock: { $sum: '$remainingQty' },
        },
      },
      {
        $match: {
          totalStock: { $lte: lowStockThreshold },
        },
      },
      { $count: 'lowStockCount' },
    ]),
    // Outstanding Supplier Balances (payables only)
    Supplier.aggregate([
      { $match: { status: 'active', outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]),
    // Outstanding Customer Balances (receivables only)
    Customer.aggregate([
      { $match: { status: 'active', outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]),
    // Supplier Advance Credits
    Supplier.aggregate([
      { $match: { status: 'active', advanceBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$advanceBalance' } } },
    ]),
  ])

  const todayRevenue = todaySalesAgg[0]?.revenue ?? 0
  const todayCount = todaySalesAgg[0]?.count ?? 0
  const monthRevenue = monthSalesAgg[0]?.revenue ?? 0
  const monthGrossProfit = monthSalesAgg[0]?.grossProfit ?? 0
  const monthExpenses = monthExpensesAgg[0]?.total ?? 0
  const monthNetProfit = Math.round((monthGrossProfit - monthExpenses) * 100) / 100

  const totalPieces = inventoryAgg[0]?.totalPieces ?? 0
  const inventoryValue = Math.round((inventoryAgg[0]?.totalValue ?? 0) * 100) / 100
  const lowStockCount = lowStockAgg[0]?.lowStockCount ?? 0

  const supplierOutstanding = suppliersAgg[0]?.total ?? 0
  const customerOutstanding = customersAgg[0]?.total ?? 0
  const supplierAdvanceCredit = supplierAdvanceAgg[0]?.total ?? 0

  return {
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    todayCount,
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    monthGrossProfit: Math.round(monthGrossProfit * 100) / 100,
    monthNetProfit,
    totalPieces,
    inventoryValue,
    lowStockCount,
    supplierOutstanding: Math.round(supplierOutstanding * 100) / 100,
    customerOutstanding: Math.round(customerOutstanding * 100) / 100,
    supplierAdvanceCredit: Math.round(supplierAdvanceCredit * 100) / 100,
  }
}
