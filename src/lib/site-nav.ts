export type PublicSiteSection =
  | 'home'
  | 'about'
  | 'schedules'
  | 'sermons'
  | 'ministries'
  | 'events'
  | 'blog'
  | 'prayer-wall'
  | 'giving'
  | 'contact';

export const ABOUT_TABS = ['aboutUs', 'beliefs', 'team', 'expect'] as const;
export type AboutTab = (typeof ABOUT_TABS)[number];

export const MINISTRY_NAV_SLUGS = ['women', 'men', 'children', 'missions'] as const;
export type MinistryNavSlug = (typeof MINISTRY_NAV_SLUGS)[number];

export const ADMINISTRATIVE_CARE_SLUGS = [
  'weddings',
  'funerals',
  'baptisms',
  'childrens-dedications',
  'hospice-support',
] as const;
export type AdministrativeCareSlug = (typeof ADMINISTRATIVE_CARE_SLUGS)[number];

export const HASH_REDIRECTS: Record<string, string> = {
  home: '/',
  about: '/about',
  'prayer-wall': '/prayer-wall',
  schedules: '/schedules',
  sermons: '/sermons',
  blog: '/blog',
  ministries: '/ministries',
  events: '/events',
  giving: '/giving',
  contact: '/contact',
  'devotional-gift': '/free-gift',
};

export function aboutTabHref(tab: AboutTab): string {
  return tab === 'aboutUs' ? '/about' : `/about/${tab}`;
}

export function parseAboutTab(value?: string | null): AboutTab {
  if (value && (ABOUT_TABS as readonly string[]).includes(value)) {
    return value as AboutTab;
  }
  return 'aboutUs';
}

export function ministryHref(slug: string): string {
  return `/ministries/${slug}`;
}

export function parseMinistrySlug(value?: string | null): MinistryNavSlug {
  if (value && (MINISTRY_NAV_SLUGS as readonly string[]).includes(value)) {
    return value as MinistryNavSlug;
  }
  return 'women';
}

export function isAdministrativeCareSlug(value: string): value is AdministrativeCareSlug {
  return (ADMINISTRATIVE_CARE_SLUGS as readonly string[]).includes(value);
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '/home';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isHomeNavActive(pathname: string): boolean {
  return pathname === '/' || pathname === '/home' || pathname.startsWith('/about');
}
