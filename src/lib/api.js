// Couche d'accès aux données : tout passe par le back-end /api,
// qui interroge les sources officielles côté serveur (pas de CORS).

// Cache côté client (TTL: 5 minutes pour les recherches)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

const j = async (url, opts) => {
  const cacheKey = `${url}`;
  const cached = getCacheKey(cacheKey);
  if (cached) return cached;
  
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error('api ' + r.status);
  const data = await r.json();
  setCache(cacheKey, data);
  return data;
};

export const noAccents = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Debounce helper
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- Médicaments ---

// Un CIP-13 français commence toujours par 340 (codes BDPM).
// Un CIP-7 est un nombre de 7 chiffres.
// Tout autre code numérique est un EAN générique, pas un CIP.
function classifyCode(raw) {
  const digits = raw.replace(/\s/g, '');
  if (/^\d{7}$/.test(digits)) return { type: 'cip7', digits };
  if (/^340\d{10}$/.test(digits)) return { type: 'cip13', digits };
  if (/^\d{8,13}$/.test(digits)) return { type: 'ean', digits };
  return { type: 'text', digits: raw };
}

async function fetchByCode(digits) {
  const data = await j(`/api/medicaments?cip=${encodeURIComponent(digits)}`);
  return (Array.isArray(data) ? data : [data]).filter((x) => x && x.cis);
}

async function fetchByName(term) {
  const data = await j(`/api/medicaments?search=${encodeURIComponent(noAccents(term))}`);
  const list = (Array.isArray(data) ? data : [data]).filter((x) => x && x.cis);
  list.sort((a, b) => (/comm/i.test(b.etatComercialisation || '') ? 1 : 0) - (/comm/i.test(a.etatComercialisation || '') ? 1 : 0));
  return list;
}

export async function searchMedicaments(query) {
  const { type, digits } = classifyCode(query.trim());

  // Recherche par nom directement
  if (type === 'text') {
    const list = await fetchByName(digits);
    return { list, mode: 'name' };
  }

  // Code EAN non-médicament connu
  if (type === 'ean') {
    return { list: [], mode: 'ean', digits };
  }

  // CIP-7 ou CIP-13 : essai direct
  let list = await fetchByCode(digits);

  // CIP-13 : si rien, essai avec les 7 derniers chiffres (CIP-7 extrait)
  if (!list.length && type === 'cip13') {
    list = await fetchByCode(digits.slice(-7));
  }

  return { list, mode: list.length ? 'cip' : 'cip_notfound', digits };
}

export async function getGeneriques(med) {
  const sa = (med.composition || []).find((c) => !c.natureComposant || c.natureComposant === 'SA');
  if (!sa || !sa.denominationSubstance) return [];
  const q = noAccents(sa.denominationSubstance).toLowerCase().split(/[ (]/)[0];
  if (q.length < 3) return [];
  try {
    const groups = await j(`/api/generiques?libelle=${encodeURIComponent(q)}`);
    if (!Array.isArray(groups) || !groups.length) return [];
    const dose = noAccents(sa.dosage || '').toLowerCase().replace(/\s/g, '');
    const g = (dose && groups.find((gr) => noAccents(gr.libelle || '').toLowerCase().replace(/\s/g, '').includes(dose))) || groups[0];
    return [...new Set((g.medicaments || []).map((x) => x.elementPharmaceutique)
      .filter((n) => n && n.toLowerCase() !== (med.elementPharmaceutique || '').toLowerCase()))].slice(0, 4);
  } catch { return []; }
}

export async function medAutocomplete(query) {
  if (query.length < 3 || /^\d+$/.test(query)) return [];
  try {
    const data = await j(`/api/medicaments?search=${encodeURIComponent(noAccents(query))}`);
    const arr = Array.isArray(data) ? data : [];
    return [...new Set(arr.map((m) => m.elementPharmaceutique).filter(Boolean))].slice(0, 7);
  } catch { return []; }
}

// --- Parapharmacie ---
export async function searchParapharmacie(code) {
  const data = await j(`/api/parapharmacie/${encodeURIComponent(code)}`);
  if (data.status === 1 && data.product) return data.product;
  return null;
}

export async function getPrixIndicatif(code) {
  try {
    const data = await j(`/api/prix/${encodeURIComponent(code)}`);
    const items = (data.items || []).filter((x) => x && x.price != null && !isNaN(Number(x.price)));
    if (!items.length) return null;
    const prices = items.map((x) => Number(x.price));
    return { min: Math.min(...prices), max: Math.max(...prices), currency: items[0].currency || 'EUR', date: items[0].date || '' };
  } catch { return null; }
}

// --- Pharmacies & villes ---
export const MONACO = { nom: 'Monaco', cp: '98000', lat: 43.7384, lon: 7.4246 };

export async function cityAutocomplete(query) {
  let items = [];
  if ('monaco'.startsWith(noAccents(query).toLowerCase())) items.push(MONACO);
  try {
    const villes = await j(`/api/communes?q=${encodeURIComponent(query)}`);
    items = items.concat(villes);
  } catch { /* ignore */ }
  return items.slice(0, 8);
}

export async function fetchPharmacies(lat, lon) {
  const list = await j(`/api/pharmacies?lat=${lat}&lon=${lon}`);
  return list.sort((a, b) => (a.lat - lat) ** 2 + (a.lon - lon) ** 2 - ((b.lat - lat) ** 2 + (b.lon - lon) ** 2)).slice(0, 12);
}
