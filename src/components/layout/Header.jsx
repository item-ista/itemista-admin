import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useOrderNotifications } from '../../context/OrderNotificationContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, Menu, Check, ChevronDown, UserCog } from 'lucide-react'
import { getInitials } from '../../utils/helpers'
import { toast } from 'react-toastify'

function formatDateTime(dateStr) {
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })
  return { date, time }
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function Header({ collapsed, onMenuToggle }) {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAllRead, markAsRead } = useOrderNotifications()
  const navigate = useNavigate()
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [bellRinging, setBellRinging] = useState(false)
  const prevUnreadCount = useRef(0)
  const hasRungOnMount = useRef(false)
  const notifDropdownRef = useRef(null)
  const profileDropdownRef = useRef(null)

  // Ring bell when a new unread notification arrives (live)
  useEffect(() => {
    if (hasRungOnMount.current && unreadCount > prevUnreadCount.current) {
      setBellRinging(true)
      const t = setTimeout(() => setBellRinging(false), 900)
      prevUnreadCount.current = unreadCount
      return () => clearTimeout(t)
    }
    prevUnreadCount.current = unreadCount
  }, [unreadCount])

  // Ring once on mount if there are already unread orders (e.g. after refresh)
  useEffect(() => {
    if (!hasRungOnMount.current && unreadCount > 0) {
      hasRungOnMount.current = true
      prevUnreadCount.current = unreadCount
      setBellRinging(true)
      setTimeout(() => setBellRinging(false), 900)
    }
  }, [unreadCount])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  const handleNotifClick = (notif) => {
    markAsRead(notif.id)
    setShowNotifDropdown(false)
    navigate(`/orders/${notif.id}`)
  }

  const handleManageAccount = () => {
    setShowProfileDropdown(false)
    navigate('/account/manage')
  }

  const displayName =
    user?.user_metadata?.full_name ||
    `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
    user?.email ||
    'Admin'

  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-surface border-b border-border flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        collapsed ? 'left-[70px]' : 'left-[250px]'
      }`}
    >
      {/* Left — Mobile menu toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right — User info & actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => {
              setShowNotifDropdown((prev) => !prev)
              setShowProfileDropdown(false)
            }}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
          >
            <Bell size={20} className={bellRinging ? 'bell-ring' : ''} />
            {unreadCount > 0 && (
              <>
                {/* Red dot — always visible when unread */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white" />
                {/* Count bubble — shows number */}
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                <h3 className="text-sm font-semibold text-gray-800">Order Notifications</h3>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Bell size={32} strokeWidth={1.5} />
                    <p className="text-sm mt-2">No orders yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const { date, time } = formatDateTime(notif.createdAt)
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread dot */}
                          <div className="mt-1.5 flex-shrink-0">
                            {!notif.read ? (
                              <span className="block w-2 h-2 bg-primary rounded-full" />
                            ) : (
                              <span className="block w-2 h-2 bg-transparent rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                New Order — Rs {Number(notif.total).toLocaleString()}
                              </p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                notif.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : notif.status === 'delivered' || notif.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : notif.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {notif.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{notif.email}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                              <span>{date}</span>
                              <span>•</span>
                              <span>{time}</span>
                              <span className="ml-auto">{timeAgo(notif.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false)
                      navigate('/orders')
                    }}
                    className="w-full text-center text-xs font-semibold text-primary hover:underline"
                  >
                    View All Orders
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => {
              setShowProfileDropdown((prev) => !prev)
              setShowNotifDropdown(false)
            }}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div
              className="rounded-full bg-white text-text-secondary flex items-center justify-center text-xs font-bold overflow-hidden border border-border shrink-0"
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="rounded-full object-contain bg-white"
                  style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
                />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-text-primary leading-tight">{displayName}</p>
              <p className="text-xs text-text-muted leading-tight">Administrator</p>
            </div>
            <ChevronDown size={16} className="text-text-muted" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <button
                onClick={handleManageAccount}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              >
                <UserCog size={16} className="text-primary" />
                Manage Account
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
