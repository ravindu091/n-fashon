import React from 'react'
import { getExpenses, getExpenseSummary } from '@/services/expense.service'
import { getSettings } from '@/models/Settings'
import { ExpenseListClient } from '@/components/expenses/ExpenseListClient'
import connectDB from '@/lib/mongodb'


export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>
}) {
  await connectDB()
  const params = await searchParams

  const [expensesRes, summary, settings] = await Promise.all([
    getExpenses({
      search: params.search,
      category: params.category,
      page: params.page ? Number(params.page) : 1,
      limit: 50,
    }),
    getExpenseSummary(),
    getSettings(),
  ])

  return (
    <ExpenseListClient
      initialExpenses={JSON.parse(JSON.stringify(expensesRes.data))}
      totalExpenses={summary.total}
      categories={settings.expenseCategories}
      currentSearch={params.search}
      currentCategory={params.category}
    />
  )
}
