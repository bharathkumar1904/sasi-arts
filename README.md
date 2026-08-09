A production-grade online store for a personalized gift shop — custom photo
frames, LED frames, acrylic gifts, keychains, wedding gifts — with online
payment processing, admin automation, and WhatsApp order flow.
**Live:** http://sasiarts.website/ · **Demo:** https://sasi-arts.vercel.app

## Key Highlights
- **Real Payments** — Razorpay orders + server-side HMAC-SHA256 signature
  verification (via Vercel serverless function) for fraud-proof transactions
- **Dual Checkout** — Online payments AND WhatsApp-based ordering with
  automatic custom-quote flow
- **39+ Table PostgreSQL Backend** — Full relational schema with
  Row-Level-Security policies (products, orders, reviews, reminders,
  corporate orders, wishlists)
- **Admin Panel** — Supabase-Auth-protected admin UI for products, orders,
  inventory, lead pipeline, printable invoices
- **Offline-first UX** — local-then-sync data layer keeps cart/orders working
  even when the database is unreachable
- **Direct B2C tools** — QR code generator, birthday/anniversary gift
  reminders, corporate inquiry pipeline, loyalty memberships

## Tech Stack
(Table: Frontend; Backend Serverless; Database; Auth; Storage; Payments;
 Emails; QR; WhatsApp; SEO/Hosting)

## Architecture
Browser (SPA) → Vercel Edge/(static) → Serverless Functions
(/api/razorpay-order, /api/shipping, /api/supabase-proxy)
→ Supabase Postgres + Storage (RLS) + Auth  |  Razorpay, EmailJS, WhatsApp, qrcode.js

## API Endpoints
| Endpoint | Action | Description |
| POST /api/razorpay-order {action:create} | create Razorpay order |
| POST /api/razorpay-order {action:verify} | verify signature (HMAC) |
| POST /api/shipping | pincode → shipping zone + charge |
| POST /api/supabase-proxy | REST relay (bypasses CORS) |

## Database Schema — 19 tables at a glance (products, categories, customers, leads, orders, order_items, reviews, corporate_orders, offers, wishlists …) with RLS summary.

## Getting Started
Setup config.js → Supabase project → run schema.sql + storage.sql → add
EmailJS/Razorpay keys as env vars (Vercel) → deploy.
## Deployment
Vercel static + serverless; custom domain + CDN; SEO package (sitemap,
robots, Open Graph, Google Analytics).
## Security Notes
- secret stored only server-side (env vars)
- RLS for public tables
- opinionated CORS on serverless functions
## Roadmap (B2B bulk orders, inventory alerts, subscription coupons …)
## Author 
