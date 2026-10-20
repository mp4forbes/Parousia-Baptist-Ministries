import type { Ministry } from '@/lib/db/types';

/** Default nav order when sort_order ties or is unset */
export const MINISTRY_NAV_ORDER = ['women', 'men', 'children', 'youth', 'missions'] as const;

export function isCoreMinistrySlug(slug: string): boolean {
  return (MINISTRY_NAV_ORDER as readonly string[]).includes(slug);
}

const NAV_LABEL_FALLBACK_EN: Record<string, string> = {
  women: 'Women',
  men: 'Men',
  children: 'Children',
  youth: 'Youth',
  missions: 'Missions',
};

const NAV_LABEL_FALLBACK_FR: Record<string, string> = {
  women: 'Femmes',
  men: 'Hommes',
  children: 'Enfants',
  youth: 'Jeunesse',
  missions: 'Missions',
};

export function ministryNavOrderIndex(slug: string): number {
  const idx = (MINISTRY_NAV_ORDER as readonly string[]).indexOf(slug);
  return idx === -1 ? 1000 + slug.localeCompare('') : idx;
}

export function sortMinistriesForNav(ministries: Ministry[]): Ministry[] {
  return [...ministries].sort((a, b) => {
    const orderA = a.sort_order ?? 0;
    const orderB = b.sort_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    const idxDiff = ministryNavOrderIndex(a.slug) - ministryNavOrderIndex(b.slug);
    if (idxDiff !== 0) return idxDiff;
    return a.slug.localeCompare(b.slug);
  });
}

export function ministryDropdownLabel(ministry: Ministry, language: 'en' | 'fr_ht'): string {
  const nav =
    language === 'fr_ht'
      ? ministry.nav_label_kreyol?.trim() || ministry.nav_label_english?.trim()
      : ministry.nav_label_english?.trim() || ministry.nav_label_kreyol?.trim();
  if (nav) return nav;

  const fallback =
    language === 'fr_ht'
      ? NAV_LABEL_FALLBACK_FR[ministry.slug]
      : NAV_LABEL_FALLBACK_EN[ministry.slug];
  if (fallback) return fallback;

  return language === 'fr_ht' ? ministry.title_kreyol : ministry.title_english;
}

export function ministryAdminTabLabel(ministry: Ministry, language: 'en' | 'fr_ht'): string {
  const short = ministryDropdownLabel(ministry, language === 'fr_ht' ? 'fr_ht' : 'en');
  if (ministry.slug === 'women') {
    return language === 'en' ? "Women's Ministry" : 'Ministère des femmes';
  }
  if (ministry.slug === 'men') {
    return language === 'en' ? "Men's Ministry" : 'Ministère des hommes';
  }
  if (ministry.slug === 'missions') {
    return language === 'en' ? 'Missions' : 'Missions';
  }
  return short;
}

export function normalizeMinistrySlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidMinistrySlug(slug: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(slug) && slug.length <= 64;
}

export function parseMinistrySlugFromList(
  value: string | null | undefined,
  ministries: Ministry[]
): string {
  const slugs = new Set(ministries.map((m) => m.slug));
  if (value && slugs.has(value)) return value;
  const sorted = sortMinistriesForNav(ministries);
  return sorted[0]?.slug ?? 'women';
}
