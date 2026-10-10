import React from 'react'
import { notFound } from 'next/navigation'
import { getPurchaseById } from '@/services/purchase.service'
import { PurchaseDetailClient } from '@/components/purchases/PurchaseDetailClient'
import connectDB from '@/lib/mongodb'


export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const purchase = await getPurchaseById(id)
  if (!purchase) {
    notFound()
  }

  return <PurchaseDetailClient purchase={JSON.parse(JSON.stringify(purchase))} />
}
