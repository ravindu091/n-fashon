import 'server-only'
import connectDB from '@/lib/mongodb'
import { Expense, IExpense } from '@/models/Expense'
import { generateExpenseNumber } from '@/services/codegen.service'
import type { PaginatedResult, ExpenseStatus } from '@/types'
import { Types } from 'mongoose'

export interface CreateExpenseInput {
  date: Date | string
  category: string
  description: string
  amount: number
  paymentMethod?: string
  payee?: string
  supplierId?: string
  receiptUrl?: string
  notes?: string
  isAcquisitionCost?: boolean
}

export interface ExpenseFilters {
  search?: string
  category?: string
  status?: string
  dateFrom?: string | Date
  dateTo?: string | Date
  page?: number
  limit?: number
}

export async function createExpense(data: CreateExpenseInput, userId: string) {
  await connectDB()
  if (data.amount <= 0) {
    throw new Error('Expense amount must be greater than zero')
  }

  const expenseDate = data.date ? new Date(data.date) : new Date()
  const expenseNumber = await generateExpenseNumber(expenseDate)

  const expense = await Expense.create({
    expenseNumber,
    date: expenseDate,
    category: data.category,
    description: data.description,
    amount: data.amount,
    paymentMethod: data.paymentMethod ?? 'cash',
    payee: data.payee,
    supplierId: data.supplierId ? new Types.ObjectId(data.supplierId) : undefined,
    receiptUrl: data.receiptUrl,
    notes: data.notes,
    status: 'paid',
    isAcquisitionCost: data.isAcquisitionCost ?? false,
    createdBy: userId,
  })

  return expense
}

export async function updateExpense(id: string, data: Partial<CreateExpenseInput>) {
  await connectDB()
  const expense = await Expense.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!expense) throw new Error('Expense not found')
  return expense
}

export async function cancelExpense(id: string) {
  await connectDB()
  const expense = await Expense.findById(id)
  if (!expense) throw new Error('Expense not found')

  expense.status = 'cancelled'
  await expense.save()
  return expense
}

export async function getExpenses(filters: ExpenseFilters): Promise<PaginatedResult<IExpense>> {
  await connectDB()
  const { search, category, status, dateFrom, dateTo, page = 1, limit = 20 } = filters

  const query: Record<string, unknown> = {}
  if (status) query.status = status
  if (category) query.category = category

  if (search) {
    query.$or = [
      { expenseNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { payee: { $regex: search, $options: 'i' } },
    ]
  }

  if (dateFrom || dateTo) {
    query.date = {}
    if (dateFrom) (query.date as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (query.date as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const skip = (page - 1) * limit
  const [expenses, total] = await Promise.all([
    Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Expense.countDocuments(query),
  ])

  return {
    data: expenses as unknown as IExpense[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  }
}

export async function getExpenseSummary(dateFrom?: string | Date, dateTo?: string | Date) {
  await connectDB()
  const match: Record<string, unknown> = { status: 'paid' }
  if (dateFrom || dateTo) {
    match.date = {}
    if (dateFrom) (match.date as Record<string, unknown>).$gte = new Date(dateFrom)
    if (dateTo) (match.date as Record<string, unknown>).$lte = new Date(dateTo)
  }

  const summary = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ])

  const total = summary.reduce((acc, curr) => acc + curr.totalAmount, 0)
  return { breakdown: summary, total: Math.round(total * 100) / 100 }
}
