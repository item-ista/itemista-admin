-- ============================================================
-- Add SKU column to products table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add SKU column (nullable, unique)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Create index for fast SKU lookup
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'sku';
