import { db } from './db';

export type ChurchContact = {
  phone: string;
  email: string;
  address: string;
};

const DEFAULT_CONTACT: ChurchContact = {
  phone: '+1 (954) 555-1234',
  email: 'info@parousiabaptist.org',
  address: '789 Community Blvd, Fort Lauderdale, FL 33311',
};

/** Contact details shown in the site footer and contact section. */
export async function getChurchContact(): Promise<ChurchContact> {
  try {
    const rows = await db
      .prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?)')
      .all('church_phone', 'church_email', 'church_address') as { key: string; value: string }[];

    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    return {
      phone: settings.church_phone?.trim() || DEFAULT_CONTACT.phone,
      email: settings.church_email?.trim() || DEFAULT_CONTACT.email,
      address: settings.church_address?.trim() || DEFAULT_CONTACT.address,
    };
  } catch {
    return DEFAULT_CONTACT;
  }
}
