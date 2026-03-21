import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Tags Flow', () => {

  test('user can add a tag to an entry and filter by it on the dashboard', async ({ page }) => {
    // 1. Register a fresh user
    const uniqueEmail = `tag_tester_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[id="name"]', 'Tag Tester');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'secret123');
    await page.fill('input[id="password_confirmation"]', 'secret123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. Navigate to today's entry
    const today = format(new Date(), 'yyyy-MM-dd');
    await page.goto(`/entry/${today}`);

    // 3. Pick a mood and write an entry
    await page.click('button:has-text("🙂")');
    await page.click('.ProseMirror');
    await page.keyboard.type('A fitness entry with a tag.');

    // 4. Add a tag via the tag input
    await page.fill('input[placeholder="Add tags..."]', 'fitness');
    // Click the "Create #fitness" option in the dropdown
    await page.click('button:has-text("Create")');

    // 5. Verify the tag chip appears in the input
    await expect(page.locator('text="#fitness"')).toBeVisible();

    // 6. Save the entry
    await page.click('button:has-text("Save Entry")');
    await expect(page).toHaveURL('/');

    // 7. The dashboard should show the tag chip on the entry card
    await expect(page.locator('body')).toContainText('#fitness');

    // 8. A tag filter button should appear at the top of the dashboard
    await expect(page.locator('button:has-text("#fitness")')).toBeVisible();

    // 9. Click the tag filter to filter entries
    await page.click('button:has-text("#fitness")');

    // 10. The entry should still be visible (it has the tag)
    await expect(page.locator('body')).toContainText('A fitness entry with a tag.');
  });

});
