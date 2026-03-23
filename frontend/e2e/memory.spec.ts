import { test, expect } from '@playwright/test';

test.describe('On This Day Feature', () => {

  test('user sees an amazing memory from exactly one year ago', async ({ page, request }) => {
    // 1. Register a fresh user
    const uniqueEmail = `memory_tester_${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[id="name"]', 'Memory Tester');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'secret123');
    await page.fill('input[id="password_confirmation"]', 'secret123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. Wait for dashboard to load, then grab the auth token from localStorage
    await page.waitForSelector('text=Dashboard');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // 3. Calculate exactly 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split('T')[0];
    
    // Pick the "okay" mood (id 3 usually) or fetch moods to be safe
    // We'll just assume id 3 exists based on our seeders
    const moodId = 3; 

    // 4. Create an entry in the past via direct API call (bypassing the UI restrictions)
    const res = await request.post('http://localhost:8000/api/v1/entries', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      data: {
        entry_date: dateStr,
        mood_id: moodId,
        content: '<p>A beautiful nostalgic memory from exactly 1 year ago!</p>'
      }
    });
    
    expect(res.status()).toBe(201);

    // 5. Reload the dashboard so it fetches the new memory
    await page.reload();

    // 6. Verify the On This Day card appears
    const memoryCard = page.locator('div').filter({ hasText: 'On this day' }).first();
    await expect(memoryCard).toBeVisible();
    await expect(memoryCard.locator('text=1 memory')).toBeVisible();
    
    // We should see "1 year ago" since the math aligns
    await expect(memoryCard.locator('text=1 year ago').first()).toBeVisible();

    // 7. Click to expand the memory body
    await memoryCard.locator('button', { hasText: '1 year ago' }).first().click();

    // 8. Verify the content is visible
    await expect(memoryCard.locator('text=A beautiful nostalgic memory')).toBeVisible();
  });

});
