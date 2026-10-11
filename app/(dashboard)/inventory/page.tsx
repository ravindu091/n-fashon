import React from 'react'
import connectDB from '@/lib/mongodb'
import { ProductVariant } from '@/models/ProductVariant'
import { Product } from '@/models/Product'
import { StockBatch } from '@/models/StockBatch'
import { getInventorySummary } from '@/services/batch.service'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber } from '@/utils/currency'
import Link from 'next/link'
import { Boxes, DollarSign, AlertTriangle, Layers, Shirt, ArrowRight } from 'lucide-react'
import { InventoryTableClient } from '@/components/inventory/InventoryTableClient'


export default async function InventoryPage() {
  await connectDB()

  const [summary, variants, products, stockBatchesAgg] = await Promise.all([
    getInventorySummary(),
    ProductVariant.find({ status: 'active' }).lean(),
    Product.find().lean(),
    StockBatch.aggregate([
      { $match: { status: 'active', remainingQty: { $gt: 0 } } },
      {
        $group: {
          _id: '$variantId',
          totalStock: { $sum: '$remainingQty' },
          totalValue: { $sum: { $multiply: ['$remainingQty', '$landedUnitCost'] } },
        },
      },
    ]),
  ])

  const productMap = new Map(products.map((p) => [p._id.toString(), p]))
  const stockMap = new Map(stockBatchesAgg.map((s) => [s._id.toString(), s]))

  const variantList = variants.map((v) => {
    const parent = productMap.get(v.productId.toString())
    const stockInfo = stockMap.get(v._id.toString()) || { totalStock: 0, totalValue: 0 }
    return {
      _id: v._id.toString(),
      code: v.code,
      productName: parent?.name || 'Garment',
      category: parent?.category || '-',
      size: v.size,
      color: v.color,
      defaultSellingPrice: v.defaultSellingPrice,
      reorderLevel: v.reorderLevel,
      currentStock: stockInfo.totalStock,
      inventoryValuation: stockInfo.totalValue,
    }
  })

  const lowStockItems = variantList.filter((v) => v.currentStock <= v.reorderLevel && v.currentStock > 0)
  const outOfStockItems = variantList.filter((v) => v.currentStock === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Real-Time Inventory Overview</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Consolidated stock levels per garment variant, reorder alerts, and asset valuation.
          </p>
        </div>
        <Link href="/batches" className="btn btn-outline text-xs">
          <Layers className="w-3.5 h-3.5 mr-1.5" />
          View Purchase Batches
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total Available Stock"
          value={`${formatNumber(summary.totalPieces)} pcs`}
          subtitle="Sum of active batch pieces"
          icon={<Boxes className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Inventory Valuation"
          value={formatCurrency(summary.totalCostValue)}
          subtitle="At actual landed purchase cost"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard
          title="Low-Stock Variants"
          value={`${lowStockItems.length} items`}
          subtitle="At or below reorder threshold"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
        <KpiCard
          title="Out-of-Stock Variants"
          value={`${outOfStockItems.length} items`}
          subtitle="Zero available stock"
          icon={<Shirt className="w-5 h-5 text-red-500" />}
        />
      </div>

      {/* Low Stock Urgent Callout */}
      {lowStockItems.length > 0 && (
        <div className="card p-4 bg-amber-50/60 border-amber-200">
          <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Alert ({lowStockItems.length} variants need replenishment):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item._id} className="text-xs bg-white px-2.5 py-1 rounded border border-amber-200 font-medium text-amber-900">
                {item.productName} ({item.code}): <strong className="text-amber-700">{item.currentStock} left</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variant Inventory Table with Instant Search & Filtering */}
      <InventoryTableClient variantList={variantList} />
    </div>
  )
}
