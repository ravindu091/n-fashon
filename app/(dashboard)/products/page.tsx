import React from 'react'
import { getProducts } from '@/services/product.service'
import { getSettings } from '@/models/Settings'
import { ProductListClient } from '@/components/products/ProductListClient'
import connectDB from '@/lib/mongodb'


export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const [productsRes, settings] = await Promise.all([
    getProducts({
      search: params.search,
      category: params.category,
      status: params.status || 'active',
      page: params.page ? Number(params.page) : 1,
      limit: 50,
    }),
    getSettings(),
  ])

  return (
    <ProductListClient
      initialProducts={JSON.parse(JSON.stringify(productsRes.data))}
      categories={settings.categories}
      currentSearch={params.search}
      currentCategory={params.category}
      currentStatus={params.status || 'active'}
    />
  )
}
