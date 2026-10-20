import { buildAdminSpreadsheet } from './admin-spreadsheet';
import { getMinistrySignupFields } from './ministry-signup-fields';
import type { MinistrySignup } from './db';

function signupHeaders(slug: string): string[] {
  const fields = getMinistrySignupFields(slug);
  return ['Registration Date', 'Name', 'Email', 'Phone', ...fields.map((field) => field.label_en)];
}

function signupRow(slug: string, signup: MinistrySignup): string[] {
  let responses: Record<string, string> = {};
  try {
    responses = JSON.parse(signup.responses || '{}');
  } catch {
    responses = {};
  }

  const fields = getMinistrySignupFields(slug);
  return [
    new Date(signup.created_at).toLocaleString(),
    signup.name,
    signup.email,
    signup.phone || '',
    ...fields.map((field) => responses[field.key] || ''),
  ];
}

export async function buildMinistrySignupSpreadsheet(options: {
  slug: string;
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
