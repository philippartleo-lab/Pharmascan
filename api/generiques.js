const BDPM = 'https://medicaments-api.giygas.dev/v1';
const noAccents = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { libelle } = req.query;
  try {
    const url = `${BDPM}/generiques?libelle=${encodeURIComponent(noAccents(libelle || ''))}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('upstream ' + r.status);
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(200).json([]);
  }
}
