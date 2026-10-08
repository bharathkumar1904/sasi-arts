# Sasi Arts – Project Presentation (10 Slides) + Viva Q&A

- **Live site:** https://sasi-arts.vercel.app/
- **GitHub:** https://github.com/bharathkumar1904/sasi-arts
- **Custom domain:** sasiarts.website

Design: 16:9, Poppins SemiBold 36pt titles, Inter 20pt body,
primary `#FF6B00`, gold `#D4AF37`, dark `#1A1A2E`, white background.
Max 5 bullets per slide, max 12 words per bullet.
Screenshots referenced from `docs/screenshots/`.

---

## Slide 1 – Title

**Sasi Arts – Personalized Gifts E-Commerce Platform**

- Sasi Arts & Photo Frames – Rajanagaram, Rajahmundry
- [Your Name] | Roll No: [ ] | Guide: [ ]
- Department of [ ] | [College Name]
- Live: https://sasi-arts.vercel.app/
- Code: https://github.com/bharathkumar1904/sasi-arts

*Layout:* full-width title, links at bottom, no screenshot.

---

## Slide 2 – Problem Statement & Objectives

**Problem**

- Local gift shops have no online storefront
- Orders handled manually over phone/WhatsApp
- No tool for customers to customize designs
- No central record of orders, customers, offers

**Objectives**

- Online catalog with search, sort and categories
- Custom text, size, material and photo on products
- Online payment + WhatsApp order fallback
- Admin dashboard to manage the whole business

*Layout:* two columns (Problem | Objectives), no screenshot.

---

## Slide 3 – Proposed Solution

- Static, fast storefront deployed on Vercel
- Supabase (PostgreSQL) as the database with RLS
- Razorpay for secure online payments
- 3 serverless functions for payments, shipping, DB proxy
- Full admin panel for products, orders, invoices, leads

*Screenshot:* `01-home-page.png` (right half)

---

## Slide 4 – System Architecture

Draw with shapes (boxes + arrows), text version:

```
        Customer Browser                    Admin Browser
        (index.html +                      (admin/index.html)
         js/app.js, css/style.css)                |
                 |                                |
                 v                                v
        +------------------------------------------------+
        |            VERCEL (static hosting)            |
        |      + 3 Serverless Functions in /api         |
        +------------------------------------------------+
           |                |                  |
           v                v                  v
   razorpay-order.js   shipping.js     supabase-proxy.js
   (create + verify)   (pincode slab)  (REST /rest/v1/)
           |                                  |
           v                                  v
      Razorpay API                      Supabase
      key_id + key_secret               (PostgreSQL + Auth + RLS)
                                             |
                                             v
                                  15 tables (products, orders, ...)

   External services: Delhivery tracking, EmailJS invoices, WhatsApp deep link
```

**Flow:** Browser → `/api/razorpay-order` → Razorpay order created →
user pays → server verifies HMAC-SHA256 signature → order row written to
Supabase with RLS "Public insert" → admin updates status → invoice emailed.

*Note:* architecture diagram drawn with shapes, no screenshot.

---

## Slide 5 – Tech Stack

| Layer | Technology | Why chosen |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JS | No build step, 64-file repo, instant deploy |
| Theme/Config | `js/config.js` | Change colors, prices, links without touching logic |
| Database | Supabase (PostgreSQL) | Managed Postgres + Auth + Row Level Security free tier |
| Security | Supabase RLS policies | Public read / public insert / admin write enforced in DB |
| Backend | Vercel Serverless (`/api`) | No server to manage; scales to zero when idle |
| Payments | Razorpay (`razorpay` npm) | Indian gateway, UPI/cards, server-side signature verify |
| Shipping | `shipping.js` pincode slabs | Deterministic cost, no carrier quote API dependency |
| Courier | Delhivery tracking API | Order tracking for customers |
| Email | EmailJS | Invoice mail from browser/serverless without SMTP server |
| Hosting | Vercel + CNAME | Free HTTPS, custom domain, cache headers in `vercel.json` |

*Layout:* full table, no screenshot.

---

## Slide 6 – Database Design

**15 tables:** products, categories, customers, leads, orders, order_items,
reviews, loyalty_members, campaigns, birthday_reminders, anniversary_reminders,
corporate_orders, offers, wishlists, newsletter_subscribers

**Row Level Security model (`database/schema.sql`):**

| Policy | Tables | Effect |
|---|---|---|
| Public read | products, categories, offers | Anyone can browse |
| Public insert | leads, orders, order_items, newsletter, reminders, corporate | Anyone can submit |
| Public select | orders | Order tracking by ID |
| Admin all | products, offers, categories | Full CRUD for admin |
| Admin select | orders | Admin sees all orders |

*ER sketch:* categories 1—* products; orders 1—* order_items *—1 products;
customers 1—* orders; customers 1—* reviews.

*Note:* ER diagram drawn with shapes, no screenshot.

---

## Slide 7 – Module 1: Storefront & Customization

- Category grid: Frames, LED, Acrylic, Keychains, Wedding, Art
- Search, sort, price filter, reviews, wishlist
- Customization modal: custom text, size, material, photo upload
- Config-driven colors, prices and WhatsApp number

*Screenshot:* `08-product-customize-modal.png` (right half)

---

## Slide 8 – Module 2: Cart, Shipping & Payment

- Cart drawer with live totals; free shipping above ₹499
- Shipping by pincode slab: ₹50 local → ₹250 nationwide
- Razorpay checkout: create order → pay → verify
- Payment signature verified server-side:

```js
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(razorpay_order_id + '|' + razorpay_payment_id)
  .digest('hex');
if (expected !== razorpay_signature) return res.status(400).json({ verified: false });
```

- Fallback: WhatsApp order with prefilled cart message

*Screenshot:* `14-shopping-cart-checkout.png` (right half)

---

## Slide 9 – Module 3: Admin Panel

- Supabase Auth login; no password stored in frontend
- 11 sections: dashboard, products, orders, customers, leads,
  loyalty, campaigns, reminders, corporate, bestsellers, offers
- Add / edit / delete products, update order status
- Tax invoice & delivery challan generation, CSV export
- Order status pushed to customer tracking page

*Screenshot:* `16-admin-dashboard.png` (right half), `18-admin-invoice.png` (small inset)

---

## Slide 10 – Results, Deployment & Future Scope

**Deployed**

- Live: https://sasi-arts.vercel.app/ (sasiarts.website)
- Code: https://github.com/bharathkumar1904/sasi-arts (64 files)
- 3 serverless APIs, 15 DB tables, 11 admin modules, 21 screenshots

**Future scope**

- Coupon engine & abandoned-cart recovery
- Razorpay webhooks for automatic payment reconciliation
- Multi-vendor onboarding and delivery OTP handover
- PWA offline catalog + admin mobile view

*Screenshot:* `13-all-products.png` (right half), `10-track-order-qr.png` (inset)

---
---

# Viva / Interview Q&A (25)

## (a) Architecture — 3

**A1. Why a static frontend + serverless instead of React/Next.js?**
*Short:* The catalog is read-heavy and content-driven; static HTML on Vercel is faster, cheaper and needs no build pipeline.
*Deep:* Next.js adds hydration, bundling and build time for little gain when pages are already server-generated by admin. Vanilla JS + CDN caching gives near-zero TTFB. Serverless `/api` handles the only dynamic parts (payments, shipping, DB proxy), so we scale compute only when a request actually needs it. Trade-off accepted: no component reuse — mitigated by `js/data.js`/`config.js` as the single source of truth.

**A2. Why three separate API files?**
*Short:* Each has a different dependency and blast radius — `razorpay` SDK only loads on payment routes.
*Deep:* Vercel packages each function independently, so `razorpay-order.js` bundles the Razorpay SDK while `shipping.js` stays dependency-free and cold-starts instantly. It also keeps secrets scoped: only the payment function needs `RAZORPAY_KEY_SECRET`. A single monolith handler would ship all dependencies on every invocation.

**A3. How does the browser talk to Supabase without exposing data?**
*Short:* Through the anon key plus Row Level Security — the database itself enforces what each key may read or write.
*Deep:* The browser calls the Supabase REST endpoint (directly or via `/api/supabase-proxy`). RLS policies in `schema.sql` run server-side inside Postgres: anonymous sessions get `SELECT` on products/categories/offers, `INSERT` on orders/leads/newsletter, and no `DELETE` or cross-user `SELECT` on orders except by order ID. The anon key is safe to publish precisely because policies — not the key — are the real gate.

## (b) Security — 4

**B1. Why must `RAZORPAY_KEY_SECRET` stay on the server?**
*Short:* Anyone with the secret could forge payment signatures and mark unpaid orders as paid.
*Deep:* `key_secret` is the shared secret used for HMAC. If it ships in client JS, a user can open DevTools, extract it, and generate valid signatures for any order — effectively paying nothing while your database records success. It is set only as a Vercel environment variable and read inside the serverless function.

**B2. What does HMAC-SHA256 signature verification actually prevent?**
*Short:* It proves Razorpay really processed that specific payment — the client cannot invent a success.
*Deep:* Razorpay returns `razorpay_order_id | razorpay_payment_id`; the server recomputes `HMAC(key_secret, order_id + "|" + payment_id)` and compares with `razorpay_signature`. Because only the server knows the secret, a forged or tampered pair produces a different digest. Constant-time comparison would harden it further against timing attacks.

**B3. What does the Supabase anon key expose?**
*Short:* It identifies your project, not a user — RLS still decides every row's visibility.
*Deep:* The anon key is a JWT with role `anon`; it is meant to be public. Without RLS it would allow full table access, which is why every table has explicit policies: public read only on catalog tables, insert-only on transaction tables, admin policies gated on the authenticated role from Supabase Auth. Storage buckets are similarly limited to admin upload.

**B4. Why is passing the API key in query params (in the proxy) acceptable?**
*Short:* It carries the public anon key over HTTPS, and the comment says it dodges mobile-carrier POST-body stripping.
*Deep:* Query strings survive proxies that rewrite bodies, which was a real failure on some Indian carriers. Risk: URLs get logged in CDN/access logs. Mitigations: it is only the anon key (not a secret), traffic is HTTPS-only, and the function whitelists `path`/`method` before forwarding so it can't be used as an open relay to arbitrary hosts.

## (c) Database — 3

**C1. Explain public-read vs admin-all policies.**
*Short:* Reads are open for browsing; writes are split so only the authenticated admin can mutate catalog data.
*Deep:* `Public read` on products/categories/offers lets anonymous visitors browse. `Public insert` on orders/leads lets checkout work without login. `Admin all` on the same catalog tables means updates require a session whose JWT role is `admin` — enforced inside Postgres, so even a leaked anon key cannot alter prices.

**C2. How would you stop a user deleting another user's order?**
*Short:* RLS already denies public `DELETE` on `orders`; add a `USING (auth.uid() = customer_id)` policy for owners.
*Deep:* Today only admins hold delete rights. If self-service deletion is added, scope it with a row filter comparing `auth.uid()` to the row's owner, and validate the order ID format to avoid enumeration attempts. Also add an index on `customer_id` so the policy's subquery stays fast.

**C3. SQL: top 5 selling products this month.**
```sql
SELECT p.id, p.name, SUM(oi.quantity) AS sold
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.created_at >= date_trunc('month', now())
GROUP BY p.id, p.name
ORDER BY sold DESC
LIMIT 5;
```
*Deep:* Performance: index `orders(created_at)` and `order_items(order_id, product_id)`; the join is a hash join at this scale. At millions of rows you'd pre-aggregate into a `daily_product_sales` rollup and read from that instead of scanning `order_items` monthly.

## (d) Payments — 3

**D1. Difference between order create and payment verify?**
*Short:* Create reserves an amount with Razorpay; verify cryptographically confirms the money actually moved.
*Deep:* `orders.create({amount, currency, receipt})` returns `order_id` with status `created`. The checkout widget then captures payment and returns `payment_id` + `signature`. Our `verify` action recomputes the HMAC — only this step should mark the order `paid`. Skipping verify means trusting a client-controlled success page.

**D2. User closes the tab after paying but before verify?**
*Short:* Payment succeeds at Razorpay while our DB stays unpaid — fixed by webhooks + a reconciliation job.
*Deep:* Handle `payment.captured` on a webhook endpoint, look up by `razorpay_order_id`, flip status, then notify the customer. Add a nightly reconciliation that queries Razorpay for orders stuck in `created` beyond N minutes. Client-side `verify` becomes an optimisation rather than the source of truth.

**D3. How would you make verify idempotent?**
*Short:* Key on `razorpay_payment_id` and return the stored result on repeat calls.
*Deep:* Use `INSERT ... ON CONFLICT (razorpay_payment_id) DO UPDATE` guarded by status, or a unique constraint plus `RETURNING`, so retries never double-fulfil. Webhook handlers should also store an event ID to ignore replays. Amount must be re-validated server-side against the DB order total — never trust the client's amount field.

## (e) APIs — 3

**E1. Why pincode-range shipping instead of a carrier quote API?**
*Short:* Flat slabs give predictable, instant pricing with zero external dependency at checkout.
*Deep:* `shipping.js` maps origin 533294 to slabs (₹50 local, ₹100 East Godavari, ₹120 AP, ₹150 Telangana, ₹200–250 other states) — deterministic and offline-testable. Real-time carrier quotes need weight/dimensions per SKU and add latency/uptime risk. Later: merge both — slabs as fallback, live quote when available.

**E2. Delhivery integration points?**
*Short:* Tracking URL + AWB on the order row, rendered on the customer tracking page.
*Deep:* `DELHIVERY_API_URL: track.delhivery.com` is configured for shipment status lookup. The flow: admin marks order shipped and stores AWB → customer enters order ID → app queries status → displays courier milestones. Add polling with `AbortController` timeouts so a slow carrier API can't hang the page.

**E3. CORS handling — why `Access-Control-Allow-Origin: *`?**
*Short:* The storefront and API share a domain, but `*` keeps preflight simple for any origin calling the functions.
*Deep:* Each handler answers `OPTIONS` with 200 and sets allow-methods/headers explicitly — that's the CORS preflight contract. Because responses carry only non-credentialed public data (anon key, catalog), `*` is safe here. For admin-only endpoints, restrict the origin to `https://sasi-arts.vercel.app` and drop `*`.

## (f) Frontend / Performance — 2

**F1. Is vanilla JS viable at this size?**
*Short:* Yes — 84KB of `app.js` plus 4KB of data, no framework runtime, no build step.
*Deep:* The app is mostly DOM rendering, fetch calls and state in localStorage; a framework would add 30–100KB of runtime for little benefit. The cost is discipline: manual DOM diffing and no reactivity, so we keep a single `state` object and explicit render functions. Break-even point for React would be complex cross-page state and team growth.

**F2. What does `vercel.json` caching achieve?**
*Short:* HTML is never cached (so deploys are instant) while `js/` and `css/` revalidate on every load.
*Deep:* `Cache-Control: no-cache, no-store` on `index.html` and `admin/index.html` prevents stale shells after a push. `public, max-age=0, must-revalidate` on assets means browsers always re-check with a 304 — correct when filenames aren't content-hashed. If we add hashed filenames, switch assets to `max-age=31536000, immutable` for a real CDN win.

## (g) DevOps — 2

**G1. How do environment variables work on Vercel?**
*Short:* Set in the project dashboard per environment; read only inside functions via `process.env`.
*Deep:* `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are declared for Production and Preview, never committed — `.gitignore` excludes `.env`. Preview deployments get separate values so test payments never hit live money. Rotating a key is a dashboard edit plus redeploy, no code change.

**G2. How would you add CI/linting?**
*Short:* GitHub Actions running ESLint + a smoke test, with Vercel preview deploy on every PR.
*Deep:* A workflow on `push`/`pull_request`: `npm ci` → `eslint .` → headless Playwright checks that home, cart and admin login render. Add a small Jest suite pinning `getShippingCharge()` slabs and Razorpay signature verification. Protect `main` with required checks so a broken push can't reach `sasi-arts.vercel.app`.

## (h) Coding — 4

**H1. `fetch` with status + error handling**
```js
async function fetchApi(path, options = {}) {
  try {
    const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
```
*Points to mention:* never use `res.json()` without checking `res.ok`; returning a result object instead of throwing keeps UI code simple.

**H2. Razorpay signature verify (server)**
```js
const crypto = require('crypto');
const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
const verified = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
```
*Points:* the repo uses `===`; mention `timingSafeEqual` as the hardened version and the length guard it requires.

**H3. Supabase query with filters**
```js
const { data, error } = await supabase
  .from('orders')
  .select('id, total, status, created_at, order_items(*)')
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
  .limit(20);
```
*Points:* nested select is a PostgREST embed; RLS still applies; `.single()` vs array; error must be checked.

**H4. Pincode shipping function**
```js
function getShippingCharge(dest, subtotal) {
  if (subtotal >= 499) return { charge: 0, note: 'Free shipping above ₹499' };
  if (dest >= 533000 && dest <= 534999) return { charge: dest === 533294 ? 50 : 100, note: 'East Godavari' };
  if (dest >= 530000 && dest <= 539999) return { charge: 120, note: 'Andhra Pradesh' };
  return { charge: 250, note: 'Other states' };
}
```
*Points:* pure function = trivially unit-testable; validate pincode length before using; slabs come from `shipping.js` local pincode list.

## (i) Behavioural — 2

**I1. Your exact contribution?**
*Short:* Full-stack: frontend storefront and admin panel, Supabase schema with RLS, 3 Vercel serverless functions, Razorpay integration, deployment.
*Deep:* Be ready to quote numbers: 64 files, ~210KB JS, 15 tables, 11 admin sections, 21 screenshots. Name one thing you'd do differently — e.g. split `app.js` into modules earlier, or add tests before the payment flow.

**I2. How would you scale to 10k orders/day?**
*Short:* Move hot reads to cache, add webhooks for async payment status, and index `orders(created_at)` + `order_items(order_id)`.
*Deep:* Add a CDN cache for catalog responses, queue invoice emails so checkout isn't blocked, introduce a payment webhook + idempotency keys, and monitor Supabase connection limits — with PostgREST pooling or a read replica. Shard `order_items` by month once it outgrows a single scan, and move reporting to a materialised view.

---
*Honesty rule: do not claim React, TypeScript, unit tests, CI/CD, or offline AI — none exist in this repo.*
