-- =============================================
-- ADMIN PANEL — DATABASE MIGRATIONS
-- =============================================
-- Run these queries in your Supabase SQL Editor
-- These extend the existing database for admin functionality


-- =============================================
-- 1. ORDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Auto-update trigger
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 2. RLS POLICIES FOR ORDERS
-- =============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can update any order
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );


-- =============================================
-- 3. UPDATED RLS POLICIES FOR PRODUCTS (Admin CRUD)
-- =============================================

-- Drop existing restrictive policies if needed
-- DROP POLICY IF EXISTS "Anyone can view active products" ON products;
-- DROP POLICY IF EXISTS "Service role full access" ON products;

-- Admins can view ALL products (including inactive/draft)
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can insert products
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can update products
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can delete products
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );


-- =============================================
-- 4. PRODUCT IMAGES STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view product images
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Admins can upload product images
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can update product images
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Admins can delete product images
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );


-- =============================================
-- 5. SET ADMIN ROLE FOR A USER (Run manually)
-- =============================================
-- Replace <USER_EMAIL> with the actual admin email address
--
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = '<USER_EMAIL>';
--
-- Verify:
-- SELECT id, email, raw_user_meta_data->>'role' as role
-- FROM auth.users
-- WHERE email = '<USER_EMAIL>';
