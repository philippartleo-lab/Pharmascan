import { useState } from 'react';
import MedSection from './components/MedSection.jsx';
import ParaSection from './components/ParaSection.jsx';
import PharmaSection from './components/PharmaSection.jsx';
import ArmoireSection from './components/ArmoireSection.jsx';
import { Pill, Box } from './lib/icons.jsx';

const TABS = [
  { id: 'med', label: 'Médicaments', Comp: MedSection },
  { id: 'para', label: 'Parapharmacie', Comp: ParaSection },
  { id: 'pharma', label: 'Pharmacies', Comp: PharmaSection },
  { id: 'armoire', label: 'Armoire', Comp: ArmoireSection },
];

function TabIcon({ id }) {
  if (id === 'med') return <Pill />;
  if (id === 'armoire') return <Box />;
  if (id === 'para') return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14M5 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><path d="M12 6v6M9 9h6" />
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('med');
  const Active = TABS.find((t) => t.id === tab).Comp;

  return (
    <div className="app">
      <header>
        <span className="logo"><Pill size={20} stroke="#fff" /></span>
        <span className="brand">Pharmascan</span>
      </header>

      <main><Active /></main>

      <nav className="tabs">
        <div>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              <TabIcon id={t.id} />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
