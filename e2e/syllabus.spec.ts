import { test, expect, Page } from '@playwright/test';

const BASE = 'https://myexamcompanion.pages.dev';
const R2_HOST = 'pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
const LOAD_TIMEOUT = 30_000;

async function waitForSyllabusContent(page: Page) {
  await expect(page.locator('#syllabus-text-container')).not.toContainText(
    /Loading|Failed to load|Preparing/i,
    { timeout: LOAD_TIMEOUT }
  );
}

test.describe('Syllabus page — R2 loading (regression: /syallabus/ typo)', () => {

  test('BUG-S01: No 4xx/5xx responses for R2 syllabus requests', async ({ page }) => {
    const badResponses: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes(R2_HOST) && res.status() >= 400) {
        badResponses.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await waitForSyllabusContent(page);

    expect(
      badResponses,
      `Expected zero 4xx/5xx R2 responses. Got:\n${badResponses
        .map(r => `  ${r.status} ${r.url}`)
        .join('\n')}`
    ).toHaveLength(0);
  });

  test('BUG-S02: R2 requests use /syllabus/ path — no /syallabus/ (typo)', async ({ page }) => {
    const r2Requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) r2Requests.push(req.url());
    });

    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await waitForSyllabusContent(page);

    const typoRequests = r2Requests.filter(u => u.includes('/syallabus/'));
    expect(
      typoRequests,
      `No requests should target misspelled /syallabus/. Got: ${typoRequests.join(', ')}`
    ).toHaveLength(0);

    const syllabusRequests = r2Requests.filter(u => u.includes('/syllabus/') || u.includes('syllabus_global_index'));
    expect(syllabusRequests.length, 'Should fetch syllabus data from R2').toBeGreaterThan(0);
  });

  test('BUG-S03: Syllabus text renders (not stuck on Loading)', async ({ page }) => {
    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await waitForSyllabusContent(page);

    const text = (await page.locator('#syllabus-text-container').textContent()) || '';
    expect(text.trim().length, 'Syllabus container should have meaningful content').toBeGreaterThan(20);
    expect(text, 'Should not show error message').not.toMatch(/Failed to load/i);
  });

  test('BUG-S04: Subject tabs render in side list after exam loads', async ({ page }) => {
    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await expect(page.locator('#subj-list-desktop .qs-item').first()).toBeVisible({
      timeout: LOAD_TIMEOUT,
    });
    const count = await page.locator('#subj-list-desktop .qs-item').count();
    expect(count, 'Should list at least one subject').toBeGreaterThan(0);
  });

  test('BUG-S05: Switching subject reloads content with successful R2 response', async ({ page }) => {
    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await expect(page.locator('#subj-list-desktop .qs-item').first()).toBeVisible({
      timeout: LOAD_TIMEOUT,
    });

    const items = page.locator('#subj-list-desktop .qs-item');
    const itemCount = await items.count();
    test.skip(itemCount < 2, 'Need at least 2 subjects to switch');

    const badAfterSwitch: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes(R2_HOST) && res.status() >= 400) {
        badAfterSwitch.push({ url: res.url(), status: res.status() });
      }
    });

    await items.nth(1).click();
    await waitForSyllabusContent(page);

    expect(
      badAfterSwitch,
      `Subject switch should not produce 4xx/5xx. Got: ${badAfterSwitch
        .map(r => `${r.status} ${r.url}`)
        .join(', ')}`
    ).toHaveLength(0);
  });

  test('BUG-S06: Switching exam tab reloads data successfully', async ({ page }) => {
    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await expect(page.locator('#exam-tabs .tab').first()).toBeVisible({ timeout: LOAD_TIMEOUT });

    const tabs = page.locator('#exam-tabs .tab');
    const tabCount = await tabs.count();
    test.skip(tabCount < 2, 'Need at least 2 exam tabs to switch');

    const badAfterSwitch: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes(R2_HOST) && res.status() >= 400) {
        badAfterSwitch.push({ url: res.url(), status: res.status() });
      }
    });

    await tabs.nth(1).click();
    await waitForSyllabusContent(page);

    expect(
      badAfterSwitch,
      `Exam tab switch should not produce 4xx/5xx. Got: ${badAfterSwitch
        .map(r => `${r.status} ${r.url}`)
        .join(', ')}`
    ).toHaveLength(0);
  });

  test('BUG-S07: Page title reflects exam (SSR-injected by /syllabus/[[path]] function)', async ({ page }) => {
    await page.goto(`${BASE}/syllabus/ng/jamb`);
    const title = await page.title();
    expect(title, 'Title should mention JAMB').toMatch(/JAMB/i);
  });

  test('BUG-S08: No JS errors thrown during normal syllabus load', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(`${BASE}/syllabus/ng/jamb`);
    await waitForSyllabusContent(page);

    const criticalErrors = jsErrors.filter(
      e => !e.includes('Failed to fetch') && !e.includes('NetworkError') && !e.includes('Load failed')
    );
    expect(criticalErrors, `Unexpected JS errors: ${criticalErrors.join('\n')}`).toHaveLength(0);
  });

});
