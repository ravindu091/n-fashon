'use server'

import { requireAuth } from '@/lib/permissions'
import {
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  CreateUserData,
  UpdateUserData,
} from '@/services/user.service'
import { revalidatePath } from 'next/cache'
import type { ActionState, SafeUser } from '@/types'

/**
 * Server Action: Create a new user (Admin only)
 */
export async function createUserAction(data: CreateUserData): Promise<ActionState<SafeUser>> {
  try {
    await requireAuth(['admin'])
    const user = await createUser(data)
    revalidatePath('/users')
    return { success: true, data: JSON.parse(JSON.stringify(user)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Server Action: Update user details or reset password (Admin only)
 */
export async function updateUserAction(
  id: string,
  data: UpdateUserData
): Promise<ActionState<SafeUser>> {
  try {
    const session = await requireAuth(['admin'])
    const user = await updateUser(id, data, session.userId)
    revalidatePath('/users')
    return { success: true, data: JSON.parse(JSON.stringify(user)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Server Action: Delete a user account (Admin only)
 */
export async function deleteUserAction(id: string): Promise<ActionState> {
  try {
    const session = await requireAuth(['admin'])
    await deleteUser(id, session.userId)
    revalidatePath('/users')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Server Action: Toggle user active status (Admin only)
 */
export async function toggleUserStatusAction(id: string): Promise<ActionState<SafeUser>> {
  try {
    const session = await requireAuth(['admin'])
    const user = await toggleUserStatus(id, session.userId)
    revalidatePath('/users')
    return { success: true, data: JSON.parse(JSON.stringify(user)) }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}
