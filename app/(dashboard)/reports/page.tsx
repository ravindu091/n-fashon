import React from 'react'
import {
  getSalesSummary,
  getRevenueByProduct,
  getSalesByChannel,
  getInventoryValuation,
  getDailySales,
} from '@/services/reports.service'
import { ReportsClient } from '@/components/reports/ReportsClient'
import { subDays, format } from 'date-fns'
import connectDB from '@/lib/mongodb'


export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const defaultFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const defaultTo = format(new Date(), 'yyyy-MM-dd')

  const dateFrom = params.dateFrom || defaultFrom
  const dateTo = params.dateTo || defaultTo

  const [summary, productProfits, channelBreakdown, inventoryValuation, dailyTrends] = await Promise.all([
    getSalesSummary(dateFrom, dateTo),
    getRevenueByProduct(dateFrom, dateTo, 50),
    getSalesByChannel(dateFrom, dateTo),
    getInventoryValuation(),
    getDailySales(dateFrom, dateTo),
  ])

  return (
    <ReportsClient
      summary={summary}
      productProfits={JSON.parse(JSON.stringify(productProfits))}
      channelBreakdown={JSON.parse(JSON.stringify(channelBreakdown))}
      inventoryValuation={JSON.parse(JSON.stringify(inventoryValuation))}
      dailyTrends={JSON.parse(JSON.stringify(dailyTrends))}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  )
}
