import { test, expect } from '@playwright/test';

test.describe('Broken Images test page', () => {
  test('should surface broken image scenarios deterministically', async ({
    page,
  }) => {
    // Mock CORS test image to respond with 500
    await page.route('**/assets/images/cors-test.svg', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'image/svg+xml',
        body: '<svg/>',
      });
    });

    // Explicitly mock missing assets to 404 (some static servers may 200 fallback)
    await page.route('**/assets/images/missing-1.png', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found',
      });
    });
    await page.route('**/assets/images/missing-3.png', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found',
      });
    });

    // レース回避: ナビゲーションとレスポンス待機を同時に開始
    const [_, resp404, resp500, bg404] = await Promise.all([
      page.goto('/cases/broken-images.html'),
      page.waitForResponse(r =>
        /\/assets\/images\/missing-1\.png$/.test(r.url())
      ),
      page.waitForResponse(r =>
        /\/assets\/images\/cors-test\.svg$/.test(r.url())
      ),
      page.waitForResponse(r =>
        /\/assets\/images\/missing-3\.png$/.test(r.url())
      ),
    ]);
    expect(resp404.status()).toBe(404);
    expect(resp500.status()).toBe(500);
    expect(bg404.status()).toBe(404);

    // Truncated data URL should yield naturalWidth === 0
    const truncated = page
      .locator(
        'section[data-testid="broken-images"] img[alt="truncated-data-url"]'
      )
      .first();
    await expect(truncated).toBeVisible();
    await expect
      .poll(async () => {
        return truncated.evaluate(el => (el as HTMLImageElement).naturalWidth);
      })
      .toBe(0);

    // Background-image 404 は上の並列待機で検証済み
  });
});
