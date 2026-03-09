import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
} from 'lucide-react'
import { getProducts, deleteProduct } from '../../services/adminService'
import { formatPrice, formatDate, debounce } from '../../utils/helpers'
import { PRODUCT_STATUS, SORT_OPTIONS, PRODUCT_CATEGORIES } from '../../utils/constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { toast } from 'react-toastify'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [page, category, status, sort])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(() => {
      setPage(1)
      loadProducts()
    }, 400),
    []
  )

  useEffect(() => {
    debouncedSearch()
  }, [search])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts({ page, search, category, status, sort })
      setProducts(data.products)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct(deleteId)
      toast.success('Product deleted')
      setDeleteId(null)
      loadProducts()
    } catch (err) {
      toast.error('Failed to delete product')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-muted mt-1">{total} total products</p>
        </div>
        <Link
          to="/products/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-success text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Search & Filters — always visible */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            {Object.values(PRODUCT_STATUS).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Package size={48} className="mb-3 opacity-40" />
            <p className="text-base font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate max-w-[200px]">{product.name}</p>
                          {product.brand && <p className="text-xs text-text-muted">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs font-mono">{product.sku || '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">{product.category || '—'}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-primary">{formatPrice(product.price)}</p>
                      {product.cut_price && (
                        <p className="text-xs text-text-muted line-through">{formatPrice(product.cut_price)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${product.stock <= 5 ? 'text-danger' : 'text-text-primary'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={product.status} /></td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{formatDate(product.created_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/edit/${product.id}`}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-text-muted hover:text-warning transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product?"
        message="This will permanently delete this product. This action cannot be undone."
      />
    </div>
  )
}
