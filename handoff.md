# Handoff: Administrative Care Section + Page-Based Navigation

**Date:** 2026-08-18 (updated)  
**Repo:** Parousia-Baptist-Ministries  
**Production:** https://parousiabaptistchurch.org (Cloud Run revision `parousia-baptist-ministries-00022-j4r` at time of handoff)  
**Recommended:** Start a **new Cursor session** for this work. It spans routing/IA, public UI, DB schema, server actions, admin dashboard, bilingual copy, and email templates.

---

## Feature summary

### 1. Administrative Care (new section)

Add a new main-menu entry called **Administrative Care** with five care categories. Each category gets its own page/frame with:

1. **Photo gallery** (admin-uploadable images)
2. **Description** (bilingual EN / FR) — initial copy derived from [FBCLG Request Services](https://fbcsomerset.com/request-services/) and related pastoral-care pages on [fbcsomerset.com](https://fbcsomerset.com/events/)
3. **Category-specific intake form** — initial fields/wording derived from FBCLG pastoral-care language (see below)

On submission:

- Route notifications to church staff (configured in admin, like Contact Us — Secretary, Public Relations, etc.).
- **Auto-send a professional acknowledgment email** to the submitter from `contact@parousiabaptistchurch.org`.
- All outbound emails: consistent HTML template with church logo, address, and `contact@parousiabaptistchurch.org`.

### 2. Page-based navigation (site-wide UX change)

**Problem today:** The site is one long scrolling page (`PublicHome.tsx` with `#anchor` links). Scrolling past one topic bleeds into the next, which feels distracting.

**Desired behavior:** The top menu navigates to a **dedicated page/topic**. Users can scroll **within** that page, but content from other menu items does not appear until they choose another menu item.

**Implement this refactor alongside Administrative Care** (or immediately before it) so the new section is born as a proper route, not another `#anchor` on the homepage.

---

## Reference: FBCLG pastoral-care wording

Primary reference: [How Can We Serve You – FBCLG](https://fbcsomerset.com/request-services/)

FBCLG frames pastoral care as support “in all of their joys and sorrows” — pre-marital counseling, prayer, funeral/bereavement support, visitation, assistance, guidance, comfort, and counseling for members, families, and the community.

| FBCLG topic | Scripture / tone | Maps to Parousia category |
|-------------|------------------|---------------------------|
| Weddings | Genesis 2:24 — lifelong commitment; premarital counseling required for ordained minister | `weddings` |
| Bereavement | Exodus 33:14 — comfort, direct, and support in season of loss | `funerals` |
| Baby Dedications | 1 Samuel 1:28 — parents complete dedication form; scheduled service | `childrens-dedications` |
| Pastoral Care – Health Notification | Matthew 25:36 — visitations from diagnosis to recuperation | `hospice-support` |
| (Executive pastor scope) | Weddings, funerals, baptisms, baby dedications coordinated by pastoral staff | `baptisms` |

Secondary reference for community-care tone: [FBCLG Events](https://fbcsomerset.com/events/) (e.g. Bereavement Circle, Caregiver Support Group — ongoing support groups; optional checkbox on funeral/hospice forms).

Contact email on FBCLG pastoral care: `pastoralcare@fbcsomerset.com` → Parousia uses `contact@parousiabaptistchurch.org`.

---

## Categories

| Slug | English title | French title |
|------|---------------|--------------|
| `weddings` | Weddings | Mariages |
| `funerals` | Funerals & Bereavement | Funérailles et deuil |
| `baptisms` | Baptisms | Baptêmes |
| `childrens-dedications` | Children's Dedications | Présentation d'enfants |
| `hospice-support` | Hospice & Pastoral Visitation | Soins palliatifs et visites pastorales |

**Section title (nav):** Administrative Care / **Soins pastoraux**  
**Section tagline (EN):** *How can we serve you?* — adapted from FBCLG  
**Section tagline (FR):** *Comment pouvons-nous vous servir ?*

---

## Initial section descriptions (seed in DB)

Use as default `description_english` / `description_kreyol` (legacy `*_kreyol` column names hold proper French).

### Weddings
- **EN:** “That is why a man leaves his father and mother and is united to his wife, and they become one flesh.” (Genesis 2:24) Marriage is a lifelong commitment and should not be entered into lightly. All couples who desire an ordained minister from Parousia Baptist Ministries to officiate their wedding ceremony must complete premarital counseling sessions.
- **FR:** « C’est pourquoi l’homme quittera son père et sa mère et s’attachera à sa femme, et ils deviendront une seule chair. » (Genèse 2:24) Le mariage est un engagement pour la vie et ne doit pas être pris à la légère. Tout couple qui souhaite qu’un ministre ordonné de Parousia Baptist Ministries célèbre son mariage doit suivre des séances de counseling prénuptial.

### Funerals & Bereavement
- **EN:** “The Lord replied, ‘My Presence will go with you, and I will give you rest.’” (Exodus 33:14) Of all life experiences, death is often the most painful and challenging. Parousia Baptist Ministries is available to comfort, direct, and support you during this season of life.
- **FR:** « L’Éternel répondit : Ma présence ira avec toi, et je te donnerai du repos. » (Exode 33:14) Parmi toutes les expériences de la vie, la mort est souvent la plus douloureuse. Parousia Baptist Ministries est là pour vous consoler, vous orienter et vous soutenir en cette période.

### Baptisms
- **EN:** Baptism is a public declaration of faith in Jesus Christ. Our pastoral team will walk with you as you prepare for this important step of obedience and celebration with the church family.
- **FR:** Le baptême est une déclaration publique de foi en Jésus-Christ. Notre équipe pastorale vous accompagnera dans cette étape importante d’obéissance et de célébration avec la famille de l’église.

### Children's Dedications
- **EN:** “So now I give him to the Lord. For his whole life he will be given over to the Lord.” (1 Samuel 1:28) Any parent who desires to have a child dedicated must complete this request form. Our team will confirm scheduling details with you.
- **FR:** « C’est pourquoi je le donne à l’Éternel ; il appartiendra à l’Éternel pour toujours. » (1 Samuel 1:28) Tout parent qui souhaite présenter son enfant au Seigneur doit remplir ce formulaire. Notre équipe vous confirmera les détails de la célébration.

### Hospice & Pastoral Visitation
- **EN:** “I was sick and you looked after me…” (Matthew 25:36) From diagnosis through recuperation or end-of-life care, we provide pastoral support through prayer, visitation, and compassionate presence.
- **FR:** « J’étais malade, et vous m’avez visité… » (Matthieu 25:36) Du diagnostic à la convalescence ou aux soins de fin de vie, nous offrons un soutien pastoral par la prière, les visites et une présence compatissante.

---

## Initial form fields (`administrative-care-fields.ts`)

**Shared base fields on every form** (rendered by form component, not duplicated per slug):
- `requester_name` (text, required)
- `requester_email` (text/email, required)
- `requester_phone` (text, optional)
- `is_church_member` (select: Yes / No / Not sure)

### `weddings`
| Key | Type | EN label | FR label |
|-----|------|----------|----------|
| `partner_one_name` | text | Partner 1 full name | Nom complet du partenaire 1 |
| `partner_two_name` | text | Partner 2 full name | Nom complet du partenaire 2 |
| `preferred_wedding_date` | text | Preferred wedding date | Date de mariage souhaitée |
| `ceremony_location` | select | Ceremony location (Church sanctuary / Other venue / Undecided) | Lieu de la cérémonie |
| `prior_marriage` | select | Has either partner been married before? (Yes / No) | L’un des partenaires a-t-il déjà été marié ? |
| `premarital_counseling_ack` | checkbox | I understand premarital counseling is required before an ordained minister may officiate. | Je comprends que le counseling prénuptial est requis avant qu’un ministre ordonné puisse célébrer le mariage. |
| `additional_notes` | textarea | Additional details or questions | Détails ou questions supplémentaires |

### `funerals`
| Key | Type | EN label | FR label |
|-----|------|----------|----------|
| `deceased_full_name` | text | Full name of deceased | Nom complet du défunt |
| `date_of_passing` | text | Date of passing | Date du décès |
| `relationship_to_deceased` | text | Your relationship to the deceased | Votre lien avec le défunt |
| `service_date_preference` | text | Preferred funeral / memorial date | Date souhaitée pour les funérailles ou commémoration |
| `service_location_preference` | select | Service location (Church / Cemetery / Funeral home / Other) | Lieu du service |
| `family_contact_name` | text | Primary family contact name | Nom du contact familial principal |
| `family_contact_phone` | text | Primary family contact phone | Téléphone du contact familial |
| `support_needed` | textarea | How can our pastoral team support you at this time? | Comment notre équipe pastorale peut-elle vous soutenir en ce moment ? |
| `bereavement_group_interest` | checkbox | I am interested in ongoing bereavement support / grief care. | Je souhaite recevoir un soutien continu dans le deuil. |

### `baptisms`
| Key | Type | EN label | FR label |
|-----|------|----------|----------|
| `candidate_full_name` | text | Candidate full name | Nom complet du candidat |
| `candidate_age` | number | Candidate age | Âge du candidat |
| `baptism_date_preference` | text | Preferred baptism date | Date de baptême souhaitée |
| `previously_baptized` | select | Have you been baptized before? (Yes / No / Not sure) | Avez-vous déjà été baptisé ? |
| `salvation_testimony` | textarea | Brief testimony of faith in Christ | Bref témoignage de foi en Christ |
| `pastor_meeting_requested` | checkbox | I would like a pastor to contact me to prepare for baptism. | Je souhaite qu’un pasteur me contacte pour préparer le baptême. |

### `childrens-dedications`
| Key | Type | EN label | FR label |
|-----|------|----------|----------|
| `child_full_name` | text | Child's full name | Nom complet de l'enfant |
| `child_date_of_birth` | text | Child's date of birth | Date de naissance de l'enfant |
| `parent_guardian_names` | text | Parent(s) / guardian name(s) | Nom(s) du/des parent(s) ou tuteur(s) |
| `preferred_service_month` | text | Preferred month for dedication | Mois souhaité pour la présentation |
| `dedication_ack` | checkbox | I understand child dedication is a commitment to raise my child in the Christian faith with the support of the church. | Je comprends que la présentation de l’enfant est un engagement à l’élever dans la foi chrétienne avec le soutien de l’église. |
| `additional_notes` | textarea | Allergies, special needs, or scheduling notes | Allergies, besoins particuliers ou notes d’horaire |

### `hospice-support`
| Key | Type | EN label | FR label |
|-----|------|----------|----------|
| `patient_full_name` | text | Patient full name | Nom complet du patient |
| `relationship_to_patient` | text | Your relationship to the patient | Votre lien avec le patient |
| `care_setting` | select | Care setting (Hospital / Hospice facility / Home / Rehabilitation / Other) | Lieu de soins |
| `facility_or_address` | text | Facility name or home address | Nom de l’établissement ou adresse du domicile |
| `patient_condition` | textarea | Brief description of situation (optional) | Brève description de la situation (facultatif) |
| `visitation_requested` | select | Pastoral visitation requested? (Yes / No / Phone call only) | Visite pastorale souhaitée ? |
| `prayer_support_requested` | checkbox | Please include this need in our church prayer care. | Veuillez inclure ce besoin dans nos prières pastorales. |
| `share_with_pastoral_team` | checkbox | I authorize the pastoral care team to coordinate support with my family. | J’autorise l’équipe pastorale à coordonner le soutien avec ma famille. |

---

## Page-based navigation architecture

### Current state
- Single route `/` renders all content in `PublicHome.tsx`.
- Nav uses `href="#section"` + `scrollIntoView`.
- Some standalone routes already exist: `/devotional`, `/free-gift`, `/admin`.

### Recommended approach: App Router pages + shared layout

Create a **public site layout** with persistent header (nav, language toggle, contact CTA) and footer.

```
src/app/
  (site)/
    layout.tsx          ← SiteHeader + SiteFooter + LanguageProvider
    page.tsx            ← Home / hero / welcome only (or redirect to /home)
    home/page.tsx
    schedules/page.tsx
    sermons/page.tsx
    events/page.tsx
    ministries/page.tsx
    ministries/[slug]/page.tsx
    administrative-care/page.tsx        ← category hub
    administrative-care/[slug]/page.tsx ← weddings, funerals, etc.
    prayer-wall/page.tsx
    blog/page.tsx
    giving/page.tsx
    contact/page.tsx
    about/page.tsx                      ← tabs: about / beliefs / team / expect
```

**Nav behavior:**
- Each top-level menu item is a **Next.js `<Link href="/events">`** (not `#events`).
- Only that page’s content renders; no adjacent sections below the fold.
- Sub-menus (About tabs, Ministry types, Administrative Care categories) use either:
  - nested routes (`/about/team`, `/administrative-care/weddings`), or
  - in-page tabs **within** the route (scroll confined to that page’s main column).

**Migration strategy (phased):**
1. Extract `SiteHeader`, `SiteFooter`, shared theme helpers from `PublicHome.tsx`.
2. Move one section at a time into its own page (start with **Administrative Care** as new).
3. Update all nav links from `#anchors` to routes.
4. Keep temporary redirects: `/#events` → `/events` via middleware or client effect for bookmark compatibility.
5. Slim `PublicHome.tsx` down or replace `/` with a focused landing page.

**Alternative (faster, less ideal):** Single route with client state `activePage` that mounts only one section at a time (`display: none` on others). Easier short-term but worse URLs/SEO — prefer real routes.

### UX details
- Scroll position resets to top on route change.
- Active nav item highlighted based on `usePathname()`.
- Mobile menu closes on navigation.
- French/EN toggle persists across routes (existing `LanguageContext` + cookie).

---

## Admin dashboard

- New admin tab: **Administrative Care**
- Per category:
  - Edit descriptions (EN + FR) and images
  - View / delete submissions
  - Export to Excel (`AdminSectionContactExport` pattern)
  - Configure notification routing (`contact_name`, `contact_email`, `notification_emails`)
- Default notification routing suggestion: Secretary for weddings/dedications/baptisms; Public Relations or pastoral care lead for funerals/hospice (admin-configurable, not hard-coded).

### Email

**On every submission:**
1. Staff notification → configured `notification_emails`
2. Submitter auto-ack → `contact@parousiabaptistchurch.org`, professional HTML with logo + church address

Add `src/lib/email-templates.ts` with `buildChurchEmailHtml()`. Current `submitContactForm` does not auto-reply to sender — this feature introduces that pattern.

---

## Data model

```sql
CREATE TABLE administrative_care_categories (
  slug TEXT PRIMARY KEY,
  title_english TEXT NOT NULL,
  title_kreyol TEXT NOT NULL,
  description_english TEXT NOT NULL,
  description_kreyol TEXT NOT NULL,
  images_json TEXT DEFAULT '[]',
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  notification_emails TEXT DEFAULT ''
);

CREATE TABLE administrative_care_submissions (
  id SERIAL PRIMARY KEY,
  category_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  responses TEXT NOT NULL DEFAULT '{}',
  language TEXT DEFAULT 'en',
  created_at TEXT NOT NULL
);
```

Register admin section slugs in `src/lib/admin-sections.ts`. Seed five categories in `src/lib/db/seed.ts` with descriptions above.

---

## Existing code to reuse

| Pattern | Location |
|---------|----------|
| Per-slug form fields | `src/lib/ministry-signup-fields.ts` |
| Dynamic form UI | `src/components/MinistrySignupForm.tsx` → `AdministrativeCareForm.tsx` |
| Ministry content + signups | `ministries` + `ministry_signups`, `submitMinistrySignup` |
| Admin notification config | `src/components/AdminSectionContactExport.tsx` |
| Email sending | `src/lib/notify.ts` |
| Church contact for signature | `src/lib/church-contact.ts` |
| French content quality | `src/lib/french-content.ts` |
| Standalone page example | `src/app/devotional/page.tsx`, `src/app/free-gift/page.tsx` |

---

## Implementation order (new session)

1. **Navigation refactor** — shared layout + extract header/footer; convert nav to routes (can migrate sections incrementally).
2. **Data model + seed** — tables, default descriptions, admin slugs.
3. **`administrative-care-fields.ts`** — use field tables above verbatim.
4. **Server actions** — CRUD, submit, notify staff, auto-ack email.
5. **Public routes** — `/administrative-care` hub + `/administrative-care/[slug]` pages with gallery, description, form.
6. **Admin UI** — content editor, submissions inbox, export, notification config.
7. **Translations** — `translations.ts` nav strings.
8. **Build + deploy** — `linux/amd64` Docker; do not commit `data/assets/`.

---

## Production / infra reminders

| Item | Value |
|------|-------|
| GCP project | `gen-lang-client-0983602251` |
| Cloud Run | `parousia-baptist-ministries` (`us-west1`) |
| Assets bucket | `gen-lang-client-0983602251-parousia-assets` → `/data/assets` |
| SendGrid from | `contact@parousiabaptistchurch.org` |
| Default language | French (`fr_ht` language code; content is standard French) |
| GitHub Actions deploy | Broken (missing GCP secrets) — manual `gcloud run deploy` |

---

## Bilingual UI conventions (do not regress)

### Language toggle button (`translations.ts` → `btnToggleLanguage`)

The header language button must show the **target** language, not the current page language:

| Current site language | Button label |
|----------------------|--------------|
| French (`fr_ht`) | **Translate to English** (English text) |
| English (`en`) | **Traduire en français** (French text) |

Do **not** show both labels in the same language as the active page UI.

### French content (`fr_ht`)

- Legacy DB columns named `*_kreyol` / `*_ht` store **standard French**, not Haitian Creole.
- Use helpers in `src/lib/french-content.ts` (`frenchField`, `pickLocalizedField`, `frenchBlogFields`, `frenchEventFields`, `frenchHaitiMissionFields`, `frenchPrayerRequest`) for public display.
- On startup, `src/lib/db/seed.ts` runs `migrateLegacyFrenchContent()` and `migrateKnownLegacyCreoleRecords()` to rewrite any remaining Creole in the database.

### Admin bilingual field labels

Admin form labels use the pattern `English / Français`. The **French half must be standard French**, never Haitian Creole (e.g. use `Image d'arrière-plan`, not `Imaj background`; `Jour (français)` / `Day (English)`, not `Jou`; `Missions et évangélisation`, not `Misyon ak Evanjelizasyon`).

---

## Recent session context (completed)

- French content quality, language toggle labels (target language on button)
- Multi-day events, event photo drag/paste, free-gift asset repair
- Latest commit at handoff: `eb3183a`

---

## How to start the new session

Paste:

> Read `handoff.md` and implement in this order: (1) page-based navigation with shared site layout, (2) Administrative Care data model and forms using the FBCLG-derived field definitions in the handoff, (3) public routes at `/administrative-care/[slug]`, (4) admin UI and email acknowledgments. Use the seed descriptions and form fields from handoff.md as-is unless you spot a technical issue.
