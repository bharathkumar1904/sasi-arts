# Sasi Arts & Photo Frames - Deployment Guide

## Quick Deploy (Netlify / Vercel)

1. Upload all files to your hosting provider
2. Point your domain (e.g., sasiarts.in)
3. Update `js/config.js` with your keys

## Step-by-Step Setup

### 1. Supabase Database (Backend)

1. Create account at https://supabase.com
2. Create a new project
3. Go to SQL Editor and paste `database/schema.sql` - Run it
4. Copy your Supabase URL and anon key from Settings > API

### 2. Supabase Storage (Image Storage)

1. Run `database/storage.sql` in Supabase SQL Editor to create the storage bucket
2. Images will be stored in your Supabase project automatically

### 3. Razorpay (Payments)

1. Register at https://razorpay.com
2. Get your Key ID from Settings > API Keys
3. Use test keys for development, live keys for production

### 4. Configure `js/config.js`

```javascript
SUPABASE_URL: 'https://your-project.supabase.co',
SUPABASE_ANON_KEY: 'your-anon-key',
RAZORPAY_KEY_ID: 'rzp_live_your_key',
SITE_URL: 'https://sasiarts.in'
```

### 5. WhatsApp Integration

- Update `WHATSAPP_NUMBER` in config.js (with country code)
- The floating button and all WhatsApp links will automatically work

### 6. File Structure

```
sasi-arts/
├── index.html          # Main homepage
├── admin/
│   ├── index.html      # Admin dashboard
│   ├── css/admin.css
│   └── js/admin.js
├── css/
│   └── style.css       # Main styles
├── js/
│   ├── config.js       # Configuration
│   ├── data.js         # Sample data
│   ├── app.js          # Main application
│   └── supabase.js     # Database layer
├── database/
│   └── schema.sql      # Database schema
└── DEPLOYMENT.md       # This file
```

### 7. Features Working Out-of-Box

- Product catalog with categories
- Photo upload & live preview
- Shopping cart (localStorage)
- Wishlist (localStorage)
- Order tracking (localStorage)
- Lead capture popup (localStorage)
- WhatsApp integration
- QR code generation
- Corporate inquiry form
- Gift reminder system
- Customer reviews
- Admin dashboard
- Search functionality

### 8. For Production

1. Set up custom domain
2. Enable HTTPS
3. Add Google Analytics
4. Submit to Google Business Profile
5. Set up Google Search Console
6. Add sitemap.xml
7. Configure email notifications
8. Set up automated WhatsApp campaigns
9. Regular database backups

### 9. SEO Checklist

- [ ] Update meta tags in index.html
- [ ] Submit sitemap to Google
- [ ] Set up Google Business Profile
- [ ] Add product schema markup
- [ ] Enable Core Web Vitals optimization
- [ ] Add alt text to all images
- [ ] Set up Open Graph tags (done)
- [ ] Add structured data for products

---

## Support

For deployment assistance: WhatsApp +91 8106545049
