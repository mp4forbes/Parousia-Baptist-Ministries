'use server';

import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { db } from './db';
import { checkAdminAuth, getLoggedInAdminEmail } from './actions';
import { getAdminEmailFormatError, isValidAdminEmailFormat, normalizeAdminEmail } from './admin-email';
import { COORDINATOR_UI_COOKIE, coordinatorUiCookieOptions } from './coordinator-cookies';
import { emailsFromContactFields, emailMatchesContactFields } from './notification-emails';
import { sendRecipientOtpEmail } from './notify';
import {
  EMPTY_REGISTRANT_ACCESS,
  scopeIsAllowed,
  type RegistrantAccess,
  type RegistrantScope,
} from './registrant-scope';
import { decryptSession, encryptSession, hashPassword } from './session-crypto';
import { ADMINISTRATIVE_CARE_SLUGS } from './site-nav';
import { MINISTRY_SIGNUP_SLUGS } from './ministry-signup-fields';

const COORDINATOR_COOKIE = 'coordinator_auth';
const SESSION_SECONDS = 60 * 60 * 8;
const SETUP_SESSION_SECONDS = 60 * 30;

type CoordinatorSession = {
  email: string;
  exp: number;
  pendingPasswordSetup?: boolean;
};

type CoordinatorRecord = {
  email: string;
  password_hash?: string | null;
  created_at: string;
};

type RecipientRow = {
  notification_emails?: string | null;
  contact_email?: string | null;
};

export type CoordinatorLoginResult = {
  success: boolean;
  otpRequired?: boolean;
  setupPasswordRequired?: boolean;
  fromEmail?: string;
  access?: RegistrantAccess;
  error?: string;
};

async function ensureCoordinatorSchema(): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS coordinators (
      email TEXT PRIMARY KEY,
      password_hash TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
}

async function getCoordinatorSession(): Promise<CoordinatorSession | null> {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get(COORDINATOR_COOKIE);
    if (!auth?.value) return null;
    const decrypted = decryptSession(auth.value);
    if (!decrypted) return null;
    const session = JSON.parse(decrypted) as CoordinatorSession;
    if (!session.email || !session.exp || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getCoordinatorEmail(): Promise<string | null> {
  const session = await getCoordinatorSession();
  return session?.email ?? null;
}

export async function getLoggedInViewerEmail(): Promise<string | null> {
  const coordinator = await getCoordinatorEmail();
  if (coordinator) return coordinator;
  if (await checkAdminAuth()) {
    return getLoggedInAdminEmail();
  }
  return null;
}

async function setCoordinatorSession(
  email: string,
  options?: { pendingPasswordSetup?: boolean; maxAgeSeconds?: number }
): Promise<void> {
  const maxAgeSeconds = options?.maxAgeSeconds ?? SESSION_SECONDS;
  const cookieStore = await cookies();
  const sessionPayload = JSON.stringify({
    email: email.toLowerCase().trim(),
    exp: Date.now() + maxAgeSeconds * 1000,
    pendingPasswordSetup: options?.pendingPasswordSetup === true,
  } satisfies CoordinatorSession);
  cookieStore.set(COORDINATOR_COOKIE, encryptSession(sessionPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
  });

  if (options?.pendingPasswordSetup) {
    cookieStore.delete(COORDINATOR_UI_COOKIE);
  } else {
    cookieStore.set(COORDINATOR_UI_COOKIE, '1', coordinatorUiCookieOptions(maxAgeSeconds));
  }
}

export async function logoutCoordinator(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COORDINATOR_COOKIE);
  cookieStore.delete(COORDINATOR_UI_COOKIE);
}

function collectEmails(rows: RecipientRow[]): string[] {
  const emails = new Set<string>();
  for (const row of rows) {
    for (const email of emailsFromContactFields(row)) {
      emails.add(email);
    }
  }
  return [...emails];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function getCoordinatorRecord(email: string): Promise<CoordinatorRecord | undefined> {
  await ensureCoordinatorSchema();
  return await db.prepare('SELECT * FROM coordinators WHERE LOWER(email) = ?').get(email) as CoordinatorRecord | undefined;
}

function coordinatorHasPassword(record?: CoordinatorRecord | null): boolean {
  return !!record?.password_hash?.trim();
}

async function upsertCoordinator(email: string, passwordHash?: string | null): Promise<void> {
  await ensureCoordinatorSchema();
  const now = new Date().toISOString();
  if (passwordHash) {
    await db.prepare(`
      INSERT INTO coordinators (email, password_hash, created_at)
      VALUES (?, ?, ?)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `).run(email, passwordHash, now);
    return;
  }
  await db.prepare(`
    INSERT INTO coordinators (email, password_hash, created_at)
    VALUES (?, NULL, ?)
    ON CONFLICT (email) DO NOTHING
  `).run(email, now);
}

async function isDeviceTrusted(email: string, deviceHash: string): Promise<boolean> {
  if (!email || !deviceHash) return false;
  const device = await db.prepare(
    'SELECT verified FROM admin_devices WHERE LOWER(email) = ? AND device_hash = ?'
  ).get(email, deviceHash) as { verified: number } | undefined;
  return device?.verified === 1;
}

async function trustDevice(email: string, deviceHash: string): Promise<void> {
  if (!email || !deviceHash) return;
  await db.prepare(`
    INSERT INTO admin_devices (email, device_hash, verified, created_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(email, device_hash) DO UPDATE SET verified = 1
  `).run(email, deviceHash, new Date().toISOString());
}

export async function isNotificationRecipientEmail(email: string): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!isValidAdminEmailFormat(normalized)) return false;
  const lists = await loadAllRecipientLists();
  return lists.includes(normalized);
}

async function loadAllRecipientLists(): Promise<string[]> {
  const emails = new Set<string>();
  try {
    const [ministries, categories, sections, events] = await Promise.all([
      db.prepare('SELECT notification_emails, contact_email FROM ministries').all() as Promise<RecipientRow[]>,
      db.prepare('SELECT notification_emails, contact_email FROM administrative_care_categories').all() as Promise<RecipientRow[]>,
      db.prepare('SELECT notification_emails, contact_email FROM admin_section_configs').all() as Promise<RecipientRow[]>,
      db.prepare('SELECT notification_emails FROM events').all().catch(() => []) as Promise<RecipientRow[]>,
    ]);
    for (const email of collectEmails([...ministries, ...categories, ...sections, ...events])) {
      emails.add(email);
    }
  } catch (error) {
    console.error('Error loading notification recipient lists:', error);
  }
  return [...emails];
}

async function loadSection(slug: string): Promise<RecipientRow | undefined> {
  return db.prepare(
    'SELECT notification_emails, contact_email FROM admin_section_configs WHERE section_slug = ?'
  ).get(slug) as Promise<RecipientRow | undefined>;
}

export async function getRecipientsForScope(scope: RegistrantScope): Promise<string[]> {
  const emails = new Set<string>();
  try {
    if (scope.kind === 'event') {
      const event = await db.prepare('SELECT notification_emails FROM events WHERE id = ?').get(scope.eventId) as
        | RecipientRow
        | undefined;
      emailsFromContactFields(event).forEach((email) => emails.add(email));
      emailsFromContactFields(await loadSection('events_signups')).forEach((email) => emails.add(email));
    } else if (scope.kind === 'ministry') {
      const ministry = await db.prepare(
        'SELECT notification_emails, contact_email FROM ministries WHERE slug = ?'
      ).get(scope.slug) as RecipientRow | undefined;
      emailsFromContactFields(ministry).forEach((email) => emails.add(email));
      if (scope.slug === 'missions') {
        emailsFromContactFields(await loadSection('haiti_missions')).forEach((email) => emails.add(email));
      }
    } else if (scope.kind === 'care') {
      const category = await db.prepare(
        'SELECT notification_emails, contact_email FROM administrative_care_categories WHERE slug = ?'
      ).get(scope.slug) as RecipientRow | undefined;
      emailsFromContactFields(category).forEach((email) => emails.add(email));
      emailsFromContactFields(await loadSection('administrative_care')).forEach((email) => emails.add(email));
    } else if (scope.kind === 'contact') {
      emailsFromContactFields(await loadSection('contact_submissions')).forEach((email) => emails.add(email));
    } else if (scope.kind === 'prayer') {
      emailsFromContactFields(await loadSection('prayer_moderation')).forEach((email) => emails.add(email));
    } else if (scope.kind === 'gift') {
      emailsFromContactFields(await loadSection('ebook_subscribers')).forEach((email) => emails.add(email));
    }
  } catch (error) {
    console.error('Error loading recipients for scope:', error);
  }
  return [...emails];
}

export async function canManageRegistrants(scope: RegistrantScope): Promise<boolean> {
  return scopeIsAllowed(scope, await getRegistrantAccess());
}

export async function getRegistrantAccess(): Promise<RegistrantAccess> {
  const session = await getCoordinatorSession();
  const coordinator = session?.email ?? null;
  const adminEmail = (await checkAdminAuth()) ? await getLoggedInAdminEmail() : null;
  const email = coordinator || adminEmail;
  if (!email) return EMPTY_REGISTRANT_ACCESS;

  const normalized = email.toLowerCase().trim();
  const access: RegistrantAccess = {
    ...EMPTY_REGISTRANT_ACCESS,
    email: normalized,
    source: coordinator ? 'coordinator' : 'admin',
    needsPasswordSetup: session?.pendingPasswordSetup === true,
  };

  try {
    const eventsSection = await loadSection('events_signups');
    if (emailMatchesContactFields(normalized, eventsSection)) {
      access.allEvents = true;
    }

    const events = await db.prepare('SELECT id, notification_emails FROM events').all().catch(() => []) as {
      id: number;
      notification_emails?: string;
    }[];
    access.eventIds = events
      .filter((event) => emailMatchesContactFields(normalized, event))
      .map((event) => event.id);

    const ministries = await db.prepare('SELECT slug, notification_emails, contact_email FROM ministries').all() as {
      slug: string;
      notification_emails?: string;
      contact_email?: string;
    }[];
    const ministrySlugs = ministries
      .filter((item) => MINISTRY_SIGNUP_SLUGS.includes(item.slug as (typeof MINISTRY_SIGNUP_SLUGS)[number])
        && emailMatchesContactFields(normalized, item))
      .map((item) => item.slug);
    if (emailMatchesContactFields(normalized, await loadSection('haiti_missions'))) {
      ministrySlugs.push('missions');
    }
    access.ministries = unique(ministrySlugs);

    const categories = await db.prepare(
      'SELECT slug, notification_emails, contact_email FROM administrative_care_categories'
    ).all() as {
      slug: string;
      notification_emails?: string;
      contact_email?: string;
    }[];
    const careSlugs = categories
      .filter((item) => emailMatchesContactFields(normalized, item))
      .map((item) => item.slug.trim());
    if (emailMatchesContactFields(normalized, await loadSection('administrative_care'))) {
      careSlugs.push(...ADMINISTRATIVE_CARE_SLUGS);
    }
    access.care = unique(careSlugs);

    access.contact = emailMatchesContactFields(normalized, await loadSection('contact_submissions'));
    access.prayer = emailMatchesContactFields(normalized, await loadSection('prayer_moderation'));
    access.gift = emailMatchesContactFields(normalized, await loadSection('ebook_subscribers'));
  } catch (error) {
    console.error('Error building registrant access:', error);
  }

  return access;
}

async function issueRecipientOtp(
  normalizedEmail: string
): Promise<{ success: boolean; fromEmail?: string; error?: string }> {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.prepare('INSERT OR REPLACE INTO admin_otps (email, code, expires_at) VALUES (?, ?, ?)').run(
    normalizedEmail,
    otpCode,
    expiresAt
  );

  const emailResult = await sendRecipientOtpEmail(normalizedEmail, otpCode, expiresAt);
  if (emailResult.success) {
    return { success: true, fromEmail: emailResult.fromEmail };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP] Recipient fallback code for ${normalizedEmail}: ${otpCode}`);
    try {
      const scratchDir = path.resolve(process.cwd(), 'scratch');
      if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
      fs.writeFileSync(
        path.resolve(scratchDir, 'dev_last_recipient_otp.json'),
        JSON.stringify({ email: normalizedEmail, code: otpCode, expiresAt, emailError: emailResult.error }, null, 2),
        'utf8'
      );
    } catch {
      // Ignore scratch write failures.
    }
    return { success: true, fromEmail: emailResult.fromEmail };
  }

  await db.prepare('DELETE FROM admin_otps WHERE LOWER(email) = ?').run(normalizedEmail);
  return {
    success: false,
    error: emailResult.error
      ? `Could not send verification email: ${emailResult.error}`
      : 'Could not send verification email. Please try again later.',
  };
}

function unauthorizedError(language: 'en' | 'fr_ht') {
  return language === 'fr_ht'
    ? 'Cette adresse n’est pas enregistrée comme destinataire de notifications.'
    : 'This email is not configured as a notification recipient.';
}

export async function prevalidateCoordinatorLogin(
  email: string,
  deviceHash: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<{ authorized: boolean; trusted: boolean; hasPassword: boolean; error?: string }> {
  const normalizedEmail = normalizeAdminEmail(email);
  const formatError = getAdminEmailFormatError(normalizedEmail, language);
  if (formatError) {
    return { authorized: false, trusted: false, hasPassword: false, error: formatError };
  }

  if (!(await isNotificationRecipientEmail(normalizedEmail))) {
    return { authorized: false, trusted: false, hasPassword: false, error: unauthorizedError(language) };
  }

  const record = await getCoordinatorRecord(normalizedEmail);
  return {
    authorized: true,
    trusted: await isDeviceTrusted(normalizedEmail, deviceHash),
    hasPassword: coordinatorHasPassword(record),
  };
}

export async function requestCoordinatorLogin(
  email: string,
  password: string,
  deviceHash: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<CoordinatorLoginResult> {
  const normalizedEmail = normalizeAdminEmail(email);
  const formatError = getAdminEmailFormatError(normalizedEmail, language);
  if (formatError) return { success: false, error: formatError };

  if (!(await isNotificationRecipientEmail(normalizedEmail))) {
    return { success: false, error: unauthorizedError(language) };
  }

  try {
    const record = await getCoordinatorRecord(normalizedEmail);
    const hasPassword = coordinatorHasPassword(record);
    if (hasPassword) {
      if (!password.trim()) {
        return {
          success: false,
          error: language === 'fr_ht' ? 'Veuillez saisir votre mot de passe.' : 'Please enter your password.',
        };
      }
      if (record?.password_hash !== hashPassword(password.trim())) {
        return {
          success: false,
          error: language === 'fr_ht' ? 'Mot de passe incorrect.' : 'Incorrect password.',
        };
      }
    }

    const trusted = await isDeviceTrusted(normalizedEmail, deviceHash);
    if (hasPassword && trusted) {
      await setCoordinatorSession(normalizedEmail);
      return { success: true, otpRequired: false, access: await getRegistrantAccess() };
    }

    const otp = await issueRecipientOtp(normalizedEmail);
    if (!otp.success) return { success: false, error: otp.error };
    return { success: true, otpRequired: true, fromEmail: otp.fromEmail };
  } catch (error: any) {
    console.error('Error requesting coordinator login:', error);
    return { success: false, error: error.message || 'Could not start sign-in.' };
  }
}

export async function requestCoordinatorOtp(
  email: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<CoordinatorLoginResult> {
  return requestCoordinatorLogin(email, '', '', language);
}

export async function verifyCoordinatorOtp(
  email: string,
  otpCode: string,
  deviceHash: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<CoordinatorLoginResult> {
  try {
    const normalizedEmail = normalizeAdminEmail(email);
    const cleanCode = otpCode.trim();
    if (!(await isNotificationRecipientEmail(normalizedEmail))) {
      return { success: false, error: unauthorizedError(language) };
    }

    const otpRecord = await db.prepare('SELECT * FROM admin_otps WHERE LOWER(email) = ?').get(normalizedEmail) as
      | { email: string; code: string; expires_at: string }
      | undefined;
    if (!otpRecord) {
      return {
        success: false,
        error: language === 'fr_ht'
          ? 'Aucun code actif n’a été trouvé pour cette adresse.'
          : 'No active verification code found for this email.',
      };
    }
    if (new Date() > new Date(otpRecord.expires_at)) {
      return {
        success: false,
        error: language === 'fr_ht'
          ? 'Ce code a expiré. Veuillez en demander un nouveau.'
          : 'This verification code has expired. Please request a new one.',
      };
    }
    if (otpRecord.code !== cleanCode) {
      return {
        success: false,
        error: language === 'fr_ht' ? 'Code de vérification invalide.' : 'Invalid verification code.',
      };
    }

    await db.prepare('DELETE FROM admin_otps WHERE LOWER(email) = ?').run(normalizedEmail);
    await upsertCoordinator(normalizedEmail);

    const record = await getCoordinatorRecord(normalizedEmail);
    if (!coordinatorHasPassword(record)) {
      await setCoordinatorSession(normalizedEmail, {
        pendingPasswordSetup: true,
        maxAgeSeconds: SETUP_SESSION_SECONDS,
      });
      return { success: true, setupPasswordRequired: true, access: await getRegistrantAccess() };
    }

    await trustDevice(normalizedEmail, deviceHash);
    await setCoordinatorSession(normalizedEmail);
    return { success: true, access: await getRegistrantAccess() };
  } catch (error: any) {
    console.error('Error verifying coordinator OTP:', error);
    return { success: false, error: error.message || 'Could not verify code.' };
  }
}

export async function completeCoordinatorPasswordSetup(
  password: string,
  confirmPassword: string,
  deviceHash: string,
  language: 'en' | 'fr_ht' = 'en'
): Promise<CoordinatorLoginResult> {
  try {
    const session = await getCoordinatorSession();
    if (!session?.pendingPasswordSetup) {
      return {
        success: false,
        error: language === 'fr_ht'
          ? 'Votre session de configuration a expiré. Veuillez vous reconnecter.'
          : 'Your setup session has expired. Please sign in again.',
      };
    }

    const normalizedEmail = session.email.toLowerCase().trim();
    if (!(await isNotificationRecipientEmail(normalizedEmail))) {
      return { success: false, error: unauthorizedError(language) };
    }

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    if (!trimmedPassword) {
      return {
        success: false,
        error: language === 'fr_ht' ? 'Veuillez saisir un mot de passe.' : 'Please enter a password.',
      };
    }
    if (trimmedPassword.length < 8) {
      return {
        success: false,
        error: language === 'fr_ht'
          ? 'Le mot de passe doit contenir au moins 8 caractères.'
          : 'Your password must be at least 8 characters.',
      };
    }
    if (trimmedPassword !== trimmedConfirm) {
      return {
        success: false,
        error: language === 'fr_ht' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.',
      };
    }

    await upsertCoordinator(normalizedEmail, hashPassword(trimmedPassword));
    await trustDevice(normalizedEmail, deviceHash);
    await setCoordinatorSession(normalizedEmail);
    return { success: true, access: await getRegistrantAccess() };
  } catch (error: any) {
    console.error('Error completing coordinator password setup:', error);
    return { success: false, error: error.message || 'Could not save password.' };
  }
}
