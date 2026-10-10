'use server'

import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/permissions'
import { Settings, ISettings } from '@/models/Settings'
import { revalidatePath } from 'next/cache'
import type { ActionState } from '@/types'

export async function updateSettingsAction(data: Partial<ISettings>): Promise<ActionState> {
  try {
    await requireAuth(['admin'])
    await connectDB()

    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create(data)
    } else {
      Object.assign(settings, data)
      await settings.save()
    }

    revalidatePath('/settings')
    return { success: true, data: JSON.parse(JSON.stringify(settings)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
