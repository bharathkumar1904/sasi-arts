module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  try {
    const { path, body, method, apikey, auth } = req.body;
    if (!path || !apikey) {
      return res.status(400).json({ error: 'Missing path or apikey' });
    }
    const url = `https://wbjgiizrfdjhrccgsdbd.supabase.co/rest/v1/${path}`;
    const headers = {
      'apikey': apikey,
      'Authorization': auth ? `Bearer ${auth}` : `Bearer ${apikey}`
    };
    const fetchOpts = { method: method || 'GET', headers };
    if (body && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      headers['Prefer'] = 'return=representation';
      fetchOpts.body = JSON.stringify(body);
    }
    const supRes = await fetch(url, fetchOpts);
    const text = await supRes.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = text; }
    if (!supRes.ok) {
      return res.status(supRes.status).json({ error: text });
    }
    return res.status(200).json({ data, error: null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};