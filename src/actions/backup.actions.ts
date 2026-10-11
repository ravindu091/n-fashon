'use server'

import { requireAuth } from '@/lib/permissions'
import {
  getBackupStatus,
  importDatabaseJSON,
  BackupStatus,
  ImportBackupReport,
} from '@/services/backup.service'
import { recordBackupTimestamp } from '@/models/Settings'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

/** Fetch current backup status and overdue indicator for admin */
export async function getBackupStatusAction(): Promise<ActionState<BackupStatus>> {
  try {
    await requireAuth(['admin'])
    const status = await getBackupStatus()
    return { success: true, data: status }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

/** Record that a manual backup was completed */
export async function recordManualBackupAction(): Promise<ActionState<{ recordedAt: string }>> {
  try {
    await requireAuth(['admin'])
    const date = await recordBackupTimestamp()
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return { success: true, data: { recordedAt: date.toISOString() } }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

/** Execute safe, non-destructive import of backup JSON */
export async function importBackupAction(jsonString: string): Promise<ActionState<ImportBackupReport>> {
  try {
    await requireAuth(['admin'])

    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'Empty or invalid JSON payload provided' }
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonString)
    } catch {
      return { success: false, error: 'Invalid JSON file: syntax error during parsing.' }
    }

    const report = await importDatabaseJSON(parsed)

    // Revalidate paths so newly inserted data is immediately visible
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    revalidatePath('/products')
    revalidatePath('/inventory')
    revalidatePath('/batches')
    revalidatePath('/stock-movements')
    revalidatePath('/purchases')
    revalidatePath('/sales')
    revalidatePath('/customers')
    revalidatePath('/suppliers')
    revalidatePath('/expenses')
    revalidatePath('/returns')
    revalidatePath('/users')

    return { success: true, data: report }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
