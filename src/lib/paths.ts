import path from 'path';

/** Root directory for uploads and backups on the container filesystem. */
export function getDataDir(): string {
  return process.env.DATA_DIR || process.cwd();
}

export function getAssetDir(): string {
  return process.env.ASSETS_DIR || path.join(getDataDir(), 'assets');
}

export function getBackupDir(): string {
  return process.env.BACKUP_DIR || path.join(getDataDir(), 'backups');
}
