'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  ProductData,
} from '@/services/product.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createProductAction(data: ProductData): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const product = await createProduct(data, session.userId)
    revalidatePath('/products')
    return { success: true, data: JSON.parse(JSON.stringify(product)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateProductAction(id: string, data: Partial<ProductData>): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const product = await updateProduct(id, data)
    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    return { success: true, data: JSON.parse(JSON.stringify(product)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function archiveProductAction(id: string): Promise<ActionState> {
  try {
    await requireAuth(['admin'])
    const result = await archiveProduct(id)
    revalidatePath('/products')
    return { success: true, data: JSON.parse(JSON.stringify(result)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteProductAction(id: string): Promise<ActionState> {
  try {
    await requireAuth(['admin', 'inventory_manager'])
    const result = await deleteProduct(id)
    revalidatePath('/products')
    revalidatePath('/inventory')
    return { success: true, data: JSON.parse(JSON.stringify(result)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

