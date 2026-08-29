import { test, expect, Page } from '@playwright/test';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE = 'https://myexamcompanion.pages.dev';
const MOCK_URL = `${BASE}/modules/cbt_test/core/cbt_player.html?mode=mock&subjects=english_language%2Cchemistry%2Cmathematics%2Cphysics`;
const JAMB_URL = `${BASE}/modules/cbt_test/core/cbt_player.html?exam_id=nigeria%2Fjamb&subjects=mathematics&year=2020&data_source=ng%2Fexams%2Funiversity_entrance%2Fjamb%2Findex.json`;
const R2_HOST = 'pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

const LOAD_TIMEOUT = 75_000;

// Helper: wait for start button to become enabled (questions loaded)
async function waitForExamReady(page: Page) {
  await expect(page.locator('#btn-start-now')).toBeEnabled({ timeout: LOAD_TIMEOUT });
}

// Helper: click Start and wait for first option to appear
async function startExam(page: Page) {
  await page.locator('#btn-start-now').click();
  await expect(page.locator('.option-btn').first()).toBeVisible({ timeout: 15_000 });
}

// ── MOCK EXAM — network-level tests (don't rely on console logs) ─────────────

test.describe('Mock Exam — R2 question loading', () => {

  test('BUG-01: No sat_math R2 requests made in mock mode', async ({ page }) => {
    const r2Requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) r2Requests.push(req.url());
    });

    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    const satMath = r2Requests.filter(u => u.includes('sat_math'));
    expect(satMath, `sat_math should never be fetched. Got: ${satMath.join(', ')}`).toHaveLength(0);
  });

  test('BUG-02: R2 requests made for all 4 correct subjects', async ({ page }) => {
    const r2Requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) r2Requests.push(req.url());
    });

    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    for (const subj of ['english_language', 'chemistry', 'mathematics', 'physics']) {
      const found = r2Requests.some(u => u.includes(`jamb/${subj}/`));
      expect(found, `R2 request for subject "${subj}" should exist`).toBe(true);
    }
  });

  test('BUG-03: At least one successful R2 response for each subject', async ({ page }) => {
    const successBySubject: Record<string, boolean> = {};
    page.on('response', async res => {
      if (res.url().includes(R2_HOST) && res.ok()) {
        for (const subj of ['english_language', 'chemistry', 'mathematics', 'physics']) {
          if (res.url().includes(`jamb/${subj}/`)) successBySubject[subj] = true;
        }
      }
    });

    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    for (const subj of ['english_language', 'chemistry', 'mathematics', 'physics']) {
      expect(successBySubject[subj], `Subject "${subj}" should have at least 1 successful R2 fetch`).toBe(true);
    }
  });

  test('BUG-04: Start button becomes enabled — questions assembled correctly', async ({ page }) => {
    await page.goto(MOCK_URL);
    await expect(page.locator('#btn-start-now')).toBeEnabled({ timeout: LOAD_TIMEOUT });
    // Button text should update from "Please wait..." to "Start Exam"
    await expect(page.locator('#btn-start-now')).not.toContainText('Please wait', { timeout: 5000 });
  });

  test('BUG-05: Preloader status shows "loaded and ready"', async ({ page }) => {
    await page.goto(MOCK_URL);
    await expect(page.locator('#preloader-status')).toContainText(/loaded and ready/i, { timeout: LOAD_TIMEOUT });
  });

  test('BUG-06: Preloader count shows at least 100 questions loaded', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    const countText = await page.locator('#preloader-count').textContent();
    const count = parseInt(countText || '0', 10);
    expect(count, 'Should have at least 100 questions for 4 subjects').toBeGreaterThanOrEqual(100);
  });

  test('BUG-07: Preloader details mention exam info (not "Preparing exam resources...")', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    const details = await page.locator('#preloader-exam-details').textContent();
    expect(details).not.toContain('Preparing exam resources');
    expect(details!.length).toBeGreaterThan(5);
  });

  test('BUG-08: R2 requests use JAMB path — not SAT or other exam paths', async ({ page }) => {
    const r2Requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) r2Requests.push(req.url());
    });

    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    const wrongPath = r2Requests.filter(u => u.includes('/sat/') || u.includes('/waec/') || u.includes('/neco/'));
    expect(wrongPath, `Non-JAMB paths should not be fetched. Got: ${wrongPath.join(', ')}`).toHaveLength(0);

    const jambPaths = r2Requests.filter(u => u.includes('jamb'));
    expect(jambPaths.length).toBeGreaterThan(0);
  });

});

// ── EXAM PLAYER INTERACTION TESTS ────────────────────────────────────────────

test.describe('CBT Player — core interactions', () => {

  test('BUG-09: Subject tabs render for all 4 subjects after starting', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const tabs = page.locator('.subject-tab');
    await expect(tabs).toHaveCount(4, { timeout: 10_000 });
  });

  test('BUG-10: Option buttons visible after starting exam', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const count = await page.locator('.option-btn').count();
    expect(count, 'Should have at least 4 options per question').toBeGreaterThanOrEqual(4);
  });

  test('BUG-11: Question text is not empty', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    // Look for whatever element renders the question text
    const qEl = page.locator('#question-text, .question-text, [id*="q-text"], .q-body p').first();
    await expect(qEl).toBeVisible({ timeout: 5000 });
    const text = await qEl.textContent();
    expect((text || '').trim().length).toBeGreaterThan(3);
  });

  test('BUG-12: Selecting an option marks it .selected', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const firstOption = page.locator('.option-btn').first();
    await firstOption.click();
    await expect(firstOption).toHaveClass(/selected/);
  });

  test('BUG-13: Next button advances question number', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    // Grab any element that shows current question number
    const qNumEl = page.locator('#question-number, .q-num, [id*="q-num"], [class*="q-num"]').first();
    const before = await qNumEl.textContent().catch(() => null);

    await page.locator('#btn-next, button:has-text("Next")').first().click();
    await page.waitForTimeout(400);

    const after = await qNumEl.textContent().catch(() => null);
    if (before !== null && after !== null) {
      expect(after).not.toBe(before);
    }
  });

  test('BUG-14: Timer is visible and ticking', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const timerEl = page.locator('#timer, .timer, [id*="timer"]').first();
    await expect(timerEl).toBeVisible();

    const t1 = await timerEl.textContent();
    await page.waitForTimeout(2500);
    const t2 = await timerEl.textContent();
    expect(t1).not.toBe(t2);
  });

  test('BUG-15: Flag button adds .flag class to q-cell', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const flagBtn = page.locator('#btn-flag, button:has-text("Flag"), [aria-label*="flag" i]').first();
    if (await flagBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flagBtn.click();
      await expect(page.locator('.q-cell.flag').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('BUG-16: Answering a question then advancing marks q-cell as .ans', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    await page.locator('.option-btn').first().click();
    await page.locator('#btn-next, button:has-text("Next")').first().click();
    await page.waitForTimeout(400);

    // Open nav drawer if needed
    const drawerBtn = page.locator('#btn-open-nav, .btn-open-nav').first();
    if (await drawerBtn.isVisible({ timeout: 2000 }).catch(() => false)) await drawerBtn.click();

    await expect(page.locator('.q-cell.ans').first()).toBeVisible({ timeout: 5000 });
  });

  test('BUG-17: Submit button triggers result/confirmation screen', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const submitBtn = page.locator('#btn-submit, button:has-text("Submit"), button:has-text("Finish")').first();
    await submitBtn.click();

    const confirmBtn = page.locator('button:has-text("Yes"), button:has-text("Submit Exam"), button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) await confirmBtn.click();

    await expect(
      page.locator('.result-screen, #result-screen, .modal-overlay.visible, [id*="result"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('BUG-18: Dark mode toggle switches data-theme', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    const themeBtn = page.locator('.theme-btn, #btn-theme, button[aria-label*="theme" i], button[aria-label*="dark" i]').first();
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await themeBtn.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(before).not.toBe(after);
  });

  test('BUG-19: Previous button is disabled on question 1', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const prevBtn = page.locator('#btn-prev, button:has-text("Prev"), button:has-text("Previous")').first();
    if (await prevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(prevBtn).toBeDisabled();
    }
  });

  test('BUG-20: Back button is accessible on player screen', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const backBtn = page.locator('.back-btn, #btn-back, a:has-text("Back"), button[aria-label*="back" i]').first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
  });

  test('BUG-21: Page title is not empty', async ({ page }) => {
    await page.goto(MOCK_URL);
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('BUG-22: No JS errors thrown during normal exam start', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    // Filter out network errors for missing year files (expected 404s) and third-party noise
    const criticalErrors = jsErrors.filter(e =>
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('Load failed')
    );
    expect(criticalErrors, `Unexpected JS errors: ${criticalErrors.join('\n')}`).toHaveLength(0);
  });

  test('BUG-23: R2 year randomness — multiple different years fetched', async ({ page }) => {
    const years = new Set<string>();
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) {
        const m = req.url().match(/\/(\d{4})\.json$/);
        if (m) years.add(m[1]);
      }
    });

    await page.goto(MOCK_URL);
    await waitForExamReady(page);

    expect(years.size, `Questions should come from multiple years. Got: ${[...years].join(', ')}`).toBeGreaterThanOrEqual(2);
  });

  test('BUG-24: Empty subjects param shows error — not infinite spinner', async ({ page }) => {
    await page.goto(`${BASE}/modules/cbt_test/core/cbt_player.html?mode=mock`);

    // After 30s the preloader should show an error, not still be loading normally
    await expect(
      page.locator('#preloader-status, text=/error/i, text=/failed/i, text=/could not/i')
    ).toBeVisible({ timeout: 30_000 });
  });

  test('BUG-25: Switching subject tab changes displayed questions', async ({ page }) => {
    await page.goto(MOCK_URL);
    await waitForExamReady(page);
    await startExam(page);

    const tabs = page.locator('.subject-tab');
    if (await tabs.count() < 2) { test.skip(); return; }

    const qEl = page.locator('#question-text, .question-text, [id*="q-text"], .q-body p').first();
    const text1 = await qEl.textContent();
    await tabs.nth(1).click();
    await page.waitForTimeout(400);
    const text2 = await qEl.textContent();
    expect(text1).not.toBe(text2);
  });

});

// ── JAMB REGULAR EXAM REGRESSION ─────────────────────────────────────────────

test.describe('Regular JAMB exam — regression after subjects param fix', () => {

  test('BUG-26: Regular JAMB exam still loads (subjects param fix did not break it)', async ({ page }) => {
    await page.goto(JAMB_URL);
    await waitForExamReady(page);
    await expect(page.locator('#btn-start-now')).toBeEnabled();
  });

  test('BUG-27: Regular JAMB uses correct R2 path — no sat_math fallback', async ({ page }) => {
    const r2Urls: string[] = [];
    page.on('request', req => {
      if (req.url().includes(R2_HOST)) r2Urls.push(req.url());
    });

    await page.goto(JAMB_URL);
    await waitForExamReady(page);

    const satMath = r2Urls.filter(u => u.includes('sat_math'));
    expect(satMath, 'No sat_math URLs in JAMB mode').toHaveLength(0);

    const jamb = r2Urls.filter(u => u.includes('jamb'));
    expect(jamb.length, 'JAMB R2 URLs should be fetched').toBeGreaterThan(0);
  });

});
