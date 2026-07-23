// ===== PRODUCT DATA SOURCE (data.js base, localStorage overlay) =====
let PRODUCTS = [...SAMPLE_PRODUCTS];;
function applyAdminEdits() {
  const stored = localStorage.getItem('adminProducts');
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored).map(p => ({ ...p, bestSeller: p.is_best_seller || p.bestSeller }));
    const deletedIds = new Set(parsed.filter(p => p._deleted).map(p => p.id));
    PRODUCTS = PRODUCTS.filter(p => !deletedIds.has(p.id));
    const map = new Map(PRODUCTS.map(p => [p.id, p]));
    parsed.filter(p => !p._deleted).forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
    PRODUCTS = Array.from(map.values());
  } catch(e) {}
}

function safeGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
}
const state = {
  cart: safeGet('sasiCart', []),
  wishlist: safeGet('sasiWishlist', []),
  wkItems: safeGet('sasiWKItems', []),
  orders: safeGet('sasiOrders', []),
  viewedProducts: safeGet('sasiRecent', [])
};

function saveState(key) {
  try {
    localStorage.setItem(`sasi${key.charAt(0).toUpperCase() + key.slice(1)}`, JSON.stringify(state[key]));
  } catch(e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage full. Auto-cleaning...');
      // Step 1: remove junk keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && !k.startsWith('sasi')) localStorage.removeItem(k);
      }
      localStorage.removeItem('supabaseProducts');
      localStorage.removeItem('adminProducts');
      // Step 2: trim orders to last 10 (they hold image data)
      if (state.orders && state.orders.length > 10) {
        state.orders = state.orders.slice(-10);
        try { localStorage.setItem('sasiOrders', JSON.stringify(state.orders)); } catch(e3) {}
      }
      try {
        localStorage.setItem(`sasi${key.charAt(0).toUpperCase() + key.slice(1)}`, JSON.stringify(state[key]));
      } catch(e2) {
        showToast('Storage full. Clear browser data.', 'error');
      }
    } else {
      console.warn('saveState error:', e);
    }
  }
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = type === 'success' ? '✅' : '❌';
  toast.className = `toast show ${type}`;
  toast.innerHTML = `<span class="icon">${icon}</span> ${message}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== INIT =====
function renderAll() {
  const products = PRODUCTS;
  try { renderCategories(); } catch(e) { console.warn('renderCategories error:', e); }
  try { renderArtServices(); } catch(e) { console.warn('renderArtServices error:', e); }
  try { renderBuilderCategories(); } catch(e) { console.warn('renderBuilderCategories error:', e); }
  try { renderHomepageProducts(); } catch(e) { console.warn('renderHomepageProducts error:', e); }
  try { renderGallery(); } catch(e) { console.warn('renderGallery error:', e); }
  try { renderReviews(); } catch(e) { console.warn('renderReviews error:', e); }
  try { updateCartUI(); } catch(e) { console.warn('updateCartUI error:', e); }
  try { updateWishlistUI(); } catch(e) { console.warn('updateWishlistUI error:', e); }
  try { updateWKUI(); } catch(e) { console.warn('updateWKUI error:', e); }
  try { loadTodaysDeal(); } catch(e) { console.warn('loadTodaysDeal error:', e); }
  try { generateQRs(); } catch(e) { console.warn('generateQRs error:', e); }
  try { initScrollAnimations(); } catch(e) { console.warn('initScrollAnimations error:', e); }
  try { initUploadZone(); } catch(e) { console.warn('initUploadZone error:', e); }
}

document.addEventListener('DOMContentLoaded', () => {
  // Cache buster — force refresh if sample products changed
  const CACHE_VERSION = dataHash();
  if (localStorage.getItem('sasiCacheVersion') !== CACHE_VERSION) {
    localStorage.removeItem('adminProducts');
    localStorage.removeItem('supabaseProducts');
    localStorage.setItem('sasiCacheVersion', CACHE_VERSION);
  }
  // Load cached Supabase data immediately (so shop shows DB products on first click)
  const cached = JSON.parse(localStorage.getItem('supabaseProducts') || '[]');
  if (cached.length) {
    const map = new Map(PRODUCTS.map(p => [p.id, p]));
    cached.forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
    PRODUCTS = Array.from(map.values());
  }
  applyAdminEdits();
  renderAll();

  loadOfferFromSupabase().catch(() => {});

  loadProductsFromDB().then(dbProducts => {
    if (dbProducts && dbProducts.length > 0) {
      // Merge Supabase products with local ones — preserve bestseller, oldPrice, etc.
      const dbMapped = dbProducts.map(p => ({
        ...p,
        oldPrice: p.old_price || p.oldPrice,
        reviews: p.reviews_count || p.reviews || 0,
        bestSeller: p.is_best_seller === true || p.bestSeller === true,
        is_active: p.is_active !== false
      }));
      // Keep local products not in DB (e.g. fallback samples) and merge DB ones
      const localMap = new Map(PRODUCTS.map(p => [p.id, p]));
      dbMapped.forEach(p => {
        const existing = localMap.get(p.id);
        // Preserve local bestSeller flag (admin may have toggled it) and local customizations
        if (existing) {
          localMap.set(p.id, { ...p, bestSeller: existing.bestSeller, is_best_seller: existing.is_best_seller, is_active: existing.is_active !== false });
        } else {
          localMap.set(p.id, p);
        }
      });
      PRODUCTS = Array.from(localMap.values());
      // Admin edits win over Supabase
      applyAdminEdits();
      // Save to a separate cache for admin panel view
      try { localStorage.setItem('supabaseProducts', JSON.stringify(PRODUCTS)); } catch(e) {
        for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && !k.startsWith('sasi') && k !== 'adminProducts') localStorage.removeItem(k); }
        try { localStorage.setItem('supabaseProducts', JSON.stringify(PRODUCTS)); } catch(e2) { console.warn('supabaseProducts cache skipped (quota):', e2.message); }
      }
      renderAll();
      // Re-render shop page if it's currently open (so Supabase products appear immediately)
      const shopPage = document.getElementById('shop-page');
      if (shopPage && shopPage.style.display === 'block') {
        renderShopProducts(PRODUCTS, shopCurrentCategory);
      }
    }
  }).catch(e => console.warn('Supabase load failed, using sample data:', e.message));

  setTimeout(() => {
    if (!localStorage.getItem('leadPopupShown')) {
      const popup = document.getElementById('leadPopup');
      if (popup) popup.classList.add('active');
    }
  }, 8000);
});

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const els = document.querySelectorAll('.section-header, .product-card, .category-card, .review-card, .deal-content, .gallery-item');
  els.forEach(el => {
    if (!el.classList.contains('section-header')) el.classList.add('animate-on-scroll');
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ===== SHOP PAGE (full-screen catalog) =====
let shopCurrentProducts = [];
let shopCurrentCategory = '';

function openShop(category, searchQuery) {
  document.getElementById('shop-page').style.display = 'block';
  document.body.style.overflow = 'hidden';
  // Populate category filter dropdown
  const catFilter = document.getElementById('shopCategoryFilter');
  if (catFilter) {
    const cats = CONFIG.PRODUCT_CATEGORIES.filter(c => PRODUCTS.some(p => p.category === c));
    catFilter.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c}" ${category === c ? 'selected' : ''}>${c}</option>`).join('');
  }
  if (searchQuery) {
    document.getElementById('shopSearch').value = searchQuery;
    shopSearchProducts(searchQuery);
  } else {
    renderShopProducts(PRODUCTS, category || '');
  }
}

function closeShop() {
  document.getElementById('shop-page').style.display = 'none';
  document.body.style.overflow = '';
  shopCurrentCategory = '';
}

function renderShopProducts(products, category) {
  shopCurrentProducts = products;
  shopCurrentCategory = category || '';
  const grid = document.getElementById('shopProductsGrid');
  const filtered = category ? products.filter(p => p.category === category) : products;
  document.getElementById('shopTitle').textContent = category || 'All Products';

  // Populate category chips
  const chipsEl = document.getElementById('shopCategoryChips');
  const chips = CONFIG.PRODUCT_CATEGORIES.filter(c => products.some(p => p.category === c));
  chipsEl.innerHTML = `<span class="shop-chip ${!category ? 'active' : ''}" onclick="renderShopProducts(shopCurrentProducts,'')">All</span>` +
    chips.map(c => `<span class="shop-chip ${category === c ? 'active' : ''}" onclick="renderShopProducts(shopCurrentProducts,'${c}')">${c}</span>`).join('');

  // Render products
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-500);"><i class="fas fa-box-open" style="font-size:4rem;display:block;margin-bottom:16px;color:var(--gray-300);"></i><h3 style="margin:0 0 8px;color:var(--gray-600);">No products found</h3><p style="margin:0;font-size:14px;">Try a different category or browse all products</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
}

function getOfferTotal(item) {
  if (!item) return 0;
  const price = Number(item.price) || 0;
  const qty = Number(item.qty) || 0;
  if (item.offer && item.offer.qty && item.offer.price && qty >= item.offer.qty) {
    const sets = Math.floor(qty / item.offer.qty);
    const rem = qty % item.offer.qty;
    return sets * Number(item.offer.price) + rem * price;
  }
  return price * qty;
}

function renderProductCard(p) {
  const inWishlist = state.wishlist.includes(p.id);
  const badges = p.badge ? `<span class="badge badge-${p.badge}">${p.badge === 'best' ? '⭐ Best Seller' : p.badge === 'sale' ? '🔥 Sale' : '🆕 New'}</span>` : '';
  const pOld = p.oldPrice && p.oldPrice > 0 ? p.oldPrice : 0;
  const discount = pOld ? Math.round((1 - p.price / pOld) * 100) : 0;
  const allInclusive = p.allInclusive ? '<span style="font-size:11px;display:block;color:#22C55E;font-weight:500;">✅ All inclusive (GST + shipping)</span>' : '';
  const offerBadge = p.offer && p.offer.qty && p.offer.price ? `<span class="badge badge-sale" style="background:#FF6B00;font-size:11px;">${p.offer.qty} for ₹${p.offer.price}</span>` : '';
  const customizableBadge = p.customizable ? '<span class="badge" style="background:#8B5CF6;font-size:11px;">✨ Customizable</span>' : '';
  const priceDisplay = p.whatsappOnly ? '<span style="font-size:13px;color:var(--gray-500);">Contact for price</span>' :
    `<span class="current">&#8377;${Number(p.price).toLocaleString()}</span>${allInclusive}`;
  const actions = p.whatsappOnly ? `
    <button class="btn btn-whatsapp btn-sm" onclick="orderBloodArt(${p.id})" style="width:100%;justify-content:center;"><i class="fab fa-whatsapp"></i> Order via WhatsApp</button>
  ` : `
    <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})"><i class="fas fa-shopping-cart"></i> Add</button>
    <button class="btn btn-whatsapp btn-sm" onclick="addToWK(${p.id})"><i class="fab fa-whatsapp"></i> WhatsApp</button>
  `;
  return `
    <div class="product-card">
      <div class="image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onclick="openProductModal(${p.id})">
        <div class="badges">${badges}${customizableBadge}</div>
        <button class="wishlist-btn" onclick="toggleWishlistItem(${p.id})" title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
          <i class="fas fa-heart" style="color:${inWishlist ? '#FF4444' : ''}"></i>
        </button>
      </div>
      <div class="info">
        <div class="category-tag">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="rating">
          <span class="stars">${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? '½' : ''}</span>
          <span class="count">(${p.reviews})</span>
        </div>
        <div class="price">
          ${priceDisplay}
          ${p.oldPrice ? `<span class="old">&#8377;${Number(p.oldPrice).toLocaleString()}</span><span class="discount">${discount}% OFF</span>` : ''}
        </div>
        <div class="actions">
          ${actions}
        </div>
      </div>
    </div>
  `;
}

function orderBloodArt(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const msg = `Hi Sasi Arts! I'm interested in Blood Art service.\n\n*Service:* ${p.name}\n*Category:* ${p.category}\n\nPlease share details, pricing, and delivery time. I'd like to place an order.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Opening WhatsApp for Blood Art inquiry');
}

function shopSearchProducts(query) {
  const q = query.toLowerCase().trim();
  const source = shopCurrentProducts && shopCurrentProducts.length ? shopCurrentProducts : PRODUCTS;
  if (!q) { renderShopProducts(source, shopCurrentCategory); return; }
  const filtered = source.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q))
  );
  const grid = document.getElementById('shopProductsGrid');
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-500);"><i class="fas fa-search" style="font-size:4rem;display:block;margin-bottom:16px;color:var(--gray-300);"></i><h3 style="margin:0 0 8px;color:var(--gray-600);">No results found</h3><p style="margin:0;font-size:14px;">No products match "${q}". Try a different search term.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
  document.getElementById('shopTitle').textContent = `Search: "${q}" (${filtered.length})`;
  // Reset category filter
  document.getElementById('shopCategoryFilter').value = '';
  document.getElementById('shopSortFilter').value = '';
}

function shopSortProducts(method) {
  let sorted = [...shopCurrentProducts];
  if (method === 'price-low') sorted.sort((a, b) => Number(a.price) - Number(b.price));
  else if (method === 'price-high') sorted.sort((a, b) => Number(b.price) - Number(a.price));
  else if (method === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  renderShopProducts(sorted, shopCurrentCategory);
  document.getElementById('shopSortFilter').value = method;
}

function shopFilterByCategory(category) {
  document.getElementById('shopSearch').value = '';
  shopCurrentCategory = category || '';
  document.getElementById('shopSortFilter').value = '';
  if (category) {
    const filtered = shopCurrentProducts.filter(p => p.category === category);
    const grid = document.getElementById('shopProductsGrid');
    document.getElementById('shopTitle').textContent = category;
    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--gray-500);"><i class="fas fa-box-open" style="font-size:4rem;display:block;margin-bottom:16px;color:var(--gray-300);"></i><h3 style="margin:0 0 8px;color:var(--gray-600);">No products found</h3><p style="margin:0;font-size:14px;">Try a different category</p></div>`;
      return;
    }
    grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
    // Update chips highlight
    document.querySelectorAll('.shop-chip').forEach(chip => {
      chip.classList.toggle('active', chip.textContent === category);
    });
  } else {
    renderShopProducts(shopCurrentProducts, '');
  }
}

// ===== ART SERVICES SECTION =====
function renderArtServices() {
  const grid = document.getElementById('artServicesGrid');
  if (!grid) return;
  const sketchArt = PRODUCTS.find(p => p.category === 'Sketch Art' && p.customizable);
  const bloodArt = PRODUCTS.find(p => p.category === 'Blood Art');
  grid.innerHTML = `
    <div class="art-service-card animate-on-scroll">
      <div class="preview">
        <img src="${sketchArt ? sketchArt.image : 'images/WhatsApp Image 2026-06-21 at 12.23.35 PM.jpeg'}" alt="Sketch Art">
        <span class="overlay-badge sketch">✏️ Sketch Art</span>
      </div>
      <div class="body">
        <h3>Custom Pencil Sketch Portrait</h3>
        <p>Transform your photo into a beautiful hand-drawn pencil sketch. Perfect for birthdays, anniversaries, weddings, and memorials. High-quality A4/A3 size on premium paper.</p>
        <div class="price-tag">₹1,500 <small>All inclusive</small></div>
        <div class="features">
          <span><i class="fas fa-check-circle"></i> Hand-drawn by professional artists</span>
          <span><i class="fas fa-check-circle"></i> Upload photo & customize online</span>
          <span><i class="fas fa-check-circle"></i> GST & Shipping included</span>
          <span><i class="fas fa-check-circle"></i> Delivery in 5-7 business days</span>
        </div>
        <button class="btn btn-primary btn-lg" onclick="openSketchCustomizer()"><i class="fas fa-shopping-cart"></i> Book Online & Customize</button>
      </div>
    </div>
    <div class="art-service-card animate-on-scroll">
      <div class="preview">
        <img src="${bloodArt ? bloodArt.image : 'images/WhatsApp Image 2026-06-21 at 12.17.46 PM.jpeg'}" alt="Blood Art">
        <span class="overlay-badge blood">🎨 Blood Art</span>
      </div>
      <div class="body">
        <h3>Custom Blood Art Portrait</h3>
        <p>Unique and meaningful blood art portraits created using your blood sample. A deeply personal and symbolic art form. Each piece is one-of-a-kind and handled with utmost care.</p>
        <div class="price-tag">Contact for Price</div>
        <div class="features">
          <span><i class="fas fa-check-circle"></i> Custom portrait using blood art technique</span>
          <span><i class="fas fa-check-circle"></i> Completely safe & hygienic process</span>
          <span><i class="fas fa-check-circle"></i> Unique, personalized art piece</span>
          <span><i class="fas fa-check-circle"></i> Dispatched in 7-10 business days</span>
        </div>
        <button class="btn btn-lg" onclick="orderBloodArtDirect()" style="width:100%;justify-content:center;background:#25D366;color:#fff;"><i class="fab fa-whatsapp"></i> Inquire via WhatsApp</button>
      </div>
    </div>
  `;
}

function orderBloodArtDirect() {
  const msg = `Hi Sasi Arts! I'm interested in your Blood Art service. Please share details, pricing, and how to send the blood sample. I'd like to place an order.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openSketchCustomizer() {
  const sketch = PRODUCTS.find(p => p.category === 'Sketch Art' && p.customizable);
  if (!sketch) { showToast('Sketch Art products coming soon!', 'error'); return; }
  openProductModal(sketch.id);
  document.querySelector('#productModal .modal-actions')?.scrollIntoView({ behavior: 'smooth' });
}

// ===== HOMEPAGE CATEGORIES =====
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  grid.innerHTML = CONFIG.PRODUCT_CATEGORIES.map(cat => `
    <div class="category-card animate-on-scroll" onclick="openShop('${cat}')">
      <span class="icon">${CATEGORY_ICONS[cat] || '🎁'}</span>
      <span class="name">${cat}</span>
    </div>
  `).join('');
}

// ===== HOMEPAGE PRODUCTS (best-sellers only) =====
function renderHomepageProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  let bestSellers = PRODUCTS.filter(p => p.bestSeller || p.is_best_seller).slice(0, 8);
  // If no bestsellers flagged, show top-rated products instead
  if (bestSellers.length === 0) {
    bestSellers = [...PRODUCTS].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  }
  if (bestSellers.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500);"><i class="fas fa-box-open" style="font-size:3rem;display:block;margin-bottom:12px;"></i>No products yet — add products in Admin panel</div>`;
    return;
  }
  grid.innerHTML = bestSellers.map(p => {
    const inWishlist = state.wishlist.includes(p.id);
    const badges = p.badge ? `<span class="badge badge-${p.badge}">${p.badge === 'best' ? '⭐ Best Seller' : p.badge === 'sale' ? '🔥 Sale' : '🆕 New'}</span>` : '';
    const pOld = p.oldPrice && p.oldPrice > 0 ? p.oldPrice : 0;
    const discount = pOld ? Math.round((1 - p.price / pOld) * 100) : 0;
    const priceStr = Number(p.price).toLocaleString();
    const oldPriceStr = pOld ? Number(pOld).toLocaleString() : '';
    const offerBadge = p.offer && p.offer.qty && p.offer.price ? `<span class="badge badge-sale" style="background:#FF6B00;font-size:11px;">${p.offer.qty} for ₹${p.offer.price}</span>` : '';
    const customizableBadge = p.customizable ? '<span class="badge" style="background:#8B5CF6;font-size:11px;">✨ Customizable</span>' : '';
    return `
      <div class="product-card animate-on-scroll">
        <div class="image">
          <img src="${p.image}" alt="${p.name}" loading="lazy" onclick="openProductModal(${p.id})">
        <div class="badges">${badges}${offerBadge}${customizableBadge}</div>
          <button class="wishlist-btn" onclick="toggleWishlistItem(${p.id})" title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
            <i class="fas fa-heart" style="color:${inWishlist ? '#FF4444' : ''}"></i>
          </button>
        </div>
        <div class="info">
          <div class="category-tag">${p.category}</div>
          <h3>${p.name}</h3>
          <div class="rating">
            <span class="stars">${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? '½' : ''}</span>
            <span class="count">(${p.reviews})</span>
          </div>
          <div class="price">
            <span class="current">&#8377;${priceStr}</span>
            ${p.oldPrice ? `<span class="old">&#8377;${oldPriceStr}</span><span class="discount">${discount}% OFF</span>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})"><i class="fas fa-shopping-cart"></i> Add</button>
            <button class="btn btn-whatsapp btn-sm" onclick="addToWK(${p.id})"><i class="fab fa-whatsapp"></i> WhatsApp</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== PRODUCT BUILDER STEP FLOW =====
let builderSelectedProduct = null;

function renderBuilderCategories() {
  const grid = document.getElementById('builderCategoriesGrid');
  if (!grid) return;
  grid.innerHTML = CONFIG.PRODUCT_CATEGORIES.map(cat => `
    <div class="category-card" onclick="builderSelectCategory('${cat}')" style="animation:fadeInUp 0.4s ease;">
      <span class="icon">${CATEGORY_ICONS[cat] || '🎁'}</span>
      <span class="name">${cat}</span>
    </div>
  `).join('');
}

function builderSelectCategory(category) {
  document.getElementById('builderStep1').style.display = 'none';
  document.getElementById('builderStep2').style.display = 'block';
  document.getElementById('builderSelectedCategory').textContent = '› ' + category;
  const products = PRODUCTS.filter(p => p.category === category);
  const grid = document.getElementById('builderProductsGrid');
  if (products.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500);"><i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px;"></i>No products in this category</div>';
    return;
  }
  grid.innerHTML = products.map(p => {
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `
    <div class="product-card" style="animation:fadeInUp 0.4s ease;">
      <div class="image">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onclick="builderSelectProduct(${p.id})">
        ${discount ? `<span class="badge badge-sale" style="position:absolute;top:8px;left:8px;">${discount}% OFF</span>` : ''}
      </div>
      <div class="info">
        <h3 style="font-size:14px;">${p.name}</h3>
        <div class="price">
          <span class="current">&#8377;${p.price.toLocaleString()}</span>
          ${p.oldPrice ? '<span class="old">&#8377;' + p.oldPrice.toLocaleString() + '</span>' : ''}
        </div>
        <button class="btn btn-primary btn-sm" onclick="builderSelectProduct(${p.id})" style="width:100%;justify-content:center;">
          <i class="fas fa-pen"></i> Customize This
        </button>
      </div>
    </div>`;
  }).join('');
}

function builderSelectProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  builderSelectedProduct = p;
  populateProductOptions(p, 'productSize', 'productMaterial');
  document.getElementById('builderStep2').style.display = 'none';
  document.getElementById('builderStep3').style.display = 'block';
  document.getElementById('builderSelectedName').textContent = p.name;
  document.getElementById('builderSelectedPrice').innerHTML = '₹' + p.price.toLocaleString() + (p.oldPrice ? ' <small style="font-size:14px;color:var(--gray-500);text-decoration:line-through;">₹' + p.oldPrice.toLocaleString() + '</small>' : '');
  document.getElementById('builderSelectedImg').src = p.image;
  document.getElementById('builderSelectedImg').style.display = 'block';
  document.getElementById('builderPrice').textContent = '₹' + p.price.toLocaleString();
  document.getElementById('previewPlaceholder').style.display = 'block';
  document.getElementById('previewImage').style.display = 'none';
  document.getElementById('builderPreview').classList.remove('has-image');
  document.getElementById('builderStep3').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function builderBackToCategories() {
  document.getElementById('builderStep2').style.display = 'none';
  document.getElementById('builderStep3').style.display = 'none';
  document.getElementById('builderStep1').style.display = 'block';
  builderSelectedProduct = null;
}

function builderBackToProducts() {
  document.getElementById('builderStep3').style.display = 'none';
  document.getElementById('builderStep2').style.display = 'block';
  builderSelectedProduct = null;
}

// ===== PRODUCT DETAIL MODAL =====
let currentModalProduct = null;
let modalPhotosData = [];

const DEFAULT_SIZES = ['Large (12x8)'];
const DEFAULT_MATERIALS = ['Premium Wood', 'Acrylic', 'Metal', 'LED Backlit'];

function populateProductOptions(p, sizeSelectId, materialSelectId) {
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : DEFAULT_SIZES;
  const materials = (p.materials && p.materials.length) ? p.materials : DEFAULT_MATERIALS;
  const sizeSel = document.getElementById(sizeSelectId);
  const matSel = document.getElementById(materialSelectId);
  if (sizeSel) {
    sizeSel.innerHTML = sizes.map((s, i) => `<option ${i === 1 ? 'selected' : ''}>${s}</option>`).join('');
  }
  if (matSel) {
    matSel.innerHTML = materials.map((m, i) => `<option ${i === 1 ? 'selected' : ''}>${m}</option>`).join('');
  }
}

async function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentModalProduct = p;
  modalPhotosData = [];
  document.getElementById('modalUploadedThumbs').innerHTML = '';
  resetReviewStars();
  document.getElementById('modalProductImage').src = p.image;
  // Populate image thumbnails
  const allImgs = [p.image, ...(p.images || []).filter(i => i !== p.image)];
  const thumbContainer = document.getElementById('modalThumbnails');
  if (allImgs.length > 1) {
    thumbContainer.innerHTML = allImgs.map((url, i) =>
      `<img src="${url}" data-index="${i}" onclick="switchModalImage(this)" style="width:60px;height:60px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid ${i === 0 ? 'var(--primary)' : 'transparent'};flex-shrink:0;transition:border 0.2s;">`
    ).join('');
  } else {
    thumbContainer.innerHTML = '';
  }
  document.getElementById('modalCategory').textContent = p.category;
  document.getElementById('modalProductName').textContent = p.name;
  const totalReviews = p.reviews || 0;
  document.getElementById('modalRating').innerHTML = `${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? '½' : ''} <small style="color:var(--gray-500);">(${totalReviews} reviews)</small>`;
  const modalPriceHtml = p.allInclusive
    ? `&#8377;${Number(p.price).toLocaleString()} <small style="font-size:13px;color:#22C55E;font-weight:500;">(All inclusive)</small>`
    : `&#8377;${Number(p.price).toLocaleString()}${p.oldPrice ? ` <small style="font-size:1rem;color:var(--gray-500);text-decoration:line-through;">&#8377;${Number(p.oldPrice).toLocaleString()}</small>` : ''}`;
  document.getElementById('modalPrice').innerHTML = modalPriceHtml;
  // Populate size & material from product options
  populateProductOptions(p, 'modalSize', 'modalMaterial');
  document.getElementById('modalCustomText').value = '';
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewText').value = '';
  // Load reviews from Supabase
  try {
    const dbReviews = await loadReviewsForProduct(p.id);
    const reviewEl = document.getElementById('modalReviews');
    if (dbReviews.length > 0) {
      reviewEl.innerHTML = dbReviews.slice(0, 3).map(r =>
        `<div style="padding:6px 0;border-bottom:1px solid var(--gray-100);"><strong>${r.customer_name}</strong> ${'★'.repeat(r.rating)}<br><small>${r.text}</small></div>`
      ).join('');
    } else {
      reviewEl.innerHTML = '<small>No reviews yet. Be the first!</small>';
    }
  } catch(e) {
    document.getElementById('modalReviews').innerHTML = '<small>No reviews yet. Be the first!</small>';
  }
  document.getElementById('productModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  // Adjust modal buttons for whatsappOnly products
  const modalActions = document.querySelector('#productModal .modal-actions');
  if (modalActions) {
    if (p.whatsappOnly) {
      modalActions.innerHTML = `<button class="btn btn-whatsapp btn-lg" style="flex:1;justify-content:center;" onclick="closeProductModal();orderBloodArt(${p.id})"><i class="fab fa-whatsapp"></i> Inquire via WhatsApp</button>`;
    } else {
      modalActions.innerHTML = `
        <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="addModalToCart()"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
        <button class="btn btn-whatsapp" style="flex:1;justify-content:center;" onclick="orderViaWhatsApp()"><i class="fab fa-whatsapp"></i> Order on WhatsApp</button>
      `;
    }
  }
}

function switchModalImage(el) {
  document.getElementById('modalProductImage').src = el.src;
  document.querySelectorAll('#modalThumbnails img').forEach(t => t.style.borderColor = 'transparent');
  el.style.borderColor = 'var(--primary)';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  document.body.style.overflow = '';
  currentModalProduct = null;
  modalPhotosData = [];
  document.getElementById('modalUploadedThumbs').innerHTML = '';
}

async function handleModalPhoto(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  e.target.value = '';
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) { showToast(file.name + ' exceeds 10MB limit, skipped.', 'error'); continue; }
    // Show local preview immediately
    const reader = new FileReader();
    const previewUrl = await new Promise(resolve => { reader.onload = ev => resolve(ev.target.result); reader.readAsDataURL(file); });
    addModalPhotoThumb(previewUrl);
    // Upload to Supabase
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = generateFilePath('uploads', ext);
    const { url, error } = await uploadImage('products', filePath, file);
    if (url) {
      modalPhotosData.push(url);
      document.getElementById('modalProductImage').src = url;
      replaceModalPhotoThumb(previewUrl, url);
      showToast(file.name + ' uploaded!');
    }
  }
  if (modalPhotosData.length) showToast(modalPhotosData.length + ' photo(s) uploaded!');
}

function addModalPhotoThumb(src) {
  const c = document.getElementById('modalUploadedThumbs');
  const div = document.createElement('div');
  div.className = 'modal-photo-thumb';
  div.style.cssText = 'width:56px;height:56px;border-radius:8px;overflow:hidden;border:2px solid var(--primary);position:relative;flex-shrink:0;';
  div.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;"><button type="button" onclick="removeModalPhoto(this.parentElement)" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#ff4444;color:#fff;border:none;font-size:11px;line-height:18px;text-align:center;cursor:pointer;">×</button>`;
  c.appendChild(div);
}

function replaceModalPhotoThumb(oldSrc, newSrc) {
  document.querySelectorAll('#modalUploadedThumbs img').forEach(img => { if (img.src === oldSrc) img.src = newSrc; });
}

function removeModalPhoto(el) {
  const src = el.querySelector('img')?.src;
  modalPhotosData = modalPhotosData.filter(u => u !== src);
  el.remove();
  const first = modalPhotosData[0] || document.querySelector('#modalThumbnails img')?.src || '';
  if (first) document.getElementById('modalProductImage').src = first;
}

function addModalToCart() {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  const imgs = modalPhotosData.length ? modalPhotosData : [p.image];
  const item = {
    ...p,
    qty: 1,
    custom: true,
    images: imgs,
    image: imgs[0],
    customization: {
      text: document.getElementById('modalCustomText').value || 'No text',
      size: document.getElementById('modalSize').value,
      material: document.getElementById('modalMaterial').value,
      photos: imgs
    }
  };
  state.cart.push(item);
  saveState('cart');
  updateCartUI();
  closeProductModal();
  showToast(`Added ${p.name} to cart!`);
}

// ===== REVIEWS =====
let reviewRating = 0;

function setReviewRating(rating) {
  reviewRating = rating;
  const stars = document.getElementById('reviewStars').children;
  for (let i = 0; i < stars.length; i++) {
    stars[i].style.color = i < rating ? '#FFB800' : 'var(--gray-300)';
  }
}

function resetReviewStars() {
  const stars = document.getElementById('reviewStars');
  if (stars) {
    for (let i = 0; i < stars.children.length; i++) {
      stars.children[i].style.color = 'var(--gray-300)';
    }
  }
}

async function submitReview() {
  const p = currentModalProduct;
  if (!p) { showToast('No product selected', 'error'); return; }
  const name = document.getElementById('reviewName').value.trim();
  const text = document.getElementById('reviewText').value.trim();
  if (!reviewRating) { showToast('Please select a rating', 'error'); return; }
  if (!name) { showToast('Please enter your name', 'error'); return; }
  if (!text) { showToast('Please write a review', 'error'); return; }
  const review = {
    product_id: p.id,
    customer_name: name,
    rating: reviewRating,
    text: text
  };
  try {
    await saveReviewToDB(review);
    showToast('Review submitted! Thank you.');
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewText').value = '';
    setReviewRating(0);
    resetReviewStars();
    // Reload reviews
    const dbReviews = await loadReviewsForProduct(p.id);
    const reviewEl = document.getElementById('modalReviews');
    if (dbReviews.length > 0) {
      reviewEl.innerHTML = dbReviews.slice(0, 3).map(r =>
        `<div style="padding:6px 0;border-bottom:1px solid var(--gray-100);"><strong>${r.customer_name}</strong> ${'★'.repeat(r.rating)}<br><small>${r.text}</small></div>`
      ).join('');
    }
  } catch(e) {
    showToast('Review saved locally', 'success');
    // Save locally as fallback
    const localReviews = JSON.parse(localStorage.getItem('sasiReviews') || '[]');
    localReviews.push(review);
    localStorage.setItem('sasiReviews', JSON.stringify(localReviews));
  }
}

function orderViaWhatsApp() {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  const text = document.getElementById('modalCustomText').value || 'No text';
  const size = document.getElementById('modalSize').value;
  const material = document.getElementById('modalMaterial').value;
  const photoCount = modalPhotosData.length;
  const msg = `Hi Sasi Arts! I want to order:
*Product:* ${p.name}
*Price:* ₹${p.price}
*Category:* ${p.category}
*Custom Text:* ${text}
*Size:* ${size}
*Material:* ${material}
*Photos:* ${photoCount ? photoCount + ' uploaded' : 'Use default image'}
Please confirm the order.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeProductModal();
}

// ===== WHATSAPP KART =====
function openWhatsAppKart() {
  document.getElementById('wkDrawer').classList.add('open');
  document.getElementById('wkOverlay').classList.add('active');
  updateWKUI();
}
function closeWK() {
  document.getElementById('wkDrawer').classList.remove('open');
  document.getElementById('wkOverlay').classList.remove('active');
}

function addToWK(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const existing = state.wkItems.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.wkItems.push({ ...product, qty: 1 });
  }
  saveState('wkItems');
  updateWKUI();
  showToast(`Added to WhatsApp Kart`);
}

function removeFromWK(id) {
  state.wkItems = state.wkItems.filter(i => i.id !== id);
  saveState('wkItems');
  updateWKUI();
}

function updateWKUI() {
  const count = state.wkItems.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('wkCount').textContent = count;
  document.getElementById('wkCount2').textContent = count;
  const container = document.getElementById('wkItems');
  const footer = document.getElementById('wkFooter');
  if (state.wkItems.length === 0) {
    container.innerHTML = `<div class="empty"><span class="icon"><i class="fab fa-whatsapp" style="color:#25D366;"></i></span><p>No items in WhatsApp Kart</p><p style="font-size:13px;color:var(--gray-500);margin-top:8px;">Add products and order directly via WhatsApp</p></div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  container.innerHTML = state.wkItems.map(item => {
    const total = getOfferTotal(item);
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="details">
          <div class="name">${item.name}</div>
          <div class="price">&#8377;${total.toLocaleString()}</div>
          <div class="qty">
            <button onclick="updateWKQty(${item.id}, -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="updateWKQty(${item.id}, 1)">+</button>
            <span class="remove" onclick="removeFromWK(${item.id})"><i class="fas fa-trash"></i></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateWKQty(id, delta) {
  const item = state.wkItems.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    saveState('wkItems');
    updateWKUI();
  }
}

function sendWKMessage() {
  if (state.wkItems.length === 0) { showToast('WhatsApp Kart is empty', 'error'); return; }
  let msg = `🛍️ *New Order from Sasi Arts Website*\n\n`;
  let total = 0;
  state.wkItems.forEach(item => {
    msg += `• *${item.name}*\n`;
    msg += `  Price: ₹${item.price} x ${item.qty} = ₹${(getOfferTotal(item)).toLocaleString()}\n`;
    msg += `  Category: ${item.category}\n`;
    if (item.customization) {
      msg += `  Custom: ${item.customization.material || 'N/A'} | ${item.customization.size || 'N/A'}\n`;
      if (item.customization.text) msg += `  Text: "${item.customization.text}"\n`;
    }
    if (item.image && item.image.startsWith('data:')) msg += `  📸 Custom photo uploaded\n`;
    total += getOfferTotal(item);
  });
  msg += `\n💵 *Total Amount: ₹${total.toLocaleString()}*\n`;
  msg += `📍 *Delivery to: Rajahmundry & All India*\n`;
  msg += `🚚 Delivery charges extra (₹50-₹400 based on location)\n\n`;
  msg += `Please confirm availability, delivery charge, and estimated delivery date.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeWK();
}

function openWhatsAppGeneral() {
  const msg = `Hi Sasi Arts! I want to know more about personalized gifts.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function checkoutViaWhatsApp() {
  if (state.cart.length === 0) { showToast('Cart is empty', 'error'); return; }
  let msg = `Hi Sasi Arts! I want to order:\n\n`;
  let total = 0;
  state.cart.forEach(item => {
    msg += `• ${item.name} x${item.qty} = ₹${(getOfferTotal(item)).toLocaleString()}\n`;
    if (item.customization) msg += `  Size: ${item.customization.size}, Material: ${item.customization.material}, Text: "${item.customization.text || 'N/A'}"\n`;
    if (item.image && item.image.startsWith('data:')) msg += `  📸 Custom photo uploaded\n`;
    total += getOfferTotal(item);
  });
  msg += `\n📦 *Subtotal: ₹${total.toLocaleString()}*\n`;
  msg += `🚚 *Delivery charges will be confirmed via WhatsApp*\n\nPlease confirm my order and share delivery charges.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== DELIVERY CHARGE CALCULATION =====
async function calculateDeliveryCharge(pincode) {
  if (!pincode || pincode.length < 6) return { charge: 0, note: 'Enter pincode for exact rate' };
  const dest = parseInt(pincode);
  const bodyObj = { destination_pincode: dest };
  try {
    const res = await fetchApi('/api/shipping', bodyObj);
    if (res.ok) {
      const data = await res.json();
      if (data.charge !== undefined) return { charge: data.charge, note: data.note || 'Standard delivery' };
    }
  } catch(e) {
    console.warn('Shipping API unavailable, using local calc:', e.message);
  }
  const localPincodes = [533101, 533102, 533103, 533104, 533105, 533106, 533107, 533108, 533109, 533110, 533294, 533295, 533296];
  if (localPincodes.includes(dest)) return { charge: 50, note: 'Local delivery (Rajanagaram area)' };
  if (dest >= 533000 && dest <= 534999) return { charge: 100, note: 'East Godavari district' };
  if (dest >= 530000 && dest <= 539999) return { charge: 120, note: 'Andhra Pradesh nearby' };
  if (dest >= 500000 && dest <= 519999) return { charge: 150, note: 'Telangana / Rayalaseema' };
  if (dest >= 560000 && dest <= 569999) return { charge: 200, note: 'Karnataka' };
  if (dest >= 600000 && dest <= 649999) return { charge: 220, note: 'Tamil Nadu' };
  if (dest >= 670000 && dest <= 699999) return { charge: 220, note: 'Kerala' };
  if (dest >= 700000 && dest <= 749999) return { charge: 250, note: 'West Bengal' };
  if (dest >= 750000 && dest <= 779999) return { charge: 250, note: 'Odisha' };
  if (dest >= 380000 && dest <= 399999) return { charge: 250, note: 'Gujarat' };
  if (dest >= 400000 && dest <= 449999) return { charge: 250, note: 'Maharashtra' };
  if (dest >= 300000 && dest <= 349999) return { charge: 250, note: 'Rajasthan' };
  if (dest >= 100000 && dest <= 199999) return { charge: 250, note: 'North India - Delhi NCR' };
  if (dest >= 200000 && dest <= 299999) return { charge: 250, note: 'Uttar Pradesh / North' };
  if (dest >= 800000 && dest <= 859999) return { charge: 250, note: 'Bihar' };
  if (dest >= 780000 && dest <= 799999) return { charge: 250, note: 'Assam / North-East' };
  if (dest >= 900000 && dest <= 999999) return { charge: 250, note: 'North-East / Remote' };
  return { charge: 100, note: 'Standard delivery' };
}

// ===== RECENTLY VIEWED =====
function addToRecent(id) {
  state.viewedProducts = [id, ...state.viewedProducts.filter(x => x !== id)].slice(0, 8);
  saveState('viewedProducts');
}

// ===== CART =====
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const existing = state.cart.find(item => item.id === id && !item.custom);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...product, qty: 1, custom: false });
  }
  saveState('cart');
  updateCartUI();
  showToast(`Added ${product.name} to cart`);
}

function addCustomProduct() {
  if (!builderSelectedProduct) { showToast('Please select a product first', 'error'); return; }
  const text = document.getElementById('customText').value;
  const font = document.getElementById('fontStyle').value;
  const size = document.getElementById('productSize').value;
  const material = document.getElementById('productMaterial').value;
  const img = document.getElementById('previewImage');
  if (!img || !img.getAttribute('src') || img.getAttribute('src') === window.location.href) {
    showToast('Please upload a photo first', 'error');
    return;
  }
  const imageUrl = uploadedPhotoUrl || img.src;
  const customItem = {
    id: Date.now(),
    name: `${builderSelectedProduct.name} (Custom ${material})`,
    category: builderSelectedProduct.category,
    baseProduct: builderSelectedProduct.name,
    price: builderSelectedProduct.price,
    image: imageUrl,
    custom: true,
    qty: 1,
    customization: { text, font, size, material, baseProductId: builderSelectedProduct.id }
  };
  state.cart.push(customItem);
  saveState('cart');
  updateCartUI();
  showToast(builderSelectedProduct.name + ' added with your photo!');
}

function addCustomToWhatsApp() {
  if (!builderSelectedProduct) { showToast('Please select a product first', 'error'); return; }
  const text = document.getElementById('customText').value || 'No text';
  const size = document.getElementById('productSize').value;
  const material = document.getElementById('productMaterial').value;
  const img = document.getElementById('previewImage');
  const hasPhoto = img.src && img.src !== window.location.href;
  let msg = `🛍️ *Custom Gift Order*\n\n`;
  msg += `*Product:* ${builderSelectedProduct.name}\n`;
  msg += `*Category:* ${builderSelectedProduct.category}\n`;
  msg += `*Price:* ₹${builderSelectedProduct.price}\n`;
  msg += `*Size:* ${size}\n`;
  msg += `*Material:* ${material}\n`;
  msg += `*Text:* "${text}"\n`;
  msg += `*Photo:* ${hasPhoto ? '✅ Uploaded (attached in chat)' : '❌ Not uploaded'}\n\n`;
  msg += `Please confirm availability.`;
  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function addDealToCart() {
  const saved = JSON.parse(localStorage.getItem('sasiCurrentOffer') || '{}');
  const dealProduct = {
    id: 999,
    name: saved.title || "Today's Special - Premium LED Photo Frame",
    category: saved.category || 'LED Photo Frames',
    price: parseInt(saved.price || saved.offer_price) || 899,
    oldPrice: parseInt(saved.oldPrice || saved.old_price) || 1499,
    image: document.getElementById('dealImage').src,
    customizable: true,
    badge: 'offer',
    rating: 4.9,
    reviews: 87
  };
  const idx = PRODUCTS.findIndex(p => p.id === 999);
  if (idx >= 0) PRODUCTS[idx] = dealProduct;
  else PRODUCTS.push(dealProduct);
  openProductModal(999);
}

function removeFromCart(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  saveState('cart');
  updateCartUI();
}

function updateQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    saveState('cart');
    updateCartUI();
  }
}

function updateCartUI() {
  const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const shopCount = document.getElementById('shopCartCount');
  if (shopCount) shopCount.textContent = count;
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (state.cart.length === 0) {
    container.innerHTML = `<div class="empty"><span class="icon"><i class="fas fa-shopping-bag"></i></span><p>Your cart is empty</p><button class="btn btn-primary btn-sm mt-2" onclick="closeCart()">Start Shopping</button></div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  let subtotal = 0;
  container.innerHTML = state.cart.map(item => {
    const total = getOfferTotal(item);
    subtotal += total;
    const offerTag = item.offer && item.offer.qty && item.offer.price && item.qty >= item.offer.qty
      ? `<span style="display:inline-block;font-size:10px;background:#FFF0E6;color:#FF6B00;padding:1px 6px;border-radius:4px;margin-left:4px;">${item.offer.qty} for ₹${item.offer.price}</span>`
      : '';
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="details">
          <div class="name">${item.name}${offerTag}</div>
          ${item.customization ? `<div style="font-size:12px;color:var(--gray-500);">${item.customization.material} | ${item.customization.size}${(item.images||[]).length > 1 ? ' | 📸 ' + item.images.length + ' photos' : ''}</div>` : ''}
          <div class="price">&#8377;${total.toLocaleString()}</div>
          <div class="qty">
            <button onclick="updateQty(${item.id}, -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="updateQty(${item.id}, 1)">+</button>
            <span class="remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('cartSubtotal').textContent = `₹${subtotal.toLocaleString()}`;
  const delEst = document.getElementById('deliveryEstimate');
  if (delEst) {
    const allInc = state.cart.every(i => i.allInclusive);
    delEst.innerHTML = allInc
      ? `<small style="color:#22C55E;">✅ All inclusive — GST & shipping included in price</small>`
      : `<small style="color:var(--gray-500);">🚚 Delivery charges calculated at checkout based on your pincode (₹50 - ₹400)</small>`;
  }
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('active');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('active');
}

// ===== WISHLIST =====
function toggleWishlistItem(id) {
  const idx = state.wishlist.indexOf(id);
  if (idx > -1) {
    state.wishlist.splice(idx, 1);
    showToast('Removed from wishlist');
  } else {
    state.wishlist.push(id);
    showToast('Added to wishlist');
  }
  saveState('wishlist');
  updateWishlistUI();
  try {
    if (document.getElementById('shop-page').style.display === 'block') {
      renderShopProducts(shopCurrentProducts, shopCurrentCategory);
    } else {
      renderHomepageProducts();
    }
  } catch(e) {
    console.warn('Re-render after wishlist toggle failed:', e);
  }
}
function updateWishlistUI() {
  document.getElementById('wishlistCount').textContent = state.wishlist.length;
}
function toggleWishlist() {
  if (state.wishlist.length === 0) {
    showToast('Your wishlist is empty', 'error');
    return;
  }
  const wishProducts = PRODUCTS.filter(p => state.wishlist.includes(p.id));
  // Show shop overlay + populate category filter
  document.getElementById('shop-page').style.display = 'block';
  document.body.style.overflow = 'hidden';
  const catFilter = document.getElementById('shopCategoryFilter');
  if (catFilter) {
    const cats = CONFIG.PRODUCT_CATEGORIES.filter(c => PRODUCTS.some(p => p.category === c));
    catFilter.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  try {
    renderShopProducts(wishProducts.length ? wishProducts : PRODUCTS, '');
  } catch(e) {
    console.warn('Wishlist render error, showing all products:', e);
    renderShopProducts(PRODUCTS, '');
  }
}

// ===== SEARCH =====
function handleSearchClick() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    document.getElementById('searchResults').style.display = 'none';
    openShop('', query);
  }
}

function handleSearch(e) {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  if (!query) { results.style.display = 'none'; return; }
  const matches = PRODUCTS.filter(p =>
    (p.name && p.name.toLowerCase().includes(query)) || (p.category && p.category.toLowerCase().includes(query))
  );
  if (matches.length === 0) {
    results.innerHTML = '<div style="padding:16px;color:var(--gray-500);text-align:center;">No products found</div>';
  } else {
    results.innerHTML = matches.map(p => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--gray-100);" onclick="document.getElementById('searchInput').value='';document.getElementById('searchResults').style.display='none';openProductModal(${p.id})">
        <img src="${p.image}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--dark);">${p.name}</div>
          <div style="font-size:12px;color:var(--primary);">&#8377;${p.price}</div>
        </div>
      </div>
    `).join('');
    // Add "View all results" link
    const safeQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    results.innerHTML += `<div style="padding:8px 16px;text-align:center;border-top:1px solid var(--gray-100);"><span style="font-size:13px;color:var(--primary);cursor:pointer;font-weight:600;" onclick="document.getElementById('searchInput').value='${safeQuery}';document.getElementById('searchResults').style.display='none';openShop('','${safeQuery}')">🔍 View all ${matches.length} results in Shop →</span></div>`;
  }
  results.style.display = 'block';
  // If Enter key is pressed, open shop page with results
  if (e && e.key === 'Enter') {
    results.style.display = 'none';
    openShop('', query);
  }
}
function selectSearchResult(id) {
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('searchInput').value = '';
  openProductModal(id);
}

// ===== PHOTO UPLOAD & PREVIEW =====
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processPhoto(file);
  });
}
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (file) processPhoto(file);
}
let uploadedPhotoUrl = null;

async function processPhoto(file) {
  if (file.size > 10 * 1024 * 1024) {
    showToast('File too large. Max 10MB', 'error');
    return;
  }
  // Show preview immediately
  const reader = new FileReader();
  reader.onload = async (e) => {
    document.getElementById('previewImage').src = e.target.result;
    document.getElementById('previewImage').style.display = 'block';
    document.getElementById('previewPlaceholder').style.display = 'none';
    document.getElementById('builderPreview').classList.add('has-image');
    updatePreview();
    showToast('Uploading to cloud...');
    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = generateFilePath('uploads', ext);
    const { url, error } = await uploadImage('products', filePath, file);
    if (url) {
      uploadedPhotoUrl = url;
      document.getElementById('previewImage').src = url;
      showToast('Photo uploaded successfully!');
    } else {
      showToast('Photo saved locally (cloud upload failed)', 'error');
    }
  };
  reader.readAsDataURL(file);
}
function updatePreview() {
  const text = document.getElementById('customText').value;
  const font = document.getElementById('fontStyle').value;
  const el = document.getElementById('previewText');
  if (text) {
    el.textContent = text;
    el.style.fontFamily = font;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// ===== LOAD TODAY'S DEAL =====
function loadTodaysDeal() {
  const saved = JSON.parse(localStorage.getItem('sasiCurrentOffer') || '{}');
  if (saved.title) {
    document.getElementById('dealTitle').textContent = saved.title;
    document.getElementById('dealDesc').textContent = saved.desc || saved.description || 'Special offer on personalized gifts. Grab it fast!';
    document.getElementById('dealPrice').innerHTML = '&#8377;' + (parseInt(saved.price || saved.offer_price) || 899).toLocaleString();
    document.getElementById('dealOldPrice').innerHTML = '&#8377;' + (parseInt(saved.oldPrice || saved.old_price) || 1499).toLocaleString();
    if (saved.image) document.getElementById('dealImage').src = saved.image;
    const stock = parseInt(saved.stock || saved.stock_remaining) || 12;
    const pct = Math.min(100, Math.round((stock / 50) * 100));
    document.getElementById('stockFill').style.width = pct + '%';
    document.getElementById('stockText').textContent = '🔥 Only ' + stock + ' items left! Selling fast.';
    if (saved.expiry) {
      const exp = new Date(saved.expiry);
      const now = new Date();
      const diff = Math.max(0, Math.floor((exp - now) / 1000));
      if (diff > 0) startCountdown(diff);
    }
  }
}

// ===== COUNTDOWN =====
let countdownInterval;
function startCountdown(totalSec) {
  if (countdownInterval) clearInterval(countdownInterval);
  let totalSeconds = totalSec || 23 * 3600 + 59 * 60 + 59;
  function tick() {
    if (totalSeconds <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMinutes').textContent = '00';
      document.getElementById('cdSeconds').textContent = '00';
      return;
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    document.getElementById('cdHours').textContent = String(h).padStart(2, '0');
    document.getElementById('cdMinutes').textContent = String(m).padStart(2, '0');
    document.getElementById('cdSeconds').textContent = String(s).padStart(2, '0');
    totalSeconds--;
  }
  tick();
  countdownInterval = setInterval(tick, 1000);
}

// ===== GALLERY =====
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = SAMPLE_GALLERY.map(item => `
    <div class="gallery-item animate-on-scroll">
      <img src="${item.image}" alt="${item.caption}" loading="lazy">
      <div class="overlay"><span>${item.caption}</span></div>
    </div>
  `).join('');
}

// ===== REVIEWS =====
function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  grid.innerHTML = SAMPLE_REVIEWS.map(r => `
    <div class="review-card animate-on-scroll">
      <div class="header">
        <div class="avatar">${r.avatar}</div>
        <div>
          <div class="name">${r.name}</div>
          ${r.verified ? '<div class="verified"><i class="fas fa-check-circle"></i> Verified Buyer</div>' : ''}
        </div>
      </div>
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="text">"${r.text}"</div>
      <small style="color:var(--gray-500);display:block;margin-top:8px;">Product: ${r.product}</small>
    </div>
  `).join('');
}

// ===== ORDER TRACKING =====
async function trackOrder() {
  const id = document.getElementById('orderIdInput').value.trim();
  const result = document.getElementById('trackingResult');
  if (!id) { showToast('Please enter an Order ID', 'error'); return; }
  // Try Supabase first, then localStorage
  let order = state.orders.find(o => o.id === id);
  if (!order) {
    try {
      const { data } = await supabaseFetch(`orders?id=eq.${id}&limit=1`);
      if (data && data.length > 0) order = data[0];
    } catch(e) { /* fallback to local */ }
  }
  const steps = ['Order Placed', 'Processing', 'Production', 'Shipped', 'Delivered'];
  let currentStep = order ? order.status || 0 : 0;
  result.style.display = 'block';
  const stepsHtml = steps.map((s, i) => {
    let cls = '';
    if (i < currentStep) cls = 'completed';
    else if (i === currentStep) cls = 'active';
    return `<div class="step ${cls}"><div class="dot">${i < currentStep ? '✓' : i + 1}</div><div class="label">${s}</div></div>`;
  }).join('');
  document.getElementById('trackingSteps').innerHTML = stepsHtml;
  if (order) {
    let items = order.items || [];
    if (!items.length) {
      try { const { data } = await supabaseFetch(`order_items?order_id=eq.${order.id}`); if (data) items = data; } catch(e) {}
    }
    const itemsHtml = items.slice(0, 3).map(i => `• ${i.name || i.product_name} x${i.qty || i.quantity || 1}`).join('<br>');
    document.getElementById('orderDetails').innerHTML = `
      <div style="text-align:left;max-width:500px;margin:16px auto 0;padding:16px;background:var(--gray-50);border-radius:12px;font-size:14px;">
        <p><strong>Order:</strong> ${id}</p>
        ${itemsHtml ? `<p><strong>Items:</strong><br>${itemsHtml}</p>` : ''}
        <p><strong>Total:</strong> ₹${(order.total || 0).toLocaleString()}</p>
        <p><strong>Payment:</strong> ${order.payment_id ? '✅ Paid via Razorpay' : '⏳ Pending'}</p>
        <p><strong>Status:</strong> ${steps[currentStep] || 'Processing'}</p>
        ${order.customer_name ? `<p><strong>Delivery to:</strong> ${order.customer_name}, ${order.city || ''}</p>` : ''}
      </div>`;
  } else {
    document.getElementById('orderDetails').innerHTML = `<p>Order <strong>${id}</strong> not found. Please check the ID or contact us on WhatsApp.</p>`;
  }
}

// ===== API HELPER =====
function getApiBaseUrl() {
  const loc = window.location;
  if (!loc.origin || loc.origin === 'null' || loc.hostname === '' || loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    return CONFIG.API_BASE_URL;
  }
  return loc.origin;
}
async function fetchApi(endpoint, body, retried) {
  const url = getApiBaseUrl() + endpoint;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res;
  } catch(e) {
    if (!retried && getApiBaseUrl() !== CONFIG.API_BASE_URL) {
      const fallbackUrl = CONFIG.API_BASE_URL + endpoint;
      const res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return res;
    }
    throw e;
  }
}

// ===== QR CODES =====
function generateQRs() {
  const qrData = [
    { id: 'qrWebsite', label: 'Visit Website', url: CONFIG.SITE_URL },
    { id: 'qrWhatsApp', label: 'Order via WhatsApp', url: CONFIG.WHATSAPP_LINK },
    { id: 'qrCatalog', label: 'Digital Catalog', url: CONFIG.SITE_URL + '/?catalog=1' }
  ];
  qrData.forEach(({ id, label, url }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}" alt="${label}" style="width:150px;height:150px;border-radius:8px;">`;
  });
}
function downloadQR(type) {
  const el = document.getElementById(type === 'website' ? 'qrWebsite' : type === 'whatsapp' ? 'qrWhatsApp' : 'qrCatalog');
  if (!el) { showToast('QR not generated yet', 'error'); return; }
  const img = el.querySelector('img');
  if (img) {
    const link = document.createElement('a');
    link.download = `sasi-arts-${type}-qr.png`;
    link.href = img.src;
    link.click();
    showToast(`Downloading ${type} QR code`);
  } else {
    showToast(`${type} QR ready — right-click to save`, 'error');
  }
}

// ===== LEAD POPUP =====
function closeLeadPopup() {
  document.getElementById('leadPopup').classList.remove('active');
  localStorage.setItem('leadPopupShown', 'true');
}
async function loadOfferFromSupabase() {
  try {
    const { data } = await supabaseFetch('offers?is_active=eq.true&limit=1&order=created_at.desc');
    if (data && data.length > 0) {
      const db = data[0];
      const mapped = {
        title: db.title,
        desc: db.description || '',
        price: db.offer_price || '',
        oldPrice: db.old_price || '',
        stock: db.stock_remaining || '',
        image: db.image || '',
        active: db.is_active,
        discount: db.discount_percent ? db.discount_percent + '%' : '',
        expiry: db.expires_at || '',
        updatedAt: db.created_at || ''
      };
      localStorage.setItem('sasiCurrentOffer', JSON.stringify(mapped));
      loadTodaysDeal();
    }
  } catch(e) { /* use localStorage */ }
}

async function submitLead(e) {
  e.preventDefault();
  const lead = {
    name: document.getElementById('leadName').value,
    phone: document.getElementById('leadPhone').value,
    email: document.getElementById('leadEmail').value,
    birthday: document.getElementById('leadBirthday').value,
    coupon: 'SASI10',
    created_at: new Date().toISOString()
  };
  const leads = JSON.parse(localStorage.getItem('sasiLeads') || '[]');
  leads.push(lead);
  localStorage.setItem('sasiLeads', JSON.stringify(leads));
  try { await saveLeadToDB(lead); } catch(e) { /* localStorage fallback */ }
  showToast('Welcome! Use code SASI10 for 10% OFF');
  closeLeadPopup();
}

// ===== DELIVERY ADDRESS FORM =====
function openDeliveryForm() {
  document.getElementById('deliveryFormModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const allInclusiveCart = state.cart.every(i => i.allInclusive);
  const subtotal = state.cart.reduce((sum, i) => sum + getOfferTotal(i), 0);
  document.getElementById('delSubtotal').textContent = `₹${subtotal.toLocaleString()}`;
  if (allInclusiveCart) {
    document.getElementById('delTaxDisplay').textContent = '₹0 (All inclusive)';
    document.getElementById('delChargeDisplay').textContent = '₹0 (All inclusive)';
    document.getElementById('delChargeNote').textContent = 'GST & shipping included';
    document.getElementById('delCharge').value = 0;
  } else {
    const tax = calcTax(subtotal);
    document.getElementById('delTaxDisplay').textContent = `₹${tax.toLocaleString()}`;
  }
  const delPincode = document.getElementById('delPincode');
  if (delPincode && !allInclusiveCart) { updateDeliveryCharge(delPincode.value); }
  if (allInclusiveCart) {
    const subtotal = state.cart.reduce((sum, i) => sum + getOfferTotal(i), 0);
    document.getElementById('grandTotalDisplay').textContent = `₹${subtotal.toLocaleString()}`;
  }
}

function closeDeliveryForm() {
  document.getElementById('deliveryFormModal').style.display = 'none';
  document.body.style.overflow = '';
}

function calcTax(subtotal) {
  return CONFIG.TAX_AMOUNT;
}

function handlePincodeInput(value) {
  updateDeliveryCharge(value);
}

async function updateDeliveryCharge(pincode) {
  const allInclusiveCart = state.cart.every(i => i.allInclusive);
  const result = await calculateDeliveryCharge(pincode);
  if (allInclusiveCart) {
    document.getElementById('delChargeDisplay').textContent = '₹0 (All inclusive)';
    document.getElementById('delChargeNote').textContent = 'Included in ₹1,500';
    document.getElementById('delCharge').value = 0;
  } else {
    document.getElementById('delChargeDisplay').textContent = `₹${result.charge}`;
    document.getElementById('delChargeNote').textContent = result.note;
    document.getElementById('delCharge').value = result.charge;
  }
  const subtotal = state.cart.reduce((sum, i) => sum + getOfferTotal(i), 0);
  const finalTax = allInclusiveCart ? 0 : calcTax(subtotal);
  const finalCharge = allInclusiveCart ? 0 : result.charge;
  const grandTotal = subtotal + finalTax + finalCharge;
  document.getElementById('grandTotalDisplay').textContent = `₹${grandTotal.toLocaleString()}`;
  document.getElementById('delTaxDisplay').textContent = allInclusiveCart ? '₹0 (Included)' : `₹${finalTax.toLocaleString()}`;
}

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
async function submitDeliveryAndPay(e) {
  e.preventDefault();
  const name = val('delName');
  const phone = val('delPhone');
  const email = val('delEmail');
  const address = val('delAddress');
  const city = val('delCity');
  const pincode = val('delPincode');
  const charge = parseInt(val('delCharge'), 10) || 250;

  const delState = document.getElementById('delState')?.value.trim();
  if (!name || !phone || !address || !city || !delState || !pincode) {
    showToast('Please fill all delivery details', 'error');
    return;
  }

  const subtotal = state.cart.reduce((sum, i) => sum + getOfferTotal(i), 0);
  const allInclusiveCart = state.cart.every(i => i.allInclusive);
  const finalShipping = allInclusiveCart ? 0 : charge;
  const finalTax = allInclusiveCart ? 0 : calcTax(subtotal);
  const total = subtotal + finalTax + finalShipping;

  if (typeof Razorpay === 'undefined') {
    showToast('Razorpay not loaded. Please try again.', 'error');
    return;
  }

  try {
    const res = await fetchApi('/api/razorpay-order', { action: 'create', amount: total * 100, currency: 'INR' });
    const orderData = await res.json();
    if (!res.ok || !orderData.order_id) {
      const msg = orderData.error || ('HTTP ' + res.status);
      console.error('Razorpay setup failed:', msg);
      showToast('Payment setup failed: ' + msg, 'error');
      return;
    }

    const options = {
      key: CONFIG.RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: CONFIG.STORE_NAME,
      description: 'Personalized Gifts',
      order_id: orderData.order_id,
      handler: async function(response) {
        const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
        const cartItems = [...state.cart];

        // Verify payment signature via our server
        try {
          const verifyRes = await fetchApi('/api/razorpay-order', {
            action: 'verify',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.verified) {
            showToast('Payment verification failed. Contact support.', 'error');
            return;
          }
        } catch(e) {
          showToast('Payment verification error. Contact support.', 'error');
          return;
        }

        const order = {
          id: orderId,
          subtotal: subtotal,
          shipping: finalShipping,
          tax: finalTax,
          total: total,
          status: 0,
          payment_id: response.razorpay_payment_id,
          payment_method: 'Razorpay',
          payment_status: 'paid',
          customer_name: name,
          customer_email: email || '',
          customer_phone: phone,
          shipping_address: address,
          city: city,
          state: delState,
          pincode: pincode,
          created_at: new Date().toISOString()
        };
        const orderItems = cartItems.map(item => ({
          order_id: orderId,
          product_name: item.name,
          product_price: item.price,
          quantity: item.qty || 1,
          customization: item.customization ? JSON.stringify(item.customization) : null,
          image: (item.images && item.images[0]) || item.image || ''
        }));
        // Save to Supabase first (with items together)
        try {
          await saveOrderWithItems(order, orderItems);
        } catch(e) {
          console.warn('Supabase order save failed, saving locally:', e.message);
          // Fallback: save order and items separately
          try { await saveOrderToDB(order); } catch(e2) { console.warn('Order fallback failed:', e2.message); }
          try { await saveOrderItemsToDB(orderItems); } catch(e2) { console.warn('Items fallback failed:', e2.message); }
        }
        // Save locally for redundancy
        const localOrder = { ...order, items: cartItems };
        state.orders.push(localOrder);
        saveState('orders');
        state.cart = [];
        saveState('cart');
        updateCartUI();
        closeCart();
        closeDeliveryForm();
        // Send email invoice to admin
        try { await sendAdminInvoiceEmail(order, cartItems); } catch(e) { console.warn('Invoice email not sent:', e.message); }
        showToast('🎉 Order placed! ID: ' + orderId + '. We will ship to ' + city + '.');
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled', 'error');
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  } catch(e) {
    showToast('Payment error: ' + e.message, 'error');
    console.warn('Razorpay order creation error:', e.message);
  }
}

// ===== CHECKOUT =====
function checkout() {
  if (state.cart.length === 0) {
    showToast('Cart is empty', 'error');
    return;
  }
  openDeliveryForm();
}

// ===== ADMIN INVOICE EMAIL (via EmailJS) =====
async function sendAdminInvoiceEmail(order, items) {
  if (!CONFIG.EMAILJS_PUBLIC_KEY || CONFIG.EMAILJS_PUBLIC_KEY === 'your_public_key') return;
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS not loaded — invoice email skipped');
    return;
  }
  const itemsHtml = items.map(i => {
    const cust = i.customization || {};
    const custStr = cust.size || cust.material || cust.text ?
      ` [${cust.size || 'N/A'} | ${cust.material || 'N/A'}]${cust.text && cust.text !== 'No text' ? ` "${cust.text}"` : ''}${cust.photo && !cust.photo.startsWith('https://images.unsplash') ? ' [📷 Photo attached]' : ''}`
      : '';
    return `• ${i.name}${custStr} x${i.qty || 1} = ₹${((i.price || 0) * (i.qty || 1)).toLocaleString()}`;
  }).join('\n');
  const firstItem = items && items.length > 0 ? items[0] : null;
  const templateParams = {
    to_email: CONFIG.ADMIN_EMAIL,
    from_name: 'Sasi Arts Website',
    order_id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email || 'N/A',
    customer_phone: order.customer_phone,
    shipping_address: order.shipping_address,
    city: order.city,
    state: order.state || '',
    pincode: order.pincode,
    items: itemsHtml || 'No items',
    subtotal: '₹' + (order.subtotal || 0).toLocaleString(),
    shipping: '₹' + (order.shipping || 0).toLocaleString(),
    tax: '₹' + (order.tax || 0).toLocaleString(),
    total: '₹' + (order.total || 0).toLocaleString(),
    payment_id: order.payment_id || 'N/A',
    order_date: new Date().toLocaleString('en-IN'),
    image_url: firstItem ? (firstItem.image || firstItem.image_url || '') : ''
  };
  try {
    await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams, { publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
    console.log('Invoice email sent to admin');
  } catch(e) {
    console.warn('EmailJS send failed:', e.message);
  }
}

// ===== CORPORATE INQUIRY =====
async function submitCorporateInquiry() {
  const inquiry = {
    company_name: document.getElementById('corpCompany').value,
    contact_person: document.getElementById('corpName').value,
    email: document.getElementById('corpEmail').value,
    phone: document.getElementById('corpPhone').value,
    product_interest: document.getElementById('corpProduct').value,
    quantity: parseInt(document.getElementById('corpQty').value) || 0,
    budget_per_item: parseFloat(document.getElementById('corpBudget').value) || 0,
    message: document.getElementById('corpMessage').value,
    needs_gst: document.getElementById('corpGst').checked,
    created_at: new Date().toISOString(),
    status: 'pending'
  };
  if (!inquiry.contact_person || !inquiry.email || !inquiry.phone) {
    showToast('Please fill required fields', 'error');
    return;
  }
  let dbId = null;
  try {
    const result = await saveCorporateToDB(inquiry);
    if (result && result.data && result.data.length > 0) dbId = result.data[0].id;
  } catch(e) {
    console.warn('Corporate inquiry saved locally only:', e.message);
  }
  // Save locally with tracking ID
  const inquiries = JSON.parse(localStorage.getItem('sasiCorporate') || '[]');
  inquiries.push({ ...inquiry, id: dbId || 'local_' + Date.now() });
  localStorage.setItem('sasiCorporate', JSON.stringify(inquiries));
  document.getElementById('corporateForm').innerHTML = `
    <div class="text-center" style="padding:40px;">
      <span style="font-size:4rem;">📋</span>
      <h3 style="color:var(--dark);margin:16px 0;">Thank You!</h3>
      <p style="color:var(--gray-600);">We've received your corporate inquiry. Our team will contact you within 24 hours.</p>
      <button class="btn btn-primary mt-3" onclick="location.reload()">Submit Another</button>
    </div>`;
  showToast('Corporate inquiry submitted!');
}

// ===== GIFT REMINDER =====
function setReminder() {
  const reminder = {
    name: document.getElementById('reminderName').value,
    phone: document.getElementById('reminderPhone').value,
    type: document.getElementById('reminderType').value,
    date: document.getElementById('reminderDate').value,
    recipient: document.getElementById('reminderRecipient').value || 'Not specified',
    dateAdded: new Date().toISOString()
  };
  if (!reminder.name || !reminder.phone || !reminder.date) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  const reminders = JSON.parse(localStorage.getItem('sasiReminders') || '[]');
  reminders.push(reminder);
  localStorage.setItem('sasiReminders', JSON.stringify(reminders));
  showToast('Reminder set for ' + reminder.date + '!');
}

// ===== NEWSLETTER =====
function subscribeNewsletter(e) {
  e.preventDefault();
  const el = document.getElementById('newsletterEmail');
  const email = el ? el.value.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email', 'error'); return; }
  const subs = JSON.parse(localStorage.getItem('sasiNewsletter') || '[]');
  if (subs.some(s => s.email === email)) { showToast('Already subscribed!', 'error'); return; }
  subs.push({ email, date: new Date().toISOString() });
  localStorage.setItem('sasiNewsletter', JSON.stringify(subs));
  showToast('Subscribed!');
  if (el) el.value = '';
}

// ===== ADMIN ACCESS =====
function promptAdminPassword() {
  window.location.href = 'admin/index.html';
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  document.getElementById('mainNav').classList.toggle('open');
  document.getElementById('navOverlay').classList.toggle('active');
}
// Close dropdown on scroll
let menuCloseTimeout;
window.addEventListener('scroll', () => {
  if (menuCloseTimeout) return;
  menuCloseTimeout = setTimeout(() => {
    const nav = document.getElementById('mainNav');
    if (nav.classList.contains('open')) {
      nav.classList.remove('open');
      document.getElementById('navOverlay').classList.remove('active');
    }
    menuCloseTimeout = null;
  }, 100);
});

// ===== HEADER SCROLL (debounced) =====
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
    scrollTimeout = null;
  }, 50);
});
