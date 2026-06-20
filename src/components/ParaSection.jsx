import { useState } from 'react';
import { searchParapharmacie, getPrixIndicatif } from '../lib/api.js';
import { Scan, Shield, Help } from '../lib/icons.jsx';

function cleanTags(tags) {
  return (tags || []).map((t) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '));
}

export default function ParaSection() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle|loading|found|notfound|error
  const [product, setProduct] = useState(null);
  const [prix, setPrix] = useState(null);

  async function doSearch() {
    const c = code.trim().replace(/\s/g, '');
    if (!c) {
      setStatus('idle');
      return;
    }
    if (!/^\d{8,13}$/.test(c)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setPrix(null);
    try {
      const p = await searchParapharmacie(c);
      if (!p || !p.product_name) return setStatus('notfound');
      setProduct(p);
      setStatus('found');
      setPrix(await getPrixIndicatif(c));
    } catch (e) {
      console.error('Erreur parapharmacie:', e);
      setStatus('error');
    }
  }

  const allerg = product ? cleanTags(product.allergens_tags) : [];
  const name = product ? (product.product_name_fr || product.product_name || 'Produit') : '';
  const ing = product ? (product.ingredients_text_fr || product.ingredients_text || '') : '';
  const fmt = (v) => v.toFixed(2).replace('.', ',');

  return (
    <section>
      <h1 className="title">Produit de parapharmacie</h1>
      <p className="sub">Scannez le code-barres pour voir la composition et les allergènes.</p>

      <button className="scanbtn" onClick={() => alert("Le scan caméra s'active dans l'app installée (HTTPS). Pour l'instant, saisissez le code.")}>
        <Scan stroke="#fff" /> Scanner un produit
      </button>

      <div className="field">
        <input value={code} inputMode="numeric" placeholder="Code-barres du produit" autoComplete="off"
          onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
        <button onClick={doSearch}>Chercher</button>
      </div>
      <p className="note">Astuce : prenez un produit cosmétique de votre salle de bain et saisissez le code sous le code-barres. La recherche interroge la base ouverte Open Beauty Facts.</p>

      {status === 'loading' && <div className="loader">Recherche en cours…</div>}

      {status === 'notfound' && (
        <div className="card empty">
          <div className="circle"><Help size={32} stroke="#9A9C97" /></div>
          <h2>Produit non trouvé</h2>
          <p>Ce produit n'est pas encore dans la base ouverte. Vous pourrez contribuer à l'enrichir plus tard.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card empty"><h2>Recherche indisponible</h2><p>Vérifiez le back-end (npm run server) et votre connexion, puis réessayez.</p></div>
      )}

      {status === 'found' && product && (
        <div className="card">
          <span className="badge live">Produit trouvé</span>
          <div className="resultName">{name}</div>
          {product.brands && <p className="resultMeta">{product.brands}</p>}
          <p className="source"><Shield size={14} stroke="#9A9C97" /> Source : Open Beauty Facts</p>
          <div className="block"><p className="lbl">Allergènes signalés</p><p className="val">{allerg.length ? allerg.join(', ') : 'Aucun allergène listé pour ce produit.'}</p></div>
          <div className="block"><p className="lbl">Ingrédients (INCI)</p><p className="val">{ing || "Liste d'ingrédients non renseignée dans la base."}</p></div>
          {prix && (
            <div className="block">
              <p className="lbl">Prix indicatif</p>
              <p className="val">{prix.min === prix.max ? `${fmt(prix.min)} €` : `${fmt(prix.min)} – ${fmt(prix.max)} €`}</p>
              <p className="note" style={{ marginTop: 6 }}>Prix indicatif issu de relevés communautaires (Open Prices){prix.date ? ` (dernier relevé : ${prix.date})` : ''}. Il varie selon la pharmacie et n'est pas un prix officiel.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
