# Pharmascan

Application qui permet d'**identifier un médicament** (base officielle BDPM/ANSM) ou un **produit de parapharmacie** (Open Beauty Facts), de **trouver une pharmacie** et le **contact de garde** (3237), et de gérer une **armoire à pharmacie** avec rappels.

> **Principe de sécurité :** l'application affiche des données **officielles et factuelles**. Elle n'invente jamais d'information médicale. Pour la posologie détaillée, elle renvoie vers la notice officielle.

---

## Démarrer en local

Pré-requis : **Node.js 18+**.

```bash
npm install
npm start
```

`npm start` lance en parallèle :
- le **back-end** (Express) sur `http://localhost:8787`
- le **front** (Vite) sur `http://localhost:5173`

Ouvrez `http://localhost:5173`. (Pour lancer séparément : `npm run server` et `npm run dev`.)

---

## Architecture

```
Front (React + Vite + PWA)
        │  appels à /api/...
        ▼
Back-end (Express, server/index.js)   ← règle le CORS, centralise les appels
        │
        ├─ BDPM (médicaments) ............. medicaments-api.giygas.dev
        ├─ Open Beauty Facts (parapharma)  world.openbeautyfacts.org
        ├─ Open Prices (prix indicatif) ... prices.openfoodfacts.org
        ├─ Base Adresse Nationale (villes)  api-adresse.data.gouv.fr
        └─ OpenStreetMap (pharmacies) ..... overpass-api.de
```

Le front n'appelle jamais directement ces services : il passe par le back-end. C'est ce qui règle les blocages CORS et permettra d'ajouter des **clés d'API**, un **cache**, et un **compte utilisateur**.

### Fichiers clés
- `server/index.js` — le back-end et ses routes `/api/*`
- `src/lib/api.js` — la couche d'accès aux données côté front
- `src/lib/storage.js` — l'armoire (stockage local)
- `src/components/*` — les 4 sections (Médicaments, Parapharmacie, Pharmacies, Armoire)
- `src/index.css` — la direction artistique (couleurs, composants)

---

## Feuille de route du back-end

Ces fonctionnalités demandent le back-end (déjà amorcé dans `server/index.js`) :

- [ ] **Notice officielle structurée** (posologie, contre-indications, effets indésirables) — la fiche est aujourd'hui volontairement sobre et renvoie à la notice.
- [ ] **Statut rupture / tension en temps réel** — route `/api/disponibilite/:cis` à connecter à la source officielle ANSM (Trustmed), via une API d'éditeur (Synapse, Claude Bernard).
- [ ] **OCR d'ordonnance** — modèle de vision côté serveur (donnée de santé sensible).
- [ ] **Comptes utilisateurs** — pour synchroniser l'armoire et activer les vraies notifications de rappel.
- [ ] **Héberger sa propre base BDPM** — la BDPM est réutilisable ; en production, servir les fichiers officiels depuis son back-end plutôt que via une API tierce non commerciale.

---

## Sources & licences

- **BDPM** (médicaments) — base publique, source ANSM.
- **Open Beauty Facts** & **Open Prices** — licence **ODbL** (réutilisation commerciale avec attribution et partage à l'identique).
- **Base Adresse Nationale** & **OpenStreetMap** — données ouvertes (attribution requise pour OSM).

## Conformité

Données traitées : médicaments, produits, pharmacies — **pas de données patients**. Avant tout déploiement : CGU, RGPD (hébergement UE), et revue juridique. L'application est un outil d'**information**, pas de conseil médical.
