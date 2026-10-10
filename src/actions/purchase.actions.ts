'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createPurchase,
  markOrdered,
  receivePurchaseLines,
  addPurchasePayment,
  cancelPurchase,
  CreatePurchaseInput,
  ReceiveLineItemInput,
} from '@/services/purchase.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createPurchaseAction(data: CreatePurchaseInput): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const purchase = await createPurchase(data, session.userId)
    revalidatePath('/purchases')
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function markOrderedAction(purchaseId: string): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const purchase = await markOrdered(purchaseId)
    revalidatePath('/purchases')
    revalidatePath(`/purchases/${purchaseId}`)
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function receivePurchaseLinesAction(
  purchaseId: string,
  receipts: ReceiveLineItemInput[]
): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const purchase = await receivePurchaseLines(purchaseId, receipts, session.userId)
    revalidatePath('/purchases')
    revalidatePath(`/purchases/${purchaseId}`)
    revalidatePath('/inventory')
    revalidatePath('/batches')
    revalidatePath('/stock-movements')
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function addPurchasePaymentAction(
  purchaseId: string,
  amount: number,
  method: string = 'bank_transfer'
): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin'])
    const purchase = await addPurchasePayment(purchaseId, amount, method, session.userId)
    revalidatePath('/purchases')
    revalidatePath(`/purchases/${purchaseId}`)
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function cancelPurchaseAction(purchaseId: string): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin'])
    const purchase = await cancelPurchase(purchaseId, session.userId)
    revalidatePath('/purchases')
    revalidatePath(`/purchases/${purchaseId}`)
    return { success: true, data: JSON.parse(JSON.stringify(purchase)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
