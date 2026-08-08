import fs from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';
import { db } from './db';
import { getAssetDir } from './paths';
import { loadSiteImage, type SiteImageData } from './site-image';

const BUNDLED_LOGO_PATH = '/parousia-logo.png';

async function getLogoUrlFromSettings(): Promise<string | undefined> {
  try {
    const row = await db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get('logo_url') as { value: string } | undefined;
    return row?.value || undefined;
  } catch {
    return undefined;
  }
}

function findNewestLogoInAssetDir(): SiteImageData | null {
  const assetDir = getAssetDir();
  if (!fs.existsSync(assetDir)) return null;

  const logoFiles = fs
    .readdirSync(assetDir)
    .filter((filename) => /^logo_/i.test(filename) && /\.(png|jpe?g)$/i.test(filename))
    .map((filename) => {
      const filePath = path.join(assetDir, filename);
      return { filename, mtime: fs.statSync(filePath).mtimeMs, filePath };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (!logoFiles.length) return null;

  const ext = path.extname(logoFiles[0].filePath).toLowerCase();
  const bytes = fs.readFileSync(logoFiles[0].filePath);
  if (ext === '.png') return { bytes, format: 'png' };
  if (ext === '.jpg' || ext === '.jpeg') return { bytes, format: 'jpg' };
  return null;
}

async function tryLoadLogoCandidate(candidate: string, origin?: string): Promise<SiteImageData | null> {
  const local = await loadSiteImage(candidate);
  if (local) return local;

  if (origin && candidate.startsWith('/')) {
    return loadSiteImage(`${origin}${candidate}`);
  }

  return null;
}

/** Resolve church logo bytes for PDF generation and other server output. */
export async function resolveChurchLogo(request?: NextRequest): Promise<SiteImageData | null> {
  const settingsLogoUrl = await getLogoUrlFromSettings();
  const origin = request?.nextUrl.origin;

  const candidates = [
    settingsLogoUrl,
    BUNDLED_LOGO_PATH,
    '/apple-icon.png',
    '/icon.png',
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);

  for (const candidate of candidates) {
    const image = await tryLoadLogoCandidate(candidate, origin);
    if (image) return image;
  }

  return findNewestLogoInAssetDir();
}
