'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Shirt, Archive, Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductFormModal } from '@/components/forms/ProductFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { archiveProductAction } from '@/actions/product.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface ProductListClientProps {
  initialProducts: any[]
  categories: string[]
  currentSearch?: string
  currentCategory?: string
  currentStatus?: string
}

export function ProductListClient({
  initialProducts,
  categories,
  currentSearch = '',
  currentCategory = '',
  currentStatus = 'active',
}: ProductListClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [archivingProduct, setArchivingProduct] = useState<any | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const handleArchive = async () => {
    if (!archivingProduct) return
    setIsArchiving(true)
    await archiveProductAction(archivingProduct._id)
    setIsArchiving(false)
    setArchivingProduct(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Products Catalog</h1>
          <p className="text-xs text-[var(--foreground-muted)]">
            Manage clothing garments, size/color variant combinations, and default pricing.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Product
        </Button>
      </div>

      {/* Standardized Filter / Search Bar */}
      <div className="filter-bar">
        <form method="GET" className="flex flex-col md:flex-row md:items-center gap-2.5 w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search by product code or name..."
              className="filter-input"
            />
          </div>
          <select name="category" defaultValue={currentCategory} className="filter-select w-full md:w-48">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={currentStatus} className="filter-select w-full md:w-36">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <div className="flex items-center gap-2">
            <button type="submit" className="filter-btn btn-primary">
              Filter
            </button>
            {(currentSearch || currentCategory || (currentStatus && currentStatus !== 'active')) && (
              <a href="/products" className="filter-btn btn-outline text-slate-600 hover:text-slate-900" title="Reset all filters">
                Reset
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Products Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Default Price</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-xs text-[var(--foreground-muted)]">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                initialProducts.map((p) => (
                  <tr key={p._id.toString()}>
                    <td className="font-mono font-bold text-xs">
                      <Link href={`/products/${p._id}`} className="text-[var(--accent)] hover:underline">
                        {p.code}
                      </Link>
                    </td>
                    <td className="font-semibold text-xs text-[var(--foreground)]">
                      <Link href={`/products/${p._id}`} className="hover:text-[var(--accent)]">
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-xs">{p.category}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">{p.brand || '-'}</td>
                    <td className="text-xs font-semibold">{formatCurrency(p.defaultSellingPrice)}</td>
                    <td>
                      <Badge variant="primary">{p.variantCount} variant(s)</Badge>
                    </td>
                    <td>
                      <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="text-xs text-[var(--foreground-muted)]">{formatDate(p.createdAt)}</td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-[var(--foreground)]"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {p.status === 'active' && (
                        <button
                          onClick={() => setArchivingProduct(p)}
                          className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
                          title="Archive Product"
                        >
                          <Archive className="w-3.5 h-3.5" />
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

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={isCreateOpen || !!editingProduct}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingProduct(null)
        }}
        initialData={editingProduct}
        categories={categories}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!archivingProduct}
        onClose={() => setArchivingProduct(null)}
        onConfirm={handleArchive}
        title="Archive Product"
        message={`Are you sure you want to archive "${archivingProduct?.name}" (${archivingProduct?.code})? If this product has active stock remaining, an audit record will be preserved.`}
        confirmText="Archive"
        isLoading={isArchiving}
      />
    </div>
  )
}
