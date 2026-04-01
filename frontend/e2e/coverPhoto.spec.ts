import { test, expect } from '@playwright/test';

test.describe('Journal Cover Photo Upload', () => {

  test.beforeEach(async ({ page }) => {
    // Set mock env vars for the client-side component to bypass "Cloudinary not configured" check
    await page.addInitScript(() => {
      window.process = window.process || { env: {} };
      (window.process.env as any).NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'mock-cloud';
      (window.process.env as any).NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'mock-preset';
    });
    
    // Handle alerts automatically
    page.on('dialog', async dialog => {
      console.log('Dialog appeared:', dialog.message());
      await dialog.dismiss();
    });
    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser Error:', msg.text());
    });
  });

  test('user can upload a cover photo, add a caption, and see it on the dashboard', async ({ page }) => {
    // 1. Mock the Cloudinary API - use a broad regex to catch even malformed URLs
    await page.route(/\/api\.cloudinary\.com\/.*\/image\/upload/, async (route) => {
      console.log('Intercepted Cloudinary upload request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secure_url: 'https://res.cloudinary.com/mock-cloud/image/upload/v456/cover_polaroid.jpg'
        })
      });
    });

    // 1b. Mock the image response itself so Next.js doesn't fail on a real 404
    await page.route('https://res.cloudinary.com/mock-cloud/image/upload/v456/cover_polaroid.jpg', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from('fake-image-binary'),
      });
    });

    // 2. Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 3. Navigate to a new entry for today (or specific date)
    const today = new Date().toISOString().split('T')[0];
    await page.goto(`/entry/${today}`);

    // 4. Fill in basic entry details
    await page.fill('input[placeholder="Title of your entry…"]', 'Test Entry with Cover Photo');
    await page.locator('[contenteditable="true"]').fill('Writing some content for this entry.');

    // 5. Upload Cover Photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Add Cover Photo")');
    const fileChooser = await fileChooserPromise;
    
    await fileChooser.setFiles({
      name: 'cover.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-cover-image'),
    });

    // 6. Verify Polaroid appears and add caption
    const polaroidImg = page.locator('img[src="https://res.cloudinary.com/mock-cloud/image/upload/v456/cover_polaroid.jpg"]');
    await expect(polaroidImg).toBeVisible();
    
    await page.fill('input[placeholder="Add a caption..."]', 'A beautiful sunset memory');

    // 7. Finish/Save Entry
    await page.click('button:has-text("Finish Entry")');
    // Or "Save Entry" if it changes state
    try {
      await page.click('button:has-text("Save Entry")');
    } catch (e) {
      // already clicked finish
    }

    // 8. Redirect to dashboard and verify the cover photo banner exists
    await expect(page).toHaveURL('/');
    
    // Check for the large cover photo container on the dashboard
    const dashboardCover = page.locator('img[alt="Cover Photo"]').first();
    await expect(dashboardCover).toBeVisible();
    await expect(page.locator('text=Test Entry with Cover Photo')).toBeVisible();
    await expect(page.locator('text=A beautiful sunset memory')).toBeVisible();
  });

});
