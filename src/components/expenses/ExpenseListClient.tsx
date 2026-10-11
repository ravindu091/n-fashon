'use client'

import React, { useState } from 'react'
import { Plus, Search, Receipt, Trash2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ExpenseFormModal } from '@/components/forms/ExpenseFormModal'
import { cancelExpenseAction } from '@/actions/expense.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { useInstantFilter } from '@/hooks/useInstantFilter'

interface ExpenseListClientProps {
  initialExpenses: any[]
  totalExpenses: number
  categories: string[]
  currentSearch?: string
  currentCategory?: string
}

export function ExpenseListClient({
  initialExpenses,
  totalExpenses,
  categories,
  currentSearch = '',
  currentCategory = '',
}: ExpenseListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const {
    filters,
    isPending,
    hasActiveFilters,
    onSearchChange,
    onSelectChange,
    onReset,
    onSubmit,
  } = useInstantFilter({
    search: currentSearch,
    category: currentCategory,
  })

  const handleCancel = async (id: string) => {
    if (confirm('Cancel this recorded expense?')) {
      await cancelExpenseAction(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Business Operating Expenses</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Record operating costs (advertising, packaging, utilities) to calculate accurate net profit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-[var(--foreground-muted)] block uppercase font-bold">Total Expenses</span>
            <span className="text-sm font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Record Expense
          </Button>
        </div>
      </div>

      {/* Standardized Filter Bar with Instant Preview */}
      <div className="filter-bar">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
          <div className="relative flex-1 min-w-[220px]">
            {isPending ? (
              <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            )}
            <input
              type="text"
              name="search"
              value={filters.search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search description, payee, or expense #..."
              className="filter-input pr-8"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            name="category"
            value={filters.category || ''}
            onChange={(e) => onSelectChange('category', e.target.value)}
            className="filter-select w-full sm:w-56"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button type="submit" className="filter-btn btn-primary" title="Search filter preview">
              Filter
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="filter-btn btn-outline text-slate-600 hover:text-slate-900"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense #</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount (LKR)</th>
                <th>Payment Method</th>
                <th>Payee / Vendor</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {initialExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No operating expenses recorded yet. Click "Record Expense" to add advertising or packing costs.
                  </td>
                </tr>
              ) : (
                initialExpenses.map((exp) => (
                  <tr key={exp._id.toString()}>
                    <td className="font-mono font-bold text-xs">{exp.expenseNumber}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(exp.date)}</td>
                    <td>
                      <Badge variant="primary">{exp.category}</Badge>
                    </td>
                    <td className="text-xs font-semibold text-[var(--foreground)]">{exp.description}</td>
                    <td className="text-xs font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                    <td className="text-xs capitalize">{exp.paymentMethod}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{exp.payee || '-'}</td>
                    <td>
                      <Badge variant={exp.status === 'paid' ? 'success' : 'neutral'}>
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      {exp.status === 'paid' && (
                        <button
                          onClick={() => handleCancel(exp._id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                          title="Cancel Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
