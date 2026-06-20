const OBF = 'https://world.openbeautyfacts.org/api/v2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  try {
    const fields = 'product_name,product_name_fr,brands,ingredients_text_fr,ingredients_text,allergens_tags';
    const r = await fetch(`${OBF}/product/${encodeURIComponent(code)}.json?fields=${fields}`);
    if (!r.ok) throw new Error('upstream ' + r.status);
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(502).json({ status: 0 });
  }
}
