export type RegistrantScope =
  | { kind: 'event'; eventId: number }
  | { kind: 'ministry'; slug: string }
  | { kind: 'care'; slug: string }
  | { kind: 'contact' }
  | { kind: 'prayer' }
  | { kind: 'gift' };

export type RegistrantColumnType = 'text' | 'textarea' | 'number' | 'select' | 'readonly';

export interface RegistrantColumn {
  key: string;
  label: string;
  type: RegistrantColumnType;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface RegistrantRow {
  id: number;
  values: Record<string, string>;
}

export interface RegistrantAccess {
  email: string | null;
  source: 'coordinator' | 'admin' | null;
  needsPasswordSetup: boolean;
  allEvents: boolean;
  eventIds: number[];
  ministries: string[];
  care: string[];
  contact: boolean;
  prayer: boolean;
  gift: boolean;
}

export const EMPTY_REGISTRANT_ACCESS: RegistrantAccess = {
  email: null,
  source: null,
  needsPasswordSetup: false,
  allEvents: false,
  eventIds: [],
  ministries: [],
  care: [],
  prayer: false,
  contact: false,
  gift: false,
};

export function scopeIsAllowed(scope: RegistrantScope, access: RegistrantAccess | null): boolean {
  if (!access?.email || access.needsPasswordSetup) return false;
  switch (scope.kind) {
    case 'event':
      return access.allEvents || access.eventIds.includes(scope.eventId);
    case 'ministry':
      return access.ministries.includes(scope.slug);
    case 'care':
      return access.care.includes(scope.slug);
    case 'contact':
      return access.contact;
    case 'prayer':
      return access.prayer;
    case 'gift':
      return access.gift;
  }
}

export function hasAnyRegistrantListAccess(access: RegistrantAccess | null): boolean {
  if (!access?.email || access.needsPasswordSetup) return false;
  return access.allEvents
    || access.eventIds.length > 0
    || access.ministries.length > 0
    || access.care.length > 0
    || access.contact
    || access.prayer
    || access.gift;
}

export type RegistrantAccessLink = {
  href: string;
  kind: 'events' | 'ministry' | 'care' | 'contact' | 'prayer' | 'gift';
  slug?: string;
};

export function registrantAccessLinks(access: RegistrantAccess | null): RegistrantAccessLink[] {
  if (!access?.email || access.needsPasswordSetup) return [];
  const links: RegistrantAccessLink[] = [];
  if (access.allEvents || access.eventIds.length > 0) {
    links.push({ href: '/events', kind: 'events' });
  }
  for (const slug of access.ministries) {
    links.push({ href: `/ministries/${slug}`, kind: 'ministry', slug });
  }
  for (const slug of access.care) {
    links.push({ href: `/administrative-care/${slug}`, kind: 'care', slug });
  }
  if (access.contact) links.push({ href: '/contact', kind: 'contact' });
  if (access.prayer) links.push({ href: '/prayer-wall', kind: 'prayer' });
  if (access.gift) links.push({ href: '/free-gift', kind: 'gift' });
  return links;
}
