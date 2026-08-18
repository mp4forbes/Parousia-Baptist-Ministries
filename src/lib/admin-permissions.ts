export const SUPER_ADMIN_SETTINGS_KEYS = [
  'logo_url',
  'theme_primary',
  'theme_hover',
  'theme_accent',
  'theme_mode',
  'hero_bg_opacity_light',
  'hero_bg_opacity_dark',
  'soften_hero_text_bg',
  'home_background_url',
  'hide_stripe',
  'cashapp_id',
  'venmo_id',
  'apple_pay_phone',
  'zelle_phone',
  'zelle_name',
  'show_cashapp',
  'show_venmo',
  'show_apple_pay',
  'show_check',
  'check_payable_to',
  'check_mailing_address',
  'admin_password',
  'youtube_channel_url',
] as const;

export type SuperAdminSettingsKey = (typeof SUPER_ADMIN_SETTINGS_KEYS)[number];

const SUPER_ADMIN_SETTINGS_KEY_SET = new Set<string>(SUPER_ADMIN_SETTINGS_KEYS);

export const EVENT_PAYMENT_FIELDS = [
  'payment_required',
  'payment_amount',
  'payment_zelle_name',
  'payment_zelle_phone',
  'payment_instructions_english',
  'payment_instructions_kreyol',
] as const;

export function mergeSettingsPreservingRestricted(
  incoming: Record<string, string>,
  existing: Record<string, string>,
  isSuperAdmin: boolean
): Record<string, string> {
  if (isSuperAdmin) return incoming;

  const merged = { ...incoming };
  for (const key of SUPER_ADMIN_SETTINGS_KEYS) {
    if (key in existing) {
      merged[key] = existing[key];
    } else {
      delete merged[key];
    }
  }
  return merged;
}

export function isSuperAdminSettingsKey(key: string): boolean {
  return SUPER_ADMIN_SETTINGS_KEY_SET.has(key);
}

export function superAdminGateMessage(language: 'en' | 'fr_ht'): string {
  return language === 'fr_ht'
    ? 'Seuls les super administrateurs peuvent modifier ce paramètre. Contactez un super administrateur si un changement est nécessaire.'
    : 'Only super administrators can change this setting. Contact a super administrator if an update is needed.';
}
