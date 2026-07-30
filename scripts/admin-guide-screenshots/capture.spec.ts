import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.join(process.cwd(), 'docs/screenshots');

test.beforeAll(() => {
  fs.mkdirSync(outputDir, { recursive: true });
});

async function shot(page: import('@playwright/test').Page, filename: string) {
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
  });
}

async function openDashboardTab(page: import('@playwright/test').Page, label: RegExp) {
  await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(500);
}

test.describe('authenticated admin guide screenshots', () => {
  test('capture authenticated screens', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'networkidle' });
    await expect(page.getByText(/Global Settings|Anviwònman Global/i)).toBeVisible({ timeout: 30_000 });

    await page.goto('/', { waitUntil: 'networkidle' });
    await shot(page, '01-public-nav-gear.png');

    await openDashboardTab(page, /Global Settings|Anviwònman Global/i);
    await shot(page, '04-admin-dashboard-sidebar.png');
    await shot(page, '05-logo-upload.png');
    await shot(page, '06-color-adjuster.png');
    await shot(page, '12-auto-translate-panel.png');

    await openDashboardTab(page, /Configure Home Tabs|Konfigire Paj Akèy/i);
    await shot(page, '07-home-tabs-config.png');

    await openDashboardTab(page, /Ministries|Ministè/i);
    await shot(page, '08-ministries-config.png');

    await openDashboardTab(page, /Daily Devotional|Devosyonèl Chak Jou/i);
    await shot(page, '09-devotional-theme.png');

    await openDashboardTab(page, /Pastor's Blog|Piblikasyon Blòg/i);
    await page.getByRole('button', { name: /Create New Article|Kreye Nouvo Atik/i }).click();
    await page.waitForTimeout(500);
    await shot(page, '10-blog-editor.png');

    await openDashboardTab(page, /Security & Admins|Sekirite & Admins/i);
    await shot(page, '11-security-admins.png');
  });
});
