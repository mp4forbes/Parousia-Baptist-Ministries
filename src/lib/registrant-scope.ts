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

export function registrantAccessScope(link: RegistrantAccessLink): RegistrantScope | null {
  switch (link.kind) {
    case 'gift':
      return { kind: 'gift' };
    case 'contact':
      return { kind: 'contact' };
    case 'prayer':
      return { kind: 'prayer' };
    case 'care':
      return link.slug ? { kind: 'care', slug: link.slug } : null;
    case 'ministry':
      return link.slug ? { kind: 'ministry', slug: link.slug } : null;
    case 'events':
      return null;
  }
}

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

export const FOLLOW_UP_STATUSES = ['new', 'in_progress', 'completed', 'on_hold', 'cancelled'] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export function followUpColumns(language: 'en' | 'fr_ht'): RegistrantColumn[] {
  return [
    {
      key: 'follow_up_status',
      label: language === 'fr_ht' ? 'Statut' : 'Status',
      type: 'select',
      options: [
        { value: 'new', label: language === 'fr_ht' ? 'Nouveau' : 'New' },
        { value: 'in_progress', label: language === 'fr_ht' ? 'En cours' : 'In progress' },
        { value: 'completed', label: language === 'fr_ht' ? 'Terminé' : 'Completed' },
        { value: 'on_hold', label: language === 'fr_ht' ? 'En attente' : 'On hold' },
        { value: 'cancelled', label: language === 'fr_ht' ? 'Annulé' : 'Cancelled' },
      ],
    },
    {
      key: 'memo',
      label: language === 'fr_ht' ? 'Mémo' : 'Memo',
      type: 'textarea',
    },
  ];
}

export function normalizeFollowUpStatus(value?: string | null): FollowUpStatus {
  const status = (value || '').trim();
  return (FOLLOW_UP_STATUSES as readonly string[]).includes(status)
    ? (status as FollowUpStatus)
    : 'new';
}

export function followUpValues(row?: { follow_up_status?: string | null; memo?: string | null } | null): Record<string, string> {
  return {
    follow_up_status: normalizeFollowUpStatus(row?.follow_up_status),
    memo: row?.memo || '',
  };
}
