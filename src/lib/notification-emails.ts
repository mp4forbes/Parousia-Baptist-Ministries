export function parseNotificationEmails(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const emails = new Set<string>();
  const matches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  for (const email of matches) {
    emails.add(email.toLowerCase());
  }
  for (const part of value.split(/[,;\n]+/)) {
    const email = part.trim().toLowerCase().replace(/^mailto:/, '');
    if (email.includes('@')) emails.add(email);
  }
  return [...emails];
}

export function emailIsRecipient(email: string | null | undefined, list?: string | null): boolean {
  if (!email) return false;
  return parseNotificationEmails(list).includes(email.toLowerCase().trim());
}

export function emailsFromContactFields(row?: {
  notification_emails?: string | null;
  contact_email?: string | null;
} | null): string[] {
  const emails = new Set<string>();
  for (const email of parseNotificationEmails(row?.notification_emails)) {
    emails.add(email);
  }
  for (const email of parseNotificationEmails(row?.contact_email)) {
    emails.add(email);
  }
  return [...emails];
}

export function emailMatchesContactFields(
  email: string | null | undefined,
  row?: { notification_emails?: string | null; contact_email?: string | null } | null
): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (emailsFromContactFields(row).includes(normalized)) return true;
  const blob = `${row?.notification_emails || ''}\n${row?.contact_email || ''}`.toLowerCase();
  if (!blob.includes(normalized)) return false;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[<\\s,;:])${escaped}([>\\s,;]|$)`).test(blob);
}
