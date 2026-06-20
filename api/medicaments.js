const BDPM = 'https://medicaments-api.giygas.dev/v1';
const noAccents = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { search, cip } = req.query;
  try {
    let url;
    if (cip) url = `${BDPM}/medicaments?cip=${encodeURIComponent(cip)}`;
    else if (search) url = `${BDPM}/medicaments?search=${encodeURIComponent(noAccents(search))}`;
    else return res.status(400).json({ error: 'search ou cip requis' });

    const r = await fetch(url);
    if (!r.ok) throw new Error('upstream ' + r.status);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'BDPM indisponible' });
  }
}
