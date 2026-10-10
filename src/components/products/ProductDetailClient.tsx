'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Archive, Shirt, Layers, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { VariantFormModal } from '@/components/forms/VariantFormModal'
import { ProductFormModal } from '@/components/forms/ProductFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toggleVariantStatusAction, deleteVariantAction } from '@/actions/variant.actions'
import { archiveProductAction, deleteProductAction } from '@/actions/product.actions'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'

interface ProductDetailClientProps {
  product: any
  variants: any[]
  categories?: string[]
}

export function ProductDetailClient({ product, variants, categories = [] }: ProductDetailClientProps) {
  const router = useRouter()
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<any | null>(null)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [deletingVariant, setDeletingVariant] = useState<any | null>(null)
  const [isDeletingVariant, setIsDeletingVariant] = useState(false)
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null)
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null)

  const handleArchive = async () => {
    setIsArchiving(true)
    setErrorFeedback(null)
    setSuccessFeedback(null)
    await archiveProductAction(product._id)
    setIsArchiving(false)
    setIsArchiveOpen(false)
  }

  const handleDeleteProduct = async () => {
    setIsDeletingProduct(true)
    setErrorFeedback(null)
    setSuccessFeedback(null)
    try {
      const res = await deleteProductAction(product._id)
      if (!res.success) {
        setErrorFeedback(res.error || 'Failed to delete product')
        setIsDeleteProductOpen(false)
      } else {
        router.push('/products')
      }
    } catch (e: unknown) {
      setErrorFeedback((e as Error)?.message || 'Failed to delete product')
      setIsDeleteProductOpen(false)
    } finally {
      setIsDeletingProduct(false)
    }
  }

  const handleDeleteVariant = async () => {
    if (!deletingVariant) return
    setIsDeletingVariant(true)
    setErrorFeedback(null)
    setSuccessFeedback(null)
    try {
      const res = await deleteVariantAction(deletingVariant._id, product._id)
      if (!res.success) {
        setErrorFeedback(res.error || 'Failed to delete variant')
        setDeletingVariant(null)
      } else {
        setSuccessFeedback(`Variant "${deletingVariant.code}" deleted successfully.`)
        setDeletingVariant(null)
        router.refresh()
      }
    } catch (e: unknown) {
      setErrorFeedback((e as Error)?.message || 'Failed to delete variant')
      setDeletingVariant(null)
    } finally {
      setIsDeletingVariant(false)
    }
  }

  const handleToggleVariant = async (variantId: string) => {
    await toggleVariantStatusAction(variantId, product._id)
  }

  const totalStock = variants.reduce((sum, v) => sum + (v.currentStock || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-white text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {product.code}
              </span>
              <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
                {product.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-0.5">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditProductOpen(true)} leftIcon={<Edit className="w-3.5 h-3.5" />}>
            Edit Product
          </Button>
          {product.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => { setErrorFeedback(null); setIsArchiveOpen(true) }} className="text-amber-600 hover:bg-amber-50" leftIcon={<Archive className="w-3.5 h-3.5" />}>
              Archive
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { setErrorFeedback(null); setIsDeleteProductOpen(true) }} className="text-red-600 hover:bg-red-50 hover:border-red-200" leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
            Delete
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsVariantModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Variant
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorFeedback && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorFeedback}</span>
          </div>
          <button onClick={() => setErrorFeedback(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}
      {successFeedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <span>{successFeedback}</span>
          <button onClick={() => setSuccessFeedback(null)} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}


      {/* Product Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Category</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{product.category}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Brand</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{product.brand || 'Unbranded'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Default Selling Price</p>
          <p className="text-base font-bold text-[var(--foreground)] mt-1">{formatCurrency(product.defaultSellingPrice)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">Total In-Stock Units</p>
          <p className={`text-base font-bold mt-1 ${totalStock === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalStock} pcs
          </p>
        </div>
      </div>

      {product.description && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-1">Description & Notes</p>
          <p className="text-xs text-[var(--foreground)] leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Variants Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Size & Color Variants</h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              Each variant maintains its own independent inventory balance across purchase batches.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsVariantModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Variant
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Variant Code</th>
                <th>Size</th>
                <th>Color</th>
                <th>Selling Price</th>
                <th>Promo Price</th>
                <th>Available Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-[var(--foreground-muted)]">
                    No variants created yet. Click "Add Variant" to create sizes and colors.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v._id.toString()}>
                    <td className="font-mono text-xs font-bold text-[var(--foreground)]">{v.code}</td>
                    <td className="text-xs font-semibold">{v.size}</td>
                    <td className="text-xs">{v.color}</td>
                    <td className="text-xs font-semibold">{formatCurrency(v.defaultSellingPrice)}</td>
                    <td className="text-xs text-[var(--foreground-muted)]">
                      {v.promoPrice ? formatCurrency(v.promoPrice) : '-'}
                    </td>
                    <td>
                      <span
                        className={`font-bold text-xs ${
                          v.currentStock === 0
                            ? 'text-red-600'
                            : v.currentStock <= v.reorderLevel
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {v.currentStock} pcs
                      </span>
                      {v.currentStock <= v.reorderLevel && v.currentStock > 0 && (
                        <span className="ml-1 text-[10px] text-amber-500 font-medium">(Low)</span>
                      )}
                      {v.currentStock === 0 && (
                        <span className="ml-1 text-[10px] text-red-500 font-medium">(Out)</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={v.status === 'active' ? 'success' : 'neutral'}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => setEditingVariant(v)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                        title="Edit Variant"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleVariant(v._id)}
                        className="text-xs text-[var(--accent)] hover:underline ml-1"
                      >
                        {v.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setErrorFeedback(null)
                          setDeletingVariant(v)
                        }}
                        className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 ml-1 inline-flex items-center"
                        title="Delete Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variant Modal */}
      <VariantFormModal
        isOpen={isVariantModalOpen || !!editingVariant}
        onClose={() => {
          setIsVariantModalOpen(false)
          setEditingVariant(null)
        }}
        productId={product._id}
        defaultPrice={product.defaultSellingPrice}
        initialData={editingVariant}
      />

      {/* Edit Product Modal */}
      <ProductFormModal
        isOpen={isEditProductOpen}
        onClose={() => setIsEditProductOpen(false)}
        initialData={product}
        categories={categories}
      />

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Archive Product"
        message={`Are you sure you want to archive "${product.name}"? You have ${totalStock} units currently in stock.`}
        confirmText="Archive Product"
        isLoading={isArchiving}
      />

      {/* Delete Product Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteProductOpen}
        onClose={() => setIsDeleteProductOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${product.name}" (${product.code}) and all its variants? This cannot be undone. Products with active inventory stock cannot be deleted.`}
        confirmText="Delete Product"
        variant="danger"
        isLoading={isDeletingProduct}
      />

      {/* Delete Variant Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingVariant}
        onClose={() => setDeletingVariant(null)}
        onConfirm={handleDeleteVariant}
        title="Delete Variant"
        message={`Are you sure you want to delete variant "${deletingVariant?.code}" (${deletingVariant?.size} / ${deletingVariant?.color})? This cannot be undone. Variants with active inventory stock cannot be deleted.`}
        confirmText="Delete Variant"
        variant="danger"
        isLoading={isDeletingVariant}
      />
    </div>
  )
}
