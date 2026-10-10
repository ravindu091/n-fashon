'use server'

import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import type { ActionState } from '@/types'

export async function seedAdminUser() {
  await connectDB()
  const count = await User.countDocuments()
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    await User.create({
      name: 'Admin Owner',
      email: 'admin@nfashion.lk',
      passwordHash,
      role: 'admin',
      isActive: true,
    })
    console.log('Default admin user seeded: admin@nfashion.lk / admin123')
  }
}

export async function loginAction(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await connectDB()
  await seedAdminUser()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      success: false,
      error: 'Please provide both email and password.',
    }
  }

  const user = await User.findOne({ email })
  if (!user || !user.isActive) {
    return {
      success: false,
      error: 'Invalid credentials or inactive account.',
    }
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  if (!isValidPassword) {
    return {
      success: false,
      error: 'Invalid credentials or inactive account.',
    }
  }

  // Update last login
  user.lastLoginAt = new Date()
  await user.save()

  // Create session
  await createSession(user._id.toString(), user.role)

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
