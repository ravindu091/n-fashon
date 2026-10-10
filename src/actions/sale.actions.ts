'use server'

import { requireAuth } from '@/lib/permissions'
import {
  confirmSale,
  addSalePayment,
  CreateSaleInput,
} from '@/services/sales.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function confirmSaleAction(data: CreateSaleInput): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'sales_staff'])
    const sale = await confirmSale(data, session.userId)
    revalidatePath('/sales')
    revalidatePath('/inventory')
    revalidatePath('/batches')
    revalidatePath('/dashboard')
    revalidatePath('/reports')
    return { success: true, data: JSON.parse(JSON.stringify(sale)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function addSalePaymentAction(
  saleId: string,
  amount: number,
  method: string = 'cash'
): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'sales_staff'])
    const sale = await addSalePayment(saleId, amount, method, session.userId)
    revalidatePath('/sales')
    revalidatePath(`/sales/${saleId}`)
    return { success: true, data: JSON.parse(JSON.stringify(sale)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
