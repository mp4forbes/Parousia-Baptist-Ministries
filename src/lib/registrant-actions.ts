'use server';

import { revalidatePath } from 'next/cache';
import {
  ADMINISTRATIVE_CARE_BASE_FIELDS,
  ADMINISTRATIVE_CARE_FIELDS,
  isCheckedResponse,
} from './administrative-care-fields';
import { buildAdminSpreadsheet } from './admin-spreadsheet';
import { getSettings } from './actions';
import { canManageRegistrants } from './coordinator-session';
import { db } from './db';
import type {
  AdministrativeCareSubmission,
  ContactSubmission,
  EventRecord,
  Lead,
  MinistrySignup,
  PrayerRequest,
  Registration,
} from './db';
import {
  getEventRegistrationFields,
  parseEventRegistrationResponses,
} from './event-registration-fields';
import { isEventPaymentRequired } from './event-payment';
import { MINISTRY_SIGNUP_FIELDS, MINISTRY_SIGNUP_SLUGS, type MinistrySignupSlug } from './ministry-signup-fields';
import type {
  RegistrantColumn,
  RegistrantRow,
  RegistrantScope,
} from './registrant-scope';
import { isAdministrativeCareSlug, type AdministrativeCareSlug } from './site-nav';

const SKIP_CARE_KEYS = new Set(['requester_name', 'requester_email', 'requester_phone']);

function parseJsonMap(value?: string | null): Record<string, string> {
  try {
    const parsed = JSON.parse(value || '{}') as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, item]) => [key, item == null ? '' : String(item)])
    );
  } catch {
    return {};
  }
}

function fieldType(type: string): RegistrantColumn['type'] {
  if (type === 'textarea') return 'textarea';
  if (type === 'number') return 'number';
  if (type === 'select' || type === 'checkbox') return 'select';
  return 'text';
}

function checkboxOptions(language: 'en' | 'fr_ht'): { value: string; label: string }[] {
  return [
    { value: 'yes', label: language === 'fr_ht' ? 'Oui' : 'Yes' },
    { value: 'no', label: language === 'fr_ht' ? 'Non' : 'No' },
  ];
}

function allCareFields(slug: AdministrativeCareSlug) {
  return [...ADMINISTRATIVE_CARE_BASE_FIELDS, ...ADMINISTRATIVE_CARE_FIELDS[slug]];
}

function revalidatePublicLists() {
  revalidatePath('/');
  revalidatePath('/events');
  revalidatePath('/ministries');
  revalidatePath('/administrative-care');
  revalidatePath('/contact');
  revalidatePath('/prayer-wall');
  revalidatePath('/free-gift');
  revalidatePath('/admin/dashboard');
}

async function requireAccess(scope: RegistrantScope): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await canManageRegistrants(scope))) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}

function columnsForEvent(
  event: EventRecord,
  language: 'en' | 'fr_ht'
): RegistrantColumn[] {
  const paymentRequired = isEventPaymentRequired(event);
  const fields = getEventRegistrationFields(event.registration_type);
  const columns: RegistrantColumn[] = [
    { key: 'name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text', required: true },
    { key: 'email', label: language === 'fr_ht' ? 'Courriel' : 'Email', type: 'text', required: true },
    { key: 'phone', label: language === 'fr_ht' ? 'Téléphone' : 'Phone', type: 'text' },
  ];
  if (paymentRequired) {
    columns.push({
      key: 'payment_status',
      label: language === 'fr_ht' ? 'Paiement' : 'Payment',
      type: 'select',
      options: [
        { value: 'paid', label: language === 'fr_ht' ? 'Payé' : 'Paid' },
        { value: 'not_paid', label: language === 'fr_ht' ? 'Non payé' : 'Not Paid' },
      ],
    });
  }
  for (const field of fields) {
    columns.push({
      key: `r_${field.key}`,
      label: language === 'fr_ht' ? field.label_ht : field.label_en,
      type: fieldType(field.type),
      required: field.required,
      options: field.options?.map((option) => ({
        value: option.value,
        label: language === 'fr_ht' ? option.label_ht : option.label_en,
      })),
    });
  }
  return columns;
}

export async function listRegistrants(
  scope: RegistrantScope,
  language: 'en' | 'fr_ht' = 'en'
): Promise<{ success: boolean; title?: string; columns?: RegistrantColumn[]; rows?: RegistrantRow[]; error?: string }> {
  const access = await requireAccess(scope);
  if (!access.ok) return { success: false, error: access.error };

  try {
    if (scope.kind === 'event') {
      const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(scope.eventId) as EventRecord | undefined;
      if (!event) return { success: false, error: 'Event not found.' };
      const registrations = await db.prepare(
        'SELECT * FROM registrations WHERE event_id = ? ORDER BY id DESC'
      ).all(scope.eventId) as Registration[];
      const columns = columnsForEvent(event, language);
      const rows = registrations.map((item) => {
        const responses = parseEventRegistrationResponses(item.responses_json);
        const values: Record<string, string> = {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          payment_status: item.payment_status === 'paid' ? 'paid' : 'not_paid',
        };
        for (const field of getEventRegistrationFields(event.registration_type)) {
          values[`r_${field.key}`] = responses[field.key] || (field.key === 'notes' ? item.notes || '' : '');
        }
        return { id: item.id, values };
      });
      const title = language === 'fr_ht' ? event.title_kreyol : event.title_english;
      return { success: true, title, columns, rows };
    }

    if (scope.kind === 'ministry') {
      if (!MINISTRY_SIGNUP_SLUGS.includes(scope.slug as MinistrySignupSlug)) {
        return { success: false, error: 'Invalid ministry.' };
      }
      const slug = scope.slug as MinistrySignupSlug;
      const ministry = await db.prepare('SELECT title_english, title_kreyol FROM ministries WHERE slug = ?').get(slug) as
        | { title_english: string; title_kreyol: string }
        | undefined;
      const fields = MINISTRY_SIGNUP_FIELDS[slug];
      const columns: RegistrantColumn[] = [
        { key: 'name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text', required: true },
        { key: 'email', label: language === 'fr_ht' ? 'Courriel' : 'Email', type: 'text', required: true },
        { key: 'phone', label: language === 'fr_ht' ? 'Téléphone' : 'Phone', type: 'text' },
        ...fields.map((field) => ({
          key: `r_${field.key}`,
          label: language === 'fr_ht' ? field.label_ht : field.label_en,
          type: fieldType(field.type),
          required: field.required,
          options: field.options?.map((option) => ({
            value: option.value,
            label: language === 'fr_ht' ? option.label_ht : option.label_en,
          })),
        })),
        { key: 'created_at', label: language === 'fr_ht' ? 'Inscrit le' : 'Signed up', type: 'readonly' as const },
      ];
      const signups = await db.prepare(
        'SELECT * FROM ministry_signups WHERE ministry_slug = ? ORDER BY created_at DESC'
      ).all(slug) as MinistrySignup[];
      const rows = signups.map((item) => {
        const responses = parseJsonMap(item.responses);
        const values: Record<string, string> = {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          created_at: item.created_at || '',
        };
        for (const field of fields) {
          values[`r_${field.key}`] = responses[field.key] || '';
        }
        return { id: item.id, values };
      });
      const title = language === 'fr_ht' ? ministry?.title_kreyol : ministry?.title_english;
      return { success: true, title: title || slug, columns, rows };
    }

    if (scope.kind === 'care') {
      if (!isAdministrativeCareSlug(scope.slug)) return { success: false, error: 'Invalid category.' };
      const slug = scope.slug;
      const category = await db.prepare(
        'SELECT title_english, title_kreyol FROM administrative_care_categories WHERE slug = ?'
      ).get(slug) as { title_english: string; title_kreyol: string } | undefined;
      const extraFields = allCareFields(slug).filter((field) => !SKIP_CARE_KEYS.has(field.key));
      const columns: RegistrantColumn[] = [
        { key: 'name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text', required: true },
        { key: 'email', label: language === 'fr_ht' ? 'Courriel' : 'Email', type: 'text', required: true },
        { key: 'phone', label: language === 'fr_ht' ? 'Téléphone' : 'Phone', type: 'text' },
        ...extraFields.map((field) => ({
          key: `r_${field.key}`,
          label: language === 'fr_ht' ? field.label_ht : field.label_en,
          type: fieldType(field.type),
          required: field.required,
          options: field.type === 'checkbox'
            ? checkboxOptions(language)
            : field.options?.map((option) => ({
              value: option.value,
              label: language === 'fr_ht' ? option.label_ht : option.label_en,
            })),
        })),
        { key: 'created_at', label: language === 'fr_ht' ? 'Soumis le' : 'Submitted', type: 'readonly' as const },
      ];
      const submissions = await db.prepare(
        'SELECT * FROM administrative_care_submissions WHERE category_slug = ? ORDER BY created_at DESC'
      ).all(slug) as AdministrativeCareSubmission[];
      const rows = submissions.map((item) => {
        const responses = parseJsonMap(item.responses);
        const values: Record<string, string> = {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          created_at: item.created_at || '',
        };
        for (const field of extraFields) {
          const raw = responses[field.key] || '';
          values[`r_${field.key}`] = field.type === 'checkbox'
            ? (isCheckedResponse(raw) ? 'yes' : 'no')
            : raw;
        }
        return { id: item.id, values };
      });
      const title = language === 'fr_ht' ? category?.title_kreyol : category?.title_english;
      return { success: true, title: title || slug, columns, rows };
    }

    if (scope.kind === 'contact') {
      const columns: RegistrantColumn[] = [
        { key: 'name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text', required: true },
        { key: 'email', label: language === 'fr_ht' ? 'Courriel' : 'Email', type: 'text', required: true },
        { key: 'phone', label: language === 'fr_ht' ? 'Téléphone' : 'Phone', type: 'text' },
        { key: 'message', label: language === 'fr_ht' ? 'Message' : 'Message', type: 'textarea', required: true },
        { key: 'created_at', label: language === 'fr_ht' ? 'Reçu le' : 'Received', type: 'readonly' },
      ];
      const submissions = await db.prepare(
        'SELECT * FROM contact_submissions ORDER BY created_at DESC'
      ).all() as ContactSubmission[];
      const rows = submissions.map((item) => ({
        id: item.id,
        values: {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          message: item.message || '',
          created_at: item.created_at || '',
        },
      }));
      return {
        success: true,
        title: language === 'fr_ht' ? 'Messages de contact' : 'Contact messages',
        columns,
        rows,
      };
    }

    if (scope.kind === 'gift') {
      const columns: RegistrantColumn[] = [
        { key: 'name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text', required: true },
        { key: 'email', label: language === 'fr_ht' ? 'Courriel' : 'Email', type: 'text', required: true },
        { key: 'phone', label: language === 'fr_ht' ? 'Téléphone' : 'Phone', type: 'text', required: true },
        { key: 'created_at', label: language === 'fr_ht' ? 'Inscrit le' : 'Signed up', type: 'readonly' },
      ];
      const subscribers = await db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as Lead[];
      const rows = subscribers.map((item) => ({
        id: item.id,
        values: {
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          created_at: item.created_at || '',
        },
      }));
      return {
        success: true,
        title: language === 'fr_ht' ? 'Méditations gratuites' : 'Free Devotional subscribers',
        columns,
        rows,
      };
    }

    const columns: RegistrantColumn[] = [
      { key: 'requester_name', label: language === 'fr_ht' ? 'Nom' : 'Name', type: 'text' },
      { key: 'request_text', label: language === 'fr_ht' ? 'Demande' : 'Request', type: 'textarea', required: true },
      {
        key: 'is_anonymous',
        label: language === 'fr_ht' ? 'Anonyme' : 'Anonymous',
        type: 'select',
        options: checkboxOptions(language),
      },
      { key: 'created_at', label: language === 'fr_ht' ? 'Reçu le' : 'Received', type: 'readonly' },
    ];
    const requests = await db.prepare('SELECT * FROM prayer_requests ORDER BY created_at DESC').all() as PrayerRequest[];
    const rows = requests.map((item) => ({
      id: item.id,
      values: {
        requester_name: item.requester_name || '',
        request_text: item.request_text || '',
        is_anonymous: item.is_anonymous ? 'yes' : 'no',
        created_at: item.created_at || '',
      },
    }));
    return {
      success: true,
      title: language === 'fr_ht' ? 'Demandes de prière' : 'Prayer requests',
      columns,
      rows,
    };
  } catch (error: any) {
    console.error('Error listing registrants:', error);
    return { success: false, error: error.message || 'Could not load the list.' };
  }
}

function collectResponseFields(values: Record<string, string>): Record<string, string> {
  const responses: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('r_')) {
      responses[key.slice(2)] = (value || '').trim();
    }
  }
  return responses;
}

export async function saveRegistrant(
  scope: RegistrantScope,
  id: number | null,
  values: Record<string, string>
): Promise<{ success: boolean; id?: number; error?: string }> {
  const access = await requireAccess(scope);
  if (!access.ok) return { success: false, error: access.error };

  const name = (values.name || values.requester_name || '').trim();
  const email = (values.email || '').trim().toLowerCase();
  const phone = (values.phone || '').trim();

  try {
    if (scope.kind === 'event') {
      if (!name) return { success: false, error: 'Name is required.' };
      const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(scope.eventId) as EventRecord | undefined;
      if (!event) return { success: false, error: 'Event not found.' };
      const responses = collectResponseFields(values);
      if (values.r_notes === undefined && values.notes) responses.notes = values.notes;
      const notes = responses.notes || '';
      const paymentStatus = values.payment_status === 'paid' ? 'paid' : 'not_paid';
      if (id) {
        await db.prepare(
          'UPDATE registrations SET name = ?, email = ?, phone = ?, notes = ?, responses_json = ?, payment_status = ? WHERE id = ? AND event_id = ?'
        ).run(name, email, phone, notes, JSON.stringify(responses), paymentStatus, id, scope.eventId);
        revalidatePublicLists();
        return { success: true, id };
      }
      await db.prepare(
        'INSERT INTO registrations (event_id, name, email, phone, notes, responses_json, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(scope.eventId, name, email, phone, notes, JSON.stringify(responses), paymentStatus);
      const created = await db.prepare(
        'SELECT id FROM registrations WHERE event_id = ? AND email = ? ORDER BY id DESC LIMIT 1'
      ).get(scope.eventId, email) as { id: number } | undefined;
      revalidatePublicLists();
      return { success: true, id: created?.id };
    }

    if (scope.kind === 'ministry') {
      if (!MINISTRY_SIGNUP_SLUGS.includes(scope.slug as MinistrySignupSlug)) {
        return { success: false, error: 'Invalid ministry.' };
      }
      if (!name || !email) return { success: false, error: 'Name and email are required.' };
      const responses = collectResponseFields(values);
      if (id) {
        await db.prepare(
          'UPDATE ministry_signups SET name = ?, email = ?, phone = ?, responses = ? WHERE id = ? AND ministry_slug = ?'
        ).run(name, email, phone || null, JSON.stringify(responses), id, scope.slug);
        revalidatePublicLists();
        return { success: true, id };
      }
      const createdAt = new Date().toISOString();
      await db.prepare(
        'INSERT INTO ministry_signups (ministry_slug, name, email, phone, responses, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(scope.slug, name, email, phone || null, JSON.stringify(responses), createdAt);
      const created = await db.prepare(
        'SELECT id FROM ministry_signups WHERE ministry_slug = ? AND email = ? ORDER BY id DESC LIMIT 1'
      ).get(scope.slug, email) as { id: number } | undefined;
      revalidatePublicLists();
      return { success: true, id: created?.id };
    }

    if (scope.kind === 'care') {
      if (!isAdministrativeCareSlug(scope.slug)) return { success: false, error: 'Invalid category.' };
      if (!name || !email) return { success: false, error: 'Name and email are required.' };
      const responses = collectResponseFields(values);
      responses.requester_name = name;
      responses.requester_email = email;
      responses.requester_phone = phone;
      if (id) {
        await db.prepare(
          'UPDATE administrative_care_submissions SET name = ?, email = ?, phone = ?, responses = ? WHERE id = ? AND category_slug = ?'
        ).run(name, email, phone || null, JSON.stringify(responses), id, scope.slug);
        revalidatePublicLists();
        return { success: true, id };
      }
      const createdAt = new Date().toISOString();
      await db.prepare(
        'INSERT INTO administrative_care_submissions (category_slug, name, email, phone, responses, language, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(scope.slug, name, email, phone || null, JSON.stringify(responses), 'en', createdAt);
      const created = await db.prepare(
        'SELECT id FROM administrative_care_submissions WHERE category_slug = ? AND email = ? ORDER BY id DESC LIMIT 1'
      ).get(scope.slug, email) as { id: number } | undefined;
      revalidatePublicLists();
      return { success: true, id: created?.id };
    }

    if (scope.kind === 'contact') {
      const message = (values.message || '').trim();
      if (!name || !email || !message) return { success: false, error: 'Name, email, and message are required.' };
      if (id) {
        await db.prepare(
          'UPDATE contact_submissions SET name = ?, email = ?, phone = ?, message = ? WHERE id = ?'
        ).run(name, email, phone || null, message, id);
        revalidatePublicLists();
        return { success: true, id };
      }
      const createdAt = new Date().toISOString();
      await db.prepare(
        'INSERT INTO contact_submissions (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(name, email, phone || null, message, createdAt);
      const created = await db.prepare(
        'SELECT id FROM contact_submissions WHERE email = ? ORDER BY id DESC LIMIT 1'
      ).get(email) as { id: number } | undefined;
      revalidatePublicLists();
      return { success: true, id: created?.id };
    }

    if (scope.kind === 'gift') {
      if (!name || !email || !phone) return { success: false, error: 'Name, email, and phone are required.' };
      if (id) {
        await db.prepare(
          'UPDATE leads SET name = ?, email = ?, phone = ? WHERE id = ?'
        ).run(name, email, phone, id);
        revalidatePublicLists();
        return { success: true, id };
      }
      const createdAt = new Date().toISOString();
      await db.prepare(
        'INSERT INTO leads (name, email, phone, created_at) VALUES (?, ?, ?, ?)'
      ).run(name, email, phone, createdAt);
      const created = await db.prepare(
        'SELECT id FROM leads WHERE email = ? ORDER BY id DESC LIMIT 1'
      ).get(email) as { id: number } | undefined;
      revalidatePublicLists();
      return { success: true, id: created?.id };
    }

    const requestText = (values.request_text || '').trim();
    if (!requestText) return { success: false, error: 'Prayer request text is required.' };
    const anonymous = values.is_anonymous === 'yes' || values.is_anonymous === '1' ? 1 : 0;
    const requesterName = (values.requester_name || '').trim() || null;
    if (id) {
      await db.prepare(
        'UPDATE prayer_requests SET requester_name = ?, request_text = ?, is_anonymous = ? WHERE id = ?'
      ).run(requesterName, requestText, anonymous, id);
      revalidatePublicLists();
      return { success: true, id };
    }
    const createdAt = new Date().toISOString();
    await db.prepare(
      'INSERT INTO prayer_requests (requester_name, request_text, is_anonymous, created_at) VALUES (?, ?, ?, ?)'
    ).run(requesterName, requestText, anonymous, createdAt);
    const created = await db.prepare(
      'SELECT id FROM prayer_requests ORDER BY id DESC LIMIT 1'
    ).get() as { id: number } | undefined;
    revalidatePublicLists();
    return { success: true, id: created?.id };
  } catch (error: any) {
    console.error('Error saving registrant:', error);
    return { success: false, error: error.message || 'Could not save the entry.' };
  }
}

export async function deleteRegistrant(
  scope: RegistrantScope,
  id: number
): Promise<{ success: boolean; error?: string }> {
  const access = await requireAccess(scope);
  if (!access.ok) return { success: false, error: access.error };

  try {
    if (scope.kind === 'event') {
      await db.prepare('DELETE FROM registrations WHERE id = ? AND event_id = ?').run(id, scope.eventId);
    } else if (scope.kind === 'ministry') {
      await db.prepare('DELETE FROM ministry_signups WHERE id = ? AND ministry_slug = ?').run(id, scope.slug);
    } else if (scope.kind === 'care') {
      await db.prepare('DELETE FROM administrative_care_submissions WHERE id = ? AND category_slug = ?').run(id, scope.slug);
    } else if (scope.kind === 'contact') {
      await db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(id);
    } else if (scope.kind === 'gift') {
      await db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    } else {
      await db.prepare('DELETE FROM prayer_requests WHERE id = ?').run(id);
    }
    revalidatePublicLists();
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting registrant:', error);
    return { success: false, error: error.message || 'Could not delete the entry.' };
  }
}

export async function exportRegistrantsSpreadsheet(
  scope: RegistrantScope,
  language: 'en' | 'fr_ht' = 'en'
): Promise<{ success: boolean; data?: string; filename?: string; mimeType?: string; error?: string }> {
  const list = await listRegistrants(scope, language);
  if (!list.success || !list.columns || !list.rows) {
    return { success: false, error: list.error || 'Could not export the list.' };
  }

  try {
    const settings = await getSettings();
    const headers = list.columns.map((column) => column.label);
    const rows = list.rows.map((row) => list.columns!.map((column) => row.values[column.key] || ''));
    const sheetTitle = list.title || 'Registrations';
    const buffer = await buildAdminSpreadsheet({
      sheetTitle,
      headers,
      rows,
      logoUrl: settings.logo_url,
      sheetName: 'List',
    });
    const slug = scope.kind === 'event'
      ? `event-${scope.eventId}`
      : scope.kind === 'ministry' || scope.kind === 'care'
        ? scope.slug
        : scope.kind === 'gift'
          ? 'free-devotional'
          : scope.kind;
    return {
      success: true,
      data: buffer.toString('base64'),
      filename: `${slug}-registrations.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  } catch (error: any) {
    console.error('Error exporting registrant spreadsheet:', error);
    return { success: false, error: error.message || 'Could not export the spreadsheet.' };
  }
}
