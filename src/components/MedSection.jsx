import { useState, useCallback, lazy, Suspense } from 'react';
import { searchMedicaments, getGeneriques, medAutocomplete, noAccents, debounce } from '../lib/api.js';
import { addMed } from '../lib/storage.js';
import { Suggest, Disclaimer } from './Common.jsx';
import { Scan, Shield, FileText, Plus, Help, Chevron, ChevronLeft, Alert, Search } from '../lib/icons.jsx';

const BarcodeScanner = lazy(() => import('./BarcodeScanner.jsx'));

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
  const [status, setStatus] = useState('idle'); // idle|loading|list|fiche|notfound|ean|error
  const [list, setList] = useState([]);
  const [med, setMed] = useState(null);
  const [generics, setGenerics] = useState([]);
  const [added, setAdded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastCode, setLastCode] = useState(''); // code scanné qui n'a pas abouti

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
    if (!term || term.length < 2) { setStatus('idle'); return; }
    setSugg([]);
    setStatus('loading');
    try {
      const { list: results, mode, digits } = await searchMedicaments(term);

      // EAN lu au scan → pas un code médicament connu
      if (mode === 'ean') {
        setLastCode(digits);
        return setStatus('ean');
      }

      if (!results || !results.length) {
        // Code CIP scanné mais inconnu → propose de chercher par nom
        if (mode === 'cip_notfound') {
          setLastCode(term);
          return setStatus('cip_notfound');
        }
        return setStatus('notfound');
      }

      if (results.length === 1) return showFiche(results[0]);
      setList(results);
      setStatus('list');
    } catch (e) {
      console.error('Erreur recherche:', e);
      setStatus('error');
    }
  }

  // Après un scan qui échoue, relance une recherche texte avec ce que l'utilisateur saisit
  function doFallbackSearch(name) {
    setQuery(name);
    doSearch(name);
  }

  function handleDetected(rawCode) {
    setScanning(false);
    setQuery(rawCode);
    doSearch(rawCode);
  }

  function addToArmoire() {
    addMed({ id: String(med.cis), name: med.elementPharmaceutique || 'Médicament', substance: substancesOf(med) });
    setAdded(true);
  }

  return (
    <section>
      <h1 className="title">Quel est ce médicament ?</h1>
      <p className="sub">Scannez la boîte ou cherchez par nom pour voir l'information officielle.</p>

      <button className="scanbtn" onClick={() => setScanning(true)}>
        <Scan stroke="#fff" /> Scanner un médicament
      </button>

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
        </Suspense>
      )}

      <div className="field">
        <input value={query} placeholder="Nom ou code CIP" autoComplete="off"
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

      {/* Code EAN générique — pas un médicament */}
      {status === 'ean' && (
        <div className="card empty">
          <div className="circle"><Scan size={32} stroke="#9A9C97" /></div>
          <h2>Code EAN, pas un code CIP</h2>
          <p>Le code <code style={{ background: '#f0f0f0', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>{lastCode}</code> est un code-barres EAN standard, pas un code médicament (CIP). Les médicaments utilisent un code CIP à 7 ou 13 chiffres (commençant par 340).</p>
          <p style={{ marginTop: 8 }}>Cherchez plutôt par le <b>nom</b> du médicament :</p>
          <FallbackInput onSearch={doFallbackSearch} />
        </div>
      )}

      {/* Code CIP scanné mais introuvable dans la BDPM */}
      {status === 'cip_notfound' && (
        <div className="card empty">
          <div className="circle"><Help size={32} stroke="#9A9C97" /></div>
          <h2>Code non trouvé dans la BDPM</h2>
          <p>Le code <code style={{ background: '#f0f0f0', padding: '1px 5px', borderRadius: 4, fontSize: 13 }}>{lastCode}</code> n'a pas été reconnu. Il peut s'agir d'un médicament étranger, d'un générique récent ou d'un code mal lu.</p>
          <p style={{ marginTop: 8 }}>Essayez avec le <b>nom</b> imprimé sur la boîte :</p>
          <FallbackInput onSearch={doFallbackSearch} />
        </div>
      )}

      {/* Recherche texte sans résultat */}
      {status === 'notfound' && (
        <div className="card empty">
          <div className="circle"><Help size={32} stroke="#9A9C97" /></div>
          <h2>Médicament non trouvé</h2>
          <p>Aucun résultat dans la BDPM pour <b>« {query} »</b>. Vérifiez l'orthographe, essayez le nom générique ou la substance active (ex. « paracétamol »).</p>
          <div className="chips" style={{ marginTop: 12, justifyContent: 'center' }}>
            {CHIPS.map((c) => <span key={c} className="chip" onClick={() => { setQuery(c); doSearch(c); }}>{c}</span>)}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="card empty">
          <div className="circle"><Alert size={32} stroke="#9A9C97" /></div>
          <h2>Base officielle injoignable</h2>
          <p>Vérifiez votre connexion internet et réessayez.</p>
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

// Champ de saisie texte affiché dans les écrans d'erreur code
function FallbackInput({ onSearch }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSearch(val.trim())}
        placeholder="Nom du médicament…"
        style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 14 }}
      />
      <button
        onClick={() => val.trim() && onSearch(val.trim())}
        style={{ padding: '9px 14px', borderRadius: 9, background: 'var(--teal)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Search size={16} stroke="#fff" />
      </button>
    </div>
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
