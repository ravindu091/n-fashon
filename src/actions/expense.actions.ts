'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createExpense,
  updateExpense,
  cancelExpense,
  CreateExpenseInput,
} from '@/services/expense.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createExpenseAction(data: CreateExpenseInput): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin'])
    const expense = await createExpense(data, session.userId)
    revalidatePath('/expenses')
    revalidatePath('/dashboard')
    revalidatePath('/reports')
    return { success: true, data: JSON.parse(JSON.stringify(expense)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateExpenseAction(id: string, data: Partial<CreateExpenseInput>): Promise<ActionState> {
  try {
    await requireAuth(['admin'])
    const expense = await updateExpense(id, data)
    revalidatePath('/expenses')
    return { success: true, data: JSON.parse(JSON.stringify(expense)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function cancelExpenseAction(id: string): Promise<ActionState> {
  try {
    await requireAuth(['admin'])
    const expense = await cancelExpense(id)
    revalidatePath('/expenses')
    return { success: true, data: JSON.parse(JSON.stringify(expense)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
