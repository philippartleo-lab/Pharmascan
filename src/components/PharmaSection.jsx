import { useState, useRef, useCallback } from 'react';
import { cityAutocomplete, fetchPharmacies, debounce } from '../lib/api.js';
import { Suggest } from './Common.jsx';
import { Phone, Pin, Chevron } from '../lib/icons.jsx';

const mapUrl = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

export default function PharmaSection() {
  const [city, setCity] = useState('');
  const [sugg, setSugg] = useState([]);
  const [status, setStatus] = useState('idle'); // idle|loading|done|error
  const [pharmas, setPharmas] = useState([]);
  const [label, setLabel] = useState('');
  const picked = useRef(null);

  // Debounce optimisé
  const debouncedCitySearch = useCallback(
    debounce(async (v) => {
      if (v.trim().length >= 2) {
        const items = await cityAutocomplete(v.trim());
        setSugg(items.map((c) => ({ label: c.nom, sub: c.cp, value: c.nom, lat: c.lat, lon: c.lon })));
      } else {
        setSugg([]);
      }
    }, 250),
    []
  );

  function onInput(v) {
    setCity(v);
    debouncedCitySearch(v);
  }

  async function doSearch(coords, name) {
    const c = (name ?? city).trim();
    if (!c) {
      setStatus('idle');
      return;
    }
    setSugg([]); 
    setStatus('loading'); 
    setLabel(c.charAt(0).toUpperCase() + c.slice(1));
    
    let geo = coords;
    if (!geo) {
      try {
        const items = await cityAutocomplete(c);
        if (items && items[0] && items[0].lat != null) {
          geo = { lat: items[0].lat, lon: items[0].lon };
        }
      } catch (e) {
        console.error('Erreur géolocalisation:', e);
      }
    }
    
    if (!geo) return setStatus('error');
    
    try {
      const pharmacies = await fetchPharmacies(geo.lat, geo.lon);
      if (!pharmacies) throw new Error('Pas de réponse');
      setPharmas(pharmacies);
      setStatus('done');
    } catch (e) {
      console.error('Erreur pharmacies:', e);
      setStatus('error');
    }
  }

  return (
    <section>
      <h1 className="title">Pharmacies &amp; garde</h1>
      <p className="sub">Trouvez une pharmacie et le contact de garde de votre ville.</p>

      <div className="field">
        <input value={city} placeholder="Votre ville" autoComplete="off"
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          onBlur={() => setTimeout(() => setSugg([]), 150)} />
        <button onClick={() => doSearch()}>Chercher</button>
      </div>
      <Suggest items={sugg} onPick={(it) => { setCity(it.value); doSearch(it.lat != null ? { lat: it.lat, lon: it.lon } : null, it.value); }} />

      {status === 'loading' && <div className="loader">Recherche des pharmacies à {label}…</div>}

      {(status === 'done' || status === 'error') && (
        <div className="card">
          <span className="badge ok">Pharmacie de garde</span>
          <div className="resultName">Garde à {label}</div>
          <p className="resultMeta">Service officiel disponible 24h/24, 7j/7.</p>
          <a className="callbtn" href="tel:3237"><Phone size={19} stroke="#fff" /> Appeler le 3237</a>
          <a className="linkbtn" href="https://www.3237.fr" target="_blank" rel="noreferrer">Ouvrir le site 3237.fr</a>
          <p className="note">Le 3237 indique la pharmacie de garde la plus proche (service payant, environ 0,35 €/min). En Île-de-France, monpharmacien-idf.fr est gratuit. Après 22 h, certaines villes passent par la gendarmerie ou le commissariat.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card"><p className="lbl" style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>Pharmacies à {label}</p>
          <p className="note">Service de localisation indisponible (back-end éteint ou ville introuvable). Vérifiez et réessayez.</p></div>
      )}

      {status === 'done' && (
        <div className="card">
          <p className="lbl" style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>Pharmacies à {label}</p>
          {pharmas.length === 0 && <p className="note">Aucune pharmacie trouvée dans la base ouverte pour cette zone.</p>}
          {pharmas.map((p, i) => (
            <div className="pharma-item" key={i}>
              <span className="pin"><Pin size={18} stroke="#085041" /></span>
              <div className="info"><div className="n">{p.name}</div><div className="a">{p.addr || label}</div></div>
              {p.phone && <a className="act" href={`tel:${p.phone.replace(/\s/g, '')}`} aria-label="Appeler"><Phone size={15} stroke="#1C1D1B" /></a>}
              <a className="act" href={mapUrl(p.lat, p.lon)} target="_blank" rel="noreferrer" aria-label="Itinéraire"><Chevron size={16} stroke="#1C1D1B" /></a>
            </div>
          ))}
          {pharmas.length > 0 && <p className="note">Données OpenStreetMap. L'itinéraire pointe vers l'adresse réelle de chaque officine.</p>}
        </div>
      )}
    </section>
  );
}
