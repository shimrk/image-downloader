import { test, expect } from '@playwright/test';

test.describe('Ads and Content separation', () => {
  test('should distinguish main content images from ad images', async ({
    page,
  }) => {
    await page.goto('/cases/ads-and-content.html');

    const contentImages = page.locator('article[data-section="content"] img');
    await expect(contentImages).toHaveCount(2);

    const contentBg = page.locator(
      'article[data-section="content"] [data-kind="background-image"]'
    );
    await expect(contentBg).toHaveCount(1);

    const adImages = page.locator('img[data-ad="true"][data-testid^="ad-"]');
    await expect(adImages).toHaveCount(3);

    // Sanity check: ensure URLs look correct
    const adSrcs = await adImages.evaluateAll(nodes =>
      nodes.map(n => (n as HTMLImageElement).src)
    );
    for (const src of adSrcs) {
      expect(src).toMatch(/\/assets\/(ads|placeholders)\//);
    }
  });
});
