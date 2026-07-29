import { buildAdminSpreadsheet } from './admin-spreadsheet';
import { MINISTRY_SIGNUP_FIELDS, MinistrySignupSlug } from './ministry-signup-fields';
import type { MinistrySignup } from './db';

function signupHeaders(slug: MinistrySignupSlug): string[] {
  const fields = MINISTRY_SIGNUP_FIELDS[slug];
  return ['Registration Date', 'Name', 'Email', 'Phone', ...fields.map((field) => field.label_en)];
}

function signupRow(slug: MinistrySignupSlug, signup: MinistrySignup): string[] {
  let responses: Record<string, string> = {};
  try {
    responses = JSON.parse(signup.responses || '{}');
  } catch {
    responses = {};
  }

  const fields = MINISTRY_SIGNUP_FIELDS[slug];
  return [
    new Date(signup.created_at).toLocaleString(),
    signup.name,
    signup.email,
    signup.phone || '',
    ...fields.map((field) => responses[field.key] || ''),
  ];
}

export async function buildMinistrySignupSpreadsheet(options: {
  slug: MinistrySignupSlug;
  ministryTitle: string;
  signups: MinistrySignup[];
  logoUrl?: string;
}): Promise<Buffer> {
  const { slug, ministryTitle, signups, logoUrl } = options;
  return buildAdminSpreadsheet({
    sheetTitle: `${ministryTitle} — Signup Registry`,
    headers: signupHeaders(slug),
    rows: signups.map((signup) => signupRow(slug, signup)),
    logoUrl,
    sheetName: 'Signups',
  });
}
