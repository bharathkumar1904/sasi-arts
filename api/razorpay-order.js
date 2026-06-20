const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    switch (action) {
      case 'create': {
        if (!amount || amount <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        const order = await razorpay.orders.create({
          amount: Math.round(amount),
          currency: currency || 'INR',
          receipt: 'rcpt_' + Date.now(),
        });
        return res.status(200).json({ order_id: order.id, amount: order.amount, currency: order.currency });
      }

      case 'verify': {
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ error: 'Missing payment details for verification' });
        }
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');

        if (expectedSignature === razorpay_signature) {
          return res.status(200).json({ verified: true, payment_id: razorpay_payment_id });
        } else {
          return res.status(400).json({ verified: false, error: 'Invalid payment signature' });
        }
      }

      default:
        return res.status(400).json({ error: 'Unknown action. Use "create" or "verify".' });
    }
  } catch (err) {
    console.error('Razorpay API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
