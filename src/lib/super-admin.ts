const DEFAULT_SUPER_ADMIN_EMAIL = 'straightlineaffiliate@gmail.com';

export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL;
  const emails = raw
    .split(',')
    .map((email) => email.toLowerCase().trim())
    .filter(Boolean);

  return emails.length > 0 ? emails : [DEFAULT_SUPER_ADMIN_EMAIL];
}

export function getPrimarySuperAdminEmail(): string {
  return getSuperAdminEmails()[0];
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return getSuperAdminEmails().includes(normalized);
}

export function formatSuperAdminEmailsForDisplay(): string {
  return getSuperAdminEmails().join(', ');
}
