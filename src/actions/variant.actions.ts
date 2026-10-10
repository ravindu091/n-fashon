'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createVariant,
  updateVariant,
  toggleVariantStatus,
  VariantData,
} from '@/services/variant.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createVariantAction(productId: string, data: VariantData): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const variant = await createVariant(productId, data, session.userId)
    revalidatePath('/products')
    revalidatePath(`/products/${productId}`)
    return { success: true, data: JSON.parse(JSON.stringify(variant)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateVariantAction(id: string, productId: string, data: Partial<VariantData>): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const variant = await updateVariant(id, data)
    revalidatePath(`/products/${productId}`)
    return { success: true, data: JSON.parse(JSON.stringify(variant)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function toggleVariantStatusAction(id: string, productId: string): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const variant = await toggleVariantStatus(id)
    revalidatePath(`/products/${productId}`)
    return { success: true, data: JSON.parse(JSON.stringify(variant)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
