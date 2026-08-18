export function parseEventImages(imagesJson?: string | null): string[] {
  if (!imagesJson) return [];

  try {
    const parsed = JSON.parse(imagesJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((url): url is string => typeof url === 'string' && url.length > 0);
  } catch {
    return [];
  }
}

export function serializeEventImages(images: string[]): string {
  return JSON.stringify(images.filter(Boolean));
}
