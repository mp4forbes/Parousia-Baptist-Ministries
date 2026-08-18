import type { EventRecord } from './db/types';
import type { Language } from './translations';

function parseIsoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function eventHasEndDate(event: Pick<EventRecord, 'date' | 'end_date'>): boolean {
  const endDate = event.end_date?.trim();
  if (!endDate) return false;
  return endDate > event.date;
}

export function normalizeEventEndDate(startDate: string, endDate: string): string {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start || !end) return '';
  if (end <= start) return '';
  return end;
}

export function formatEventDateLabel(
  event: Pick<EventRecord, 'date' | 'end_date'>,
  language: Language
): string {
  const start = parseIsoDate(event.date);
  if (!start) return event.date;

  const endValue = normalizeEventEndDate(event.date, event.end_date || '');
  const end = endValue ? parseIsoDate(endValue) : null;

  if (!end) {
    return start.toLocaleDateString(language === 'fr_ht' ? 'fr-CA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const locale = language === 'fr_ht' ? 'fr-CA' : 'en-US';

  if (sameMonth) {
    const monthYear = start.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return `${start.getDate()}–${end.getDate()} ${monthYear}`;
  }

  if (sameYear) {
    const startLabel = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  }

  const startLabel = start.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

export function getEventCalendarEndDay(event: Pick<EventRecord, 'date' | 'end_date'>): string {
  return normalizeEventEndDate(event.date, event.end_date || '') || event.date;
}
