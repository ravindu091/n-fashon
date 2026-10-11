'use client'

import React, { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/currency'

export interface InventoryVariantItem {
  _id: string
  code: string
  productName: string
  category: string
  size: string
  color: string
  defaultSellingPrice: number
  reorderLevel: number
  currentStock: number
  inventoryValuation: number
}

interface InventoryTableClientProps {
  variantList: InventoryVariantItem[]
}

export function InventoryTableClient({ variantList }: InventoryTableClientProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    variantList.forEach((v) => {
      if (v.category && v.category !== '-') set.add(v.category)
    })
    return Array.from(set).sort()
  }, [variantList])

  const filteredVariants = useMemo(() => {
    const q = search.toLowerCase().trim()
    return variantList.filter((v) => {
      const matchSearch =
        !q ||
        v.productName.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q)

      const matchCategory = !categoryFilter || v.category === categoryFilter

      const isOutOfStock = v.currentStock === 0
      const isLowStock = v.currentStock <= v.reorderLevel && !isOutOfStock
      const isInStock = v.currentStock > v.reorderLevel

      const matchStatus =
        !statusFilter ||
        (statusFilter === 'in_stock' && isInStock) ||
        (statusFilter === 'low_stock' && isLowStock) ||
        (statusFilter === 'out_of_stock' && isOutOfStock)

      return matchSearch && matchCategory && matchStatus
    })
  }, [variantList, search, categoryFilter, statusFilter])

  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter)

  const handleReset = () => {
    setSearch('')
    setCategoryFilter('')
    setStatusFilter('')
  }

  return (
    <div className="space-y-4">
      {/* Standardized Filter Bar with Instant Preview */}
      <div className="filter-bar">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Instant search by garment, code, size, color, or category..."
              className="filter-input pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select w-full sm:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select w-full sm:w-44 font-semibold"
          >
            <option value="">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">⚠️ Low Stock</option>
            <option value="out_of_stock">⛔ Out of Stock</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="filter-btn btn-outline text-slate-600 hover:text-slate-900"
              title="Clear all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Variant Inventory Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--foreground)]">Variant Stock & Valuation Ledger</h2>
          <span className="text-xs text-[var(--foreground-muted)]">
            Showing {filteredVariants.length} of {variantList.length} variants
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Garment Name</th>
                <th>Variant Code</th>
                <th>Category</th>
                <th>Size / Color</th>
                <th>Selling Price</th>
                <th>Available Pieces</th>
                <th>Stock Valuation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No variants match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const isOutOfStock = v.currentStock === 0
                  const isLowStock = v.currentStock <= v.reorderLevel && !isOutOfStock

                  return (
                    <tr key={v._id}>
                      <td className="text-xs font-semibold text-[var(--foreground)]">{v.productName}</td>
                      <td className="font-mono text-xs font-bold">{v.code}</td>
                      <td className="text-xs">{v.category}</td>
                      <td className="text-xs">
                        {v.size} / {v.color}
                      </td>
                      <td className="text-xs font-semibold">{formatCurrency(v.defaultSellingPrice)}</td>
                      <td className="text-xs font-bold">
                        <span
                          className={
                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'
                          }
                        >
                          {v.currentStock} pcs
                        </span>
                      </td>
                      <td className="text-xs font-semibold">{formatCurrency(v.inventoryValuation)}</td>
                      <td>
                        {isOutOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
