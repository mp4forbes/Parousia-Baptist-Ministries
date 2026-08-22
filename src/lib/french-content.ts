import type { Ministry } from './db/types';

type ChurchLocationFields = {
  nameEn: string;
  nameFr: string;
  addressEn: string;
  addressFr: string;
};

/** Canonical French copy when legacy Creole or English is stored in French fields. */
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

export const PASTOR_MESSAGE_FRENCH =
  "Je suis heureux de vous accueillir au nom de Jésus-Christ. Notre église est une famille de croyants qui servent le Seigneur et attendent son retour. Venez adorer avec nous !";

export const FREE_GIFT_FRENCH_DEFAULTS = {
  title: 'Méditations Parousie 2026',
  description:
    'Indiquez votre nom, votre adresse courriel et votre numéro de téléphone pour télécharger notre livret de méditations, conçu pour vous aider à grandir chaque jour dans la Parole.',
};

/** Canonical French for legacy rows still stored in Creole (keyed by English title). */
export const CANONICAL_BLOG_FRENCH: Record<string, { title: string; content: string }> = {
  'Steadfastness in the Storms of Life': {
    title: 'La fermeté au cœur des tempêtes',
    content:
      'Chers frères et sœurs, tandis que nous cheminons sur cette terre, nous rencontrerons bien des épreuves et des tempêtes. Mais prenons courage, car Jésus-Christ a déjà vaincu le monde pour nous. Lorsque notre vie est fermement ancrée dans sa Parole, rien ne peut nous ébranler.',
  },
  'Living as a Blessed Community': {
    title: 'Vivre comme une communauté bénie',
    content:
      'Notre communauté est un don d’une valeur inestimable. Lorsque nous nous soutenons les uns les autres avec amour et respect, nous devenons un véritable modèle de croissance spirituelle et de communion fraternelle pour tous ceux qui nous entourent.',
  },
};

export const CANONICAL_EVENT_FRENCH: Record<string, { title: string; description: string }> = {
  'Youth Conference "Rise Up"': {
    title: 'Conférence des jeunes « Lève-toi »',
    description:
      'Une soirée spéciale de louange dynamique, avec des conférenciers invités et des échanges enrichissants sur les défis et les possibilités qui se présentent aujourd’hui aux jeunes chrétiens.',
  },
};

export const CANONICAL_HAITI_MISSION_FRENCH: Record<string, { title: string; description: string }> = {
  'Parousie School Support in Les Cayes': {
    title: 'Soutien à l’école Parousie des Cayes',
    description:
      'Nous soutenons l’éducation et les repas quotidiens de plus de 150 écoliers dans la région des Cayes, en Haïti. Nous fournissons le matériel et les salaires des enseignants.',
  },
  'Mobile Health Clinic': {
    title: 'Clinique médicale mobile',
    description:
      'Achat de médicaments et financement d’équipements pour notre clinique mobile qui apporte des soins médicaux gratuits aux familles des zones rurales éloignées des hôpitaux.',
  },
};

export const KNOWN_HAITI_MISSION_CREOLE_TO_FRENCH: Record<string, string> = {
  "N'ap sipòte edikasyon ak manje chak jou pou plis pase 150 timoun lekòl nan zòn Okay, Ayiti. Nou bay materyèl ak salè pwofesè yo.":
    'Nous soutenons l’éducation et les repas quotidiens de plus de 150 écoliers dans la région des Cayes, en Haïti. Nous fournissons le matériel et les salaires des enseignants.',
  "Acha medikaman ak finansman ekipman pou klinik mobil nou an k'ap pote swen medikal gratis bay fanmi nan zòn riral yo ki lwen lopital.":
    'Achat de médicaments et financement d’équipements pour notre clinique mobile qui apporte des soins médicaux gratuits aux familles des zones rurales éloignées des hôpitaux.',
};

export const KNOWN_EVENT_LOCATION_CREOLE_TO_FRENCH: Record<string, string> = {
  'Tanp Egliz la': 'Sanctuaire de l’église',
  'Tanp legliz la': 'Sanctuaire de l’église',
};

export const CANONICAL_LOCAL_OUTREACH_FRENCH: Record<string, { title: string }> = {
  'Biblical School BibliANASIUM': { title: 'École biblique BibliANASIUM' },
};

export const KNOWN_PRAYER_CREOLE_TO_FRENCH: Record<string, string> = {
  'Tanpri lapriyè pou pitit gason m k ap pase yon egzamen lekòl trè enpòtan demen.':
    'Merci de prier pour mon fils, qui passera demain un examen scolaire très important.',
  'Mwen mande lapriyè pou gidans ak direksyon nan travay mwen.':
    'Je demande la prière afin d’être guidé et orienté dans mon travail.',
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

const CREOLE_DAY_TO_FRENCH: Record<string, string> = {
  dimanch: 'Dimanche',
  lendi: 'Lundi',
  madi: 'Mardi',
  mèkredi: 'Mercredi',
  mercredi: 'Mercredi',
  jedi: 'Jeudi',
  vandredi: 'Vendredi',
  samdi: 'Samedi',
};

const CREOLE_SCHEDULE_TITLE_TO_FRENCH: Array<[RegExp, string]> = [
  [/^Konsèy$/i, 'Conseil'],
  [/^Konseye$/i, 'Conseil'],
  [/^Premye Sèvis$/i, 'Premier culte'],
  [/^Dezyèm Sèvis$/i, 'Deuxième culte'],
  [/^Lekòl Dimanch$/i, "École du dimanche"],
  [/^Sèvis Adorasyon Aswè$/i, "Culte d'adoration du soir"],
  [/^Chapèl Timoun$/i, 'Chapelle des enfants'],
  [/^Vwa ak Koral$/i, 'Voix et chorale'],
  [/^Etid Biblik$/i, 'Étude biblique'],
  [/^Priye Lakay$/i, 'Prière à domicile'],
  [/^Sèvis Jèn ak Priyè$/i, 'Service de jeûne et prière'],
  [/^Seminè Biblik$/i, 'Séminaire biblique'],
  [/^Sware Jèn Vandredi$/i, 'Soirée de jeûne du vendredi'],
  [/^Minwi Priyè$/i, 'Minuit de prière'],
];

const CREOLE_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Kisa pou Atann/gi, 'À quoi vous attendre'],
  [/Labib kòm Verite Absoli/gi, "La Bible, vérité absolue"],
  [/Trinite Sen An/gi, 'La Sainte Trinité'],
  [/Sali pa la Gras sèlman/gi, 'Le salut par la grâce seule'],
  [/Retou Seyè a \(Parousia\)/gi, 'Le retour du Seigneur (Parousie)'],
  [/Ministè Medam Yo/gi, 'Ministère des femmes'],
  [/Lekòl Dimanch & Jenès/gi, 'École du dimanche et jeunesse'],
  [/Devosyonèl Parousie/gi, 'Méditations Parousie'],
  [/Sipò Lekòl Parousie nan Okay/gi, "Soutien à l'école Parousie des Cayes"],
  [/Klinik Sante Mobil/gi, 'Clinique médicale mobile'],
  [/Viv kòm yon Kominote Beni/gi, 'Vivre comme une communauté bénie'],
  [/^Misyon ak Evanjelizasyon$/i, 'Missions et évangélisation'],
  [/^Lekòl Biblik BibliANASIUM$/i, 'École biblique BibliANASIUM'],
  [/^Tanp Egliz la$/i, 'Sanctuaire de l’église'],
  [/^Tanp legliz la$/i, 'Sanctuaire de l’église'],
  [/Fèmte nan mitan Tanpèt yo/gi, 'Fermeté au milieu des tempêtes'],
  [/Frè Pierre/gi, 'Frère Pierre'],
  [/Sè Marie/gi, 'Sœur Marie'],
  [/\bAyiti\b/g, 'Haïti'],
  [/, nan /g, ', à '],
  [/\bOuest, Ayiti\b/g, 'Ouest, Haïti'],
  [/\bNippes, Ayiti\b/g, 'Nippes, Haïti'],
  [
    /Mwen kontan salye nou[\s\S]*?Vin adore ak nou!/gi,
    PASTOR_MESSAGE_FRENCH,
  ],
  [
    /Mete non ou, imel, ak telefòn ou[\s\S]*?nan Pawòl la\./gi,
    FREE_GIFT_FRENCH_DEFAULTS.description,
  ],
];

const CREOLE_MARKERS =
  /\b(minist[eè]r|minist[eè]|medam|s[eè]vis|fanm|gason|timoun|lapriye|krey[oò]l|annou|genyen|kote|kijan|bondye|lapaw[oò]l|louwanj|lapriy[eè]|fr[eè]|s[eè] |pou nou|nan tout|ak tout|se pou|pa gen|mwen |nou |yo |li |ki |lan |nan |ap |tout moun|labib|devosyon|kominote|kontan|salye|lekòl|dimanch|premye|dezyèm|aswè|priye|etid|seminè|sware|minwi|viv |fèmte|tanpèt|mande |telechaje|imel|telefòn|pitit|egzamen|travay|guidans|direksyon)\b/i;

const CREOLE_CONTRACTIONS = /\b(n'|l'|d'|m'|k'|s'|w'|t')/i;

const ENGLISH_HEADING_MARKERS =
  /\b(Women's Ministry|Men's Fellowship|Children(?: &| and)? Youth Ministry|Missions(?: &| and)? Outreach|About Us|Our Beliefs|Our Team|What to Expect|Prayer Wall|Public Prayer Wall|Executive Committee)\b/i;

export function normalizeFrenchDay(day: string): string {
  const trimmed = day.trim();
  if (!trimmed) return trimmed;
  const mapped = CREOLE_DAY_TO_FRENCH[trimmed.toLowerCase()];
  return mapped || trimmed;
}

export function normalizeFrenchText(text: string): string {
  let value = text.trim();
  if (!value) return value;

  const dayMapped = CREOLE_DAY_TO_FRENCH[value.toLowerCase()];
  if (dayMapped) return dayMapped;

  for (const [pattern, replacement] of CREOLE_SCHEDULE_TITLE_TO_FRENCH) {
    if (pattern.test(value)) {
      value = value.replace(pattern, replacement);
    }
  }

  for (const [pattern, replacement] of CREOLE_PHRASE_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  return value;
}

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

  const normalized = normalizeFrenchText(trimmed);
  if (normalized !== trimmed && !looksLikeHaitianCreole(normalized) && !looksLikeEnglishInFrenchField(normalized)) {
    return normalized;
  }

  if (englishCompare && trimmed === englishCompare.trim()) {
    if (looksLikeEnglishInFrenchField(trimmed) || looksLikeHaitianCreole(trimmed)) {
      return canonicalFrench || normalized;
    }
  }

  if (looksLikeHaitianCreole(trimmed) || looksLikeEnglishInFrenchField(trimmed)) {
    return canonicalFrench || normalized;
  }

  return normalized;
}

export function frenchField(
  frenchValue: string | undefined | null,
  englishValue?: string | null,
  canonicalFrench = ''
): string {
  return resolveFrenchContent(frenchValue, canonicalFrench, englishValue);
}

export function pickLocalizedField(
  language: 'en' | 'fr_ht',
  frenchValue: string | undefined | null,
  englishValue: string | undefined | null,
  canonicalFrench = ''
): string {
  if (language === 'en') {
    return englishValue?.trim() || frenchValue?.trim() || '';
  }
  return normalizeFrenchText(frenchField(frenchValue, englishValue, canonicalFrench));
}

export function frenchBlogFields(post: {
  title_kreyol: string;
  title_english: string;
  content_kreyol: string;
  content_english: string;
}): { title: string; content: string } {
  const canonical = CANONICAL_BLOG_FRENCH[post.title_english];
  return {
    title: resolveFrenchContent(post.title_kreyol, canonical?.title || '', post.title_english),
    content: resolveFrenchContent(post.content_kreyol, canonical?.content || '', post.content_english),
  };
}

export function frenchEventFields(event: {
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
}): { title: string; description: string } {
  const canonical = CANONICAL_EVENT_FRENCH[event.title_english];
  return {
    title: resolveFrenchContent(event.title_kreyol, canonical?.title || '', event.title_english),
    description: resolveFrenchContent(
      event.description_kreyol,
      canonical?.description || '',
      event.description_english
    ),
  };
}

export function frenchHaitiMissionFields(mission: {
  title_kreyol: string;
  title_english: string;
  description_kreyol: string;
  description_english: string;
}): { title: string; description: string } {
  const trimmedDescription = mission.description_kreyol.trim();
  if (KNOWN_HAITI_MISSION_CREOLE_TO_FRENCH[trimmedDescription]) {
    return {
      title: resolveFrenchContent(
        mission.title_kreyol,
        CANONICAL_HAITI_MISSION_FRENCH[mission.title_english]?.title || '',
        mission.title_english
      ),
      description: KNOWN_HAITI_MISSION_CREOLE_TO_FRENCH[trimmedDescription],
    };
  }

  const canonical = CANONICAL_HAITI_MISSION_FRENCH[mission.title_english];
  return {
    title: resolveFrenchContent(mission.title_kreyol, canonical?.title || '', mission.title_english),
    description: resolveFrenchContent(
      mission.description_kreyol,
      canonical?.description || '',
      mission.description_english
    ),
  };
}

export function frenchPrayerRequest(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (KNOWN_PRAYER_CREOLE_TO_FRENCH[trimmed]) {
    return KNOWN_PRAYER_CREOLE_TO_FRENCH[trimmed];
  }
  return frenchField(trimmed, '');
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

export function frenchPastorMessage(settings: Record<string, string | undefined>): string {
  return resolveFrenchContent(
    settings.pastor_message_kreyol,
    PASTOR_MESSAGE_FRENCH,
    settings.pastor_message_english
  );
}

export function frenchFreeGiftTitle(settings: Record<string, string | undefined>): string {
  return resolveFrenchContent(
    settings.free_gift_title_kreyol,
    FREE_GIFT_FRENCH_DEFAULTS.title,
    settings.free_gift_title_english
  );
}

export function frenchFreeGiftDescription(settings: Record<string, string | undefined>): string {
  return resolveFrenchContent(
    settings.free_gift_desc_kreyol,
    FREE_GIFT_FRENCH_DEFAULTS.description,
    settings.free_gift_desc_english
  );
}

export function sanitizeChurchLocation(location: ChurchLocationFields): ChurchLocationFields {
  return {
    nameEn: location.nameEn,
    nameFr: normalizeFrenchText(location.nameFr || location.nameEn),
    addressEn: location.addressEn,
    addressFr: normalizeFrenchText(location.addressFr || location.addressEn),
  };
}

export function sanitizeChurchLocations(locations: ChurchLocationFields[]): ChurchLocationFields[] {
  return locations.map(sanitizeChurchLocation);
}

export function frenchMinistryField(
  ministry: Pick<Ministry, 'slug' | 'title_kreyol' | 'title_english' | 'description_kreyol' | 'description_english' | 'bullets_kreyol' | 'bullets_english'>,
  field: 'title' | 'description' | 'bullets'
): string {
  const defaults = MINISTRY_FRENCH_DEFAULTS[ministry.slug];
  if (!defaults) {
    if (field === 'title') return frenchField(ministry.title_kreyol, ministry.title_english);
    if (field === 'description') return frenchField(ministry.description_kreyol, ministry.description_english);
    return frenchField(ministry.bullets_kreyol, ministry.bullets_english);
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
