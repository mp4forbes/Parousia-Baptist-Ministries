export const GALLERY_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;
export const GALLERY_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const GALLERY_MAX_BYTES = 15 * 1024 * 1024;
export const GALLERY_MAX_BATCH = 24;
export const GALLERY_EVENT_TAG_MAX = 160;
export const GALLERY_CAPTION_MAX = 500;

export function normalizeEventTag(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** A photo matches when the filter text appears inside its event tag. */
export function eventTagMatches(eventTag: string, query: string): boolean {
  const needle = normalizeEventTag(query).toLocaleLowerCase();
  if (!needle) return true;
  return normalizeEventTag(eventTag).toLocaleLowerCase().includes(needle);
}

export function isGalleryImageFile(file: { name: string; type: string; size?: number }): boolean {
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  if ((GALLERY_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return true;
  return (GALLERY_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
}
