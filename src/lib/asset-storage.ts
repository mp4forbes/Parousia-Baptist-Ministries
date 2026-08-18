import fs from 'fs';
import path from 'path';
import { getAssetDir } from './paths';

export const FREE_GIFT_FILE_SETTING_KEYS = [
  'free_gift_file_url',
  'free_gift_file_url_english',
  'free_gift_file_url_french',
  'free_gift_file_url_kreyol',
] as const;

export function assetFileExists(assetUrl: string): boolean {
  if (!assetUrl || !assetUrl.startsWith('/api/assets/')) {
    return true;
  }

  try {
    const filename = decodeURIComponent(assetUrl.replace('/api/assets/', '').split('?')[0]);
    const assetDir = getAssetDir();
    const filePath = path.join(assetDir, filename);
    const relative = path.relative(assetDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return false;
    }
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}
