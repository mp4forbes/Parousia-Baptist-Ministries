import type { Sermon } from './db/types';
import {
  KNOWN_SERMON_DESCRIPTION_CREOLE_TO_FRENCH,
  looksLikeHaitianCreole,
  looksLikePlainEnglish,
  looksLikePlainFrench,
  SERMON_ARCHIVE_DESCRIPTION_ENGLISH,
  SERMON_ARCHIVE_DESCRIPTION_FRENCH,
} from './french-content';

export function normalizeSermonEnglishTitle(title: string): string {
  return title.replace(/YAugusth/gi, 'Youth');
}

export function bestSermonEnglishTitle(sermon: Pick<Sermon, 'title_kreyol' | 'title_english'>): string {
  const en = normalizeSermonEnglishTitle(sermon.title_english?.trim() || '');
  const fr = sermon.title_kreyol?.trim() || '';
  if (fr && looksLikePlainEnglish(fr) && (!en || /YAugusth/i.test(sermon.title_english || ''))) {
    return normalizeSermonEnglishTitle(fr);
  }
  return en || normalizeSermonEnglishTitle(fr);
}

export function sermonTitleNeedsFrenchTranslation(sermon: Pick<Sermon, 'title_kreyol' | 'title_english'>): boolean {
  const en = bestSermonEnglishTitle(sermon);
  const fr = sermon.title_kreyol?.trim() || '';
  if (!en) return false;
  if (!fr) return true;
  if (fr === en || fr === sermon.title_english?.trim()) return true;
  if (looksLikePlainEnglish(fr) && !looksLikePlainFrench(fr)) return true;
  return false;
}

export function sermonDescriptionNeedsFrenchTranslation(
  sermon: Pick<Sermon, 'description_kreyol' | 'description_english'>
): boolean {
  const en = sermon.description_english?.trim() || '';
  const fr = sermon.description_kreyol?.trim() || '';
  if (!en) return false;
  if (!fr) return true;
  if (fr === en) return true;
  if (fr in KNOWN_SERMON_DESCRIPTION_CREOLE_TO_FRENCH) return false;
  if (looksLikeHaitianCreole(fr)) return true;
  if (looksLikePlainEnglish(fr) && !looksLikePlainFrench(fr)) return true;
  if (fr === SERMON_ARCHIVE_DESCRIPTION_FRENCH && en === SERMON_ARCHIVE_DESCRIPTION_ENGLISH) return false;
  return false;
}

export function bestSermonEnglishDescription(sermon: Pick<Sermon, 'description_kreyol' | 'description_english'>): string {
  const en = sermon.description_english?.trim() || '';
  if (en) return en;
  return SERMON_ARCHIVE_DESCRIPTION_ENGLISH;
}
