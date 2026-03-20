import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Trash Flow', () => {

  test('user can delete an entry and restore it from trash', async ({ page }) => {
    // 1. Register a fresh user
    const uniqueEmail = `trash_tester_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[id="name"]', 'Trash Tester');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'secret123');
    await page.fill('input[id="password_confirmation"]', 'secret123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. Write a journal entry for today
    await page.click('text="Write Today"');
    await expect(page).toHaveURL(/.*\/entry\/.*/);
    await page.click('button:has-text("🙂")');
    await page.click('.ProseMirror');
    await page.keyboard.type('This entry will be trashed and restored.');
    await page.click('button:has-text("Save Entry")');
    await expect(page).toHaveURL('/');

    // 3. Open the entry and delete it
    const today = format(new Date(), 'yyyy-MM-dd');
    await page.goto(`/entry/${today}`);
    // Click the delete button in the header
    await page.click('button:has-text("Delete")');
    // Confirm deletion in the modal
    await page.click('button:has-text("Delete Entry")');

    // 4. Should be redirected to dashboard and entry should be gone
    await expect(page).toHaveURL('/');

    // 5. Navigate to Trash page
    await page.click('a[href="/trash"]');
    await expect(page).toHaveURL('/trash');

    // 6. The trashed entry should appear
    await expect(page.locator('body')).toContainText(format(new Date(), 'MMMM'));

    // 7. Restore it
    await page.click('button:has-text("Restore")');

    // 8. After restoring, the trash should be empty
    await expect(page.locator('body')).toContainText('Trash is empty');

    // 9. Verify it's back on the dashboard
    await page.goto('/');
    await expect(page.locator('body')).toContainText('trashed and restored');
  });

});
