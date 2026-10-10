import { Schema, model, models, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'inventory_manager' | 'sales_staff'
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['admin','inventory_manager','sales_staff'], default: 'sales_staff' },
    isActive:      { type: Boolean, default: true },
    lastLoginAt:   { type: Date },
  },
  { timestamps: true }
)

export const User: Model<IUser> =
  models.User ?? model<IUser>('User', UserSchema)
