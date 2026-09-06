import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:3101', viewport: { width: 390, height: 844 }, hasTouch: true },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'yarn dev --port 3101', url: 'http://127.0.0.1:3101', reuseExistingServer: !process.env.CI },
});
