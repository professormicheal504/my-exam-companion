import { test, expect } from '@playwright/test';

// Note: Ensure your local server is running (e.g., via VS Code Live Server) on this port before running the tests.
const BASE_URL = 'http://127.0.0.1:5500/public/modules';

test('Auto-save and resume algorithm perfectly syncs state', async ({ page }) => {
  // 1. Navigate to the dashboard
  await page.goto(`${BASE_URL}/index.html`);
  
  // Assuming the user navigates to an exam setup and starts it
  // We'll jump directly to the player for this specific exam
  await page.goto(`${BASE_URL}/cbt_test/core/cbt_player.html?exam_id=nigeria/jamb`);
  
  // Ensure the exam started (start overlay is hidden)
  await expect(page.locator('#start-screen-overlay')).toBeHidden({ timeout: 10000 });
  
  // 2. The Input (Simulate User Actions)
  // Wait for questions to load and click Option A on Question 1
  const optionA = page.locator('button#opt-0');
  await expect(optionA).toBeVisible();
  await optionA.click();
  
  // Flag the question
  const flagBtn = page.locator('button#flag-btn');
  await flagBtn.click();
  
  // Wait a moment for the interval to tick and save state
  await page.waitForTimeout(1500);

  // 3. Verify LocalStorage is accurately tracking data
  const savedState = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('cbt_active_state'));
  });
  
  // Validate that the math checks out (Input = Output)
  expect(savedState).not.toBeNull();
  expect(savedState.answers[0]).toBe(0); // Option A (index 0) was saved
  expect(savedState.flags.length).toBe(1); // Flag was saved
  expect(savedState.currentQ).toBe(0);

  // 4. Simulate a Browser Crash or Accidental Exit
  await page.reload(); 

  // 5. The Output (Verify Resume State)
  // Ensure the exam is automatically resumed (start screen should immediately be hidden)
  await expect(page.locator('#start-screen-overlay')).toBeHidden();
  
  // Verify Option A is STILL visually selected
  await expect(optionA).toHaveClass(/selected/);
  
  // Verify the flag button is STILL active
  await expect(flagBtn).toHaveClass(/flagged/);

  // 6. Test the Dashboard Banner Navigation
  await page.goto(`${BASE_URL}/index.html`);
  
  // The Yellow Resume banner MUST be visible because the exam wasn't submitted
  const resumeBanner = page.locator('#resume-banner-container');
  await expect(resumeBanner).toBeVisible();
  
  // Handle the browser confirm dialog automatically BEFORE clicking discard
  page.once('dialog', dialog => dialog.accept());
  
  // Click "Discard" and ensure it deletes the state
  await page.locator('button#btn-discard-exam').click();
  
  // Verify banner is hidden
  await expect(resumeBanner).toBeHidden();
  
  // Verify localStorage is completely wiped of the exam state
  const finalState = await page.evaluate(() => localStorage.getItem('cbt_active_state'));
  expect(finalState).toBeNull();
});
