export const ADMIN_SECTION_SLUGS = [
  'haiti_missions',
  'local_outreach',
  'events_signups',
  'contact_submissions',
  'prayer_moderation',
  'ebook_subscribers',
] as const;

export type AdminSectionSlug = (typeof ADMIN_SECTION_SLUGS)[number];

export const ADMIN_EXPORT_SLUGS = [
  'haiti_missions',
  'local_outreach',
  'events',
  'event_registrations',
  'contact_submissions',
  'prayer_moderation',
  'ebook_subscribers',
] as const;

export type AdminExportSlug = (typeof ADMIN_EXPORT_SLUGS)[number];

export function isAdminSectionSlug(value: string): value is AdminSectionSlug {
  return ADMIN_SECTION_SLUGS.includes(value as AdminSectionSlug);
}

export function isAdminExportSlug(value: string): value is AdminExportSlug {
  return ADMIN_EXPORT_SLUGS.includes(value as AdminExportSlug);
}
