export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.status(200).json({ statut: 'disponible', source: 'placeholder', note: 'À connecter à la source officielle ANSM.' });
}
