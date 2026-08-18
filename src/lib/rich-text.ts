function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Normalize pasted Google Docs / Word text into readable markdown-like lines. */
export function normalizeRichText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([.!?])\s+\*\s+\*\*/g, '$1\n\n* **')
    .replace(/([.!?])\s+-\s+\*\*/g, '$1\n\n- **')
    .replace(/([.!?])\s+\*\s+(?=[A-Za-zÀ-ÿ])/g, '$1\n\n* ')
    .replace(/([.!?])\s+-\s+(?=[A-Za-zÀ-ÿ])/g, '$1\n\n- ')
    .replace(/\s+\*\s+\*\*/g, '\n* **')
    .replace(/\s+-\s+\*\*/g, '\n- **')
    .trim();
}

function formatInline(escaped: string): string {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

function isListLine(line: string): boolean {
  return /^([\*\-•]|\d+\.)\s+/.test(line.trim());
}

function stripListMarker(line: string): string {
  return line.trim().replace(/^([\*\-•]|\d+\.)\s+/, '');
}

/** Convert lightweight markdown to safe HTML for event/blog descriptions. */
export function richTextToHtml(text: string): string {
  if (!text.trim()) return '';

  const normalized = normalizeRichText(text);
  const blocks = normalized.split(/\n\n+/).filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return '';

      if (lines.every(isListLine)) {
        const items = lines
          .map((line) => `<li>${formatInline(escapeHtml(stripListMarker(line)))}</li>`)
          .join('');
        return `<ul class="list-disc pl-5 space-y-1.5 my-3">${items}</ul>`;
      }

      const paragraph = lines
        .map((line) => formatInline(escapeHtml(isListLine(line) ? stripListMarker(line) : line)))
        .join('<br />');
      return `<p class="mb-3 last:mb-0">${paragraph}</p>`;
    })
    .join('');
}

export function googleMapsUrl(address: string): string {
  const query = address.trim();
  if (!query) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
