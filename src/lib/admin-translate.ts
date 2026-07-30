export type TranslateDirection = 'auto' | 'fr_ht_to_en' | 'en_to_fr_ht';

export type BilingualTextField = {
  id: string;
  kreyol: string;
  english: string;
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

export function collectTextsForTranslation(
  fields: BilingualTextField[],
  direction: TranslateDirection,
  uiLanguage: 'en' | 'fr_ht' = 'fr_ht'
): { fromLang: 'en' | 'fr_ht'; items: Array<{ id: string; text: string }> } | null {
  if (direction === 'fr_ht_to_en') {
    const items = fields
      .filter((field) => field.kreyol.trim())
      .map((field) => ({ id: field.id, text: field.kreyol }));
    return items.length ? { fromLang: 'fr_ht', items } : null;
  }

  if (direction === 'en_to_fr_ht') {
    const items = fields
      .filter((field) => field.english.trim())
      .map((field) => ({ id: field.id, text: field.english }));
    return items.length ? { fromLang: 'en', items } : null;
  }

  const kreyolOnly = fields.filter((field) => field.kreyol.trim() && !field.english.trim());
  const englishOnly = fields.filter((field) => field.english.trim() && !field.kreyol.trim());

  if (kreyolOnly.length >= englishOnly.length && kreyolOnly.length > 0) {
    return {
      fromLang: 'fr_ht',
      items: kreyolOnly.map((field) => ({ id: field.id, text: field.kreyol })),
    };
  }

  if (englishOnly.length > 0) {
    return {
      fromLang: 'en',
      items: englishOnly.map((field) => ({ id: field.id, text: field.english })),
    };
  }

  const fromLang = uiLanguage;
  const items = fields
    .map((field) => ({
      id: field.id,
      text: fromLang === 'fr_ht' ? field.kreyol : field.english,
    }))
    .filter((item) => item.text.trim());

  return items.length ? { fromLang, items } : null;
}

export function applyTranslatedFields(
  fields: BilingualTextField[],
  translations: Record<string, string>,
  fromLang: 'en' | 'fr_ht'
): BilingualTextField[] {
  return fields.map((field) => {
    const translated = translations[field.id];
    if (!translated) return field;

    if (fromLang === 'fr_ht') {
      return { ...field, english: translated };
    }
    return { ...field, kreyol: translated };
  });
}
