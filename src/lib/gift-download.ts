import type { Language } from './translations';

export const BUILT_IN_DEVOTIONAL_PDF = {
  en: '/api/devotional/pdf?lang=en',
  fr_ht: '/api/devotional/pdf?lang=fr',
} as const;

/** Resolve the primary and fallback download URLs for the free gift devotional. */
export function getGiftDownloadUrls(
  settings: Record<string, string>,
  language: Language
): { primary: string; fallback: string } {
  const fallback =
    language === 'fr_ht' ? BUILT_IN_DEVOTIONAL_PDF.fr_ht : BUILT_IN_DEVOTIONAL_PDF.en;

  if (language === 'fr_ht') {
    const customFrench =
      settings.free_gift_file_url_french ||
      settings.free_gift_file_url_kreyol ||
      '';
    return {
      primary: customFrench || fallback,
      fallback,
    };
  }

  const customEnglish =
    settings.free_gift_file_url_english || settings.free_gift_file_url || '';
  return {
    primary: customEnglish || fallback,
    fallback,
  };
}
