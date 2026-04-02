import { test, expect } from '@playwright/test';

test.describe('Journal Cover Photo Deletion', () => {

  test.beforeEach(async ({ page }) => {
    // Handle alerts automatically
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  });

  test('user can remove a cover photo and it persists as null in the database', async ({ page }) => {
    const testDate = '2026-04-02';
    const mockImageUrl = 'https://res.cloudinary.com/mock-cloud/image/upload/v456/existing_cover.jpg';

    // 1. Mock Login & Initial Entry Data
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com' })
      });
    });

    await page.route(`/api/entries/${testDate}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 101,
            title: 'Existing Entry',
            content: '<p>Some content</p>',
            mood: { id: 3, label: 'Neutral', value: 3 },
            tags: [],
            cover_image_url: mockImageUrl,
            cover_image_caption: 'Old Caption',
            entry_date: testDate
          })
        });
      } else if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() || '{}');
        // CRITICAL CHECK: cover_image_url should be null in the payload
        if (payload.cover_image_url === null) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...payload, id: 101, entry_date: testDate, mood: { id: 3 } })
          });
        } else {
          console.error('FAIL: cover_image_url was NOT null in PATCH payload', payload);
          await route.fulfill({ status: 500 });
        }
      }
    });

    await page.route('/api/moods', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 3, label: 'Neutral', value: 3, emoji: '😐' }])
      });
    });

    await page.route('/api/tags', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    // 2. Go to Entry Page
    await page.goto(`/entry/${testDate}`);
    await expect(page.getByPlaceholder('Title of your entry…')).toHaveValue('Existing Entry');

    // 3. Verify Polaroid is there
    const polaroid = page.locator('img[alt="Cover Photo"]');
    await expect(polaroid).toBeVisible();

    // 4. Hover and Click Remove (X)
    // The button has title="Remove Photo"
    await polaroid.hover();
    const removeBtn = page.locator('button[title="Remove Photo"]');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // 5. Verify Polaroid is gone (replaced by "Insert a photo" button)
    await expect(polaroid).not.toBeVisible();
    await expect(page.locator('text=Insert a photo of today')).toBeVisible();

    // 6. Click Save Entry
    await page.click('button:has-text("Save Entry")');

    // 7. Verify we redirected to dashboard (or at least out of the entry page)
    await expect(page).toHaveURL('/');
  });

});
