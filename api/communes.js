const BAN = 'https://api-adresse.data.gouv.fr';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.query.q || '';
  try {
    const r = await fetch(`${BAN}/search/?q=${encodeURIComponent(q)}&type=municipality&autocomplete=1&limit=7`);
    if (!r.ok) throw new Error('upstream ' + r.status);
    const data = await r.json();
    const villes = (data.features || []).map((f) => {
      const c = (f.geometry && f.geometry.coordinates) || [];
      const p = f.properties || {};
      return { nom: p.city || p.name || p.label, cp: p.postcode || '', lat: c[1], lon: c[0] };
    }).filter((v) => v.nom);
    res.status(200).json(villes);
  } catch (e) {
    res.status(200).json([]);
  }
}
