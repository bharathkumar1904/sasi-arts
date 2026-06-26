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
11. Beginner-Friendly Concepts for Interviews
12. Complete File Reference (Current State)
13. Quick Reference Cards

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

## 7. Interview Questions (Technical)

*For beginner-friendly concepts and broader interview prep, see [Section 11](#11-beginner-friendly-concepts-for-interviews)*

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

## 11. Beginner-Friendly Concepts for Interviews

### 11.1 What is a Server, Frontend, and Backend? (The Restaurant Analogy)

Think of a **restaurant**:

| Concept | Restaurant Analogy | Real World |
|---------|-------------------|------------|
| **Frontend** | The menu, the dining table, the waiter taking your order — what you see and interact with | HTML, CSS, JavaScript in the browser — the UI, buttons, forms, animations |
| **Backend** | The kitchen — where the chef prepares your food, checks inventory, processes payments | Server-side code (Node.js, Python, etc.) — handles logic, database, payments |
| **Server** | The entire restaurant building — the physical place where everything runs | A computer/cloud instance that hosts both frontend files and backend code |

**Frontend** = What the user sees and clicks (browser code: HTML/CSS/JS). Runs on the *user's device*.

**Backend** = The hidden logic (database queries, payment processing, authentication). Runs on a *server computer somewhere else*.

**Server** = The computer that stores files, runs backend code, and sends responses to the browser.

**In Sasi Arts:**
- **Frontend**: `index.html`, `css/style.css`, `js/app.js` — all run in your browser
- **Backend**: `api/razorpay-order.js`, `api/shipping.js` — run on Vercel's servers
- **Server**: Vercel's cloud infrastructure (AWS Lambda under the hood)

---

### 11.2 React vs Vite vs Plain HTML/CSS/JS

#### What each is:

| Technology | What it is | Analogy |
|-----------|-----------|---------|
| **Plain HTML/CSS/JS** | Raw web building blocks — no tools, no frameworks, just the browser's native languages | Building a house brick by brick with your bare hands |
| **React** | A JavaScript library for building interactive UIs. Uses components (reusable pieces like `<Navbar>`, `<ProductCard>`). Automatically updates the page when data changes | A power tool set — drills, saws, measuring tapes — that make building faster but require learning how to use them |
| **Vite** | A build tool that bundles code for production. Not a framework — it's like a "compiler" that optimizes your code for the browser | A factory assembly line that takes raw materials and produces finished, packaged goods |

#### Key Differences:

```
                    Plain HTML/CSS/JS                  React + Vite
                    ──────────────                     ──────────
Code Structure:     Multiple files linked              Components (JSX files)
                    via <script> tags                  that include markup + logic

Re-rendering:       Manual DOM manipulation            Automatic — React detects
                    (document.getElementById)          changes and updates only
                    You do everything yourself          what's needed

State Management:   Manual (variables,                 Built-in (useState, useReducer)
                    localStorage reads/writes)          + context/redux

Performance:        Faster initial load                Slower initial load (bundle size)
                    Slower for complex apps             Faster updates (virtual DOM)

Build Step:         None — files served as-is           Required — Vite bundles + minifies

SEO:                Better — search engines             Worse — content rendered by JS
                    can read raw HTML                   (needs SSR/Next.js to fix)

Learning Curve:     Minimal — just HTML/CSS/JS          Steeper — JSX, hooks, state, build tools
```

#### When to use what:

- **Plain HTML/CSS/JS** — Small sites (1-10 pages), simple interactivity, SEO-critical pages, when you want full control and minimal dependencies. **Sasi Arts uses this** because it's a small-mid e-commerce site with ~17 product categories and simple interactions.

- **React** — Large apps with complex state (like Facebook, Instagram), real-time updates, reusable component libraries, team of developers.

- **Vite** — Always paired with React/Vue/Svelte. Never used alone. It provides hot module replacement (instant updates during development) and optimized production builds.

#### Drawbacks of using React for Sasi Arts:

1. **Over-engineering** — A 1700-line vanilla JS file would become multiple React components across many files with state management complexity
2. **SEO problems** — Google can index React but products loaded via API calls might not be crawled properly
3. **Slower initial load** — React bundle (even minified ~40KB) + dependencies vs zero framework overhead
4. **Build step** — Every change requires `npm run build` before deploy
5. **Learning curve** — The store owner (non-developer) needs to understand React to make simple changes

---

### 11.3 Why Build a Full-Stack Website with a Framework (React) Instead of Plain HTML/CSS?

#### Advantages of frameworks (React, Vue, Angular):

| Aspect | Plain HTML/CSS/JS | With Framework (React) |
|--------|------------------|----------------------|
| **Code Reuse** | Copy-paste HTML for each product card | Create one `<ProductCard>` component, reuse everywhere |
| **Dynamic Updates** | Find element by ID, change innerHTML | Just update a variable, React re-renders automatically |
| **Team Work** | Everyone touches same files | Components are isolated — teams work independently |
| **Scaling** | Code becomes spaghetti at ~5000 lines | Clean architecture scales to 100,000+ lines |
| **Mobile Apps** | Build separate app | React Native shares logic |
| **Ecosystem** | Manual everything | Router, state management, form libraries available |

#### Disadvantages of frameworks:

| Aspect | Problem |
|--------|---------|
| **Bundle Size** | React is ~40KB compressed — big for slow connections |
| **SEO** | Single-page apps need server-side rendering (Next.js) for good SEO |
| **Build Time** | Every change needs a build step |
| **Complexity** | State management, routing, build tools overwhelm beginners |
| **Overkill** | A simple site with 5 pages doesn't need React |
| **Lock-in** | Hard to switch frameworks later |

#### The Verdict:

> **For simple sites** (portfolio, small business, brochure) → Plain HTML/CSS/JS is best
> **For medium sites** (e-commerce with complex state, dashboards) → React/Vue is worth it
> **For large apps** (social media, SaaS, real-time collaboration) → Framework is essential

**Sasi Arts is on the border** — it works fine with vanilla JS (1648 lines is manageable). A React version would be cleaner but wouldn't increase revenue or performance.

---

### 11.4 Deployment vs Hosting

People often confuse these. They're two different things:

```
Hosting = Owning/renting the land
Deployment = Building the house on that land
```

| Concept | Definition | Analogy | Examples |
|---------|-----------|---------|----------|
| **Hosting** | Where your website files live — the server/storage that serves them to visitors | Renting an apartment where your stuff is stored | Vercel, Netlify, AWS, Hostinger, GoDaddy |
| **Deployment** | The process of uploading/publishing your code so it's live on the hosting | Moving your furniture into the apartment | `git push`, FTP upload, Vercel auto-deploy from GitHub |

#### Types of Hosting:

```
                    Hosting Types
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Shared Hosting    VPS (Virtual      Cloud/Serverless
   ($2-10/month)     Private Server)   (Pay per use)
        │                │                │
   • Many sites on     • You get a      • Code runs in
     one server          dedicated VM     functions (on demand)
   • Cheapest          • Full control   • Auto-scales
   • Slow, limited     • Need to set    • Pay only for
                        up everything     what you use
                     • $5-50/month     • Free tier available
```

**Sasi Arts uses**: Vercel (Cloud/Serverless hosting) — **FREE**

#### Deployment Methods:

| Method | How It Works | Used For |
|--------|-------------|----------|
| **Git-based** | Push to GitHub → auto-deploys (Vercel, Netlify) | Modern web apps |
| **FTP** | Upload files via FileZilla to hosting server | Old-school shared hosting |
| **Manual** | Upload ZIP through hosting dashboard | Beginners |
| **CI/CD** | Automated pipelines with tests before deploy (GitHub Actions, Jenkins) | Enterprise apps |

**Sasi Arts uses**: Git-based deployment (GitHub → Vercel auto-deploy)

---

### 11.5 CSS vs Tailwind CSS

#### What is CSS?
Cascading Style Sheets — the language that makes websites look good.

```css
/* Traditional CSS */
.button {
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
}
```

#### What is Tailwind CSS?
A CSS framework that provides pre-built utility classes. Instead of writing custom CSS, you use small classes directly in HTML.

```html
<!-- Tailwind CSS — no custom CSS needed -->
<button class="bg-blue-500 text-white px-5 py-2.5 rounded text-base">
  Click me
</button>
```

#### Key Comparison:

| Aspect | Traditional CSS | Tailwind CSS |
|--------|----------------|-------------|
| **How it works** | Write custom styles in `.css` files | Apply pre-built utility classes in HTML |
| **File size** | Only what you write (~10KB for small site) | Base is large (~800KB) but purged for production (~10KB) |
| **Learning** | Learn CSS properties — applies anywhere | Learn Tailwind class names — vendor-specific |
| **Consistency** | Manual — can accidentally use different margins/colors | Design system built-in — consistent spacing, colors |
| **HTML readability** | Clean HTML, separate CSS | HTML is long with many classes |
| **Custom designs** | Easy — write any CSS you want | Must configure `tailwind.config.js` for custom values |
| **Frameworks** | Works with everything | Requires build step (PostCSS) + Tailwind CLI |
| **Beginners** | Need to learn CSS anyway | Need to learn CSS *and* Tailwind class names |
| **Debugging** | Check CSS file, find the selector | Check HTML, find the long class list |
| **Team work** | CSS conflicts, specificity wars | No conflicts — classes are scoped to elements |

#### When to use:

- **Traditional CSS** — Small sites, when you want full control, beginners learning
- **Tailwind CSS** — Large projects with design teams, need for consistency, rapid prototyping

**Sasi Arts uses**: Traditional CSS (1582 lines in `css/style.css`). Tailwind would require a build tool setup (PostCSS/NPM) which adds complexity without benefit for a small project.

---

### 11.6 Does Sasi Arts Use a Server? Can It Handle Lots of Traffic?

#### Yes and No — It Depends on What "Server" Means:

**For static files** (HTML, CSS, JS, images):
- NO traditional server — files are served by **Vercel's CDN** (Content Delivery Network)
- CDN = 100+ servers worldwide, each caching copies of your files
- Result: Can handle **millions of visitors** for static content — same as big sites like Amazon for their static assets

**For API calls** (payment processing, database writes):
- YES — Vercel Serverless Functions run on **AWS Lambda** (Amazon's cloud)
- Each API call spins up a tiny server, processes the request, then shuts down
- AWS Lambda auto-scales — more traffic = more servers spin up automatically

**For database** (Supabase/PostgreSQL):
- YES — Supabase runs on dedicated PostgreSQL servers
- Free tier: 500MB database, 2 CPU cores, limited connections
- Can handle ~100-200 concurrent users reading/writing

#### Traffic Handling Breakdown:

| Component | How It Handles Traffic | Limits |
|-----------|----------------------|--------|
| **HTML/CSS/JS files** | Vercel CDN — cached globally, serves from nearest location | Virtually unlimited (CDN scale) |
| **Product images** | Served from Supabase Storage (CDN) | Free: 1GB storage, 10GB bandwidth |
| **Razorpay payments** | Handled by Razorpay's servers, not yours | Unlimited — Razorpay processes millions daily |
| **API calls** (`/api/*`) | Vercel Serverless (AWS Lambda) | Free: 100GB-hours, 10s execution per call |
| **Database queries** | Supabase PostgreSQL (single server) | Free: 500MB, 2 CPU, 60 req/sec |
| **Concurrent users** | Limited by the weakest link (database) | ~100-200 users (realistic for free tier) |

#### Can Sasi Arts Handle a Viral Traffic Spike?

| Scenario | Can it handle? | Why |
|----------|---------------|-----|
| 100 visitors/day | ✅ Easily | Sleeps through it |
| 1,000 visitors/day | ✅ Yes | Vercel free tier handles millions of requests |
| 10,000 visitors/day | ⚠️ Maybe | Static files fine, but database queries might slow down |
| 100,000 visitors/day | ❌ Upgrade needed | Need Supabase Pro ($25/month) for more DB connections |
| Going viral on Instagram | ⚠️ Risky | Static part fine, but checkout flow might timeout |

**Bottleneck**: The **database** (Supabase free tier) is always the weakest link. The frontend (Vercel CDN) can handle anything.

**For a small business** (10-50 orders/day): ✅ Completely fine.

---

### 11.7 Additional Expected Interview Questions

#### Q: How does the browser know what to show when someone types "sasiarts.in"?
**A**: 
1. Browser asks DNS (phonebook of the internet) — "Where is sasiarts.in?"
2. DNS says "It's hosted on Vercel's servers at IP address 76.76.21.21"
3. Browser connects to Vercel's CDN at that IP
4. Vercel sends back `index.html`
5. Browser reads the `<script>` tags and downloads `config.js`, `data.js`, `app.js`
6. Browser runs the JavaScript — builds the page dynamically

#### Q: What happens if the database goes down during a payment?
**A**: Graceful degradation:
1. Payment succeeds (Razorpay confirms)
2. Order saves to `localStorage` (browser storage)
3. Toast shows "Order confirmed"
4. When database comes back, re-sync attempt happens on next load
5. Customer can still track the order from localStorage
6. Admin sees the order on next Supabase sync

#### Q: Can a customer order without internet?
**A**: No — they need internet to load the page and pay. But if internet drops *during* checkout:
- Cart items are in `localStorage` (survive refresh)
- Payment attempt times out gracefully
- Customer can retry when connected

#### Q: How are product prices stored — strings or numbers? Why?
**A**: Numbers (integers). Prices are stored in **paise** (Indian currency smallest unit). `₹499` = `49900` paise. This avoids floating-point arithmetic errors (0.1 + 0.2 ≠ 0.3 in JavaScript). Only converted to rupees for display: `(price / 100).toFixed(2)`.

#### Q: What's the difference between `localStorage`, `sessionStorage`, and cookies?
**A**:
| Storage | Persists | Scope | Size | Used for |
|---------|----------|-------|------|----------|
| `localStorage` | Until manually deleted | All tabs/windows | 5-10MB | Cart, orders, products (Sasi Arts) |
| `sessionStorage` | Until tab closes | Single tab | 5-10MB | Admin auth token (Sasi Arts) |
| Cookies | Per expiry | Sent with every HTTP request | 4KB | Session IDs, tracking |

#### Q: How does caching work in this project?
**A**: Three layers:
1. **Browser cache** — `?v=12` on script URLs forces fresh download when deployed
2. **localStorage cache** — Products saved in browser's localStorage to avoid reloading from Supabase every time
3. **CDN cache** — Vercel caches static files globally near users. Updated on each deploy

#### Q: What is HMAC SHA256 and why is it used?
**A**: HMAC = Hash-based Message Authentication Code. It's a way to verify that a message (payment data) came from Razorpay and wasn't tampered with. SHA256 creates a unique fingerprint of the data. The server creates its own fingerprint using the secret key and compares it with Razorpay's fingerprint. If they match, the payment is authentic.

#### Q: How would you make this site a Progressive Web App (PWA)?
**A**: Add:
1. `manifest.json` — defines app name, icon, theme color
2. Service Worker — intercepts network requests, caches files offline
3. HTTPS (already done via Vercel)
4. `<link rel="manifest">` in `index.html`
This lets users "install" the site on their phone and browse products offline.

#### Q: What would you change if this project had 100,000 products?
**A**: 
1. **Pagination/server-side rendering** — loading 100K products in browser would crash
2. **Search database** — PostgreSQL full-text search instead of JS filter
3. **React/Vue** — Virtual scrolling and state management at scale
4. **Dedicated server** — Vercel serverless has 10s timeout, need dedicated instance
5. **Database indexing** — Speed up queries with proper indexes
6. **Redis cache** — Cache popular products/queries to reduce DB load
7. **Supabase Pro** — More connections, read replicas

#### Q: Why is the admin panel a separate HTML file instead of a hidden section?
**A**: 
1. **Security** — Unauthenticated users never load admin JS code
2. **Performance** — Admin panel JS (820 lines) doesn't load on the main site
3. **Separation of concerns** — Admin panel has different styles, logic, features
4. **Simplicity** — No need for route guards or auth checks on the main site

#### Q: What is Row-Level Security (RLS) in Supabase?
**A**: RLS is a database security feature that restricts which rows a user can see/modify. Think of it like a bouncer at a club:
- Anonymous users can only INSERT (add to cart) and SELECT specific tables
- Only authenticated admins can see all orders, update products, delete data
- Rules are defined in PostgreSQL at the table level — cannot be bypassed even from the frontend

---

## 12. Complete File Reference (Current State)

### 12.1 File Sizes & Metrics

| File | Lines | Size | Last Updated |
|------|-------|------|-------------|
| `index.html` | 792 | ~28KB | June 2026 |
| `css/style.css` | 1582 | ~45KB | June 2026 |
| `js/app.js` | 1648 | ~55KB | June 2026 |
| `js/config.js` | 52 | ~2KB | June 2026 |
| `js/data.js` | 64 | ~3KB | June 2026 |
| `js/supabase.js` | 254 | ~8KB | June 2026 |
| `admin/index.html` | 297 | ~10KB | June 2026 |
| `admin/js/admin.js` | 820 | ~30KB | June 2026 |
| `admin/css/admin.css` | 188 | ~5KB | June 2026 |
| `api/razorpay-order.js` | 55 | ~2KB | June 2026 |
| `api/shipping.js` | 44 | ~1.5KB | June 2026 |
| `api/package.json` | — | — | June 2026 |

**Total**: ~190KB of code (≈190 pages of text)

### 12.2 Dependency Count

| Dependency | Type | Size (CDN) | Required? |
|-----------|------|-----------|-----------|
| Razorpay Checkout | Payment | ~100KB | Yes — payments |
| EmailJS | Email | ~15KB | Yes — admin invoices |
| Font Awesome 6.5 | Icons | ~10KB | Yes — UI icons |
| Google Fonts (Playfair + Poppins) | Typography | ~15KB | Yes — design |
| QR Server API | QR Codes | 0 (external API) | Yes — QR generation |

**Total external**: ~140KB loaded on first visit

---

## 13. Quick Reference Cards

### Card 1: Tech Stack at a Glance
```
Frontend:  HTML5 + CSS3 + Vanilla JS (no frameworks)
Backend:   Node.js (Vercel Serverless Functions)
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth
Storage:   Supabase Storage (product images, user uploads)
Payments:  Razorpay (card/UPI/netbanking)
Email:     EmailJS
Hosting:   Vercel (static + serverless + CDN)
Domain:    sasiarts.in
```

### Card 2: Request Flow
```
Browser ──GET──▶ Vercel CDN ──index.html──▶ Browser
  │                                              │
  │────GET /api/razorpay-order────▶ Vercel Lambda
  │                                       │
  │◀───────── response ────────────────────┘
  │                                              │
  │────POST ────▶ Razorpay (payment) ────▶ callback
  │                                              │
  │────INSERT──▶ Supabase (order save) ────▶ done
```

### Card 3: Key Numbers
```
Products:       22 (17 categories)
Gallery items:  10
Database tables: 15
API endpoints:   2
CSS lines:      1,582
JS lines:       1,648
Admin JS lines: 820
Cache version:  4
Current v tag:  12
```

---
