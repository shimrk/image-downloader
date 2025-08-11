import { test, expect } from '@playwright/test';

test.describe('Large Gallery test page', () => {
  test('should render 600 visual items (img + background-image)', async ({
    page,
  }) => {
    await page.goto('/cases/large-gallery.html');
    const gallery = page.locator('#gallery');
    await expect(gallery).toBeVisible();

    // Count images and background-image placeholders
    const imgCount = await page.locator('#gallery img').count();
    const bgCount = await page
      .locator('#gallery [data-kind="background-image"]')
      .count();

    // There are 600 items total, with every 6th item a background-image div
    // So background-image count should be 100 and image elements should be 500
    expect(bgCount).toBe(100);
    expect(imgCount).toBe(500);
    expect(imgCount + bgCount).toBe(600);

    // Ensure <picture> usage exists
    await expect(page.locator('#gallery picture img').first()).toBeVisible();
  });
});
