import { createBrowserRouter, Navigate } from 'react-router-dom'

// Layout
import AdminLayout from '../layouts/AdminLayout'

// Guards
import AdminRoute from '../components/guards/AdminRoute'

// Pages
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import ProductList from '../pages/products/ProductList'
import AddProduct from '../pages/products/AddProduct'
import EditProduct from '../pages/products/EditProduct'
import OrderList from '../pages/orders/OrderList'
import OrderDetail from '../pages/orders/OrderDetail'
import ReviewList from '../pages/reviews/ReviewList'
import UserList from '../pages/users/UserList'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  // Login (public)
  {
    path: '/login',
    element: <Login />,
  },

  // Root redirect
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // Protected admin routes
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          // Products
          {
            path: '/products',
            element: <ProductList />,
          },
          {
            path: '/products/add',
            element: <AddProduct />,
          },
          {
            path: '/products/edit/:id',
            element: <EditProduct />,
          },
          // Orders
          {
            path: '/orders',
            element: <OrderList />,
          },
          {
            path: '/orders/:id',
            element: <OrderDetail />,
          },
          // Reviews
          {
            path: '/reviews',
            element: <ReviewList />,
          },
          // Users
          {
            path: '/users',
            element: <UserList />,
          },
          // Settings
          {
            path: '/settings',
            element: <Settings />,
          },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
