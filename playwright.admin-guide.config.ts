import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.ADMIN_GUIDE_BASE_URL || 'https://ParousiaBaptistChurch.org';
const authFile = process.env.ADMIN_GUIDE_AUTH_STATE || 'scripts/.auth/admin-storage-state.json';

export default defineConfig({
  testDir: './scripts/admin-guide-screenshots',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    screenshot: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'public',
      testMatch: /public\.spec\.ts/,
    },
    {
      name: 'authenticated',
      testMatch: /capture\.spec\.ts/,
      use: {
        storageState: authFile,
      },
    },
  ],
});
