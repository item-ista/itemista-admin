import { useEffect, useState } from 'react'
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { getDashboardStats } from '../services/adminService'
import { formatPrice, formatDate, timeAgo } from '../utils/helpers'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen />

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
    },
    {
      label: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Overview of your store's performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, lightColor }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${lightColor} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className={`${color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Low Stock Alert: {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's' : ''} with stock ≤ 5
            </p>
          </div>
        </div>
      )}

      {/* Order Status Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Summary */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Order Status Summary</h2>
          {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold text-text-primary">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No orders yet</p>
          )}
        </div>

        {/* Recent Products */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Recently Added Products</h2>
          {stats?.recentProducts?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={16} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                    <p className="text-xs text-text-muted">{timeAgo(product.created_at)}</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{formatPrice(product.price)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No products yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Recent Orders</h2>
        {stats?.recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-text-muted">Order ID</th>
                  <th className="text-left py-2 px-3 font-medium text-text-muted">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-text-muted">Total</th>
                  <th className="text-left py-2 px-3 font-medium text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-2.5 px-3 text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="py-2.5 px-3 font-semibold">{formatPrice(order.total)}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No orders yet</p>
        )}
      </div>
    </div>
  )
}
