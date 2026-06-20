import { useState } from 'react';
import { loadFiche, saveFiche, FICHE_DEFAULTS } from '../lib/storage.js';

const SANG = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const LIENS = ['', 'Conjoint(e)', 'Parent', 'Enfant', 'Frère / Sœur', 'Ami(e)', 'Médecin', 'Autre'];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid var(--line)', fontSize: 14,
  background: '#fff', color: 'var(--ink)', boxSizing: 'border-box',
};
const sel = { ...inp, appearance: 'none', WebkitAppearance: 'none' };
const ta = { ...inp, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' };

export default function FicheMedicale() {
  const [fiche, setFiche] = useState(loadFiche);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fiche);
  const [copied, setCopied] = useState(false);

  const isEmpty = !fiche.prenom && !fiche.nom && !fiche.groupeSanguin;

  function set(k, v) { setDraft((d) => ({ ...d, [k]: v })); }

  function save() {
    saveFiche(draft);
    setFiche(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(fiche);
    setEditing(false);
  }

  function ficheText() {
    const lines = [
      '🏥 FICHE MÉDICALE D\'URGENCE — Pharmascan',
      '',
    ];
    if (fiche.prenom || fiche.nom) lines.push(`👤 ${[fiche.prenom, fiche.nom].filter(Boolean).join(' ')}`);
    if (fiche.dateNaissance) lines.push(`📅 Né(e) le ${new Date(fiche.dateNaissance).toLocaleDateString('fr-FR')}`);
    if (fiche.groupeSanguin) lines.push(`🩸 Groupe sanguin : ${fiche.groupeSanguin}`);
    if (fiche.adresse) lines.push(`📍 ${fiche.adresse}`);
    if (fiche.contactNom || fiche.contactTel) {
      lines.push('');
      lines.push('🚨 PERSONNE À PRÉVENIR');
      if (fiche.contactNom) lines.push(`   ${fiche.contactNom}${fiche.contactLien ? ` (${fiche.contactLien})` : ''}`);
      if (fiche.contactTel) lines.push(`   📞 ${fiche.contactTel}`);
    }
    if (fiche.allergies) { lines.push(''); lines.push('⚠️ ALLERGIES'); lines.push(`   ${fiche.allergies}`); }
    if (fiche.traitements) { lines.push(''); lines.push('💊 TRAITEMENTS EN COURS'); lines.push(`   ${fiche.traitements}`); }
    if (fiche.antecedents) { lines.push(''); lines.push('📋 ANTÉCÉDENTS'); lines.push(`   ${fiche.antecedents}`); }
    if (fiche.notes) { lines.push(''); lines.push(`💬 ${fiche.notes}`); }
    return lines.join('\n');
  }

  async function share() {
    const text = ficheText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Ma fiche médicale', text }); return; } catch (_) {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (editing) {
    return (
      <div className="card" style={{ marginTop: 0 }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>✏️ Modifier la fiche médicale</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Prénom">
            <input style={inp} value={draft.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Marie" />
          </Field>
          <Field label="Nom">
            <input style={inp} value={draft.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Dupont" />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Date de naissance">
            <input style={inp} type="date" value={draft.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />
          </Field>
          <Field label="Groupe sanguin">
            <select style={sel} value={draft.groupeSanguin} onChange={(e) => set('groupeSanguin', e.target.value)}>
              {SANG.map((s) => <option key={s} value={s}>{s || '— Sélectionner —'}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Adresse">
          <input style={inp} value={draft.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
        </Field>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#C0392B', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚨 Personne à prévenir</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Nom & prénom">
            <input style={inp} value={draft.contactNom} onChange={(e) => set('contactNom', e.target.value)} placeholder="Jean Dupont" />
          </Field>
          <Field label="Lien">
            <select style={sel} value={draft.contactLien} onChange={(e) => set('contactLien', e.target.value)}>
              {LIENS.map((l) => <option key={l} value={l}>{l || '— Choisir —'}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Téléphone">
          <input style={inp} type="tel" value={draft.contactTel} onChange={(e) => set('contactTel', e.target.value)} placeholder="+33 6 00 00 00 00" />
        </Field>

        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-ink)', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💊 Informations médicales</p>

        <Field label="Allergies">
          <textarea style={ta} value={draft.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Pénicilline, Aspirine, arachides…" />
        </Field>
        <Field label="Traitements en cours">
          <textarea style={ta} value={draft.traitements} onChange={(e) => set('traitements', e.target.value)} placeholder="Metformine 500mg matin/soir, Lévothyrox 75µg…" />
        </Field>
        <Field label="Antécédents médicaux">
          <textarea style={ta} value={draft.antecedents} onChange={(e) => set('antecedents', e.target.value)} placeholder="Diabète type 2, hypertension…" />
        </Field>
        <Field label="Notes libres">
          <textarea style={{ ...ta, minHeight: 50 }} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Porteur d'un pacemaker, implant cochléaire…" />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn-cancel" style={{ flex: 1 }} onClick={cancel}>Annuler</button>
          <button className="btn-save" style={{ flex: 2 }} onClick={save}>Enregistrer</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0 }}>
      {/* Carte médicale style Apple Health */}
      <div style={cardStyle}>
        <div style={cardHeader}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', opacity: 0.75, textTransform: 'uppercase' }}>Fiche médicale d'urgence</div>
            {(fiche.prenom || fiche.nom) && (
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {[fiche.prenom, fiche.nom].filter(Boolean).join(' ')}
              </div>
            )}
            {fiche.dateNaissance && (
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                Né(e) le {new Date(fiche.dateNaissance).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
          {fiche.groupeSanguin && (
            <div style={bloodBadge}>
              <span style={{ fontSize: 10, display: 'block', opacity: 0.8 }}>Groupe</span>
              <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{fiche.groupeSanguin}</span>
            </div>
          )}
        </div>

        {isEmpty ? (
          <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>Aucune information renseignée. Appuyez sur Modifier pour remplir votre fiche.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {fiche.adresse && <Row icon="📍" label="Adresse" value={fiche.adresse} />}

            {(fiche.contactNom || fiche.contactTel) && (
              <div style={urgRow}>
                <span style={{ fontSize: 16 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Personne à prévenir{fiche.contactLien ? ` · ${fiche.contactLien}` : ''}
                  </div>
                  {fiche.contactNom && <div style={{ fontSize: 15, fontWeight: 600 }}>{fiche.contactNom}</div>}
                  {fiche.contactTel && (
                    <a href={`tel:${fiche.contactTel}`} style={{ fontSize: 14, color: '#fff', opacity: 0.9, textDecoration: 'none' }}>
                      📞 {fiche.contactTel}
                    </a>
                  )}
                </div>
              </div>
            )}

            {fiche.allergies && <Row icon="⚠️" label="Allergies" value={fiche.allergies} warn />}
            {fiche.traitements && <Row icon="💊" label="Traitements" value={fiche.traitements} />}
            {fiche.antecedents && <Row icon="📋" label="Antécédents" value={fiche.antecedents} />}
            {fiche.notes && <Row icon="💬" label="Notes" value={fiche.notes} />}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={() => { setDraft(fiche); setEditing(true); }}
          style={btnSecondary}
        >
          ✏️ Modifier
        </button>
        {!isEmpty && (
          <button onClick={share} style={btnShare}>
            {copied ? '✓ Copié !' : (navigator.share ? '↗ Partager' : '📋 Copier')}
          </button>
        )}
      </div>

      {!isEmpty && (
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
          💡 Ces données restent sur votre appareil. Le bouton Partager génère un texte à coller dans Apple Santé, une note ou un message d'urgence.
        </p>
      )}
    </div>
  );
}

function Row({ icon, label, value, warn }) {
  return (
    <div style={{ ...urgRow, background: warn ? 'rgba(255,220,60,0.18)' : 'rgba(255,255,255,0.12)', borderRadius: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 14 }}>{value}</div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: 'linear-gradient(135deg, #C0392B 0%, #922B21 100%)',
  borderRadius: 18, padding: '20px 18px', color: '#fff',
  boxShadow: '0 8px 24px rgba(192,57,43,0.35)',
};
const cardHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
};
const bloodBadge = {
  background: 'rgba(255,255,255,0.2)', borderRadius: 12,
  padding: '6px 12px', textAlign: 'center', color: '#fff',
  backdropFilter: 'blur(4px)', minWidth: 60,
};
const urgRow = {
  display: 'flex', gap: 10, alignItems: 'flex-start',
  padding: '8px 10px',
};
const btnSecondary = {
  flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--line)',
  background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
};
const btnShare = {
  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
  background: 'var(--teal)', color: '#fff', cursor: 'pointer',
  fontSize: 14, fontWeight: 600,
};
