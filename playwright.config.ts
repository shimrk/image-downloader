import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'npm run serve:test-pages',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
