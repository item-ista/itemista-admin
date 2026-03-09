import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Eye, Filter } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../../services/adminService'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS } from '../../utils/constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import { toast } from 'react-toastify'

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getOrders({ page, status: statusFilter, search })
      setOrders(data.orders)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      // Orders table may not exist yet
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      toast.success('Order status updated')
      loadOrders()
    } catch (err) {
      toast.error('Failed to update order status')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
        <p className="text-sm text-text-muted mt-1">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
              placeholder="Search by order ID or customer email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            {Object.values(ORDER_STATUS).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <ShoppingCart size={48} className="mb-3 opacity-40" />
            <p className="text-base font-medium">No orders found</p>
            <p className="text-sm mt-1">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{order.id.slice(0, 12)}...</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {order.customer_email || order.customer_name || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {Object.values(ORDER_STATUS).map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs text-info hover:opacity-80 font-medium transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
