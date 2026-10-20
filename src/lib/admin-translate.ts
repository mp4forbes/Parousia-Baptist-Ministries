import {
  looksLikeHaitianCreole,
  looksLikePlainEnglish,
  looksLikePlainFrench,
} from './french-content';

export type TranslateDirection = 'auto' | 'fr_ht_to_en' | 'en_to_fr_ht';

export type BilingualTextField = {
  id: string;
  kreyol: string;
  english: string;
};

export type BilingualTranslationItem = {
  id: string;
  text: string;
  /** Which column supplied `text` when both languages are filled (e.g. synced English in French field). */
  sourceSide?: 'kreyol' | 'english';
};

export function resolveTranslateSourceLang(
  direction: TranslateDirection,
  kreyolText: string,
  englishText: string,
  uiLanguage: 'en' | 'fr_ht' = 'fr_ht'
): 'en' | 'fr_ht' | null {
  const hasHt = kreyolText.trim().length > 0;
  const hasEn = englishText.trim().length > 0;

  if (direction === 'fr_ht_to_en') {
    return hasHt ? 'fr_ht' : null;
  }
  if (direction === 'en_to_fr_ht') {
    return hasEn ? 'en' : null;
  }

  if (hasHt && !hasEn) return 'fr_ht';
  if (hasEn && !hasHt) return 'en';
  if (hasHt && hasEn) return uiLanguage === 'fr_ht' ? 'fr_ht' : 'en';
  return null;
}

/** When translating in one direction, an empty source field clears the opposite language. */
export function applyDirectionalTargetClears(
  fields: BilingualTextField[],
  direction: TranslateDirection
): BilingualTextField[] {
  if (direction === 'en_to_fr_ht') {
    return fields.map((field) => (field.english.trim() ? field : { ...field, kreyol: '' }));
  }
  if (direction === 'fr_ht_to_en') {
    return fields.map((field) => (field.kreyol.trim() ? field : { ...field, english: '' }));
  }
  return fields;
}

export function bilingualFieldsDiffer(a: BilingualTextField[], b: BilingualTextField[]): boolean {
  if (a.length !== b.length) return true;
  return a.some(
    (field, index) =>
      field.kreyol !== b[index].kreyol || field.english !== b[index].english || field.id !== b[index].id
  );
}

export function prepareBilingualTranslation(
  fields: BilingualTextField[],
  direction: TranslateDirection,
  uiLanguage: 'en' | 'fr_ht' = 'fr_ht'
): {
  fields: BilingualTextField[];
  payload: { fromLang: 'en' | 'fr_ht'; items: BilingualTranslationItem[] } | null;
  clearedOnly: boolean;
} {
  const clearedFields = applyDirectionalTargetClears(fields, direction);
  const payload = collectTextsForTranslation(clearedFields, direction, uiLanguage);
  const clearedOnly = !payload && bilingualFieldsDiffer(fields, clearedFields);
  return { fields: clearedFields, payload, clearedOnly };
}

export function collectTextsForTranslation(
  fields: BilingualTextField[],
  direction: TranslateDirection,
  uiLanguage: 'en' | 'fr_ht' = 'fr_ht'
): { fromLang: 'en' | 'fr_ht'; items: BilingualTranslationItem[] } | null {
  if (direction === 'fr_ht_to_en') {
    const items = fields
      .filter((field) => field.kreyol.trim())
      .map((field) => ({ id: field.id, text: field.kreyol, sourceSide: 'kreyol' as const }));
    return items.length ? { fromLang: 'fr_ht', items } : null;
  }

  if (direction === 'en_to_fr_ht') {
    const items: BilingualTranslationItem[] = [];
    for (const field of fields) {
      const ht = field.kreyol.trim();
      const en = field.english.trim();
      if (!ht && !en) continue;
      if (ht && looksLikePlainEnglish(ht) && (!en || en !== ht)) {
        items.push({ id: field.id, text: ht, sourceSide: 'kreyol' });
        continue;
      }
      if (en) {
        items.push({ id: field.id, text: en, sourceSide: 'english' });
      }
    }
    return items.length ? { fromLang: 'en', items } : null;
  }

  const kreyolOnly = fields.filter((field) => field.kreyol.trim() && !field.english.trim());
  const englishOnly = fields.filter((field) => field.english.trim() && !field.kreyol.trim());

  if (kreyolOnly.length >= englishOnly.length && kreyolOnly.length > 0) {
    return {
      fromLang: 'fr_ht',
      items: kreyolOnly.map((field) => ({ id: field.id, text: field.kreyol, sourceSide: 'kreyol' as const })),
    };
  }

  if (englishOnly.length > 0) {
    return {
      fromLang: 'en',
      items: englishOnly.map((field) => ({ id: field.id, text: field.english, sourceSide: 'english' as const })),
    };
  }

  const enToFr: BilingualTranslationItem[] = [];
  const frToEn: BilingualTranslationItem[] = [];

  for (const field of fields) {
    const ht = field.kreyol.trim();
    const en = field.english.trim();
    if (!ht || !en) continue;

    if (looksLikePlainEnglish(ht) && !looksLikePlainFrench(ht)) {
      enToFr.push({ id: field.id, text: ht, sourceSide: 'kreyol' });
      continue;
    }
    if (looksLikeHaitianCreole(ht) && looksLikePlainEnglish(en)) {
      frToEn.push({ id: field.id, text: ht, sourceSide: 'kreyol' });
      continue;
    }
    if (ht === en && looksLikePlainEnglish(ht)) {
      enToFr.push({ id: field.id, text: ht, sourceSide: 'kreyol' });
    }
  }

  if (enToFr.length > 0 && frToEn.length === 0) {
    return { fromLang: 'en', items: enToFr };
  }
  if (frToEn.length > 0 && enToFr.length === 0) {
    return { fromLang: 'fr_ht', items: frToEn };
  }
  if (enToFr.length > 0 && frToEn.length > 0) {
    return uiLanguage === 'fr_ht'
      ? { fromLang: 'en', items: enToFr }
      : { fromLang: 'fr_ht', items: frToEn };
  }

  const fromLang = uiLanguage;
  const items = fields
    .map((field) => ({
      id: field.id,
      text: fromLang === 'fr_ht' ? field.kreyol : field.english,
      sourceSide: (fromLang === 'fr_ht' ? 'kreyol' : 'english') as 'kreyol' | 'english',
    }))
    .filter((item) => item.text.trim());

  return items.length ? { fromLang, items } : null;
}

export function bilingualItemsForApi(
  items: BilingualTranslationItem[]
): Array<{ id: string; text: string }> {
  return items.map(({ id, text }) => ({ id, text }));
}

export function applyTranslatedFields(
  fields: BilingualTextField[],
  translations: Record<string, string>,
  fromLang: 'en' | 'fr_ht',
  items?: BilingualTranslationItem[]
): BilingualTextField[] {
  const sourceSideById = new Map(items?.map((item) => [item.id, item.sourceSide]) ?? []);

  return fields.map((field) => {
    const translated = translations[field.id];
    if (!translated) return field;

    if (fromLang === 'fr_ht') {
      return { ...field, english: translated };
    }

    const sourceSide = sourceSideById.get(field.id);
    const english =
      sourceSide === 'kreyol' && field.kreyol.trim() ? field.kreyol : field.english;
    return { ...field, kreyol: translated, english };
  });
}
