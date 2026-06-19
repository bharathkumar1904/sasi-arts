const ORIGIN_PINCODE = 533294;

function getShippingCharge(dest) {
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { destination_pincode } = req.body;
    if (!destination_pincode) {
      return res.status(400).json({ error: 'destination_pincode is required' });
    }
    const dest = parseInt(destination_pincode);
    const result = getShippingCharge(dest);
    return res.status(200).json({ charge: result.charge, note: result.note, pincode: dest });
  } catch (err) {
    console.error('Shipping API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
