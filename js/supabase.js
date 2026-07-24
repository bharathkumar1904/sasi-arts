// ============================================================
// SUPABASE REST API CLIENT (No library needed - works out of box)
// Uses Supabase REST API directly via fetch
// ============================================================

let ADMIN_AUTH_TOKEN = null;

function setAdminToken(token) {
  ADMIN_AUTH_TOKEN = token;
}

const SUPABASE_URL = CONFIG.SUPABASE_URL;

let supabaseClient = null;
try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
} catch(e) { /* not in admin context */ }

async function supabaseFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = method !== 'GET' && method !== 'HEAD';
  const url = `${SUPABASE_URL}/rest/v1/${path}${path.includes('?') ? '&' : '?'}apikey=${CONFIG.SUPABASE_ANON_KEY}`;
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = method !== 'GET' && method !== 'HEAD';
  const headers = {
    'apikey': CONFIG.SUPABASE_ANON_KEY,
    'Authorization': ADMIN_AUTH_TOKEN ? `Bearer ${ADMIN_AUTH_TOKEN}` : `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
  };
  if (isWrite) {
    headers['Content-Type'] = 'application/json';
    headers['Prefer'] = 'return=representation';
  }
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`Supabase error (${res.status}): ${err}`);
    return { data: null, error: err };
  }
  const data = await res.json();
  return { data, error: null };
}

// ===== PRODUCTS =====
async function loadProductsFromDB() {
  const { data, error } = await supabaseFetch('products?select=*&order=created_at.desc');
  if (error) throw new Error(error);
  return data || [];
}

async function saveProductToDB(product) {
  return await supabaseFetch('products', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

async function updateProductInDB(id, updates) {
  return await supabaseFetch(`products?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

async function deleteProductFromDB(id) {
  return await supabaseFetch(`products?id=eq.${id}`, { method: 'DELETE' });
}

// ===== LEADS =====
async function saveLeadToDB(lead) {
  return await supabaseFetch('leads', {
    method: 'POST',
    body: JSON.stringify(lead)
  });
}

// ===== ORDERS =====
async function saveOrderToDB(order) {
  const result = await supabaseFetch('orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
  if (result.error) throw new Error('saveOrderToDB: ' + result.error);
  return result;
}

// ===== ORDER ITEMS =====
async function saveOrderItemsToDB(items) {
  const result = await supabaseFetch('order_items', {
    method: 'POST',
    body: JSON.stringify(items)
  });
  if (result.error) throw new Error('saveOrderItemsToDB: ' + result.error);
  return result;
}

// ===== LOAD ORDERS =====
async function loadOrdersFromDB() {
  const { data } = await supabaseFetch('orders?select=*&order=created_at.desc');
  return data || [];
}

async function saveOrderWithItems(order, items) {
  const orderResult = await supabaseFetch('orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
  if (orderResult.error) throw new Error('saveOrderWithItems - order: ' + orderResult.error);
  if (items && items.length > 0) {
    const itemsResult = await supabaseFetch('order_items', {
      method: 'POST',
      body: JSON.stringify(items)
    });
    if (itemsResult.error) console.warn('Order items save warning:', itemsResult.error);
  }
  return orderResult;
}

async function loadOrderWithItems(orderId) {
  const { data: order } = await supabaseFetch(`orders?id=eq.${orderId}&limit=1`);
  if (order && order.length > 0) {
    const { data: items } = await supabaseFetch(`order_items?order_id=eq.${orderId}`);
    return { ...order[0], items: items || [] };
  }
  return null;
}

// ===== UPDATE ORDER STATUS =====
async function updateOrderStatusInDB(id, status) {
  return await supabaseFetch(`orders?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: parseInt(status) })
  });
}

// ===== REVIEWS =====
async function saveReviewToDB(review) {
  const result = await supabaseFetch('reviews', {
    method: 'POST',
    body: JSON.stringify(review)
  });
  if (result.error) throw new Error('saveReviewToDB: ' + result.error);
  return result;
}

async function loadReviewsForProduct(productId) {
  const { data } = await supabaseFetch(`reviews?product_id=eq.${productId}&order=created_at.desc`);
  return data || [];
}

// ===== LOAD ORDER ITEMS =====
async function loadOrderItemsFromDB(orderId) {
  const { data } = await supabaseFetch(`order_items?order_id=eq.${orderId}`);
  return data || [];
}

// ===== CUSTOMERS =====
async function saveCustomerToDB(customer) {
  return await supabaseFetch('customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  });
}

// ===== LEADS =====
async function fetchLeadsFromDB() {
  const { data } = await supabaseFetch('leads?select=*&order=created_at.desc');
  return data || [];
}

// ===== CAMPAIGNS =====
async function saveCampaignToDB(campaign) {
  return await supabaseFetch('campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign)
  });
}

// ===== CORPORATE ORDERS =====
async function saveCorporateToDB(inquiry) {
  const result = await supabaseFetch('corporate_orders?select=id', {
    method: 'POST',
    body: JSON.stringify(inquiry)
  });
  if (result.error) throw new Error('saveCorporateToDB: ' + result.error);
  return result;
}

async function loadCorporateFromDB() {
  const { data } = await supabaseFetch('corporate_orders?select=*&order=created_at.desc');
  return data || [];
}

// ===== TEST CONNECTION =====
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseFetch('products?select=count&limit=1');
    if (error) {
      console.warn('⚠️ Supabase connection failed:', error);
      window.__supabaseOk = '❌ ' + error;
      return false;
    }
    console.log('✅ Supabase connected successfully');
    window.__supabaseOk = '✅ Connected';
    return true;
  } catch (e) {
    console.warn('⚠️ Supabase connection error:', e.message);
    window.__supabaseOk = '❌ ' + e.message;
    return false;
  }
}

// ===== SUPABASE STORAGE (Image Upload) =====
async function uploadImage(bucket, filePath, file) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}?apikey=${CONFIG.SUPABASE_ANON_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: file,
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': file.type,
        'cache-control': 'public, max-age=31536000'
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn('Image upload failed:', err);
      return { url: null, error: err };
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    return { url: publicUrl, error: null };
  } catch (e) {
    console.warn('Image upload error:', e.message);
    return { url: null, error: e.message };
  }
}

function getStorageUrl(bucket, path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function generateFilePath(prefix, ext) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = ext ? `.${ext}` : '';
  return `${prefix}/${timestamp}-${random}${extension}`;
}

// Auto-test connection on load
setTimeout(() => testSupabaseConnection(), 2000);
