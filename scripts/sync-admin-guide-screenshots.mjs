import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.join(process.cwd(), 'docs/screenshots');
const targetDir = path.join(process.cwd(), 'public/admin-guide/screenshots');

fs.mkdirSync(targetDir, { recursive: true });

if (!fs.existsSync(sourceDir)) {
  console.error(`Missing source directory: ${sourceDir}`);
  process.exit(1);
}

const files = fs.readdirSync(sourceDir).filter((file) => /\.(png|jpe?g|webp)$/i.test(file));
if (files.length === 0) {
  console.warn('No screenshot files found to sync.');
  process.exit(0);
}

for (const file of files) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
}

console.log(`Synced ${files.length} screenshot(s) to ${targetDir}`);
