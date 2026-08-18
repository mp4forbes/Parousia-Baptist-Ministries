import type { Ministry } from './db/types';

/** Canonical French copy when legacy Kreyol or English is stored in French fields. */
export const HOME_FRENCH_DEFAULTS: Record<string, string> = {
  about_us_title_ht: 'Qui sommes-nous ?',
  about_us_p1_ht:
    "Parousia Baptist Ministries est une communauté vivante de croyants consacrés à l'adoration de Dieu et dans l'attente du retour de Jésus-Christ. Notre mission est d'annoncer fidèlement l'Évangile, de former des disciples et de servir notre communauté locale ainsi que la diaspora.",
  about_us_p2_ht:
    "Depuis nos débuts, nous nous attachons à vivre une foi biblique authentique, à soutenir des projets éducatifs et sanitaires en Haïti et à offrir un lieu accueillant où chacun peut trouver une véritable famille spirituelle.",
  beliefs_title_ht: 'Nos croyances',
  belief_1_title_ht: "L'autorité infaillible des Écritures",
  belief_1_desc_ht:
    "Nous croyons que toute la Bible est la Parole inspirée, infaillible et sans erreur de Dieu, notre autorité suprême en matière de foi, de doctrine et de conduite.",
  belief_2_title_ht: 'La Sainte Trinité',
  belief_2_desc_ht:
    "Nous croyons en un seul Dieu, existant éternellement en trois personnes égales : le Père, le Fils (Jésus-Christ) et le Saint-Esprit.",
  belief_3_title_ht: 'Le salut par la grâce',
  belief_3_desc_ht:
    "Le salut est un don de Dieu reçu par la repentance et la foi dans le sacrifice de Jésus-Christ. Nous sommes sauvés par la grâce seule, et non par nos œuvres.",
  belief_4_title_ht: 'Le retour du Seigneur (Parousie)',
  belief_4_desc_ht:
    "Nous attendons avec espérance le retour personnel, visible et glorieux de Jésus-Christ, qui rassemblera son Église et établira son règne de justice.",
  team_title_ht: 'Notre équipe',
  team_subtitle_ht: 'Départements et associations',
  expect_title_ht: 'À quoi vous attendre',
  expect_p1_ht:
    "Lorsque vous venez adorer avec nous à Parousia Baptist Ministries, vous découvrez une atmosphère chaleureuse, accueillante et respectueuse. Nos cultes, en français et en anglais, permettent à chacun de participer pleinement.",
  expect_bullet1_ht: 'Une adoration et des louanges qui édifient',
  expect_bullet2_ht: 'Des messages solides, fondés sur la Bible',
  expect_bullet3_ht: 'Une communauté qui vous accueille à bras ouverts',
};

export const MINISTRY_FRENCH_DEFAULTS: Record<
  string,
  { title: string; description: string; bullets: string }
> = {
  women: {
    title: 'Ministère des femmes',
    description:
      "Ce ministère rassemble les sœurs de l'église afin de fortifier leur vie spirituelle, leur communion fraternelle et leur soutien mutuel. Par des études bibliques, des groupes de prière et des ateliers, nous aidons chaque femme à vivre pleinement sa vocation biblique.",
    bullets:
      'Rencontre de prière : chaque samedi à 6 h\nÉtudes bibliques thématiques et conférence annuelle des femmes\nEncouragement mutuel, réseaux de soutien et service communautaire',
  },
  men: {
    title: 'Ministère des hommes',
    description:
      "Notre objectif est de former des hommes selon le cœur de Dieu, capables d'être de solides responsables spirituels dans leur foyer, dans l'église et dans la communauté. Ces rencontres offrent un cadre fraternel propice au partage, à l'encouragement, à l'étude biblique et à la croissance commune.",
    bullets:
      'Petit-déjeuner mensuel de formation : le premier samedi du mois\nSéminaires sur la responsabilité familiale, les finances et la masculinité biblique\nProjets de service et aide concrète à la communauté',
  },
  children: {
    title: 'Ministère des enfants et des jeunes',
    description:
      "Nous enseignons aux enfants et aux jeunes les voies du Seigneur dès leur plus jeune âge. Nos classes d'école du dimanche et nos programmes pour la jeunesse proposent des leçons bibliques adaptées, des temps de louange, de la musique et des jeux qui enracinent leur foi dans la Parole de Dieu.",
    bullets:
      "Classes d'école du dimanche : chaque dimanche à 10 h 30\nChorale des enfants et formation instrumentale\nCamps bibliques d'été annuels",
  },
  missions: {
    title: 'Missions et évangélisation',
    description:
      "Rejoignez notre ministère des missions pour soutenir l'évangélisation et les œuvres de service communautaire en Haïti et dans notre région.",
    bullets:
      "Projets scolaires et sanitaires en Haïti\nSoutien à l'évangélisation locale\nPossibilités de bénévolat au service de la communauté",
  },
};

const CREOLE_MARKERS =
  /\b(minist[eè]r|minist[eè]|s[eè]vis|fanm|gason|timoun|lapriye|krey[oò]l|annou|genyen|kote|kijan|bondye|lapaw[oò]l|louwanj|lapriy[eè]|fr[eè]m|s[eè]k|pou nou|nan tout|ak tout|se pou|pa gen|mwen |nou |yo |li |ki |lan |nan |ap |tout moun)\b/i;

const CREOLE_CONTRACTIONS = /\b(n'|l'|d'|m'|k'|s'|w'|t')/i;

const ENGLISH_HEADING_MARKERS =
  /\b(Women's Ministry|Men's Fellowship|Children(?: &| and)? Youth Ministry|Missions(?: &| and)? Outreach|About Us|Our Beliefs|Our Team|What to Expect|Prayer Wall|Public Prayer Wall|Executive Committee)\b/i;

export function looksLikeHaitianCreole(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  if (CREOLE_MARKERS.test(value)) return true;
  if (CREOLE_CONTRACTIONS.test(value) && !/\b(l'|d')(?:église|Église|un|une|autorité|attente)\b/.test(value)) {
    return true;
  }
  return false;
}

export function looksLikeEnglishInFrenchField(text: string): boolean {
  const value = text.trim();
  if (!value) return false;
  return ENGLISH_HEADING_MARKERS.test(value);
}

export function resolveFrenchContent(
  stored: string | undefined | null,
  canonicalFrench: string,
  englishCompare?: string | null
): string {
  const trimmed = stored?.trim() || '';
  if (!trimmed) return canonicalFrench;
  if (englishCompare && trimmed === englishCompare.trim()) {
    if (looksLikeEnglishInFrenchField(trimmed) || looksLikeHaitianCreole(trimmed)) {
      return canonicalFrench;
    }
  }
  if (looksLikeHaitianCreole(trimmed) || looksLikeEnglishInFrenchField(trimmed)) {
    return canonicalFrench;
  }
  return trimmed;
}

export function frenchSetting(
  settings: Record<string, string | undefined>,
  key: string,
  englishKey?: string
): string {
  const canonical = HOME_FRENCH_DEFAULTS[key] || '';
  const english = englishKey ? settings[englishKey] : undefined;
  return resolveFrenchContent(settings[key], canonical, english);
}

export function frenchMinistryField(
  ministry: Pick<Ministry, 'slug' | 'title_kreyol' | 'title_english' | 'description_kreyol' | 'description_english' | 'bullets_kreyol' | 'bullets_english'>,
  field: 'title' | 'description' | 'bullets'
): string {
  const defaults = MINISTRY_FRENCH_DEFAULTS[ministry.slug];
  if (!defaults) {
    if (field === 'title') return ministry.title_kreyol || ministry.title_english || '';
    if (field === 'description') return ministry.description_kreyol || ministry.description_english || '';
    return ministry.bullets_kreyol || ministry.bullets_english || '';
  }

  if (field === 'title') {
    return resolveFrenchContent(ministry.title_kreyol, defaults.title, ministry.title_english);
  }
  if (field === 'description') {
    return resolveFrenchContent(ministry.description_kreyol, defaults.description, ministry.description_english);
  }
  return resolveFrenchContent(ministry.bullets_kreyol, defaults.bullets, ministry.bullets_english);
}

export function localizedFrenchRecordField(
  frenchValue: string | undefined | null,
  englishValue: string | undefined | null,
  canonicalFrench: string
): string {
  return resolveFrenchContent(frenchValue, canonicalFrench, englishValue);
}
