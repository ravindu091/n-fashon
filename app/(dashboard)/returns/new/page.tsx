import React from 'react'
import connectDB from '@/lib/mongodb'
import { Sale } from '@/models/Sale'
import { NewReturnClient } from '@/components/returns/NewReturnClient'


export default async function NewReturnPage() {
  await connectDB()

  // Fetch confirmed sales that have completed line items
  const sales = await Sale.find({ status: 'confirmed' })
    .sort({ saleDate: -1 })
    .limit(50)
    .lean()

  return <NewReturnClient sales={JSON.parse(JSON.stringify(sales))} />
}
