import { useEffect, useState } from 'react'
import { Search, RefreshCcw } from 'lucide-react'
import { getSafepayOrders, getSafepayStats } from '../../services/adminService'
import { formatDate, formatPrice } from '../../utils/helpers'
import { PAYMENT_STATUS } from '../../utils/constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'

export default function SafepayPayments() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [page, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersData, statsData] = await Promise.all([
        getSafepayOrders({ page, status: statusFilter, search }),
        getSafepayStats(),
      ])
      setOrders(ordersData.orders)
      setTotalPages(ordersData.totalPages)
      setTotal(ordersData.total)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load Safepay data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSafepayRef = (paymentDetails) => {
    if (!paymentDetails) return '—'
    return (
      paymentDetails.safepay_order_id ||
      paymentDetails.transaction_id ||
      paymentDetails.payment_id ||
      '—'
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Safepay Data</h1>
        <p className="text-sm text-text-muted mt-1">Safepay payments and order payment states</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-muted">Orders Synced</p>
          <p className="text-2xl font-bold text-text-primary mt-2">{stats.total}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-muted">Paid</p>
          <p className="text-2xl font-bold text-success mt-2">{stats.paid}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-muted">Processing / Pending</p>
          <p className="text-2xl font-bold text-warning mt-2">{stats.pending}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-muted">Failed</p>
          <p className="text-2xl font-bold text-danger mt-2">{stats.failed}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              placeholder="Search by order ID or customer email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Payment Status</option>
            {Object.values(PAYMENT_STATUS).map((status) => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-secondary hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <p className="text-base font-medium">No Safepay payments found</p>
            <p className="text-sm mt-1">Payments will appear here after Safepay checkout</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Payment</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Safepay Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-text-secondary text-xs">{formatDate(order.created_at)}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {order.customer_email || order.customer_name || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.payment_status || 'pending'} />
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{order.status || '—'}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {getSafepayRef(order.payment_details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <div className="mt-2 text-xs text-text-muted">{total} total Safepay orders</div>
    </div>
  )
}
