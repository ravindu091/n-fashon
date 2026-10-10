import React from 'react'
import { getStockBatches } from '@/services/batch.service'
import { BatchListClient } from '@/components/inventory/BatchListClient'
import connectDB from '@/lib/mongodb'


export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const batchesRes = await getStockBatches({
    search: params.search,
    status: params.status || 'active',
    page: params.page ? Number(params.page) : 1,
    limit: 50,
  })

  return (
    <BatchListClient
      initialBatches={JSON.parse(JSON.stringify(batchesRes.data))}
      currentSearch={params.search}
      currentStatus={params.status || 'active'}
    />
  )
}
