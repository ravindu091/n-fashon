'use server'

import { requireAuth } from '@/lib/permissions'
import { adjustStock } from '@/services/batch.service'
import { revalidatePath } from 'next/cache'
import type { ActionState, MovementType } from '@/types'

export async function adjustStockAction(
  batchId: string,
  qtyChange: number,
  reason: string,
  type: MovementType = 'manual_adjustment',
  notes?: string
): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'inventory_manager'])
    const result = await adjustStock(batchId, qtyChange, reason, type, session.userId, 'User', notes)
    revalidatePath('/batches')
    revalidatePath('/inventory')
    revalidatePath('/stock-movements')
    return { success: true, data: JSON.parse(JSON.stringify(result)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
