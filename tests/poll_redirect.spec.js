import { test, expect } from '@playwright/test';

test('poll vote should redirect to explanation view', async ({ page }) => {
  // Mock the poll submission API
  await page.route('/api/poll', async route => {
    await route.fulfill({ status: 200, json: { success: true } });
  });

  // Navigate to the poll page
  const url = 'http://localhost:5000/modules/study/classroom/classroom_discussion.html?exam_id=nigeria/jamb&subject=english_language&year=2024&q=2024_q1&mode=poll';
  await page.goto(url);

  // Wait for the poll options to be visible
  await page.waitForSelector('.poll-option', { state: 'visible', timeout: 10000 });

  // Click the first poll option
  await page.click('.poll-option');

  // Wait for the custom confirm modal to appear
  await page.waitForSelector('#pollModalConfirm', { state: 'visible', timeout: 5000 });

  // Mock the localStorage to bypass any previous votes
  await page.evaluate(() => localStorage.clear());

  // Click the confirm button
  await page.click('#pollModalConfirm');

  // Wait for navigation or URL change
  await page.waitForURL(url => !url.href.includes('mode=poll'), { timeout: 10000 });

  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Assertions
  expect(finalUrl).not.toContain('mode=poll');
  expect(finalUrl).toContain('locked_answer=');
});
