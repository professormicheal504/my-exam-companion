const { test, expect } = require('@playwright/test');

test.describe('Leaderboard UI & Logic Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to leaderboard (adjust URL if needed)
    await page.goto('http://127.0.0.1:5500/public/modules/leaderboard/leaderboard.html');
  });

  test('Timeframe default should be Today', async ({ page }) => {
    const period = await page.locator('#filter-period').inputValue();
    expect(period).toBe('today');
  });

  test('Exam Body should dynamically update based on Country', async ({ page }) => {
    // Select US
    await page.locator('#filter-country').selectOption('us');
    const usOptions = await page.locator('#filter-exam-body option').allTextContents();
    expect(usOptions).toContain('SAT');
    expect(usOptions).not.toContain('JAMB');

    // Select NG
    await page.locator('#filter-country').selectOption('ng');
    const ngOptions = await page.locator('#filter-exam-body option').allTextContents();
    expect(ngOptions).toContain('JAMB');
    expect(ngOptions).not.toContain('SAT');
  });

  test('Title description updates based on country', async ({ page }) => {
    await page.locator('#filter-country').selectOption('all');
    await expect(page.locator('.page-desc')).toContainText('worldwide');

    await page.locator('#filter-country').selectOption('ng');
    await expect(page.locator('.page-desc')).toContainText('nationwide');
  });

  test('USA option exists and updates filters correctly', async ({ page }) => {
    // Select US
    await page.locator('#filter-country').selectOption('us');
    
    // Check if the dropdown value is correctly "us"
    const selectedCountry = await page.locator('#filter-country').inputValue();
    expect(selectedCountry).toBe('us');
    
    // Check if exam body contains SAT
    const usOptions = await page.locator('#filter-exam-body option').allTextContents();
    expect(usOptions).toContain('SAT');
  });
});
