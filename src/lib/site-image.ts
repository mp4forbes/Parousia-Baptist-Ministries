import fs from 'fs';
import path from 'path';
import { getAssetDir } from './paths';

export type SiteImageData = {
  bytes: Uint8Array;
  format: 'png' | 'jpg';
};

function detectImageFormat(bytes: Uint8Array, sourceUrl: string): 'png' | 'jpg' | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  const lower = sourceUrl.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg';
  return null;
}

function readImageFile(filePath: string): SiteImageData | null {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') {
    return { bytes: fs.readFileSync(filePath), format: 'png' };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return { bytes: fs.readFileSync(filePath), format: 'jpg' };
  }
  return null;
}

function parseDataImageUrl(sourceUrl: string): SiteImageData | null {
  const match = sourceUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  const format = match[1].toLowerCase().startsWith('png') ? 'png' : 'jpg';
  const bytes = Uint8Array.from(Buffer.from(match[2], 'base64'));
  return { bytes, format };
}

/** Load a PNG/JPEG from a site-relative asset path or remote URL. */
export async function loadSiteImage(sourceUrl: string | undefined): Promise<SiteImageData | null> {
  if (!sourceUrl) return null;

  try {
    if (sourceUrl.startsWith('data:image/')) {
      return parseDataImageUrl(sourceUrl);
    }

    if (sourceUrl.startsWith('/api/assets/')) {
      const filename = decodeURIComponent(sourceUrl.replace('/api/assets/', '').split('?')[0]);
      const filePath = path.join(getAssetDir(), filename);
      if (fs.existsSync(filePath)) {
        return readImageFile(filePath);
      }
      return null;
    }

    if (sourceUrl.startsWith('/')) {
      const publicPath = path.join(process.cwd(), 'public', sourceUrl.replace(/^\//, ''));
      if (fs.existsSync(publicPath)) {
        return readImageFile(publicPath);
      }

      const appIconName =
        sourceUrl === '/icon.png'
          ? 'icon.png'
          : sourceUrl === '/apple-icon.png'
            ? 'apple-icon.png'
            : null;
      if (appIconName) {
        const appIconPath = path.join(process.cwd(), 'src', 'app', appIconName);
        if (fs.existsSync(appIconPath)) {
          return readImageFile(appIconPath);
        }
      }

      return null;
    }

    if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
      const response = await fetch(sourceUrl, { cache: 'no-store' });
      if (!response.ok) return null;
      const bytes = new Uint8Array(await response.arrayBuffer());
      const format = detectImageFormat(bytes, sourceUrl);
      return format ? { bytes, format } : null;
    }

    return null;
  } catch (error) {
    console.error('Failed to load site image:', error);
    return null;
  }
}
