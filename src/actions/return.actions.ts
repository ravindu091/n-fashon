'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createReturn,
  CreateReturnInput,
} from '@/services/returns.service'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function createReturnAction(data: CreateReturnInput): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin', 'sales_staff'])
    const ret = await createReturn(data, session.userId)
    revalidatePath('/returns')
    revalidatePath('/sales')
    revalidatePath('/inventory')
    revalidatePath('/batches')
    revalidatePath('/dashboard')
    return { success: true, data: JSON.parse(JSON.stringify(ret)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
