# ElyHub

> **ElyHub** — la plateforme des structures esport d'Elysium : équipes, recrutement, scrims, tournois, joueurs.
> React 19 · Create React App (CRACO) · Firebase (Auth + Firestore + Storage) · Tailwind CSS · Vercel.

## Sommaire

- [Démarrer](#démarrer)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture)
- [Firebase (règles de sécurité)](#firebase-règles-de-sécurité)
- [Fonctions serveur / Vercel](#fonctions-serveur--vercel)
- [SEO](#seo)
- [Recherche](#recherche)
- [Scripts](#scripts)
- [Tests & CI](#tests--ci)

---

## Démarrer

```bash
npm ci          # installation reproductible (package-lock.json)
cp .env.example .env   # renseigner la config Firebase
npm start       # serveur de dev sur http://localhost:3000
```

Le projet s'installe avec **npm** (le sandbox/CI ne joignent pas registry.yarnpkg.com ;
`.npmrc` active `legacy-peer-deps` pour réconcilier React 19 et react-scripts 5).

## Variables d'environnement

Voir [`.env.example`](./.env.example) — variables **sans préfixe** (`FIREBASE_API_KEY`, …),
exposées au client par la liste `CLIENT_ENV_VARS` de [`craco.config.js`](./craco.config.js)
via `DefinePlugin`. La forme préfixée `REACT_APP_*` est aussi acceptée (prioritaire).
Toute variable ajoutée doit être déclarée dans cette liste **et** dans `.env.example`.

Sur Vercel : Project → Settings → Environment Variables (Production + Preview), puis **redéploiement**
(les valeurs sont inlinées au build).

Si Firebase n'est pas configuré, l'app démarre en mode dégradé avec un bandeau d'avertissement
(voir `src/lib/firebase.js`) au lieu d'un écran noir.

## Architecture

```
src/
├── App.js                  # routes (React.lazy + Suspense) & providers
├── components/
│   ├── common/             # Cards, Badges, States, Seo, Glossary, Modals…
│   ├── layout/             # Navbar, FilterBar, Footer, CommandPalette
│   ├── tournament/         # Bracket, Match (scores, litiges)
│   └── ui/                 # primitives shadcn (15 composants conservés, les 31 morts ont été purgés)
├── context/                # AuthContext (rôles admin/mod), FiltersContext, GamesContext, NotificationsContext
├── hooks/                  # useCollection/useDocument (Firestore temps réel), useGames (via contexte)
├── i18n/                   # FR, EN (+ DE, ES, PT, IT partiels, repli sur EN) — détection langue navigateur
├── lib/                    # firebase, db, constants, bracket, utils, image, time, elo, search, glossary
└── pages/                  # une page par route, chargée en lazy
```

Conventions : `data-testid` partout ; texte via `useI18n().t()` (jamais en dur) ;
cards via `src/components/common/Cards.jsx` ; états via `States.jsx`.

## Firebase (règles de sécurité)

Toutes les écritures partent du navigateur : les règles de sécurité sont donc **obligatoires**
et versionnées dans le dépôt :

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

- [`firestore.rules`](./firestore.rules) — propriété par collection, rôles `admin`/`moderator`
  (champ `role` du document `users/{uid}`), messagerie restreinte aux participants,
  escalade de rôle interdite, quotas d'écriture à durcir via Cloud Functions (voir `functions/`).
- [`storage.rules`](./storage.rules) — images publiques en lecture, écriture par le propriétaire.
- [`firestore.indexes.json`](./firestore.indexes.json) — index composites pour les tris/filtres.

Les images sont stockées dans **Firebase Storage** (URL), plus en base64 dans Firestore :
`src/lib/image.js` fait le basculement (base64 en secours si Storage n'est pas configuré).

## Fonctions serveur / Vercel

Le dossier `api/` contient les fonctions Vercel :

| Fichier | Rôle |
|---|---|
| `api/sitemap.ts` | `sitemap.xml` dynamique (routes statiques + contenus Firestore) |
| `api/og-image.ts` | image Open Graph 1200×630 générée par fiche — runtime **nodejs** (pas edge) : le bundler Edge ne sait pas embarquer `@vercel/og` hors Next.js |
| `api/ical/[teamId].ts` | flux iCal des scrims d'une équipe |
| `middleware.ts` | routage SPA + **vraies 404** (URL inconnues → `/404.html`, statut 404) |

Le middleware ne s'exécute QUE sur les routes « page » (son `config.matcher` exclut
`/api`, `/static`, `/brand` et tout fichier avec extension) : les fichiers statiques
sont servis directement par Vercel avec leur bon Content-Type. Ne jamais répondre
soi-même aux chemins statiques depuis un middleware : la réponse remplacerait le
fichier (MIME vide + `X-Content-Type-Options: nosniff` → écran noir).

### Déploiement Vercel — pièges connus

1. **Deployment Protection** : si « Vercel Authentication » est activée (Settings →
   Deployment Protection), les sous-ressources sont redirigées vers
   `vercel.com/sso-api` — le manifest échoue en CORS et les visiteurs non
   authentifiés voient un mur de connexion. Pour un site public :
   **désactiver Vercel Authentication** (production + previews).
2. **Variables d'environnement** : les valeurs sont inlinées au build — ajouter les
   variables puis **redéployer** (voir [Variables d'environnement](#variables-denvironnement)).

`functions/` contient les Cloud Functions Firebase de référence (notifications, alertes,
e-mails, synchronisation de recherche Meilisearch, quotas anti-spam) — à déployer avec
`firebase deploy --only functions`.

## SEO

- **Titre/meta/canonical/Open Graph/Twitter Card par route** : composant `Seo`
  (`src/components/common/Seo.jsx`, react-helmet-async), utilisé par chaque page.
- **JSON-LD** : `SportsEvent` (tournois), `SportsTeam`/`Organization` (équipes),
  `Person` (joueurs), `JobPosting` (offres), `BreadcrumbList` (hubs).
- **Hubs par jeu** : `/valorant`, `/valorant/equipes`, `/valorant/scrims`, `/league-of-legends/tournois`…
  (URLs lisibles qui agrègent équipes, offres, scrims, tournois, joueurs + ladder de rangs).
- `public/robots.txt` → `/api/sitemap.xml` ; `public/manifest.webmanifest` (PWA) ;
  `public/404.html` (statut 404 réel via `middleware.ts`).

Le pré-rendu des pages publiques au build (option 1 du cahier des charges) reste possible
avec `react-snap` ; le sitemap dynamique + middleware couvrent l'indexation en attendant.

## Recherche

- **⌘K / Ctrl+K** : palette globale (`src/components/layout/CommandPalette.jsx`, `cmdk`)
  sur équipes, joueurs, tournois, scrims, offres et LFT.
- **Recherche serveur** : Meilisearch/Typesense/Algolia conseillé au-delà de quelques centaines
  d'entrées. `src/lib/search.js` lit la config (`SEARCH_HOST`/`SEARCH_KEY`) et bascule
  automatiquement en recherche locale tant que le serveur n'est pas déployé ;
  `functions/` contient la fonction de synchronisation Firestore → Meilisearch.

## Scripts

| Commande | Rôle |
|---|---|
| `npm start` | dev server (CRACO) |
| `npm run build` | build de production (warnings affichés — plus de `CI=false`) |
| `npm test` | tests unitaires (Jest) |
| `npm run lint` | ESLint 9 (flat config `eslint.config.mjs`) |

## Tests & CI

- `.github/workflows/ci.yml` : lint + tests + build sur push/PR.
- Tests dans `src/**/__tests__/` : `bracket.test.js` (génération, standings),
  `time.test.js` (fuseaux, relatifs), `utils.test.js` (ICS, ELO, normalisation).
- `data-testid` est généralisé : un socle E2E (Playwright/Cypress) peut s'appuyer dessus.
