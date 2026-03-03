import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { OrderNotificationProvider } from '../context/OrderNotificationContext'

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <OrderNotificationProvider>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <Header collapsed={sidebarCollapsed} onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main
          className={`pt-16 min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? 'ml-[70px]' : 'ml-[250px]'
          }`}
        >
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </OrderNotificationProvider>
  )
}
