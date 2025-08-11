import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import os from 'os';
import fs from 'fs';

const EXT_DIST_PATH = path.resolve(__dirname, '..', 'dist');

test.describe('Extension basic behaviors', () => {
  test.skip(!process.env.DISPLAY, 'Requires X server (run with xvfb-run)');
  test.beforeAll(() => {
    // Ensure extension is built
    if (!fs.existsSync(EXT_DIST_PATH)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cp = require('child_process');
      cp.execSync('npm run -s build', { stdio: 'inherit' });
    }
  });

  test('content script injects hover button and shows notification on click', async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXT_DIST_PATH}`,
        `--load-extension=${EXT_DIST_PATH}`,
      ],
    });

    try {
      const page = await context.newPage();
      await page.goto('http://localhost:3001/cases/ads-and-content.html');

      const firstContentImg = page
        .locator('article[data-section="content"] img')
        .first();
      await expect(firstContentImg).toBeVisible();

      // Hover to trigger button insertion by content script
      await firstContentImg.hover();
      const dlButton = page.locator('.image-downloader-btn');
      await expect(dlButton).toBeVisible();

      // Click and expect a notification to appear
      await dlButton.click();
      const notification = page.locator('text=ダウンロードを開始しました');
      await expect(notification).toBeVisible();

      // Move mouse away to trigger removal
      await page.mouse.move(0, 0);
      await expect(dlButton).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('content script processes dynamically added images', async () => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXT_DIST_PATH}`,
        `--load-extension=${EXT_DIST_PATH}`,
      ],
    });

    try {
      const page = await context.newPage();
      await page.goto('http://localhost:3001/cases/ads-and-content.html');

      // Dynamically append an image to main content
      await page.evaluate(() => {
        const img = document.createElement('img');
        img.src = '/assets/images/sample-256.svg';
        img.alt = 'dynamic-added';
        const article = document.querySelector(
          'article[data-section="content"]'
        )!;
        article.appendChild(img);
      });

      const dynamicImg = page.getByRole('img', { name: 'dynamic-added' });
      await expect(dynamicImg).toBeVisible();
      await dynamicImg.hover();
      await expect(page.locator('.image-downloader-btn')).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
