import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react'
import { useOrderNotifications } from '../../context/OrderNotificationContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', showBadge: true },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { unreadCount, markAllRead } = useOrderNotifications()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-secondary text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-[70px]' : 'w-[250px]'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <img src="/ItemIstaWhite.png" alt="ItemIsta" className="w-9 h-9 flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold leading-tight">ItemIsta</h1>
            <p className="text-[10px] text-white/50 leading-tight">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, showBadge }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              onClick={showBadge ? markAllRead : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={collapsed ? label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon size={20} />
                {/* Badge on collapsed icon */}
                {showBadge && unreadCount > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {label}
                  {showBadge && unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  )
}
