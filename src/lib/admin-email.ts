import { promises as dns } from 'node:dns';
import { db } from './db';
import { isSuperAdminEmail } from './super-admin';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BLOCKED_ADMIN_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'invalid.com',
  'localhost',
  'foobar.com',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'tempmail.com',
]);

export function normalizeAdminEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function getAdminEmailDomain(email: string): string | null {
  const normalized = normalizeAdminEmail(email);
  if (!isValidAdminEmailFormat(normalized)) {
    return null;
  }
  return normalized.split('@')[1] || null;
}

export function isBlockedAdminEmailDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().trim();
  if (BLOCKED_ADMIN_EMAIL_DOMAINS.has(normalized)) {
    return true;
  }
  return normalized.endsWith('.test') || normalized.endsWith('.invalid') || normalized.endsWith('.localhost');
}

export async function domainAcceptsEmail(domain: string): Promise<boolean> {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      return true;
    }
  } catch {
    // Fall through to A-record check.
  }

  try {
    await dns.resolve4(domain);
    return false;
  } catch {
    try {
      await dns.resolve6(domain);
      return false;
    } catch {
      return false;
    }
  }
}

export async function validateAdminEmailForInvite(
  email: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<{ valid: boolean; error?: string }> {
  const formatError = getAdminEmailFormatError(email, language);
  if (formatError) {
    return { valid: false, error: formatError };
  }

  const domain = getAdminEmailDomain(email);
  if (!domain) {
    return {
      valid: false,
      error: language === 'fr_ht'
        ? 'Veuillez saisir une adresse courriel valide.'
        : 'Please enter a valid email address.',
    };
  }

  if (isBlockedAdminEmailDomain(domain)) {
    return {
      valid: false,
      error: language === 'fr_ht'
        ? 'Ce domaine de messagerie ne peut pas être utilisé pour un compte administrateur.'
        : 'This email domain cannot be used for an administrator account.',
    };
  }

  const acceptsMail = await domainAcceptsEmail(domain);
  if (!acceptsMail) {
    return {
      valid: false,
      error: language === 'fr_ht'
        ? 'Ce domaine de messagerie ne semble pas configuré pour recevoir des courriels. Veuillez vérifier l’adresse.'
        : 'This email domain does not appear configured to receive mail. Please verify the address.',
    };
  }

  return { valid: true };
}

export function isValidAdminEmailFormat(email: string): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || normalized.length > 254) {
    return false;
  }
  return EMAIL_FORMAT_REGEX.test(normalized);
}

export async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!isValidAdminEmailFormat(normalized)) {
    return false;
  }

  if (isSuperAdminEmail(normalized)) {
    return true;
  }

  const row = await db.prepare('SELECT id FROM admins WHERE LOWER(email) = ?').get(normalized) as
    | { id: number }
    | undefined;

  return !!row;
}

export function getAdminEmailFormatError(
  email: string,
  language: 'en' | 'fr_ht' = 'en'
): string | null {
  if (!normalizeAdminEmail(email)) {
    return language === 'fr_ht'
      ? 'Veuillez saisir votre adresse courriel.'
      : 'Please enter your email address.';
  }

  if (!isValidAdminEmailFormat(email)) {
    return language === 'fr_ht'
      ? 'Veuillez saisir une adresse courriel valide.'
      : 'Please enter a valid email address.';
  }

  return null;
}

export function getUnauthorizedAdminEmailError(language: 'en' | 'fr_ht' = 'en'): string {
  return language === 'fr_ht'
    ? 'Cette adresse courriel n’est pas enregistrée comme administrateur autorisé.'
    : 'This email is not registered as an authorized administrator.';
}
