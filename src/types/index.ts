// Shared TypeScript types across the application
// Do NOT import server-only modules here — this file is used by both client and server

export interface SessionPayload {
  userId: string
  role: 'admin' | 'inventory_manager' | 'sales_staff'
  expiresAt: string
}

export type UserRole = SessionPayload['role']

// ── Currency / formatting ──────────────────────────────────────────────────────
export interface CurrencyConfig {
  code: string   // e.g. "LKR"
  locale: string // e.g. "en-LK"
  symbol: string // e.g. "Rs."
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

// ── Generic API response ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

// ── Product types ─────────────────────────────────────────────────────────────
export type ProductStatus = 'active' | 'archived'
export type VariantStatus = 'active' | 'inactive'

// ── Purchase types ────────────────────────────────────────────────────────────
export type PurchaseStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled'
export type PaymentStatus  = 'unpaid' | 'partial' | 'paid' | 'refunded'

// ── Batch / inventory ─────────────────────────────────────────────────────────
export type BatchStatus = 'active' | 'depleted' | 'returned' | 'damaged'

// ── Stock movement types ───────────────────────────────────────────────────────
export type MovementType =
  | 'purchase_receipt'
  | 'sale'
  | 'customer_return'
  | 'supplier_return'
  | 'damaged'
  | 'missing'
  | 'manual_adjustment'
  | 'stock_correction'
  | 'reversal'

// ── Sale types ────────────────────────────────────────────────────────────────
export type SaleStatus    = 'pending' | 'confirmed' | 'cancelled' | 'refunded'
export type SaleChannel   = 'facebook' | 'instagram' | 'whatsapp' | 'physical' | 'other'

// ── Return types ─────────────────────────────────────────────────────────────
export type ReturnCondition = 'resellable' | 'damaged' | 'defective' | 'other'
export type ReturnStatus    = 'pending' | 'approved' | 'completed' | 'rejected'

// ── Expense types ─────────────────────────────────────────────────────────────
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled'

// ── Supplier / Customer ───────────────────────────────────────────────────────
export type SupplierStatus = 'active' | 'inactive' | 'archived'
export type CustomerStatus = 'active' | 'archived'

// ── Form action state ─────────────────────────────────────────────────────────
export interface ActionState<T = unknown> {
  success?: boolean
  error?: string
  errors?: Record<string, string[]>
  data?: T
}
