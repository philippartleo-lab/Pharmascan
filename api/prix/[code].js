const PRICES = 'https://prices.openfoodfacts.org/api/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  try {
    const r = await fetch(`${PRICES}/prices?product_code=${encodeURIComponent(code)}&order_by=-date&size=10`);
    if (!r.ok) throw new Error('upstream ' + r.status);
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(200).json({ items: [] });
  }
}
