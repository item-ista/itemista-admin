import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { playNotificationSound } from '../utils/notificationSound'

const OrderNotificationContext = createContext(null)
const LS_KEY = 'admin_read_order_ids'

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')) }
  catch { return new Set() }
}

function saveReadId(id) {
  try {
    const ids = getReadIds()
    ids.add(id)
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

function saveAllReadIds(ids) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)) }
  catch { /* ignore */ }
}

export function useOrderNotifications() {
  const ctx = useContext(OrderNotificationContext)
  if (!ctx) throw new Error('useOrderNotifications must be used within OrderNotificationProvider')
  return ctx
}

export function OrderNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalPendingOrders, setTotalPendingOrders] = useState(0)
  const initialLoadDone = useRef(false)

  // ── Load recent orders as initial notifications ──────────────────────────
  const loadRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_email, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) { console.error('Failed to load orders:', error); return }

      const readIds = getReadIds()

      const items = (data || []).map((order) => ({
        id: order.id,
        email: order.customer_email,
        total: order.total,
        status: order.status,
        createdAt: order.created_at,
        // Unread only if pending AND not previously marked read in localStorage
        read: order.status !== 'pending' || readIds.has(order.id),
      }))

      setNotifications(items)

      const unread = items.filter((o) => !o.read).length
      setUnreadCount(unread)

      const pending = (data || []).filter((o) => o.status === 'pending').length
      setTotalPendingOrders(pending)

      return unread
    } catch (err) {
      console.error('Order notification load error:', err)
      return 0
    }
  }, [])

  // ── Fetch total pending order count for sidebar badge ────────────────────
  const loadPendingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (!error && count !== null) setTotalPendingOrders(count)
    } catch { /* ignore */ }
  }, [])

  // ── Real-time listener for new orders ────────────────────────────────────
  useEffect(() => {
    loadRecentOrders().then((unread) => {
      initialLoadDone.current = true
    })
    loadPendingCount()

    const channel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new
          const newNotif = {
            id: order.id,
            email: order.customer_email,
            total: order.total,
            status: order.status,
            createdAt: order.created_at,
            read: false,
          }

          setNotifications((prev) => [newNotif, ...prev].slice(0, 50))
          setUnreadCount((prev) => prev + 1)
          setTotalPendingOrders((prev) => prev + 1)

          // Play sound only after initial load
          if (initialLoadDone.current) {
            playNotificationSound()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === order.id ? { ...n, status: order.status } : n
            )
          )
          loadPendingCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadRecentOrders, loadPendingCount])

  // ── Actions ──────────────────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      // Persist all current IDs as read in localStorage
      saveAllReadIds(prev.map((n) => n.id))
      return prev.map((n) => ({ ...n, read: true }))
    })
    setUnreadCount(0)
  }, [])

  const markAsRead = useCallback((orderId) => {
    saveReadId(orderId)
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === orderId)
      if (notif && !notif.read) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      return prev.map((n) => (n.id === orderId ? { ...n, read: true } : n))
    })
  }, [])

  return (
    <OrderNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        totalPendingOrders,
        markAllRead,
        markAsRead,
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  )
}
