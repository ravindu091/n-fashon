import React from 'react'
import { notFound } from 'next/navigation'
import { getPurchaseById } from '@/services/purchase.service'
import { ReceiveStockClient } from '@/components/purchases/ReceiveStockClient'
import connectDB from '@/lib/mongodb'


export default async function ReceiveStockPage({
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

  return <ReceiveStockClient purchase={JSON.parse(JSON.stringify(purchase))} />
}
