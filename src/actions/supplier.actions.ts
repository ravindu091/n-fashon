'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createSupplier,
  updateSupplier,
  archiveSupplier,
  SupplierData,
} from '@/services/supplier.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createSupplierAction(data: SupplierData): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const supplier = await createSupplier(data, session.userId)
    revalidatePath('/suppliers')
    return { success: true, data: JSON.parse(JSON.stringify(supplier)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSupplierAction(id: string, data: Partial<SupplierData>): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const supplier = await updateSupplier(id, data)
    revalidatePath('/suppliers')
    revalidatePath(`/suppliers/${id}`)
    return { success: true, data: JSON.parse(JSON.stringify(supplier)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function archiveSupplierAction(id: string): Promise<ActionState> {
  try {
    await requireAuth(['admin'])
    const result = await archiveSupplier(id)
    revalidatePath('/suppliers')
    return { success: true, data: JSON.parse(JSON.stringify(result)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
