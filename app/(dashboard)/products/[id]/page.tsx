import React from 'react'
import { notFound } from 'next/navigation'
import { getProductWithVariants } from '@/services/product.service'
import { getSettings } from '@/models/Settings'
import { ProductDetailClient } from '@/components/products/ProductDetailClient'
import connectDB from '@/lib/mongodb'


export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const [result, settings] = await Promise.all([
    getProductWithVariants(id),
    getSettings(),
  ])

  if (!result) {
    notFound()
  }

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(result.product))}
      variants={JSON.parse(JSON.stringify(result.variants))}
      categories={settings.categories}
    />
  )
}
