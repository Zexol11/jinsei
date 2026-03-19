import { test, expect } from '@playwright/test';

test.describe('Journal Entry Flow', () => {

  test('user can write and save a daily journal entry', async ({ page }) => {
    // 1. Create a fresh user for this test so we always have a clean slate.
    const uniqueEmail = `journal_tester_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[id="name"]', 'Journal Tester');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'secret123');
    await page.fill('input[id="password_confirmation"]', 'secret123');
    await page.click('button[type="submit"]');

    // 2. Wait for successful redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // 3. Click the "Write Today" button on the dashboard
    await page.click('text="Write Today"');

    // 4. Verify we are on the entry page
    await expect(page).toHaveURL(/.*\/entry\/.*/);

    // 5. Select a mood (e.g., the 'good' emoji 🙂)
    await page.click('button:has-text("🙂")');

    // 6. Type into the rich text editor (TipTap's contenteditable is .ProseMirror)
    await page.click('.ProseMirror');
    await page.keyboard.type('This is an automated journal entry written by Playwright! It feels amazing to be alive inside this Chromium browser.');

    // 7. Click the 'Save Entry' button
    await page.click('button:has-text("Save Entry")');

    // 8. We should be redirected back to the dashboard automatically
    await expect(page).toHaveURL('/');

    // 9. Verify the newly written text appears in the timeline on the dashboard!
    await expect(page.locator('body')).toContainText('automated journal entry written by Playwright');
    
    // 10. Verify the streak updated immediately
    await expect(page.locator('body')).toContainText('1-day streak');
  });

});
