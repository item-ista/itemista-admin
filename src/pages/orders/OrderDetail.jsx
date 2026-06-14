import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react'
import { getOrder, updateOrderStatus } from '../../services/adminService'
import { formatPrice, formatDateTime } from '../../utils/helpers'
import { ORDER_STATUS } from '../../utils/constants'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { toast } from 'react-toastify'
import { useOrderNotifications } from '../../context/OrderNotificationContext'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const { markAsRead } = useOrderNotifications()

  useEffect(() => {
    loadOrder()
    // Auto-mark notification as read when this order is viewed
    markAsRead(id)
  }, [id])

  const loadOrder = async () => {
    try {
      const data = await getOrder(id)
      setOrder(data)
    } catch (err) {
      toast.error('Failed to load order')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await updateOrderStatus(id, newStatus)
      setOrder(updated)
      toast.success('Status updated')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <LoadingScreen />
  if (!order) return null

  const paymentDetails = order.payment_details || {}

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/orders')} className="p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Order Details</h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">#{order.id}</p>
        </div>
        <div>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {Object.values(ORDER_STATUS).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package size={18} /> Order Items
            </h2>
            {order.items?.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No items data available</p>
            )}

            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <span className="font-semibold text-text-primary">Total</span>
              <span className="font-bold text-lg text-text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-text-primary mb-3">Customer</h2>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>{order.customer_name || '—'}</p>
              <p>{order.customer_email || '—'}</p>
              <p>{order.customer_phone || '—'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <MapPin size={16} /> Shipping Address
            </h2>
            {(() => {
              const raw = order.shipping_address || order.address;
              if (!raw) return <p className="text-sm text-text-secondary">No address provided</p>;
              try {
                const addr = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return (
                  <div className="text-sm text-text-secondary space-y-1">
                    {addr.name && <p className="font-medium text-text-primary">{addr.name}</p>}
                    {addr.phone && <p>{addr.phone}</p>}
                    {addr.tag && <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{addr.tag}</span>}
                    {(addr.address || addr.fullAddress) && <p>{addr.fullAddress || addr.address}</p>}
                    {addr.region && !addr.fullAddress && <p>{addr.region}</p>}
                  </div>
                );
              } catch {
                return <p className="text-sm text-text-secondary">{raw}</p>;
              }
            })()}
          </div>

          {/* Payment */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <CreditCard size={16} /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Method</span>
                <span className="text-text-primary font-medium">{order.payment_method || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <StatusBadge status={order.payment_status || 'pending'} />
              </div>

              {paymentDetails.bank_name && (
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted">Bank</span>
                  <span className="text-text-primary font-medium text-right">{paymentDetails.bank_name}</span>
                </div>
              )}

              {paymentDetails.card_brand && (
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted">Card</span>
                  <span className="text-text-primary font-medium text-right">
                    {paymentDetails.card_brand} •••• {paymentDetails.card_last4 || '----'}
                  </span>
                </div>
              )}

              {paymentDetails.payer_name && (
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted">Payer</span>
                  <span className="text-text-primary font-medium text-right">{paymentDetails.payer_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-text-primary mb-3">Timeline</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Created</span>
                <span className="text-text-secondary">{formatDateTime(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Updated</span>
                <span className="text-text-secondary">{formatDateTime(order.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
