// Armoire à pharmacie — persistance locale.
// Stocke les médicaments avec catégorie, date d'expiration, quantité et rappels.

const KEY = 'pharmascan_armoire';
const FICHE_KEY = 'pharmascan_fiche_medicale';

const mem = {};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return k in mem ? mem[k] : null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { mem[k] = v; } },
};

export function loadArmoire() {
  try { return JSON.parse(store.get(KEY) || '[]'); } catch { return []; }
}

export function saveArmoire(a) { store.set(KEY, JSON.stringify(a)); }

export function addMed(med) {
  const a = loadArmoire();
  const newMed = {
    id: med.id || `med_${Date.now()}`,
    name: med.name,
    substance: med.substance || '',
    category: med.category || 'autre',
    quantity: med.quantity || 1,
    expirationDate: med.expirationDate || '',
    addedDate: med.addedDate || new Date().toISOString().split('T')[0],
    reminders: med.reminders || { matin: false, midi: false, soir: false },
    notes: med.notes || '',
  };
  if (!a.find((x) => x.id === newMed.id)) {
    a.push(newMed);
    saveArmoire(a);
  }
  return a;
}

export function removeMed(id) {
  const a = loadArmoire().filter((x) => x.id !== id);
  saveArmoire(a);
  return a;
}

export function updateMed(id, updates) {
  const a = loadArmoire();
  const med = a.find((x) => x.id === id);
  if (med) {
    Object.assign(med, updates);
    saveArmoire(a);
  }
  return a;
}

export function toggleReminder(id, slot) {
  const a = loadArmoire();
  const it = a.find((x) => x.id === id);
  if (it) { it.reminders[slot] = !it.reminders[slot]; saveArmoire(a); }
  return a;
}

export function isExpiringSoon(expirationDate) {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expDate <= thirtyDaysFromNow && expDate >= today;
}

// --- Fiche médicale d'urgence ---

export const FICHE_DEFAULTS = {
  prenom: '', nom: '', dateNaissance: '', groupeSanguin: '',
  adresse: '',
  contactNom: '', contactTel: '', contactLien: '',
  allergies: '', traitements: '', antecedents: '', notes: '',
};

export function loadFiche() {
  try { return { ...FICHE_DEFAULTS, ...JSON.parse(store.get(FICHE_KEY) || '{}') }; } catch { return { ...FICHE_DEFAULTS }; }
}

export function saveFiche(fiche) { store.set(FICHE_KEY, JSON.stringify(fiche)); }

export function isExpired(expirationDate) {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  return expDate < today;
}
