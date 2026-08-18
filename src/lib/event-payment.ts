import type { EventRecord } from './db/types';

export type RegistrationPaymentStatus = 'paid' | 'not_paid';

export function isEventPaymentRequired(
  event: (Partial<EventRecord> & { event_payment_required?: number | boolean | null }) | null | undefined
): boolean {
  if (!event) return false;
  const flag = event.payment_required ?? event.event_payment_required;
  if (flag === 1 || flag === true) return true;
  return String(flag) === '1';
}

export function formatRegistrationPaymentStatus(
  status: string | null | undefined,
  paymentRequired: boolean
): string {
  if (!paymentRequired) return 'N/A';
  return status === 'paid' ? 'Paid' : 'Not Paid';
}

export function getEventPaymentInstructions(
  event: Partial<EventRecord>,
  language: 'en' | 'fr_ht'
): string {
  const custom =
    language === 'fr_ht'
      ? event.payment_instructions_kreyol?.trim()
      : event.payment_instructions_english?.trim();
  return custom || '';
}
