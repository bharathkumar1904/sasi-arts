// ===== TOAST =====
function showToast(message, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `admin-toast`;
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:99999;background:#1A1A2E;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;animation:slideInRight 0.3s ease;border-left:4px solid ${type === 'success' ? '#22C55E' : '#FF4444'};max-width:400px;font-family:'Poppins',sans-serif;`;
  toast.innerHTML = `<span style="font-size:18px;">${type === 'success' ? '✅' : '❌'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== SUPABASE AUTH =====
let adminAuthed = false;

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  const sucEl = document.getElementById('loginSuccess');
  errEl.textContent = '';
  sucEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const token = data.session.access_token;
    setAdminToken(token);
    sessionStorage.setItem('sasiAdminToken', token);
    adminAuthed = true;
    sucEl.textContent = '✅ Signed in! Loading admin panel...';
    setTimeout(showAdminPanel, 500);
  } catch (err) {
    errEl.textContent = '❌ ' + (err.message || 'Login failed');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function checkAdminAuth() {
  const token = sessionStorage.getItem('sasiAdminToken');
  if (token) {
    try {
      if (!supabaseClient) throw new Error('No Supabase client');
      const { data, error } = await supabaseClient.auth.getUser(token);
      if (error || !data.user) throw new Error('Invalid session');
      setAdminToken(token);
      adminAuthed = true;
      showAdminPanel();
      return;
    } catch (e) {
      sessionStorage.removeItem('sasiAdminToken');
    }
  }
  // Not authenticated — show login
  document.getElementById('loginOverlay').style.display = 'flex';
}

function showAdminPanel() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  initAdminProducts();
  renderDashboard();
}

function adminLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  sessionStorage.removeItem('sasiAdminToken');
  setAdminToken(null);
  adminAuthed = false;
  if (supabaseClient) supabaseClient.auth.signOut();
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginBtn').disabled = false;
  document.getElementById('loginBtn').textContent = 'Sign In';
}

// ===== ADMIN STATE =====
function loadAdminProducts() {
  const fromCache = JSON.parse(localStorage.getItem('supabaseProducts') || '[]');
  const fromEdits = JSON.parse(localStorage.getItem('adminProducts') || '[]');
  const deletedIds = new Set(fromEdits.filter(p => p._deleted).map(p => p.id));
  const map = new Map(SAMPLE_PRODUCTS.filter(p => !deletedIds.has(p.id)).map(p => [p.id, { ...p }]));
  fromCache.filter(p => !deletedIds.has(p.id)).forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
  fromEdits.filter(p => !p._deleted).forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
  return Array.from(map.values());
}
let adminProducts = [];
let _initPromise = null;

async function initAdminProducts() {
  _initPromise = (async () => {
    let fresh = [];
    let errMsg = '';
    try { fresh = await loadProductsFromDB(); } catch(e) { errMsg = e.message; console.warn('Supabase fetch failed:', e); }
    if (fresh && fresh.length) {
      console.log('Supabase returned', fresh.length, 'products');
      const slim = fresh.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, oldPrice: p.old_price || p.oldPrice, image: p.image, images: p.images, rating: p.rating, reviews: p.reviews_count || p.reviews, badge: p.badge, bestSeller: p.is_best_seller === true, is_active: p.is_active !== false, sizes: p.sizes, materials: p.materials, offer: p.offer, customizable: p.customizable, allInclusive: p.allInclusive, whatsappOnly: p.whatsappOnly }));
      let cached = true;
      try { localStorage.setItem('supabaseProducts', JSON.stringify(slim)); } catch(e2) {
        cached = false;
        for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && !k.startsWith('sasi') && k !== 'adminProducts') localStorage.removeItem(k); }
        try { localStorage.setItem('supabaseProducts', JSON.stringify(slim)); cached = true; } catch(e3) { console.warn('Cache full, using in-memory only'); }
      }
      if (!cached) {
        const deleted = new Set(JSON.parse(localStorage.getItem('adminProducts') || '[]').filter(p => p._deleted).map(p => p.id));
        const map = new Map(SAMPLE_PRODUCTS.filter(p => !deleted.has(p.id)).map(p => [p.id, { ...p }]));
        slim.filter(p => !deleted.has(p.id)).forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
        JSON.parse(localStorage.getItem('adminProducts') || '[]').filter(p => !p._deleted).forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
        adminProducts = Array.from(map.values());
        console.log('Merged', adminProducts.length, 'products in-memory (cache was full)');
        return;
      }
    } else {
      console.warn('Supabase returned no products or error:', errMsg || 'empty array');
    }
    adminProducts = loadAdminProducts();
    console.log('Final adminProducts count:', adminProducts.length);
  })();
  return _initPromise;
}

function getLeads() { return JSON.parse(localStorage.getItem('sasiLeads') || '[]'); }
function getOrders() { return JSON.parse(localStorage.getItem('sasiOrders') || '[]'); }
function getCorporate() { return JSON.parse(localStorage.getItem('sasiCorporate') || '[]'); }
function getReminders() { return JSON.parse(localStorage.getItem('sasiReminders') || '[]'); }
function getCampaigns() { return JSON.parse(localStorage.getItem('sasiCampaigns') || '[]'); }
function getNewsletter() { return JSON.parse(localStorage.getItem('sasiNewsletter') || '[]'); }

// ===== TIME =====
function updateTime() {
  document.getElementById('currentTime').textContent = new Date().toLocaleString('en-IN');
}
// ===== TAB SWITCHING =====
function switchTab(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
  renderTab(tab);
}

function renderTab(tab) {
  switch(tab) {
    case 'dashboard': renderDashboard(); break;
    case 'products': renderProducts(); break;
    case 'orders': renderOrders(); break;
    case 'customers': renderCustomers(); break;
    case 'leads': renderLeads(); break;
    case 'loyalty': renderLoyalty(); break;
    case 'campaigns': renderCampaigns(); break;
    case 'reminders': renderReminders(); break;
    case 'corporate': renderCorporate(); break;
    case 'bestsellers': renderBestsellers(); break;
    case 'offers': loadActiveOffer(); renderOfferHistory(); break;
  }
}

// ===== DASHBOARD =====
async function renderDashboard() {
  // Load orders from Supabase first if not already loaded
  if (allOrders.length === 0) {
    try {
      const dbOrders = await loadOrdersFromDB();
      const withItems = await Promise.all((dbOrders || []).map(async (o) => {
        try { const { data: items } = await supabaseFetch(`order_items?order_id=eq.${o.id}`); return { ...o, items: items || [] }; } catch(e) { return { ...o, items: [] }; }
      }));
      allOrders = [...withItems];
      const local = getOrders();
      local.forEach(lo => { if (!allOrders.find(mo => mo.id === lo.id)) allOrders.push(lo); });
      localStorage.setItem('sasiOrders', JSON.stringify(allOrders));
    } catch(e) { /* use local */ }
  }
  const orders = allOrders.length ? allOrders : getOrders();
  const leads = getLeads();
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const thisMonthRevenue = orders.filter(o => new Date(o.created_at || o.date) > new Date(Date.now() - 30*86400000)).reduce((sum, o) => sum + (o.total || 0), 0);
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="icon"><i class="fas fa-shopping-cart"></i></div><div class="label">Total Orders</div><div class="value">${orders.length}</div><div class="change up">+${orders.filter(o => o.status >= 4).length} completed</div></div>
    <div class="stat-card"><div class="icon"><i class="fas fa-rupee-sign"></i></div><div class="label">Total Revenue</div><div class="value">&#8377;${revenue.toLocaleString()}</div><div class="change up">+&#8377;${thisMonthRevenue.toFixed(0)} this month</div></div>
    <div class="stat-card"><div class="icon"><i class="fas fa-users"></i></div><div class="label">Total Leads</div><div class="value">${leads.length}</div><div class="change up">+${leads.filter(l => new Date(l.created_at || l.date) > new Date(Date.now() - 7*86400000)).length} this week</div></div>
    <div class="stat-card"><div class="icon"><i class="fas fa-box"></i></div><div class="label">Products</div><div class="value">${adminProducts.length}</div><div class="change up">${adminProducts.filter(p => p.bestSeller).length} best sellers</div></div>
    <div class="stat-card"><div class="icon"><i class="fas fa-star"></i></div><div class="label">Avg Rating</div><div class="value">4.7</div><div class="change up">&#9733; Excellent</div></div>
    <div class="stat-card"><div class="icon"><i class="fas fa-envelope"></i></div><div class="label">Newsletter Subs</div><div class="value">${getNewsletter().length}</div></div>
  `;
  document.getElementById('recentOrders').innerHTML = orders.slice(-5).reverse().map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer_name || o.customer?.name || 'Guest'}</td>
      <td>${o.items?.length || (o.id ? '1' : '0')} item(s)</td>
      <td>&#8377;${(o.total || 0).toLocaleString()}</td>
      <td><span class="badge ${o.status >= 4 ? 'badge-success' : o.status >= 2 ? 'badge-warning' : 'badge-info'}">${['Pending','Processing','Production','Shipped','Delivered'][o.status] || 'Pending'}</span></td>
      <td>${new Date(o.created_at || o.date).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--gray-600);">No orders yet</td></tr>';
  document.getElementById('topProducts').innerHTML = adminProducts.slice(0, 5).map(p => `
    <tr><td>${p.name}</td><td>${p.category}</td><td>&#8377;${p.price}</td><td>${'★'.repeat(Math.floor(p.rating))}</td><td>${p.reviews || 0} reviews</td></tr>
  `).join('');
}

// ===== PRODUCTS =====
function adminImg(src) { return src ? (src.startsWith('images/') ? '../' + src : src) : '' }
async function renderProducts() {
  if (!adminProducts.length) {
    if (_initPromise) await _initPromise;
    else adminProducts = loadAdminProducts();
  }
  document.getElementById('productTable').innerHTML = adminProducts.map(p => {
    const imgCount = (p.images && p.images.length) || 1;
    const hasOptions = (p.sizes && p.sizes.length) || (p.materials && p.materials.length);
    const hasOffer = p.offer && p.offer.qty && p.offer.price;
    return `<tr>
      <td><img src="${adminImg(p.image)}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">${imgCount > 1 ? `<span style="display:block;font-size:10px;color:var(--gray-600);text-align:center;">+${imgCount-1} more</span>` : ''}</td>
      <td>${p.name ?? ''}</td>
      <td>${p.category ?? ''}</td>
            <td>&#8377;${p.price ?? 0}${hasOffer ? `<br><span style="font-size:10px;color:#FF6B00;">${p.offer.qty} for ₹${p.offer.price}</span>` : ''}</td>
      <td>${p.oldPrice ? '&#8377;'+p.oldPrice : '-'}</td>
      <td>${'★'.repeat(Math.max(0, Math.min(5, Math.floor(Number(p.rating) || 0))))}</td>
      <td style="font-size:11px;">${hasOptions ? '<span style="color:#22C55E;">✓ Options</span>' : '-'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function showAddProduct() {
  document.getElementById('addProductForm').style.display = 'block';
  document.getElementById('addProductForm').scrollIntoView({ behavior: 'smooth' });
}
function hideAddProduct() {
  document.getElementById('addProductForm').style.display = 'none';
}
function handleAdminImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('adminImagePreview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    preview.dataset.imageData = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleOfferImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = document.getElementById('offerImagePreview');
    preview.src = ev.target.result;
    preview.style.display = 'block';
    preview.dataset.imageData = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function addExtraImageRow(url) {
  const container = document.getElementById('extraImagesContainer');
  const row = document.createElement('div');
  row.className = 'extra-image-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  row.innerHTML = `<input type="url" class="pExtraImage" value="${url || ''}" placeholder="Image URL" style="flex:1;padding:8px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:13px;"><button type="button" class="btn btn-outline btn-sm" onclick="this.parentElement.remove()" style="color:#FF4444;border-color:#FF4444;">&times;</button>`;
  container.appendChild(row);
}

function handleExtraImages(e) {
  const files = Array.from(e.target.files);
  const previewContainer = document.getElementById('extraImagesPreview');
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      // Add to preview
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = 'width:80px;height:80px;border-radius:6px;object-fit:cover;border:1px solid #ddd;';
      previewContainer.appendChild(img);
      // Add URL to list
      addExtraImageRow(dataUrl);
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function getExtraImages() {
  const inputs = document.querySelectorAll('.pExtraImage');
  return Array.from(inputs).map(i => i.value).filter(Boolean);
}

function getSizesList() {
  return document.getElementById('pSizes').value.split('\n').map(s => s.trim()).filter(Boolean);
}

function getMaterialsList() {
  return document.getElementById('pMaterials').value.split('\n').map(s => s.trim()).filter(Boolean);
}


async function addProduct() {
  const name = document.getElementById('pName').value;
  const category = document.getElementById('pCategory').value;
  const price = parseInt(document.getElementById('pPrice').value, 10);
  const oldPrice = parseInt(document.getElementById('pOldPrice').value, 10) || 0;
  const rating = parseFloat(document.getElementById('pRating').value) || 0;
  const reviewsCount = parseInt(document.getElementById('pReviews').value, 10) || 0;
  const badge = document.getElementById('pBadge').value;
  const isBestSeller = document.getElementById('pBestSeller').checked;
  const customizable = document.getElementById('pCustomizable').checked;
  const preview = document.getElementById('adminImagePreview');
  let image = preview.dataset.imageData || preview.src || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400';
  if (!name || !price) { alert('Please fill required fields'); return; }

  // Upload image to Supabase Storage if it's a new upload
  if (image.startsWith('data:')) {
    const ext = image.split(';')[0].split('/')[1] || 'jpg';
    const blob = await (await fetch(image)).blob();
    const file = new File([blob], `product.${ext}`, { type: `image/${ext}` });
    const filePath = generateFilePath('products', ext);
    const { url, error } = await uploadImage('products', filePath, file);
    if (url) image = url;
    else console.warn('Image upload failed, using local:', error);
  }

  const extraImages = getExtraImages();
  const sizes = getSizesList();
  const materials = getMaterialsList();
  const allImages = [image, ...extraImages].filter(Boolean);
  const offerQty = parseInt(document.getElementById('pOfferQty').value);
  const offerPrice = parseInt(document.getElementById('pOfferPrice').value);
  const offer = (offerQty && offerPrice) ? { qty: offerQty, price: offerPrice } : null;
  const newProduct = {
    name, category, price, old_price: oldPrice,
    image, images: allImages, sizes, materials, offer,
    rating, reviews_count: reviewsCount, badge,
    is_best_seller: isBestSeller, customizable,
    is_active: true, stock: 100
  };
  // Save to Supabase first to get the real ID
  let dbId = null;
  let supabaseError = false;
  let supabaseErrorMsg = '';
  try {
    const r = await saveProductToDB(newProduct);
    if (r.error) {
      supabaseError = true;
      supabaseErrorMsg = typeof r.error === 'string' ? r.error.slice(0, 200) : JSON.stringify(r.error);
      console.error('Supabase save error:', r.error);
    } else if (r.data && r.data.length > 0) {
      dbId = r.data[0].id;
    }
  } catch(e) {
    supabaseError = true;
    supabaseErrorMsg = e.message || e;
    console.warn('Product saved locally, Supabase sync skipped:', e.message);
  }
  const finalId = dbId || Date.now();
  adminProducts.push({ ...newProduct, id: finalId, oldPrice, reviews: reviewsCount, bestSeller: isBestSeller, db_id: dbId });
  const msg = supabaseError
    ? 'Saved locally. Supabase sync failed: ' + (supabaseErrorMsg || 'unknown error')
    : 'Product added successfully' + (dbId ? ' & synced to Supabase!' : '!');
  const isErr = supabaseError;
  try { localStorage.setItem('adminProducts', JSON.stringify(adminProducts)); } catch(e) {
    adminProducts.pop();
    showToast('Failed to save: ' + e.message, 'error');
    return;
  }
  try { await renderProducts(); } catch(e) {
    document.getElementById('productTable').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#FF4444;">Render error: ' + e.message + '</td></tr>';
  }
  hideAddProduct();
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pOldPrice').value = '';
  preview.src = '';
  preview.style.display = 'none';
  delete preview.dataset.imageData;
  try { showToast(msg, isErr ? 'error' : 'success'); } catch(e) { alert(msg); }
}
async function editProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  const name = prompt('Product name:', p.name);
  if (name) p.name = name;
  const price = prompt('Price:', p.price);
  if (price) p.price = parseInt(price);
  const category = prompt('Category:', p.category || '');
  if (category) p.category = category;
  const sizesStr = prompt('Sizes (comma-separated, leave blank to keep):', (p.sizes || []).join(', '));
  if (sizesStr !== null) p.sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean);
  const materialsStr = prompt('Materials (comma-separated, leave blank to keep):', (p.materials || []).join(', '));
  if (materialsStr !== null) p.materials = materialsStr.split(',').map(s => s.trim()).filter(Boolean);
  const imageUrl = prompt('Image URL (leave blank to keep current):', '');
  if (imageUrl) p.image = imageUrl;
  const extraImages = prompt('Extra image URLs (comma-separated):', (p.images || []).slice(1).join(', '));
  if (extraImages !== null) {
    const newExtra = extraImages.split(',').map(s => s.trim()).filter(Boolean);
    p.images = [p.image, ...newExtra];
  }
  p.customizable = confirm(`Customizable? (Current: ${p.customizable !== false ? 'Yes' : 'No'})\n\nOK = Yes, Cancel = No`);
  localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
  renderProducts();
  // Sync to Supabase if product has a db_id
  const dbId = p?.db_id || p?.id;
  if (dbId && typeof dbId === 'number' && dbId < 999999999) {
    try {
      const updates = {};
      if (name) updates.name = name;
      if (price) updates.price = parseInt(price);
      if (category) updates.category = category;
      if (imageUrl) updates.image = imageUrl;
      if (sizesStr) updates.sizes = p.sizes;
      if (materialsStr) updates.materials = p.materials;
      if (extraImages) updates.images = p.images;
      updates.customizable = p.customizable !== false;
      const r = await updateProductInDB(dbId, updates);
      if (r.error) console.error('Supabase update error:', r.error);
    } catch(e) {
      console.warn('Supabase sync skipped:', e.message);
    }
  }
}
async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const p = adminProducts.find(x => x.id === id);
  // Mark as deleted (keeps it in adminProducts so the flag propagates to the main site)
  adminProducts = adminProducts.map(x => x.id === id ? { ...x, _deleted: true } : x);
  localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
  renderProducts();
  // Delete from Supabase
  let dbId = p?.db_id || p?.id;
  if (!dbId) { console.warn('No ID for this product'); return; }
  // If dbId is a Date.now() number (local-only product), skip DB delete
  if (typeof dbId === 'number' && dbId > 999999999) { return; }
  try { const r = await deleteProductFromDB(dbId); if (r.error) console.error('Supabase delete error:', r.error); } catch(e) { console.warn('Supabase sync skipped:', e.message); }
}

// ===== ORDERS =====
let allOrders = [];

async function loadOrders() {
  const local = getOrders();
  try {
    const dbOrders = await loadOrdersFromDB();
    // Fetch items for each DB order
    const withItems = await Promise.all((dbOrders || []).map(async (o) => {
      try {
        const { data: items } = await supabaseFetch(`order_items?order_id=eq.${o.id}`);
        return { ...o, items: items || [] };
      } catch(e) {
        return { ...o, items: [] };
      }
    }));
    // Merge DB orders (primary) with local orders (fallback)
    const merged = [...withItems];
    local.forEach(lo => {
      if (!merged.find(mo => mo.id === lo.id)) merged.push(lo);
    });
    allOrders = merged;
  } catch(e) {
    console.warn('Supabase orders unavailable, using local:', e.message);
    allOrders = local;
  }
  localStorage.setItem('sasiOrders', JSON.stringify(allOrders));
  renderOrdersTable();
}

async function renderOrders() {
  document.getElementById('orderTable').innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;">Loading orders...</td></tr>';
  await loadOrders();
}

function renderOrdersTable() {
  const table = document.getElementById('orderTable');
  if (!table) return;
  table.innerHTML = allOrders.length ? allOrders.map(o => {
    const itemsCount = o.items?.length || 0;
    const hasCustom = (o.items || []).some(i => {
      let c = i.customization;
      if (typeof c === 'string') { try { c = JSON.parse(c); } catch(e) { c = null; } }
      return c && (c.size || c.material || c.text || c.font || c.photo || (i.image && !i.image.includes('unsplash')));
    });
    const custName = o.customer_name || o.customer?.name || 'Guest';
    const deliveryInfo = [o.city, o.state, o.pincode].filter(Boolean).join(', ');
    return `<tr>
      <td><strong>${o.id}</strong></td>
      <td>${custName}<br><small style="color:var(--gray-600);">${o.customer_email || ''}</small><br><small style="color:var(--gray-600);">${o.customer_phone || ''}</small></td>
      <td>${itemsCount}${hasCustom ? ' <span style="display:inline-block;background:#F59E0B;color:#fff;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600;">Custom</span>' : ''}</td>
      <td>&#8377;${(o.total || 0).toLocaleString()}</td>
      <td><span class="badge ${o.payment_id ? 'badge-success' : 'badge-warning'}">${o.payment_id ? 'Paid' : 'Pending'}</span></td>
      <td><select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--gray-200);">
        ${['Pending','Processing','Production','Shipped','Delivered'].map((s, i) => `<option value="${i}" ${(o.status || 0) == i ? 'selected':''}>${s}</option>`).join('')}
      </select></td>
      <td style="font-size:12px;">${o.shipping_address ? o.shipping_address.substring(0, 30) + '...' : ''}<br><small style="color:var(--gray-600);">${deliveryInfo}</small></td>
      <td>${new Date(o.date || o.created_at).toLocaleDateString('en-IN')}</td>
      <td><button class="btn btn-outline btn-sm" onclick="viewOrderBill('${o.id}')"><i class="fas fa-file-invoice"></i></button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" style="text-align:center;padding:40px;">No orders yet. Orders placed via Razorpay will appear here.</td></tr>';
}

async function updateOrderStatus(id, status) {
  const order = allOrders.find(o => o.id === id);
  if (order) {
    order.status = parseInt(status);
    localStorage.setItem('sasiOrders', JSON.stringify(allOrders));
    try { await updateOrderStatusInDB(id, status); } catch(e) { /* local only */ }
  }
}

function normalizeItem(i) {
  const name = i.product_name || i.name || 'Item';
  const qty = i.quantity || i.qty || 1;
  const price = i.product_price || i.price || 0;
  let cust = i.customization;
  if (typeof cust === 'string') { try { cust = JSON.parse(cust); } catch(e) { cust = null; } }
  return { name, qty, price, customization: cust || {}, image: i.image || (cust && (cust.photos ? cust.photos[0] : cust.photo)) || '' };
}

function openImage(src) {
  if (!src) return;
  const w = window.open('', '_blank');
  if (w) { w.document.write(`<img src="${src}" style="max-width:100%;">`); return; }
  // fallback: create a temp link
  const a = document.createElement('a');
  a.href = src;
  a.target = '_blank';
  a.rel = 'noopener';
  a.click();
}

function downloadImage(src, filename) {
  if (!src) return;
  // For data URLs, create a downloadable link
  const a = document.createElement('a');
  a.href = src;
  a.download = filename || 'customization-image';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function viewOrderBill(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  const rawItems = order.items || [];
  console.log('Order items raw:', rawItems.map(i => ({ name: i.name || i.product_name, cust: i.customization })));
  const items = rawItems.map(normalizeItem);
  const statusLabels = ['Pending','Processing','Production','Shipped','Delivered'];
  const date = new Date(order.created_at || order.date).toLocaleString('en-IN');
  const itemsHtml = items.length ? items.map(i => {
    const cust = i.customization || {};
    // Photos can be in cust.photos (array, modal flow), cust.photo (single, legacy), or i.image (builder flow)
    const userPhotos = (Array.isArray(cust.photos) && cust.photos.length) ? cust.photos : [];
    if (cust.photo && !userPhotos.includes(cust.photo)) userPhotos.push(cust.photo);
    if (i.image && !userPhotos.includes(i.image) && !i.image.includes('unsplash')) userPhotos.push(i.image);
    const willShow = [cust.size, cust.material, cust.font, (cust.text && cust.text !== 'No text') ? 'x' : null, userPhotos.length ? '📸' : null].filter(Boolean);
    const photoHtml = userPhotos.length ? userPhotos.map((url, pi) =>
      `<img src="${url}" style="max-width:120px;max-height:120px;border-radius:4px;margin:4px;object-fit:cover;border:1px solid #ddd;cursor:pointer;vertical-align:top;" onclick="openImage(this.src)" title="Click to view larger"><button onclick="downloadImage('${url}','photo-${order.id}-${pi}')" style="display:block;margin:0 auto 4px;padding:2px 8px;background:#1A1A2E;color:#fff;border:none;border-radius:4px;font-size:10px;cursor:pointer;">Download</button>`
    ).join('') : '';
    const custDetails = willShow.length ? `
      <div style="margin-top:6px;font-size:12px;color:#555;background:#f9f9f9;padding:8px 10px;border-radius:6px;border-left:3px solid #1A1A2E;">
        ${cust.size ? `<div><strong>Size:</strong> ${cust.size}</div>` : ''}
        ${cust.material ? `<div><strong>Material:</strong> ${cust.material}</div>` : ''}
        ${cust.font ? `<div><strong>Font:</strong> ${cust.font}</div>` : ''}
        ${cust.text && cust.text !== 'No text' ? `<div><strong>Text:</strong> "${cust.text}"</div>` : ''}
        ${userPhotos.length ? `<div style="margin-top:4px;"><strong>Customer Photos (${userPhotos.length}):</strong><br>${photoHtml}</div>` : ''}
      </div>` : '';
    const imagePreview = i.image && !i.image.startsWith('data:') && !i.image.includes('unsplash') ?
      `<img src="${i.image}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:6px;">` : '';
    return `<tr><td>${imagePreview}${i.name}${custDetails}</td><td style="text-align:center;">${i.qty}</td><td style="text-align:right;">₹${i.price.toLocaleString()}</td><td style="text-align:right;">₹${(i.price * i.qty).toLocaleString()}</td></tr>`;
  }).join('') : '<tr><td colspan="4" style="text-align:center;">No items</td></tr>';

  const bill = `
    <div style="position:fixed;inset:0;z-index:9999;padding:10px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);" onclick="document.getElementById('billOverlay').remove()"></div>
      <div id="billOverlay" style="position:relative;background:#fff;border-radius:12px;max-width:95vw;width:700px;max-height:90vh;overflow-y:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:scaleIn 0.3s ease;">
        <button onclick="this.closest('#billOverlay').parentElement.remove()" style="position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;background:#f0f0f0;border:none;font-size:16px;cursor:pointer;z-index:1;">&times;</button>
        <div style="text-align:center;margin-bottom:20px;border-bottom:2px dashed #ddd;padding-bottom:16px;">
          <h2 style="font-family:'Playfair Display',serif;color:#1A1A2E;margin:0;">Sasi Arts</h2>
          <small style="color:#999;">Photo Frames & Gifts · Rajanagaram</small>
          <h3 style="margin:8px 0 4px;color:#333;">TAX INVOICE / DELIVERY CHALLAN</h3>
          <p style="margin:0;font-size:13px;color:#666;">Order: <strong>${order.id}</strong> | Date: ${date}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:16px;background:var(--gray-50);padding:16px;border-radius:8px;">
          <div style="grid-column:1/-1;font-weight:700;color:var(--dark);margin-bottom:4px;">📦 CUSTOMER DETAILS FOR DELIVERY</div>
          <div><strong>Name:</strong> ${order.customer_name || order.customer?.name || 'N/A'}</div>
          <div><strong>Phone:</strong> ${order.customer_phone || order.customer?.phone || order.delivery?.phone || 'N/A'}</div>
          <div><strong>Email:</strong> ${order.customer_email || order.customer?.email || order.delivery?.email || 'N/A'}</div>
          <div><strong>Payment:</strong> ${order.payment_id ? '✅ Paid (Razorpay)' : '⏳ Pending'}</div>
          <div style="grid-column:1/-1;"><strong>Address:</strong> ${order.shipping_address || order.delivery?.address || 'N/A'}</div>
          <div><strong>City:</strong> ${order.city || order.delivery?.city || ''}</div>
          <div><strong>State:</strong> ${order.state || order.delivery?.state || ''}</div>
          <div style="grid-column:1/-1;"><strong>Pincode:</strong> ${order.pincode || order.delivery?.pincode || ''}</div>
          ${order.payment_id ? `<div style="grid-column:1/-1;"><strong>Payment ID:</strong> ${order.payment_id}</div>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
          <thead><tr style="background:#1A1A2E;color:#fff;"><th style="padding:8px 12px;text-align:left;">Item Details</th><th style="padding:8px 12px;">Qty</th><th style="padding:8px 12px;">Rate</th><th style="padding:8px 12px;">Amount</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="border-top:1px solid #eee;padding-top:12px;font-size:14px;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>₹${(order.subtotal || 0).toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Delivery</span><span>₹${(order.shipping || order.deliveryCharge || 0).toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>GST (Fixed ₹23.33)</span><span>₹${(order.tax || 0).toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;border-top:2px solid #333;padding-top:8px;margin-top:8px;">
            <span>Total</span><span>₹${(order.total || 0).toLocaleString()}</span>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;font-size:12px;color:#999;border-top:1px dashed #ddd;padding-top:12px;">
          <p style="margin:0;">🔒 Paid via Razorpay | Status: <strong>${statusLabels[order.status || 0]}</strong></p>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', bill);
}

// renderOrders is defined above — calls loadOrders internally

// ===== CUSTOMERS =====
function renderCustomers() {
  const orders = getOrders();
  const customersMap = new Map();
  orders.forEach(o => {
    const email = o.customer_email || o.customer?.email;
    if (email) {
      const cust = {
        name: o.customer_name || o.customer?.name || 'N/A',
        email,
        phone: o.customer_phone || o.customer?.phone || 'N/A'
      };
      if (!customersMap.has(email)) customersMap.set(email, cust);
    }
  });
  const customers = [...customersMap.values()];
  document.getElementById('customerTable').innerHTML = customers.length ? customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${orders.filter(o => (o.customer_email || o.customer?.email) === c.email).length}</td>
      <td>${new Date().toLocaleDateString('en-IN')}</td>
      <td><span class="badge badge-success">Active</span></td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;">No customers yet</td></tr>';
}

// ===== LEADS =====
function renderLeads() {
  const leads = getLeads();
  document.getElementById('leadTable').innerHTML = leads.length ? leads.map(l => `
    <tr>
      <td>${l.name || 'N/A'}</td>
      <td>${l.phone}</td>
      <td>${l.email || 'N/A'}</td>
      <td>${l.birthday || 'N/A'}</td>
      <td><span class="badge badge-success">${l.coupon || 'SASI10'}</span></td>
      <td>${new Date(l.created_at || l.date).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;">No leads yet</td></tr>';
}
function exportLeads() {
  const leads = getLeads();
  if (!leads.length) { alert('No leads to export'); return; }
  let csv = 'Name,Phone,Email,Birthday,Coupon,Date\n';
  leads.forEach(l => { csv += `"${l.name}","${l.phone}","${l.email}","${l.birthday}","${l.coupon}","${l.created_at || l.date}"\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ===== LOYALTY =====
function renderLoyalty() {
  const orders = getOrders();
  const customersMap = new Map();
  orders.forEach(o => {
    const email = o.customer_email || o.customer?.email;
    if (email) {
      const name = o.customer_name || o.customer?.name || 'N/A';
      const phone = o.customer_phone || o.customer?.phone || '';
      if (!customersMap.has(email)) customersMap.set(email, { name, email, phone });
    }
  });
  const customers = [...customersMap.values()];
  document.getElementById('loyaltyTable').innerHTML = customers.length ? customers.map((c, i) => {
    const orderCount = orders.filter(o => (o.customer_email || o.customer?.email) === c.email).length;
    const points = orderCount * 50;
    const tier = points >= 1000 ? 'Gold' : points >= 500 ? 'Silver' : 'Bronze';
    return `<tr>
      <td>${c.name || 'N/A'}</td>
      <td><strong>${points}</strong></td>
      <td><span class="badge ${tier === 'Gold' ? 'badge-warning' : tier === 'Silver' ? 'badge-info' : 'badge-success'}">${tier}</span></td>
      <td>${Math.floor(orderCount / 3)}</td>
      <td>${orderCount}</td>
      <td><button class="btn btn-primary btn-sm" onclick="addPoints('${c.email}')">Add Points</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" style="text-align:center;">No loyalty data</td></tr>';
}
function addPoints(email) {
  alert(`Points added for ${email}`);
}

// ===== OFFERS =====
function loadOfferForm() {
  const saved = JSON.parse(localStorage.getItem('sasiCurrentOffer') || '{}');
  if (saved.title) {
    document.getElementById('offerTitle').value = saved.title || '';
    document.getElementById('offerDesc').value = saved.desc || '';
    document.getElementById('offerPrice').value = saved.price || '';
    document.getElementById('offerOldPrice').value = saved.oldPrice || '';
    document.getElementById('offerStock').value = saved.stock || '';
    if (saved.image) {
      const preview = document.getElementById('offerImagePreview');
      preview.src = saved.image;
      preview.style.display = 'block';
      delete preview.dataset.imageData;
    }
    document.getElementById('offerActive').checked = saved.active !== false;
    if (saved.expiry) document.getElementById('offerExpiry').value = saved.expiry.slice(0, 16);
    calcOfferDiscount();
  }
  document.getElementById('offerSyncStatus').textContent = '📋 Loaded from database';
}

function calcOfferDiscount() {
  const price = parseFloat(document.getElementById('offerPrice').value) || 0;
  const old = parseFloat(document.getElementById('offerOldPrice').value) || 0;
  if (old > 0 && price > 0) {
    const disc = Math.round((1 - price / old) * 100);
    document.getElementById('offerDiscount').value = Math.min(100, Math.max(0, disc)) + '%';
  } else {
    document.getElementById('offerDiscount').value = '—';
  }
}
document.getElementById('offerPrice')?.addEventListener('input', calcOfferDiscount);
document.getElementById('offerOldPrice')?.addEventListener('input', calcOfferDiscount);

async function updateOffer() {
  const title = document.getElementById('offerTitle').value.trim();
  const desc = document.getElementById('offerDesc').value.trim();
  const price = document.getElementById('offerPrice').value;
  const oldPrice = document.getElementById('offerOldPrice').value;
  const stock = parseInt(document.getElementById('offerStock').value) || 0;
  const offerPreview = document.getElementById('offerImagePreview');
  const image = offerPreview.dataset.imageData || offerPreview.src || '';
  const active = document.getElementById('offerActive').checked;
  const expiry = document.getElementById('offerExpiry').value;

  if (!title || !price) { alert('Please fill product name and price'); return; }

  const localOffer = {
    title, desc, price, oldPrice, stock, image, active,
    discount: Math.round((1 - price / oldPrice) * 100) + '%',
    expiry: expiry ? new Date(expiry).toISOString() : new Date(Date.now() + 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('sasiCurrentOffer', JSON.stringify(localOffer));
  document.getElementById('offerSyncStatus').textContent = '⏳ Syncing to Supabase...';

  const offerData = {
    title,
    description: desc,
    offer_price: parseFloat(price),
    old_price: parseFloat(oldPrice),
    stock_remaining: parseInt(stock) || 0,
    image,
    is_active: active,
    discount_percent: Math.round((1 - price / oldPrice) * 100),
    expires_at: expiry ? new Date(expiry).toISOString() : new Date(Date.now() + 86400000).toISOString()
  };

  try {
    const { data, error } = await supabaseFetch('offers?is_active=eq.true&limit=1&order=created_at.desc');
    if (error) throw new Error(error);
    if (data && data.length > 0) {
      const r = await supabaseFetch(`offers?id=eq.${data[0].id}`, { method: 'PATCH', body: JSON.stringify(offerData) });
      if (r.error) throw new Error(r.error);
    } else {
      const r = await supabaseFetch('offers', { method: 'POST', body: JSON.stringify(offerData) });
      if (r.error) throw new Error(r.error);
    }
    document.getElementById('offerSyncStatus').textContent = '✅ Synced to Supabase! Homepage will show this deal.';
  } catch(e) {
    const errMsg = (e.message || '').slice(0, 150);
    document.getElementById('offerSyncStatus').textContent = `⚠️ Saved locally. Supabase error: ${errMsg}`;
    console.error('Offer sync error:', e.message);
  }

  renderOfferHistory();
  showToast('Today\'s deal updated!');
}

function renderOfferHistory() {
  const table = document.getElementById('offerHistoryTable');
  if (!table) return;
  const saved = JSON.parse(localStorage.getItem('sasiCurrentOffer') || '{}');
  if (!saved.title) {
    table.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-600);">No offers yet. Create one above.</td></tr>';
    return;
  }
  table.innerHTML = `<tr>
    <td>${saved.title}</td>
    <td>₹${saved.price}</td>
    <td>${saved.discount || Math.round((1 - saved.price/saved.oldPrice)*100) + '%'}</td>
    <td>${saved.stock}</td>
    <td><span class="badge badge-success">Active</span></td>
    <td>${saved.expiry ? new Date(saved.expiry).toLocaleDateString('en-IN') : 'N/A'}</td>
    <td><button class="btn btn-outline btn-sm" onclick="loadOfferForm()">Edit</button></td>
  </tr>`;
}

function previewDeal() {
  showToast('👀 Check homepage to see the deal live!');
}

async function loadActiveOffer() {
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
    }
  } catch(e) { /* ignore */ }
  const saved = JSON.parse(localStorage.getItem('sasiCurrentOffer') || '{}');
  if (saved.title) {
    document.getElementById('offerTitle').value = saved.title || '';
    document.getElementById('offerDesc').value = saved.desc || '';
    document.getElementById('offerPrice').value = saved.price || '';
    document.getElementById('offerOldPrice').value = saved.oldPrice || '';
    document.getElementById('offerStock').value = saved.stock || '';
    if (saved.image) {
      const preview = document.getElementById('offerImagePreview');
      preview.src = saved.image;
      preview.style.display = 'block';
      delete preview.dataset.imageData;
    }
    calcOfferDiscount();
  }
}

// ===== CAMPAIGNS =====
function renderCampaigns() {
  const campaigns = getCampaigns();
  document.getElementById('campaignTable').innerHTML = campaigns.length ? campaigns.map(c => `
    <tr>
      <td>${c.name}</td>
      <td><span class="badge badge-info">${c.type}</span></td>
      <td>${c.recipients}</td>
      <td>${c.sent}</td>
      <td><span class="badge badge-success">Sent</span></td>
      <td>${new Date(c.date).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;padding:40px;">No campaigns sent yet. Use the buttons above to send.</td></tr>';
}
function sendCampaign(type) {
  const leads = getLeads();
  if (!leads.length) { alert('No leads in database to send campaign'); return; }
  const names = {
    birthday: '🎂 Birthday Wishes Campaign',
    festival: '🎉 Festival Greetings Campaign',
    promo: '🏷️ Promotional Offer Campaign'
  };
  const messages = {
    birthday: `Hi! 🎂 Happy Birthday from Sasi Arts! Enjoy special birthday discounts on personalized gifts. Visit sasiarts.website to explore! 🎁`,
    festival: `🎉 Wishing you a wonderful festive season! Sasi Arts has exclusive festive offers on customized gifts. Check them out at sasiarts.in ✨`,
    promo: `🏷️ Special Offer from Sasi Arts! Get flat discounts on personalized photo frames, LED frames & more. Shop now at sasiarts.website ❤️`
  };
  const campaign = {
    name: names[type] || 'Campaign',
    type,
    recipients: leads.length,
    sent: leads.length,
    date: new Date().toISOString()
  };
  const campaigns = getCampaigns();
  campaigns.push(campaign);
  localStorage.setItem('sasiCampaigns', JSON.stringify(campaigns));
  renderCampaigns();
  // Log leads that would receive the campaign
  const leadPhones = leads.map(l => l.phone).join(', ');
  const waLink = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(messages[type] || messages.promo)}`;
  if (confirm(`✅ ${campaign.name}\n\nCampaign recorded for ${leads.length} leads.\n\nClick OK to preview the message on WhatsApp.`)) {
    window.open(waLink, '_blank');
  }
}

// ===== REMINDERS =====
function renderReminders() {
  const reminders = getReminders();
  document.getElementById('reminderTable').innerHTML = reminders.length ? reminders.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.phone}</td>
      <td><span class="badge badge-info">${r.type}</span></td>
      <td>${new Date(r.date).toLocaleDateString('en-IN')}</td>
      <td>${r.recipient}</td>
      <td><span class="badge badge-success">Active</span></td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;">No reminders set</td></tr>';
}

// ===== CORPORATE =====
async function renderCorporate() {
  const local = getCorporate();
  let hasRemote = false;
  try {
    const dbInquiries = await loadCorporateFromDB();
    if (dbInquiries.length > 0) hasRemote = true;
    // Merge DB inquiries into local, avoiding duplicates by phone+email
    dbInquiries.forEach(di => {
      const dup = local.find(li => li.id === di.id || (li.phone === di.phone && li.email === di.email));
      if (!dup) local.push(di);
    });
    // Save merged data back to localStorage so Supabase data persists
    localStorage.setItem('sasiCorporate', JSON.stringify(local));
  } catch(e) { /* local only */ }
  document.getElementById('corporateTable').innerHTML = local.length ? local.map(i => `
    <tr>
      <td><strong>${i.company_name || i.company || 'N/A'}</strong></td>
      <td>${i.contact_person || i.name}</td>
      <td>${i.phone}</td>
      <td>${i.product_interest || i.product}</td>
      <td>${i.quantity || 'N/A'}</td>
      <td>${i.needs_gst || i.gst ? '✅ Yes' : '❌ No'}</td>
      <td>${i.created_at || i.date ? new Date(i.created_at || i.date).toLocaleDateString('en-IN') : 'N/A'}</td>
    </tr>
  `).join('') : '<tr><td colspan="7" style="text-align:center;">No corporate inquiries</td></tr>';
}

// ===== BEST SELLERS =====
async function renderBestsellers() {
  if (!adminProducts.length && _initPromise) await _initPromise;
  const table = document.getElementById('bestsellerTable');
  if (!table) return;
  table.innerHTML = adminProducts.map(p => {
    const isBest = p.is_best_seller || p.bestSeller;
    return `<tr>
      <td><img src="${adminImg(p.image)}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>&#8377;${p.price}</td>
      <td>${'★'.repeat(Math.floor(p.rating))}${p.rating % 1 >= 0.5 ? '½' : ''}</td>
      <td><span class="badge ${isBest ? 'badge-success' : 'badge-danger'}" style="font-size:12px;">${isBest ? '⭐ YES' : '—'}</span></td>
      <td>
        <button class="btn ${isBest ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="toggleBestseller(${p.id})">
          <i class="fas ${isBest ? 'fa-times' : 'fa-star'}"></i> ${isBest ? 'Remove' : 'Set as Best Seller'}
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function toggleBestseller(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  const newVal = !(p.is_best_seller || p.bestSeller);
  p.is_best_seller = newVal;
  p.bestSeller = newVal;
  localStorage.setItem('adminProducts', JSON.stringify(adminProducts));
  renderBestsellers();
  showToast(`${p.name} ${newVal ? 'added to' : 'removed from'} Best Sellers`);
  // Sync to Supabase using the actual DB id if available
  const dbId = p.db_id || p.id;
  try {
    const r = await updateProductInDB(dbId, { is_best_seller: newVal });
    if (r.error) console.error('Supabase sync error:', r.error);
  } catch(e) {
    console.warn('Synced locally, Supabase sync skipped:', e.message);
  }
}

// ===== EXPORT DATA =====
function exportData() {
  const data = {
    products: adminProducts,
    orders: getOrders(),
    leads: getLeads(),
    campaigns: getCampaigns()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sasi-arts-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  alert('Data exported successfully!');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Cache buster — force refresh if sample products changed
  const CACHE_VERSION = typeof dataHash === 'function' ? dataHash() : '7';
  if (localStorage.getItem('sasiCacheVersion') !== CACHE_VERSION) {
    localStorage.removeItem('adminProducts');
    localStorage.removeItem('supabaseProducts');
    localStorage.setItem('sasiCacheVersion', CACHE_VERSION);
  }
  // Populate product category dropdown
  const catSelect = document.getElementById('pCategory');
  if (catSelect && typeof CONFIG !== 'undefined') {
    catSelect.innerHTML = CONFIG.PRODUCT_CATEGORIES.map(c => `<option>${c}</option>`).join('');
  }
  checkAdminAuth();
  updateTime();
  setInterval(updateTime, 1000);
  // Admin upload zone drag/drop
  const zone = document.getElementById('adminUploadZone');
  if (zone) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; zone.style.background = 'rgba(255,107,0,0.05)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = 'var(--gray-200)'; zone.style.background = ''; });
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.style.borderColor = 'var(--gray-200)'; zone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.getElementById('adminImagePreview');
          preview.src = e.target.result;
          preview.style.display = 'block';
          preview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  // Offer upload zone drag/drop
  const offerZone = document.getElementById('offerUploadZone');
  if (offerZone) {
    offerZone.addEventListener('dragover', (e) => { e.preventDefault(); offerZone.style.borderColor = 'var(--primary)'; offerZone.style.background = 'rgba(255,107,0,0.05)'; });
    offerZone.addEventListener('dragleave', () => { offerZone.style.borderColor = 'var(--gray-200)'; offerZone.style.background = ''; });
    offerZone.addEventListener('drop', (e) => {
      e.preventDefault(); offerZone.style.borderColor = 'var(--gray-200)'; offerZone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = document.getElementById('offerImagePreview');
          preview.src = e.target.result;
          preview.style.display = 'block';
          preview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
