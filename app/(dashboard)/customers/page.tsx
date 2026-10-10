import React from 'react'
import { getCustomers } from '@/services/customer.service'
import { CustomerListClient } from '@/components/customers/CustomerListClient'
import connectDB from '@/lib/mongodb'


export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const customersRes = await getCustomers({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 50,
  })

  return (
    <CustomerListClient
      initialCustomers={JSON.parse(JSON.stringify(customersRes.data))}
      currentSearch={params.search}
    />
  )
}
