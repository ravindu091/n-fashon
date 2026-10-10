import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { ExpenseStatus } from '@/types'

export interface IExpense extends Document {
  _id: Types.ObjectId
  expenseNumber: string
  date: Date
  category: string
  description: string
  amount: number
  paymentMethod: string
  payee?: string
  supplierId?: Types.ObjectId
  receiptUrl?: string
  notes?: string
  status: ExpenseStatus
  isAcquisitionCost: boolean  // true = already allocated to inventory (e.g. shipping in Purchase)
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseNumber:      { type: String, required: true, unique: true },
    date:               { type: Date, required: true },
    category:           { type: String, required: true },
    description:        { type: String, required: true, trim: true },
    amount:             { type: Number, required: true, min: 0 },
    paymentMethod:      { type: String, default: 'cash' },
    payee:              { type: String },
    supplierId:         { type: Schema.Types.ObjectId, ref: 'Supplier' },
    receiptUrl:         { type: String },
    notes:              { type: String },
    status:             { type: String, enum: ['pending','paid','cancelled'], default: 'paid' },
    isAcquisitionCost:  { type: Boolean, default: false },
    createdBy:          { type: String, required: true },
  },
  { timestamps: true }
)

ExpenseSchema.index({ expenseNumber: 1 }, { unique: true })
ExpenseSchema.index({ date: -1 })
ExpenseSchema.index({ category: 1, date: -1 })
ExpenseSchema.index({ status: 1 })

export const Expense: Model<IExpense> =
  models.Expense ?? model<IExpense>('Expense', ExpenseSchema)
