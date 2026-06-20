const crypto = require('crypto');

function getAuth() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not set in Vercel env vars');
  }
  return 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = getAuth();
    const { action, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    switch (action) {
      case 'create': {
        if (!amount || amount < 100) {
          return res.status(400).json({ error: 'Amount must be at least 100 paise' });
        }
        const resp = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': auth,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount),
            currency: currency || 'INR',
            receipt: 'rcpt_' + Date.now(),
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return res.status(500).json({ error: 'Razorpay error: ' + (data.error?.description || data.error || resp.status) });
        }
        return res.status(200).json({ order_id: data.id, amount: data.amount, currency: data.currency });
      }

      case 'verify': {
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ error: 'Missing payment details for verification' });
        }
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');

        if (expectedSignature === razorpay_signature) {
          return res.status(200).json({ verified: true, payment_id: razorpay_payment_id });
        }
        return res.status(400).json({ verified: false, error: 'Signature mismatch - payment may be tampered' });
      }

      default:
        return res.status(400).json({ error: 'Unknown action. Use "create" or "verify".' });
    }
  } catch (err) {
    console.error('Razorpay API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
