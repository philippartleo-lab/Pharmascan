import { memo } from 'react';
import { Alert } from '../lib/icons.jsx';

export const Disclaimer = memo(function Disclaimer({ text }) {
  return (
    <div className="disclaimer">
      <Alert size={16} stroke="#7E4E0B" style={{ flexShrink: 0, marginTop: 1 }} />
      <p>{text || "Information à titre indicatif. Ne remplace pas l'avis d'un médecin ou d'un pharmacien."}</p>
    </div>
  );
});

export const Suggest = memo(function Suggest({ items, onPick }) {
  if (!items || !items.length) return null;
  return (
    <div className="suggest" style={{ display: 'block' }}>
      {items.map((it, i) => (
        <button key={i} className="sugg-row" onMouseDown={(e) => { e.preventDefault(); onPick(it); }}>
          <span>{it.label}</span>
          {it.sub ? <span className="sugg-sub">{it.sub}</span> : null}
        </button>
      ))}
    </div>
  );
});
