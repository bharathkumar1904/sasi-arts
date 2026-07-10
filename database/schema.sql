-- ============================================================
-- SASI ARTS & PHOTO FRAMES - COMPLETE DATABASE SCHEMA
-- Execute this in your Supabase SQL Editor
-- ============================================================

-- 1. PRODUCTS
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  image TEXT,
  images TEXT[],
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  badge TEXT,
  is_best_seller BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 100,
  sizes TEXT[],
  materials TEXT[],
  offer JSONB,
  customizable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  birthday DATE,
  anniversary DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_corporate BOOLEAN DEFAULT false,
  company_name TEXT,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEADS
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  birthday DATE,
  coupon TEXT DEFAULT 'SASI10',
  is_converted BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'popup',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  payment_method TEXT DEFAULT 'COD',
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  status INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  product_name TEXT,
  product_price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  customization JSONB,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVIEWS
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES customers(id),
  customer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  image TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LOYALTY MEMBERS
CREATE TABLE loyalty_members (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Bronze',
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CAMPAIGNS
CREATE TABLE campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BIRTHDAY REMINDERS
CREATE TABLE birthday_reminders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  recipient_name TEXT,
  birthday_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ANNIVERSARY REMINDERS
CREATE TABLE anniversary_reminders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  recipient_name TEXT,
  anniversary_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CORPORATE ORDERS
CREATE TABLE corporate_orders (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  product_interest TEXT,
  quantity INTEGER,
  budget_per_item DECIMAL(10,2),
  message TEXT,
  needs_gst BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. OFFERS
CREATE TABLE offers (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  product_id BIGINT REFERENCES products(id),
  discount_percent INTEGER,
  offer_price DECIMAL(10,2),
  old_price DECIMAL(10,2),
  image TEXT,
  stock_remaining INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. WISHLIST
CREATE TABLE wishlists (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- 15. NEWSLETTER SUBSCRIBERS
CREATE TABLE newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Public read" ON products;
DROP POLICY IF EXISTS "Public read" ON categories;
DROP POLICY IF EXISTS "Public read" ON offers;
DROP POLICY IF EXISTS "Public insert" ON leads;
DROP POLICY IF EXISTS "Public insert" ON orders;
DROP POLICY IF EXISTS "Public insert" ON order_items;
DROP POLICY IF EXISTS "Public insert" ON corporate_orders;
DROP POLICY IF EXISTS "Public insert" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public insert" ON birthday_reminders;
DROP POLICY IF EXISTS "Public insert" ON anniversary_reminders;
DROP POLICY IF EXISTS "Admin all" ON products;
DROP POLICY IF EXISTS "Admin all" ON offers;
DROP POLICY IF EXISTS "Admin all" ON categories;
DROP POLICY IF EXISTS "Public select" ON orders;
DROP POLICY IF EXISTS "Admin select" ON orders;
DROP POLICY IF EXISTS "Admin update" ON orders;
DROP POLICY IF EXISTS "Public select" ON order_items;
DROP POLICY IF EXISTS "Admin select" ON order_items;
DROP POLICY IF EXISTS "Admin all" ON customers;

-- Public read access for products, categories & offers
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON offers FOR SELECT USING (true);

-- Anonymous INSERT policies (no auth required - public form submissions)
CREATE POLICY "Public insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON corporate_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON birthday_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON anniversary_reminders FOR INSERT WITH CHECK (true);

-- Public select for order tracking by customers
CREATE POLICY "Public select" ON orders FOR SELECT USING (true);
CREATE POLICY "Public select" ON order_items FOR SELECT USING (true);

-- Admin-only policies (require Supabase Auth login)
CREATE POLICY "Admin all" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON offers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin select" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin update" ON orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin select" ON order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all" ON customers FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_orders_customer ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO categories (name, slug, icon) VALUES
  ('Personalized Photo Frames', 'photo-frames', '🖼️'),
  ('LED Photo Frames', 'led-frames', '💡'),
  ('Acrylic Gifts', 'acrylic-gifts', '✨'),
  ('Moon Lamps', 'moon-lamps', '🌙'),
  ('Magic Mirrors', 'magic-mirrors', '🪞'),
  ('Photo Mugs', 'photo-mugs', '☕'),
  ('Cushions', 'cushions', '🛋️'),
  ('Photo Clocks', 'photo-clocks', '⏰'),
  ('Crystal Gifts', 'crystal-gifts', '💎'),
  ('Keychains', 'keychains', '🔑'),
  ('Name Plates', 'name-plates', '📛'),
  ('Corporate Gifts', 'corporate-gifts', '💼'),
  ('Birthday Gifts', 'birthday-gifts', '🎂'),
  ('Anniversary Gifts', 'anniversary-gifts', '💑'),
  ('Wedding Gifts', 'wedding-gifts', '💒'),
  ('Bangles', 'Bangless', '⭕'),
  ('Sketch Art', 'sketch-art', '✏️'),
  ('Blood Art', 'blood-art', '🎨');

-- ============================================================
-- MIGRATIONS (run these if table already exists without new columns)
-- ============================================================
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[];
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT[];
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS offer JSONB;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable BOOLEAN DEFAULT false;
