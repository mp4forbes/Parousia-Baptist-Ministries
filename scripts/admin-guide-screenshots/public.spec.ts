import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.join(process.cwd(), 'docs/screenshots');

test.beforeAll(() => {
  fs.mkdirSync(outputDir, { recursive: true });
});

test('admin login step 1', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.join(outputDir, '02-admin-login-step1.png'),
    fullPage: false,
  });
});
