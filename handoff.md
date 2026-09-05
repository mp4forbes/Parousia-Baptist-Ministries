# Handoff — Parousia Baptist Ministries

**Date:** 2026-09-04  
**Repo:** Parousia Baptist Ministries (`master`)  
**Production:** https://parousiabaptistchurch.org  
**Cloud Run revision:** `parousia-baptist-ministries-00031-v4d`  
**Latest commit:** `afda46f` — *Replace legacy Haitian Creole with standard French across the site.*

---

## Start here (next session)

Paste this into a new Cursor session:

> Read `handoff.md` before making changes. The site uses standard **French** in `*_kreyol` / `*_ht` fields (not Haitian Creole). Follow bilingual UI conventions for the language toggle and admin labels. Deploy with image-only `gcloud run deploy` (see Deploy section below).

---

## What was completed recently

| Commit | Summary | Deployed |
|--------|---------|----------|
| *(local, uncommitted)* | Morning devotionals: group-chat prompt, French-only presets, Creole fallbacks removed | No |
| `afda46f` | Creole → standard French: helpers, DB migrations, admin labels, public display | Yes (`00031-v4d`) |
| `22b5ef5` | Header flicker fix; scroll nav + hamburger at medium widths | Yes (`00030-5lh`) |
| `2d0d786` | Full-width public site layout | Yes (`00029-8vj`) |

### Morning devotionals (local)

- **`src/lib/devotional-presets.ts`** — Gemini group-chat prompt + French/English fallbacks. `*_kreyol` values are standard French.
- **`src/lib/actions.ts`** — generates the full morning-devotional structure (greeting, scripture, core lesson, wisdom, prayer) whenever `GEMINI_API_KEY` is set; presets are the fallback.
- **`src/lib/db/seed.ts`** — replaces known Creole daily-devotional rows with the French group-chat versions on startup.
- Public `/devotional` page keeps line breaks and has **Copy for group chat**.

### French / Creole work (`afda46f`)

- **`src/lib/french-content.ts`** — normalization, Creole detection, canonical French maps, display helpers:
  - `frenchField`, `pickLocalizedField`, `resolveFrenchContent`
  - `frenchBlogFields`, `frenchEventFields`, `frenchHaitiMissionFields`, `frenchPrayerRequest`
  - `CANONICAL_*` maps for blog, events, Haiti missions, local outreach, prayer text
- **`src/lib/db/seed.ts`** — runs on every app startup:
  - `migrateLegacyFrenchContent()` — settings, ministries, schedules, blog, events, etc.
  - `migrateKnownLegacyCreoleRecords()` — known legacy rows (blog, events, missions, prayers, schedules, ministries, outreach, event locations)
  - **Important:** `administrative_care_categories` uses `slug` as PK, not `id` (migration must not query `id` on that table)
- **Admin labels** in `AdminDashboardClient.tsx` — Creole bilingual labels replaced with standard French (`Image d'arrière-plan`, `Croyance`, `Identifiant CashApp`, etc.)
- **Docs / agent rules:** `AGENTS.md`, `handoff.md` (this file), `.cursor/rules/admin-bilingual-fields.mdc`

### Post-deploy note

- Cloud Run serves the new revision immediately; **open browser tabs do not auto-refresh**. Users need a normal or hard refresh to see changes.
- Startup migrations rewrite legacy Creole in French DB columns only; English content and site structure are unchanged.

---

## Bilingual conventions (do not regress)

### Never Haitian Creole

Nothing on this site should be converted to, generated as, or stored as Haitian Creole. All translations and non-English copy must be proper **standard French**. Legacy names (`kreyol`, `fr_ht`, `*_kreyol`, `*_ht`) are database/UI codes only — they are not a license to write Creole.

### Language code

- `fr_ht` = French UI (legacy code name; content must be **standard French**, not Haitian Creole)
- `en` = English UI

### Language toggle button (`translations.ts` → `btnToggleLanguage`)

Show the **target** language, not the current page language:

| Active UI | Button label |
|-----------|--------------|
| French (`fr_ht`) | **Translate to English** |
| English (`en`) | **Traduire en français** |

### French content fields

- DB columns `*_kreyol`, `*_ht`, settings keys `*_ht` store **standard French**.
- Public pages: always use `french-content.ts` helpers; do not render raw `*_kreyol` in French mode without normalization.
- Admin bilingual labels: pattern `English / Français` — French half must never be Creole (`Imaj`, `Jou`, `Kwayans`, `Misyon`, etc.).

### If new Creole appears

1. Add canonical French to `french-content.ts` (map or helper).
2. Add a row to `migrateKnownLegacyCreoleRecords()` in `seed.ts` for DB cleanup on deploy.
3. Use the helper in `PublicHome.tsx` or the relevant client component.

---

## Architecture (current)

### Page-based navigation — **done**

Routes under `src/app/(site)/` with shared layout (`SiteHeader`, `SiteFooter`, `LanguageProvider`):

| Route | Section |
|-------|---------|
| `/` | Home (hero) |
| `/schedules`, `/sermons`, `/events`, `/blog`, `/prayer-wall`, `/giving`, `/contact` | Main nav sections |
| `/about`, `/about/[tab]` | About tabs |
| `/ministries`, `/ministries/[slug]` | Ministry pages |
| `/administrative-care`, `/administrative-care/[slug]` | Administrative Care hub + categories |

`PublicSectionPage` → `PublicHome` with `section` prop; data from `loadPublicSiteData()`.

### Administrative Care — **done**

- Tables: `administrative_care_categories` (PK: `slug`), `administrative_care_submissions`
- Form fields: `src/lib/administrative-care-fields.ts`
- Public: `AdministrativeCareHubClient`, `AdministrativeCareCategoryClient`, `AdministrativeCareForm`
- Admin: `AdminAdministrativeCareTab`
- Categories: `weddings`, `funerals`, `baptisms`, `childrens-dedications`, `hospice-support`

### Key files

| Area | Location |
|------|----------|
| Public shell | `src/components/PublicHome.tsx`, `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx` |
| French content | `src/lib/french-content.ts` |
| DB seed + migrations | `src/lib/db/seed.ts`, `src/lib/db/schema.sql` |
| Server actions | `src/lib/actions.ts` |
| Translations | `src/lib/translations.ts` |
| Admin dashboard | `src/components/AdminDashboardClient.tsx` |
| Site nav helpers | `src/lib/site-nav.ts` |

---

## Production / deploy

| Item | Value |
|------|-------|
| GCP project | `gen-lang-client-0983602251` |
| Cloud Run service | `parousia-baptist-ministries` (`us-west1`) |
| Custom domain | https://parousiabaptistchurch.org |
| Assets | GCS bucket `gen-lang-client-0983602251-parousia-assets` mounted at `/data/assets` |
| SendGrid from | `contact@parousiabaptistchurch.org` |
| Default public language | French (`fr_ht`) |
| GitHub Actions | `.github/workflows/deploy.yml` exists but may lack GCP secrets — manual deploy used |

### Manual deploy (image-only — preserves Cloud SQL, secrets, GCS volume)

```bash
PROJECT_ID=gen-lang-client-0983602251
REGION=us-west1
SERVICE=parousia-baptist-ministries
TAG=$(git rev-parse --short HEAD)
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/straightlinecards/${SERVICE}:${TAG}"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker build --platform linux/amd64 -t "${IMAGE_URI}" .
docker push "${IMAGE_URI}"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --quiet
```

Do **not** pass full `--set-secrets` / `--add-cloudsql-instances` flags on routine deploys unless intentionally changing infra.

### Local dev

```bash
npm run dev -- -p 3000
```

Requires `.env.local` with `DATABASE_URL`, `DATA_DIR=./data`, etc. Local Postgres DB must have `theme_mode: light` in `settings` for production-like appearance; if DB init fails, settings fall back to dark theme.

---

## Git hygiene

**Do not commit** (currently untracked):

- `.cursor/mcp.json`
- `data/assets/*` (uploaded production assets; use GCS in prod)
- `docs/pitch-deck/`, `scripts/pitch-deck-screenshots/`, `test-results/`

Only commit when the user explicitly asks.

---

## Known pitfalls

1. **Broken DB init → dark theme** — If `seed.ts` migration throws (e.g. wrong column on `administrative_care_categories`), `getSettings()` returns `{}` and the site defaults to `theme_mode: dark`. Migrations are wrapped in try/catch per table; keep it that way.
2. **Creole in DB, not in code** — Much legacy content lives in production PostgreSQL. Code + startup migration must handle it; editing seed defaults alone is not enough for existing rows.
3. **Browser cache** — After deploy, verify with a hard refresh or incognito window.

---

## Possible next work (not started / backlog)

- QA pass on production after French release (all pages, admin config tabs, coordinator portal).
- Fix GitHub Actions deploy secrets so push-to-master deploys automatically.
- Pitch deck assets in `docs/pitch-deck/` (local only, untracked).
- Admin guide HTML regeneration if admin UI labels changed (`docs/Parousia-Admin-Guide*.md` were lightly updated in French pass).

---

## Administrative Care reference (implemented)

Section nav: **Administrative Care** / **Soins pastoraux**

| Slug | English | French |
|------|---------|--------|
| `weddings` | Weddings | Mariages |
| `funerals` | Funerals & Bereavement | Funérailles et deuil |
| `baptisms` | Baptisms | Baptêmes |
| `childrens-dedications` | Children's Dedications | Présentation d'enfants |
| `hospice-support` | Hospice & Pastoral Visitation | Soins palliatifs et visites pastorales |

Full form field definitions remain in `src/lib/administrative-care-fields.ts`. FBCLG reference copy was used for seed descriptions (see git history / seed.ts if needed).
