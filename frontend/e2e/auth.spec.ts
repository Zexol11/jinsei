import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('user can register and see dashboard', async ({ page }) => {
    // 1. Give our automated user a unique random email every time so it never clashes
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    // 2. Playwright navigates to the register page
    await page.goto('/register');

    // 3. Playwright types into the inputs
    await page.fill('input[id="name"]', 'Automated Tester');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'secret123');
    await page.fill('input[id="password_confirmation"]', 'secret123');

    // 4. Playwright clicks the Register button
    await page.click('button[type="submit"]');

    // 5. Playwright waits to see if it was successfully redirected to the dashboard!
    await expect(page).toHaveURL('/');
    
    // 6. Playwright checks if the header loads indicating we are truly logged in
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

});
