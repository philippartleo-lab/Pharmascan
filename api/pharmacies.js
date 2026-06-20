const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat/lon requis' });

  const q = `[out:json][timeout:25];(node["amenity"="pharmacy"](around:4000,${lat},${lon});way["amenity"="pharmacy"](around:4000,${lat},${lon}););out center;`;

  for (const ep of OVERPASS) {
    try {
      const r = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q),
      });
      if (!r.ok) continue;
      const data = await r.json();
      const list = (data.elements || []).map((el) => {
        const t = el.tags || {};
        const plat = el.lat != null ? el.lat : el.center && el.center.lat;
        const plon = el.lon != null ? el.lon : el.center && el.center.lon;
        const addr = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
        return { name: t.name || 'Pharmacie', addr, phone: t.phone || t['contact:phone'] || '', lat: plat, lon: plon };
      }).filter((p) => p.lat != null && p.lon != null);
      return res.status(200).json(list);
    } catch (e) { /* essaie le miroir suivant */ }
  }
  res.status(502).json({ error: 'Overpass indisponible' });
}
