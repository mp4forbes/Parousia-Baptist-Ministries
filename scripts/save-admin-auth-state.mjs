import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.ADMIN_GUIDE_BASE_URL || 'https://ParousiaBaptistChurch.org';
const authDir = path.join(process.cwd(), 'scripts/.auth');
const authFile = path.join(authDir, 'admin-storage-state.json');

fs.mkdirSync(authDir, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

console.log(`\n1. Log in at ${baseURL}/admin`);
console.log('2. Complete OTP if prompted');
console.log('3. Wait until you land on /admin/dashboard');
console.log('4. Press Enter here to save the session...\n');

await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });

await new Promise((resolve) => {
  process.stdin.once('data', resolve);
});

await context.storageState({ path: authFile });
console.log(`Saved auth state to ${authFile}`);

await browser.close();
