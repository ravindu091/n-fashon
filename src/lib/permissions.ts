import 'server-only'
import { getSession } from '@/lib/session'
import type { UserRole } from '@/types'

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getSession()

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('FORBIDDEN')
  }

  return session
}

export const ROLES = {
  ADMIN: 'admin' as const,
  INVENTORY_MANAGER: 'inventory_manager' as const,
  SALES_STAFF: 'sales_staff' as const,
}

export function canManageSettings(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canViewFinancials(role: UserRole): boolean {
  return role === 'admin'
}

export function canManageInventory(role: UserRole): boolean {
  return role === 'admin' || role === 'inventory_manager'
}

export function canManageSales(role: UserRole): boolean {
  return role === 'admin' || role === 'sales_staff'
}
