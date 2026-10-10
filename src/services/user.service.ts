import 'server-only'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User, IUser } from '@/models/User'
import type { SafeUser, UserStats, UserRole } from '@/types'

export interface UserFilters {
  search?: string
  role?: string
  status?: string
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: UserRole
  isActive?: boolean
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  isActive?: boolean
}

function mapToSafeUser(doc: any): SafeUser {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: !!doc.isActive,
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  }
}

/**
 * Fetch users with optional search, role, and status filtering.
 * Never includes password hashes.
 */
export async function getUsers(filters: UserFilters = {}): Promise<SafeUser[]> {
  await connectDB()

  const query: any = {}

  if (filters.search && filters.search.trim().length > 0) {
    const escaped = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')
    query.$or = [{ name: regex }, { email: regex }]
  }

  if (filters.role && filters.role !== 'all') {
    query.role = filters.role
  }

  if (filters.status === 'active') {
    query.isActive = true
  } else if (filters.status === 'inactive') {
    query.isActive = false
  }

  const users = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean()

  return users.map(mapToSafeUser)
}

/**
 * Get aggregate statistics about system users
 */
export async function getUserStats(): Promise<UserStats> {
  await connectDB()

  const [total, adminCount, inventoryCount, salesCount, activeCount, inactiveCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'inventory_manager' }),
    User.countDocuments({ role: 'sales_staff' }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
  ])

  return {
    total,
    adminCount,
    inventoryCount,
    salesCount,
    activeCount,
    inactiveCount,
  }
}

/**
 * Retrieve a single user by ID
 */
export async function getUserById(id: string): Promise<SafeUser | null> {
  await connectDB()
  const user = await User.findById(id).select('-passwordHash').lean()
  if (!user) return null
  return mapToSafeUser(user)
}

/**
 * Create a new user with hashed password and email uniqueness verification
 */
export async function createUser(data: CreateUserData): Promise<SafeUser> {
  await connectDB()

  // 1. Validation
  const trimmedName = data.name?.trim()
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('User name must be at least 2 characters long.')
  }

  const normalizedEmail = data.email?.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    throw new Error('Please provide a valid email address.')
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long.')
  }

  const validRoles: UserRole[] = ['admin', 'inventory_manager', 'sales_staff']
  if (!validRoles.includes(data.role)) {
    throw new Error(`Invalid role. Allowed roles: ${validRoles.join(', ')}`)
  }

  // 2. Duplicate email check
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    throw new Error(`A user with email "${normalizedEmail}" already exists.`)
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(data.password, 10)

  // 4. Create document
  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    role: data.role,
    isActive: data.isActive !== undefined ? data.isActive : true,
  })

  return mapToSafeUser(user)
}

/**
 * Update an existing user with guard rails against self-lockout and losing the last admin
 */
export async function updateUser(
  id: string,
  data: UpdateUserData,
  currentUserId?: string
): Promise<SafeUser> {
  await connectDB()

  const user = await User.findById(id)
  if (!user) {
    throw new Error('User not found.')
  }

  const isSelf = currentUserId && user._id.toString() === currentUserId

  // Guard against deactivating own account
  if (data.isActive === false && isSelf) {
    throw new Error('You cannot deactivate your own account.')
  }

  // Guard against deactivating the only active administrator
  if (data.isActive === false && user.role === 'admin') {
    const otherActiveAdmins = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: user._id },
    })
    if (otherActiveAdmins === 0) {
      throw new Error('Cannot deactivate the only active administrator.')
    }
  }

  // Guard against self-demoting from admin
  if (data.role && data.role !== 'admin' && user.role === 'admin') {
    if (isSelf) {
      throw new Error('You cannot demote yourself from Administrator.')
    }
    const otherActiveAdmins = await User.countDocuments({
      role: 'admin',
      isActive: true,
      _id: { $ne: user._id },
    })
    if (otherActiveAdmins === 0) {
      throw new Error('Cannot change the role of the only active administrator.')
    }
  }

  // Name update
  if (data.name !== undefined) {
    const trimmed = data.name.trim()
    if (trimmed.length < 2) {
      throw new Error('Name must be at least 2 characters.')
    }
    user.name = trimmed
  }

  // Email update
  if (data.email !== undefined) {
    const normalized = data.email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!normalized || !emailRegex.test(normalized)) {
      throw new Error('Please provide a valid email address.')
    }
    if (normalized !== user.email) {
      const emailConflict = await User.findOne({
        email: normalized,
        _id: { $ne: user._id },
      })
      if (emailConflict) {
        throw new Error(`Email "${normalized}" is already taken by another account.`)
      }
      user.email = normalized
    }
  }

  // Role update
  if (data.role) {
    const validRoles: UserRole[] = ['admin', 'inventory_manager', 'sales_staff']
    if (!validRoles.includes(data.role)) {
      throw new Error(`Invalid role: ${data.role}`)
    }
    user.role = data.role
  }

  // Status update
  if (data.isActive !== undefined) {
    user.isActive = data.isActive
  }

  // Password reset (if provided)
  if (data.password && data.password.trim().length > 0) {
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.')
    }
    user.passwordHash = await bcrypt.hash(data.password, 10)
  }

  await user.save()
  return mapToSafeUser(user)
}

/**
 * Toggle active status of a user
 */
export async function toggleUserStatus(id: string, currentUserId: string): Promise<SafeUser> {
  await connectDB()
  const user = await User.findById(id)
  if (!user) throw new Error('User not found.')

  return updateUser(id, { isActive: !user.isActive }, currentUserId)
}

/**
 * Permanently delete a user account with safety checks
 */
export async function deleteUser(id: string, currentUserId: string): Promise<{ success: boolean }> {
  await connectDB()

  if (id === currentUserId) {
    throw new Error('You cannot delete your own account.')
  }

  const user = await User.findById(id)
  if (!user) {
    throw new Error('User not found.')
  }

  if (user.role === 'admin') {
    const otherAdmins = await User.countDocuments({
      role: 'admin',
      _id: { $ne: user._id },
    })
    if (otherAdmins === 0) {
      throw new Error('Cannot delete the only administrator.')
    }
  }

  await User.findByIdAndDelete(id)
  return { success: true }
}
