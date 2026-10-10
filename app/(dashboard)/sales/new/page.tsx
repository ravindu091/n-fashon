import React from 'react'
import connectDB from '@/lib/mongodb'
import { Customer } from '@/models/Customer'
import { ProductVariant } from '@/models/ProductVariant'
import { Product } from '@/models/Product'
import { StockBatch } from '@/models/StockBatch'
import { getSettings } from '@/models/Settings'
import { NewSaleClient } from '@/components/sales/NewSaleClient'


export default async function NewSalePage() {
  await connectDB()

  const [customers, variants, products, stockBatchesAgg, settings] = await Promise.all([
    Customer.find({ status: 'active' }).select('_id name phone').lean(),
    ProductVariant.find({ status: 'active' }).lean(),
    Product.find().select('_id name code').lean(),
    StockBatch.aggregate([
      { $match: { status: 'active', remainingQty: { $gt: 0 } } },
      {
        $sort: { receivedDate: 1 },
      },
      {
        $group: {
          _id: '$variantId',
          totalStock: { $sum: '$remainingQty' },
          oldestBatchCost: { $first: '$landedUnitCost' },
        },
      },
    ]),
    getSettings(),
  ])

  const productMap = new Map(products.map((p) => [p._id.toString(), p]))
  const stockMap = new Map(stockBatchesAgg.map((s) => [s._id.toString(), s]))

  const variantList = variants.map((v) => {
    const parent = productMap.get(v.productId.toString())
    const stockInfo = stockMap.get(v._id.toString()) || { totalStock: 0, oldestBatchCost: 0 }
    return {
      _id: v._id.toString(),
      code: v.code,
      productId: v.productId.toString(),
      productName: parent?.name || 'Garment',
      size: v.size,
      color: v.color,
      defaultSellingPrice: v.defaultSellingPrice,
      promoPrice: v.promoPrice,
      currentStock: stockInfo.totalStock,
      oldestBatchCost: stockInfo.oldestBatchCost,
    }
  })

  return (
    <NewSaleClient
      customers={JSON.parse(JSON.stringify(customers))}
      variants={variantList}
      channels={settings.channels}
    />
  )
}
