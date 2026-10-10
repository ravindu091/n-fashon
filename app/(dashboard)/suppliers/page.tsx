import React from 'react'
import { getSuppliers } from '@/services/supplier.service'
import { SupplierListClient } from '@/components/suppliers/SupplierListClient'
import connectDB from '@/lib/mongodb'


export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const suppliersRes = await getSuppliers({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 50,
  })

  return (
    <SupplierListClient
      initialSuppliers={JSON.parse(JSON.stringify(suppliersRes.data))}
      currentSearch={params.search}
    />
  )
}
