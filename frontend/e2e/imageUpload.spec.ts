import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('TipTap Cloudinary Image Upload', () => {

  test('user can upload an image and it instantly embeds into the editor', async ({ page }) => {
    // 1. Mock the Cloudinary API so we don't actually hit it during tests
    await page.route('https://api.cloudinary.com/v1_1/**/image/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secure_url: 'https://res.cloudinary.com/mock-cloud/image/upload/v123/fake_image.jpg'
        })
      });
    });

    // 2. Login with seeded user
    await page.goto('/login');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 3. Wait for dashboard and focus the TipTap editor
    await page.waitForSelector('[contenteditable="true"]');
    
    // 4. Create a fake "test.png" file in memory to upload
    const fakeImageBuffer = Buffer.from('fake-image-data', 'utf-8');
    
    // 5. Tell Playwright what file to set when the hidden <input type="file"> triggers
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // We target the image button inside the MenuBar via its lucide-image icon.
    await page.locator('button:has(svg.lucide-image)').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: fakeImageBuffer,
    });

    // 6. Verify the image appears in the editor
    const imageLocator = page.locator('[contenteditable="true"] img[src="https://res.cloudinary.com/mock-cloud/image/upload/v123/fake_image.jpg"]');
    await expect(imageLocator).toBeVisible();

    // 7. Type some text around it
    await page.locator('[contenteditable="true"]').click();
    await page.keyboard.type(' Look at this amazing picture!');

    // 8. Save the entry
    await page.click('button:has-text("Save Entry")');

    // 9. Verify the entry appears on the dashboard timeline with the image inside it
    await expect(page.locator('.text-zinc-300 img')).toBeVisible();
    await expect(page.locator('text=Look at this amazing picture!')).toBeVisible();
  });

});
