# Sasi Arts & Photo Frames — Full Project Documentation

---

## Table of Contents
1. Resume Section
2. Project Overview
3. Tech Stack
4. Architecture & Flow
5. File-by-File Breakdown
6. Features
7. Payment Flow
8. Interview Questions
9. Coding Challenges & Solutions
10. Deployment Guide

---

## 1. Resume Section

### Project: Sasi Arts & Photo Frames
*Full-Stack E-Commerce Platform | JavaScript, Node.js, Supabase, Razorpay*

- Built a complete e-commerce website with 17 product categories, real-time order tracking, and Razorpay payment integration serving a personalized gift store
- Implemented server-side payment verification via HMAC SHA256 encryption, ensuring fraud-proof transactions
- Architected a dual-checkout system supporting both online payments (Razorpay card/UPI/netbanking) and WhatsApp-based ordering for custom quotes
- Designed a RESTful backend using Vercel Serverless Functions (Node.js) with Supabase PostgreSQL database and Row-Level Security policies
- Built a full admin panel with Supabase Auth for managing products, orders, leads, inventory, and generating printable invoices
- Created a product customization wizard with photo upload, text engraving, size/material selection, and live preview
- Handled graceful degradation — orders save locally if database is unavailable, with automatic sync when reconnected
- Generated dynamic QR codes for website, WhatsApp, and product catalog with PNG download support

**Tech**: JavaScript (ES6+), Node.js, Supabase (PostgreSQL + Auth + Storage), Razorpay, EmailJS, Vercel Serverless, HTML5/CSS3

---

## 2. Project Overview

A full-featured e-commerce website for Sasi Arts & Photo Frames, a personalized gift store specializing in custom photo frames, LED frames, acrylic gifts, moon lamps, pencil sketches, and blood art.

**Live URL**: https://sasiarts.in

**Key Metrics**:
- 22 sample products across 17 categories
- 15 database tables
- 1654 lines of frontend JavaScript
- 820 lines of admin panel logic
- 1582 lines of CSS
- Dual payment system (Razorpay + WhatsApp)

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript ES6+ | UI rendering, state management, DOM manipulation |
| **Backend** | Node.js — Vercel Serverless Functions | Payment processing, shipping calculation |
| **Database** | Supabase (PostgreSQL) | Persistent storage with RLS security |
| **Authentication** | Supabase Auth (email/password) | Admin panel login |
| **File Storage** | Supabase Storage | Product images, user photo uploads |
| **Payments** | Razorpay Standard Checkout | Online card/UPI/netbanking payments |
| **Email** | EmailJS | Admin invoice notifications |
| **Hosting** | Vercel | Static site + serverless functions + CDN |
| **QR Codes** | qrcode.js (CDN) | Dynamic QR code generation |
| **Icons** | Font Awesome 6.5 | UI icons throughout |
| **Fonts** | Google Fonts — Playfair Display + Poppins | Typography |
| **Messaging** | WhatsApp Business API (wa.me) | Order inquiries and custom quotes |

---

## 4. Architecture & Flow

### 4.1 Overall Architecture

```
                    ┌─────────────────────────────────┐
                    │      User's Browser              │
                    │  index.html + CSS + JS           │
                    │  (Single Page Application)        │
                    └──────────┬──────────────────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
            ▼                  ▼                       ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐
    │   Supabase    │ │  Vercel API   │ │   Third-Party     │
    │   (DB + Auth  │ │  Serverless   │ │   Services        │
    │    + Storage) │ │  Functions    │ │                   │
    └───────────────┘ └───────────────┘ │ • Razorpay       │
            │                 │         │ • EmailJS        │
            │                 │         └───────────────────┘
            ▼                 ▼
    ┌───────────────┐ ┌───────────────┐
    │ PostgreSQL    │ │ /api/razorpay │
    │ 15 tables     │ │ -order.js     │
    │ RLS policies  │ │ /api/shipping │
    └───────────────┘ │ .js           │
                      └───────────────┘
```

### 4.2 Payment Flow (Razorpay)

```
User adds products to cart
        │
        ▼
Opens delivery form → enters name, phone, address, pincode
        │
        ▼
Shipping calculated via /api/shipping (pincode-based) or local fallback
        │
        ▼
GST (₹23.33 fixed) added to total
        │
        ▼
User submits → Frontend calls POST /api/razorpay-order { action: "create" }
        │
        ▼
Server creates Razorpay order using key_secret (env var) → returns order_id
        │
        ▼
Razorpay Checkout modal opens (key_id from config.js)
        │
        ▼
User pays via UPI / Card / NetBanking
        │
        ▼
On success → Frontend calls POST /api/razorpay-order { action: "verify" }
        │
        ▼
Server validates HMAC SHA256 signature
        │
        ▼
If verified:
  ├── Order saved to Supabase (orders + order_items)
  ├── Order saved to localStorage (redundancy)
  ├── Cart cleared
  ├── Admin invoice email sent via EmailJS
  └── Toast shown with Order ID
```

### 4.3 Data Flow

```
Page Load
    │
    ▼
Load PRODUCTS from:
  ├── localStorage.getItem('adminProducts') → if exists, merge with SAMPLE_PRODUCTS
  └── Else → copy of SAMPLE_PRODUCTS from data.js
    │
    ▼
Async loadProductsFromDB() → calls Supabase
  └── If DB has products → merge (DB overrides) → save to localStorage → re-render
    │
    ▼
renderAll() → renders all sections:
  ├── Categories
  ├── Art Services
  ├── Builder Categories
  ├── Homepage Products (Best Sellers)
  ├── Gallery
  ├── Reviews
  ├── Cart UI
  ├── Wishlist UI
  ├── WhatsApp Kart UI
  ├── Today's Deal
  └── QR Codes
```

---

## 5. File-by-File Breakdown

### Root Directory

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 792 | Main storefront — all UI sections in one SPA |
| `.env` | — | Razorpay environment variables (local dev) |
| `DEPLOYMENT.md` | — | Deployment guide for Supabase + Vercel |

### Frontend JavaScript

| File | Lines | Purpose |
|------|-------|---------|
| `js/config.js` | 52 | Store info, API keys, URLs, categories |
| `js/data.js` | 64 | 22 sample products, 10 gallery items, 6 reviews, category icons |
| `js/app.js` | 1654 | All frontend logic — state, rendering, cart, payment, tracking |
| `js/supabase.js` | 254 | Supabase REST client (CRUD + storage upload) |

### Backend API (Vercel Serverless)

| File | Lines | Purpose |
|------|-------|---------|
| `api/razorpay-order.js` | 55 | Create + verify Razorpay payments |
| `api/shipping.js` | 44 | Pincode-based shipping calculator |
| `api/package.json` | — | Dependencies (razorpay ^2.9.0) |

### Admin Panel

| File | Lines | Purpose |
|------|-------|---------|
| `admin/index.html` | 297 | Admin dashboard UI |
| `admin/js/admin.js` | 820 | CRUD, order management, auth, offers |
| `admin/css/admin.css` | 188 | Admin panel styles |

### Database

| File | Lines | Purpose |
|------|-------|---------|
| `database/schema.sql` | 315 | 15 PostgreSQL tables + RLS policies |
| `database/storage.sql` | 14 | Supabase Storage bucket setup |

### Styles

| File | Lines | Purpose |
|------|-------|---------|
| `css/style.css` | 1582 | Complete storefront styles |

---

## 6. Features

### Customer-Facing Features
1. **Product Catalog** — 22 products across 17 categories with search, sort, filter
2. **Product Customization Wizard** — 3-step: Category → Product → Upload photo + text + font + size + material
3. **Photo Upload** — Drag & drop or file picker, preview, uploads to Supabase Storage
4. **Shopping Cart** — localStorage-based with quantity controls
5. **Dual Checkout** — Razorpay (card/UPI/netbanking) OR WhatsApp order
6. **WhatsApp Kart** — Separate drawer for WhatsApp-only ordering
7. **Wishlist** — Heart toggle on product cards
8. **Today's Deal** — Dynamic offer with countdown timer (from Supabase)
9. **Order Tracking** — By Order ID, 5-step status tracker
10. **Art Services** — Custom Pencil Sketch (online) + Blood Art (WhatsApp)
11. **Customer Reviews** — Star rating + text, saved to Supabase
12. **QR Codes** — Dynamic QR for website, WhatsApp, catalog (downloadable PNG)
13. **Lead Capture** — 10% off popup after 8 seconds
14. **Corporate Inquiry** — Bulk order form with GST option
15. **Gift Reminders** — Birthday/anniversary subscription
16. **Newsletter** — Email subscription
17. **SEO** — Meta tags, Open Graph, geo tags, canonical URL
18. **Mobile Responsive** — Hamburger dropdown, responsive grids, scroll animations

### Admin Panel Features (11 Tabs)
1. **Dashboard** — Stats (orders, revenue, leads, products, rating, subscribers)
2. **Products** — CRUD with image upload to Supabase Storage
3. **Orders** — View all, update status, generate printable invoice/bill
4. **Customers** — Derived from orders data
5. **Leads** — View + CSV export
6. **Loyalty** — Points/tier tracking
7. **Offers** — Today's Deal management (syncs to Supabase)
8. **Campaigns** — WhatsApp campaign sender
9. **Reminders** — Gift reminder subscriptions
10. **Corporate** — Corporate inquiry management
11. **Best Sellers** — Toggle bestseller status

---

## 7. Interview Questions

### Architecture & Design

**Q: Why no JavaScript framework (React/Vue)?**
A: The site is primarily a static e-commerce storefront with simple interactivity. Vanilla JavaScript avoids bundle overhead, reduces complexity, and enables faster load times. For a small-mid size e-commerce site, frameworks add unnecessary complexity. The code is organized into logical modules (config, data, supabase, app) which provides adequate separation of concerns.

**Q: How is state managed across the application?**
A: State is managed via a `state` object in JavaScript (`js/app.js:16-22`) that holds cart, wishlist, WhatsApp Kart items, orders, and recently viewed products. Every mutation calls `saveState(key)` which syncs to `localStorage`. This provides persistence across page refreshes. For cloud persistence, orders are also saved to Supabase.

**Q: Why dual payment paths (Razorpay + WhatsApp)?**
A: Razorpay handles secure online card/UPI/netbanking payments for standard orders. WhatsApp Kart serves customers who prefer personal assistance, need custom quotes, want to pay on delivery, or are ordering complex custom products (like blood art). This dual approach maximizes conversion by catering to different customer preferences.

**Q: How does the product data pipeline work?**
A: On page load, products are initialized from `SAMPLE_PRODUCTS` in `data.js`. Then an async call to Supabase's `products` table runs — if database products exist, they're merged (DB overrides same IDs, sample products fill gaps). The merged result is saved to `localStorage` as `adminProducts` and used for rendering. Admin panel edits also save to Supabase, creating a full CRUD cycle.

**Q: How is mobile responsiveness handled?**
A: CSS media queries at 768px breakpoint. Navigation becomes a dropdown from a hamburger icon. Product grid switches from 4-column to 2-column to 1-column. Admin tables get horizontal scroll (`overflow-x: auto`). The invoice overlay uses `max-width: 95vw` with reduced padding on small screens.

### Security

**Q: How are payments secured from fraud?**
A: The Razorpay `key_secret` is stored exclusively as a Vercel environment variable — never in frontend code. Payment signature verification happens server-side using HMAC SHA256: `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`. This ensures only legitimate payments from Razorpay are accepted, even if someone modifies the frontend JavaScript.

**Q: How is admin access secured?**
A: Admin login uses Supabase Auth with email/password. The JWT session token is stored in `sessionStorage` (not `localStorage` — cleared when tab closes). All API calls to Supabase include the auth token in the `Authorization` header. Database RLS policies enforce `auth.role() = 'authenticated'` for admin-only operations.

**Q: How is user data protected?**
A: Supabase RLS policies restrict access — anonymous users can only INSERT into orders/leads/reminders tables and SELECT from products/categories. They cannot read other users' orders or data. Admin operations require authentication.

**Q: How are file uploads secured?**
A: Supabase Storage bucket `products` has RLS policies: public INSERT (anyone can upload), public SELECT (anyone can view), admin-only UPDATE and DELETE. File size limited to 10MB, only image MIME types accepted.

### Performance

**Q: How is performance optimized for a site with no framework?**
A: Lazy loading images (`loading="lazy"` attribute), IntersectionObserver for scroll-triggered animations (reduces initial render work), cache-busting via version query params (`?v=8`), minimal third-party dependencies (only Razorpay, EmailJS, QRCode.js — all loaded from CDN), no framework bundle overhead.

**Q: How is browser caching handled?**
A: JavaScript and CSS files loaded with `?v=N` query parameter — incremented on each deployment to force browser refresh. A `CACHE_VERSION` constant in `app.js` auto-clears stale `localStorage` product data. Vercel CDN caches static assets automatically.

**Q: What happens when Supabase is unavailable?**
A: Graceful degradation throughout — products fall back to `data.js` samples, orders save to `localStorage` with Supabase as primary, admin invoice email failure is caught and logged (order still completes), shipping calculation falls back to client-side estimation.

### Business Logic

**Q: How does shipping cost calculation work?**
A: Pincode-based — origin is Rajanagaram (533294). The API at `api/shipping.js` maps destination pincode to distance zones: local (₹50), East Godavari (₹100), Andhra nearby (₹120), Telangana/Rayalaseema (₹150), Karnataka (₹200), Tamil Nadu/Kerala (₹220), other states/North India (₹250), North-East (₹250). If API fails, client-side fallback uses the same logic.

**Q: How does order tracking work?**
A: Orders are assigned an ID format `ORD-` + `Date.now().toString(36).toUpperCase()` (timestamp in base-36). The tracking page looks up by ID — first in `localStorage` (`state.orders`), then in Supabase. Status has 5 steps: Placed (0) → Processing (1) → Production (2) → Shipped (3) → Delivered (4). Admin updates the status via a dropdown in the admin panel.

**Q: How are orders saved when the user has no internet?**
A: Orders are always saved to `localStorage` as a fallback (`state.orders` + `saveState('orders')`). After internet reconnection, Supabase save is attempted. The tracking system checks localStorage first, then Supabase — so locally-saved orders remain trackable.

---

## 8. Coding Challenges & Solutions

### Challenge 1: Razorpay Server-Side Signature Verification
**Problem**: Payment verification must happen server-side to prevent fraud, but the API needs to work with Razorpay's Node.js SDK.
**Solution**: 
```javascript
// api/razorpay-order.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Create order
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const order = await razorpay.orders.create({ amount, currency });

// Verify payment
const hash = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(razorpay_order_id + '|' + razorpay_payment_id)
  .digest('hex');
const verified = hash === razorpay_signature;
```

### Challenge 2: Supabase RLS Policy Violations (42501)
**Problem**: Anonymous users trying to insert orders received "new row violates row-level security policy".
**Solution**: Added public INSERT policies to allow anonymous order creation:
```sql
CREATE POLICY "Public insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert" ON leads FOR INSERT WITH CHECK (true);
```
Also added public SELECT for order tracking:
```sql
CREATE POLICY "Public select" ON orders FOR SELECT USING (true);
CREATE POLICY "Public select" ON order_items FOR SELECT USING (true);
```

### Challenge 3: EmailJS 422 Unprocessable Content
**Problem**: Admin invoice emails failed with 422 because the EmailJS template expected variables not being sent, and the "To Email" field was empty.
**Solution**: Added `image_url` parameter to template params with the first item's image. Set recipient email directly in the EmailJS template instead of using `{{to_email}}`. Template variables must exactly match what EmailJS expects.

### Challenge 4: Vercel Toolbar (Black Floating Button)
**Problem**: Vercel injects a black circular toolbar button on deployed sites.
**Solution**: Three-layer defense:
1. CSS: `display: none` on known Vercel selectors
2. MutationObserver: Watches DOM for injected toolbar elements and hides them
3. setInterval: Periodic polling as backup (every 500ms)
Also configurable via Vercel Dashboard → Project Settings → Vercel Toolbar → Disabled.

### Challenge 5: Relative Image Paths Breaking in Admin Panel
**Problem**: Product images referenced as `images/photo.jpg` resolved to `/admin/images/photo.jpg` from the admin subdirectory.
**Solution**: Created helper function:
```javascript
function adminImg(src) { 
  return src && src.startsWith('images/') ? '../' + src : src; 
}
```
Used in admin panel rendering: `<img src="${adminImg(p.image)}">`

### Challenge 6: Browser Cache After Code Updates
**Problem**: Users see old cached JavaScript after deployment.
**Solution**: Cache-busting version number on script tags (`?v=8`). Auto-detection of stale `localStorage` admin product data via `CACHE_VERSION` constant — if mismatch, clears and reloads.

### Challenge 7: Mobile Slide-in Menu Not Working
**Problem**: The slide-in navigation panel from the left was broken on mobile.
**Solution**: Replaced with a dropdown menu from a hamburger icon (three horizontal lines) in the top-left of the header. Links close the dropdown on click. Scroll also auto-closes the dropdown.

---

## 9. Database Schema

### Tables (15 total)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `products` | id, name, category, price, image, rating, stock, bestSeller, is_active | Product catalog |
| `categories` | id, name, icon | Category management |
| `customers` | id, name, email, phone, total_orders | Customer profiles |
| `leads` | id, name, email, phone, source, created_at | Lead capture |
| `orders` | id, customer_name, customer_email, phone, address, city, state, pincode, subtotal, shipping, tax, total, status, payment_id, payment_status | Order management |
| `order_items` | id, order_id, product_name, product_price, quantity, customization, image | Order line items |
| `reviews` | id, product_id, name, rating, text, created_at | Customer reviews |
| `loyalty_members` | id, name, phone, points, tier, referrals | Loyalty program |
| `campaigns` | id, name, type, recipients, sent_count, status | WhatsApp campaigns |
| `birthday_reminders` | id, name, phone, date, recipient_name | Birthday reminders |
| `anniversary_reminders` | id, name, phone, date, recipient_name | Anniversary reminders |
| `corporate_orders` | id, company_name, contact_person, email, phone, product_interest, quantity, budget, needs_gst | Corporate inquiries |
| `offers` | id, title, description, price, old_price, stock, image, active, expires_at | Today's deals |
| `wishlists` | id, customer_id, product_id | Customer wishlists |
| `newsletter_subscribers` | id, email, subscribed_at | Newsletter subscriptions |

### Row-Level Security Policies
- **Public SELECT**: products, categories, offers
- **Public INSERT**: leads, orders, order_items, corporate_orders, newsletter_subscribers, birthday_reminders, anniversary_reminders
- **Public SELECT**: orders, order_items (for tracking)
- **Admin ALL**: products, offers, categories, customers, leads (requires `auth.role() = 'authenticated'`)
- **Admin SELECT/UPDATE**: orders, order_items

---

## 10. Deployment Guide

### Prerequisites
1. Supabase project (free tier)
2. Razorpay account (live or test mode)
3. EmailJS account (free tier)
4. Vercel account (free tier)
5. GitHub repository

### Steps
1. **Push code to GitHub**
2. **Set up Supabase**:
   - Create project
   - Run `database/schema.sql` in SQL Editor
   - Run `database/storage.sql` in SQL Editor
   - Get Project URL and anon key from Settings → API
3. **Set up Razorpay**:
   - Get Key ID and Key Secret from Razorpay Dashboard → Settings → API Keys
4. **Set up EmailJS**:
   - Create email service and template
   - Get Service ID, Template ID, Public Key
5. **Configure `js/config.js`**:
   - Update `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - Update `RAZORPAY_KEY_ID`
   - Update `EMAILJS_*` values
   - Update `API_BASE_URL` to your Vercel domain
   - Update `ADMIN_EMAIL`
6. **Vercel Deployment**:
   - Connect GitHub repo to Vercel
   - Add environment variables:
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
   - Deploy
7. **Custom Domain** (optional):
   - Add domain in Vercel Dashboard
   - Configure DNS records

### Environment Variables (Vercel)
| Variable | Value |
|----------|-------|
| `RAZORPAY_KEY_ID` | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | `...` |

---
