import { supabase, supabaseAdmin } from '../lib/supabase'
import { ITEMS_PER_PAGE } from '../utils/constants'

// Helper: admin client use karo, warna regular client fallback
const adminClient = () => supabaseAdmin || supabase

// ─── Products ────────────────────────────────────────────

export async function getProducts({ page = 1, limit = ITEMS_PER_PAGE, search = '', category = '', status = '', sort = 'newest' } = {}) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%,sku.ilike.%${search}%`)
  }
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  // Sorting
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true }); break
    case 'price-low':
      query = query.order('price', { ascending: true }); break
    case 'price-high':
      query = query.order('price', { ascending: false }); break
    case 'name-asc':
      query = query.order('name', { ascending: true }); break
    case 'name-desc':
      query = query.order('name', { ascending: false }); break
    case 'stock-low':
      query = query.order('stock', { ascending: true }); break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { products: data, total: count, page, totalPages: Math.ceil(count / limit) }
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert([product]).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function getProductCategories() {
  const { data, error } = await supabase.from('products').select('category').neq('category', null)
  if (error) throw error
  const categories = [...new Set(data.map((p) => p.category).filter(Boolean))]
  return categories.sort()
}

// ─── Image Upload ────────────────────────────────────────

export async function uploadProductImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteProductImage(url) {
  // Extract file path from URL
  const path = url.split('/product-images/')[1]
  if (!path) return
  const { error } = await supabase.storage.from('product-images').remove([path])
  if (error) throw error
}

// ─── Dashboard Stats ─────────────────────────────────────

export async function getDashboardStats() {
  const [productsRes, usersRes, ordersRes] = await Promise.all([
    supabase.from('products').select('id, price, stock, status, created_at', { count: 'exact' }),
    adminClient().auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('orders').select('id, total, status, created_at', { count: 'exact' }),
  ])

  const products = productsRes.data || []
  const totalProducts = productsRes.count || products.length
  const users = usersRes.data?.users || []
  const totalUsers = users.length
  const orders = ordersRes.data || []
  const totalOrders = ordersRes.count || orders.length

  const totalRevenue = orders
    .filter((o) => o.status === 'delivered' || o.status === 'completed')
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

  const lowStockProducts = products.filter((p) => p.stock <= 5 && p.status === 'active').length

  const ordersByStatus = {}
  orders.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  })

  // Recent activity — last 10 products
  const recentProducts = products
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  // Recent orders
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  return {
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue,
    lowStockProducts,
    ordersByStatus,
    recentProducts,
    recentOrders,
  }
}

// ─── Users ───────────────────────────────────────────────

export async function getUsers({ page = 1, limit = ITEMS_PER_PAGE, search = '' } = {}) {
  // Supabase Auth admin API for listing users
  const { data, error } = await adminClient().auth.admin.listUsers({
    page,
    perPage: limit,
  })

  if (error) throw error

  let users = data.users || []

  // Client-side search filter (Auth admin API doesn't support server-side search)
  if (search) {
    const q = search.toLowerCase()
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.user_metadata?.full_name?.toLowerCase().includes(q) ||
        u.user_metadata?.first_name?.toLowerCase().includes(q) ||
        u.user_metadata?.last_name?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    )
  }

  return {
    users,
    total: data.total || users.length,
    page,
  }
}

export async function getUser(id) {
  const { data, error } = await adminClient().auth.admin.getUserById(id)
  if (error) throw error
  return data.user
}

export async function updateUserRole(id, role) {
  const { data, error } = await adminClient().auth.admin.updateUserById(id, {
    user_metadata: { role },
  })
  if (error) throw error
  return data.user
}

// ─── Orders ──────────────────────────────────────────────

export async function getOrders({ page = 1, limit = ITEMS_PER_PAGE, status = '', search = '' } = {}) {
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`id.eq.${search},customer_email.ilike.%${search}%`)

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { orders: data, total: count, page, totalPages: Math.ceil(count / limit) }
}

export async function getOrder(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status) {
  // Pehle current order fetch karo — previous status aur items check ke liye
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status, items')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  // Order status update karo
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  if (error) throw error

  // Sirf tab stock minus karo jab status 'delivered' hua ho aur pehle delivered nahi tha
  if (status === 'delivered' && currentOrder.status !== 'delivered') {
    const items = currentOrder.items || []
    for (const item of items) {
      const productId = item.id || item.product_id
      if (!productId) continue

      // Product ka current stock fetch karo
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single()

      if (product) {
        const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 1))
        await supabase.from('products').update({ stock: newStock }).eq('id', productId)
      }
    }
  }

  return data
}

// ─── Reviews ─────────────────────────────────────────────

export async function getReviews({ page = 1, limit = ITEMS_PER_PAGE, search = '', rating = '', sort = 'newest' } = {}) {
  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })

  if (rating) query = query.eq('rating', parseInt(rating))
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,review_text.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true }); break
    case 'highest':
      query = query.order('rating', { ascending: false }); break
    case 'lowest':
      query = query.order('rating', { ascending: true }); break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { reviews: data, total: count, page, totalPages: Math.ceil(count / limit) }
}

export async function getReview(id) {
  const { data, error } = await supabase.from('reviews').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateReview(id, updates) {
  const { data, error } = await supabase.from('reviews').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

export async function getProductNameById(id) {
  const { data, error } = await supabase.from('products').select('name, slug, image').eq('id', id).single()
  if (error) return null
  return data
}
