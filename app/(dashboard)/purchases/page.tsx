import React from 'react'
import { getPurchases } from '@/services/purchase.service'
import { Supplier } from '@/models/Supplier'
import { ProductVariant } from '@/models/ProductVariant'
import { Product } from '@/models/Product'
import { PurchaseListClient } from '@/components/purchases/PurchaseListClient'
import connectDB from '@/lib/mongodb'


export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const [purchasesRes, suppliers, variants, products] = await Promise.all([
    getPurchases({
      search: params.search,
      status: params.status,
      page: params.page ? Number(params.page) : 1,
      limit: 50,
    }),
    Supplier.find({ status: 'active' }).select('_id name').lean(),
    ProductVariant.find({ status: 'active' }).lean(),
    Product.find().select('_id name code').lean(),
  ])

  const productMap = new Map(products.map((p) => [p._id.toString(), p]))

  const mappedVariants = variants.map((v) => {
    const parent = productMap.get(v.productId.toString())
    return {
      _id: v._id.toString(),
      code: v.code,
      productId: v.productId.toString(),
      productCode: parent?.code,
      productName: parent?.name || 'Garment',
      size: v.size,
      color: v.color,
      defaultSellingPrice: v.defaultSellingPrice,
    }
  })

  return (
    <PurchaseListClient
      initialPurchases={JSON.parse(JSON.stringify(purchasesRes.data))}
      suppliers={JSON.parse(JSON.stringify(suppliers))}
      variants={mappedVariants}
      currentSearch={params.search}
      currentStatus={params.status}
    />
  )
}
