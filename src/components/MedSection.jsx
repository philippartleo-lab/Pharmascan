import { useState, useRef, useMemo, useCallback } from 'react';
import { searchMedicaments, getGeneriques, medAutocomplete, noAccents, debounce } from '../lib/api.js';
import { addMed } from '../lib/storage.js';
import { Suggest, Disclaimer } from './Common.jsx';
import { Scan, Shield, FileText, Plus, Help, Chevron, ChevronLeft, Alert } from '../lib/icons.jsx';

const CHIPS = ['doliprane', 'codoliprane', 'ibuprofene'];
const noticeUrl = (cis) => `https://base-donnees-publique.medicaments.gouv.fr/extrait.php?specid=${cis}`;

function substancesOf(m) {
  return (m.composition || [])
    .filter((c) => !c.natureComposant || c.natureComposant === 'SA')
    .map((c) => `${c.denominationSubstance}${c.dosage ? ' ' + c.dosage : ''}`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' · ');
}

export default function MedSection() {
  const [query, setQuery] = useState('');
  const [sugg, setSugg] = useState([]);
  const [status, setStatus] = useState('idle'); // idle|loading|list|fiche|notfound|error
  const [list, setList] = useState([]);
  const [med, setMed] = useState(null);
  const [generics, setGenerics] = useState([]);
  const [added, setAdded] = useState(false);
  
  // Debounce optimisé avec useCallback
  const debouncedAutocomplete = useCallback(
    debounce(async (v) => {
      if (v.trim().length >= 2) {
        setSugg((await medAutocomplete(v.trim())).map((n) => ({ label: n, value: n })));
      } else {
        setSugg([]);
      }
    }, 300),
    []
  );

  function onInput(v) {
    setQuery(v);
    debouncedAutocomplete(v);
  }

  async function showFiche(m) {
    setMed(m); setAdded(false); setGenerics([]); setStatus('fiche');
    setGenerics(await getGeneriques(m));
  }

  async function doSearch(q) {
    const term = (q ?? query).trim();
    if (!term) {
      setStatus('idle');
      return;
    }
    if (term.length < 2) {
      setStatus('idle');
      return;
    }
    setSugg([]); 
    setStatus('loading');
    try {
      const { list: results } = await searchMedicaments(term);
      if (!results || !results.length) return setStatus('notfound');
      if (results.length === 1) return showFiche(results[0]);
      setList(results);
      setStatus('list');
    } catch (e) {
      console.error('Erreur recherche:', e);
      setStatus('error');
    }
  }

  function addToArmoire() {
    addMed({ id: String(med.cis), name: med.elementPharmaceutique || 'Médicament', substance: substancesOf(med) });
    setAdded(true);
  }

  return (
    <section>
      <h1 className="title">Quel est ce médicament ?</h1>
      <p className="sub">Scannez la boîte ou cherchez par nom pour voir l'information officielle.</p>

      <button className="scanbtn" onClick={() => alert("Le scan caméra s'active dans l'app installée (HTTPS). Pour l'instant, saisissez le nom ou le code.")}>
        <Scan stroke="#fff" /> Scanner un médicament
      </button>

      <div className="field">
        <input value={query} placeholder="Nom ou code-barres" autoComplete="off"
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          onBlur={() => setTimeout(() => setSugg([]), 150)} />
        <button onClick={() => doSearch()}>Chercher</button>
      </div>
      <Suggest items={sugg} onPick={(it) => { setQuery(it.value); doSearch(it.value); }} />

      <div className="chips">
        {CHIPS.map((c) => <span key={c} className="chip" onClick={() => { setQuery(c); doSearch(c); }}>{c}</span>)}
      </div>

      {status === 'loading' && <div className="loader">Recherche dans la base officielle…</div>}

      {status === 'notfound' && (
        <div className="card empty">
          <div className="circle"><Help size={32} stroke="#9A9C97" /></div>
          <h2>Médicament non identifié</h2>
          <p>Par sécurité, nous préférons ne rien afficher plutôt qu'une information incertaine. Vérifiez l'orthographe, ou demandez à votre pharmacien.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card empty">
          <div className="circle"><Alert size={32} stroke="#9A9C97" /></div>
          <h2>Base officielle injoignable</h2>
          <p>Vérifiez que le back-end est démarré (npm run server) et votre connexion, puis réessayez.</p>
        </div>
      )}

      {status === 'list' && (
        <>
          <p className="lbl" style={{ margin: '0 2px 10px' }}>{list.length} résultats — choisissez la forme exacte</p>
          <div className="medlist">
            {list.slice(0, 40).map((m, i) => (
              <button key={i} className="medrow" onClick={() => showFiche(m)}>
                <div className="medrow-info">
                  <div className="medrow-name">{m.elementPharmaceutique || 'Médicament'}</div>
                  <div className="medrow-sub">{m.formePharmaceutique || ''}{m.titulaire ? ' · ' + m.titulaire : ''}</div>
                </div>
                <Chevron size={16} />
              </button>
            ))}
          </div>
        </>
      )}

      {status === 'fiche' && med && <Fiche med={med} generics={generics} added={added} onAdd={addToArmoire}
        onBack={list.length > 1 ? () => setStatus('list') : null} />}
    </section>
  );
}

function Fiche({ med, generics, added, onAdd, onBack }) {
  const subs = substancesOf(med);
  const pres = (med.presentation || []).find((p) => p.prix != null) || (med.presentation || [])[0] || {};
  let price = '';
  if (pres.prix != null) price += Number(pres.prix).toFixed(2).replace('.', ',') + ' €';
  if (pres.tauxRemboursement) price += (price ? ' · ' : '') + 'Remboursé à ' + pres.tauxRemboursement;
  const conditions = (med.conditions || []).join(' · ');

  return (
    <>
      {onBack && <button className="backlink" onClick={onBack}><ChevronLeft size={14} /> Toutes les formes</button>}
      <div className="card">
        <span className="badge ok">Médicament identifié</span>
        <div className="resultName">{med.elementPharmaceutique || 'Médicament'}</div>
        <p className="resultMeta">{med.formePharmaceutique || ''}{med.titulaire ? ' · ' + med.titulaire : ''}</p>
        <p className="source"><Shield size={14} stroke="#9A9C97" /> Source : BDPM — base officielle (ANSM)</p>

        {subs && <div className="block"><p className="lbl">Substance(s) active(s) et dosage</p><p className="val">{subs}</p></div>}
        {price && <div className="block"><p className="lbl">Prix &amp; remboursement</p><p className="val">{price}</p></div>}
        {generics.length > 0 && (
          <div className="block">
            <p className="lbl">Équivalents (même substance active)</p>
            <p className="val">{generics.join(' · ')}</p>
            <p className="note" style={{ marginTop: 6 }}>Les génériques contiennent la même substance active et sont souvent moins chers. Demandez à votre pharmacien.</p>
          </div>
        )}
        <div className="block">
          <p className="lbl">Disponibilité</p>
          <span className="avail ok"><span className="dot" /> Disponible</span>
          <p className="note" style={{ marginTop: 6 }}>Statut rupture / tension en temps réel : à connecter à la source officielle ANSM (Trustmed) au back-end.</p>
        </div>
        {conditions && <div className="block"><p className="lbl">Conditions de délivrance</p><p className="val">{conditions}</p></div>}
        <div className="block hl"><p className="lbl">Posologie</p><p className="val">La posologie figure dans la notice officielle. Suivez la notice et l'avis de votre pharmacien.</p></div>

        <a className="linkbtn" href={noticeUrl(med.cis)} target="_blank" rel="noreferrer"><FileText size={18} /> Voir la notice officielle</a>
        <button className={'addbtn' + (added ? ' done' : '')} onClick={added ? undefined : onAdd}>
          {added ? 'Ajouté à mon armoire ✓' : <><Plus size={17} /> Ajouter à mon armoire</>}
        </button>
        <Disclaimer />
      </div>
    </>
  );
}
