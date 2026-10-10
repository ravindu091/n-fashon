'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createCustomer,
  updateCustomer,
  CustomerData,
} from '@/services/customer.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createCustomerAction(data: CustomerData): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'sales_staff'])
    const customer = await createCustomer(data, session.userId)
    revalidatePath('/customers')
    return { success: true, data: JSON.parse(JSON.stringify(customer)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateCustomerAction(id: string, data: Partial<CustomerData>): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'sales_staff'])
    const customer = await updateCustomer(id, data)
    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    return { success: true, data: JSON.parse(JSON.stringify(customer)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
