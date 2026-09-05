function normalizeSnippet(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'«»“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatQuote(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (/^["'«]/.test(trimmed)) return trimmed;
  return `"${trimmed}"`;
}

export function stripLeadingScriptureBlock(lesson: string): string {
  let rest = lesson.trim();
  if (!rest) return rest;

  rest = rest.replace(/^(Scripture|Écriture)\s*:[^\n]*\n+/i, '');
  rest = rest.replace(/^📖[^\n]*\n+/i, '');
  rest = rest.replace(/^["'«][\s\S]*?["'»]\s*\n+/m, '');

  return rest.trim();
}

export function lessonStartsWithVerse(ref: string, text: string, lesson: string): boolean {
  const head = normalizeSnippet(lesson.slice(0, 280));
  const textSnippet = normalizeSnippet(text).slice(0, 48);
  const refSnippet = normalizeSnippet(ref).slice(0, 12);

  const hasScriptureLabel = /^(scripture|ecriture)\s*:/.test(head);
  const hasRef = refSnippet.length > 3 && head.includes(refSnippet);
  const hasText = textSnippet.length > 12 && head.includes(textSnippet.slice(0, 24));

  return hasScriptureLabel && (hasText || hasRef);
}

export function composeDevotionalBody(
  ref: string,
  text: string,
  lesson: string,
  lang: 'en' | 'fr'
): string {
  const trimmedText = text.trim();
  const interpretation = stripLeadingScriptureBlock(lesson);

  if (!trimmedText) return interpretation;
  if (lessonStartsWithVerse(ref, trimmedText, lesson)) return lesson.trim();

  const label = lang === 'fr' ? 'Écriture' : 'Scripture';
  return `${label}: ${ref}\n${formatQuote(trimmedText)}\n\n${interpretation}`.trim();
}

export function devotionalInterpretation(ref: string, text: string, lesson: string): string {
  if (lessonStartsWithVerse(ref, text, lesson)) {
    return stripLeadingScriptureBlock(lesson);
  }
  return lesson.trim();
}
