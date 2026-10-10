import React from 'react'
import { notFound } from 'next/navigation'
import { getSaleById } from '@/services/sales.service'
import { SaleDetailClient } from '@/components/sales/SaleDetailClient'
import connectDB from '@/lib/mongodb'


export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params

  const sale = await getSaleById(id)
  if (!sale) notFound()

  return <SaleDetailClient sale={JSON.parse(JSON.stringify(sale))} />
}
