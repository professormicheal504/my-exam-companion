import { test, expect } from '@playwright/test';

test.describe('Classroom Questions - Ads and Pagination', () => {
  test('should load exactly 5 questions per page and inject 2 premium ads', async ({ page }) => {
    // Navigate to the questions page (assuming local server runs on port 3000)
    await page.goto('http://localhost:3000/modules/study/classroom/classroom_questions.html?exam_id=nigeria/jamb&subject=english_language');

    // Wait for questions container to render
    await expect(page.locator('#questionsContainer .card').first()).toBeVisible({ timeout: 15000 });

    // Verify exactly 5 questions are loaded on Page 1 (standard pagination)
    const questionsCount = await page.locator('#questionsContainer .card').count();
    expect(questionsCount).toBe(5);

    // Verify Premium Ads are injected after question 2 and question 4
    const adWrappers = page.locator('.ad-container-premium');
    await expect(adWrappers).toHaveCount(2);

    // Verify the ad slots have the correct data-zones
    const firstAdSlot = adWrappers.nth(0).locator('.mec-ad-slot');
    await expect(firstAdSlot).toHaveAttribute('data-zone', 'multitag_300x250');
    
    const secondAdSlot = adWrappers.nth(1).locator('.mec-ad-slot');
    await expect(secondAdSlot).toHaveAttribute('data-zone', 'multitag_300x250_2');
    
    // Verify ads lazily render as they enter viewport (testing the layout structure)
    await adWrappers.nth(0).scrollIntoViewIfNeeded();
    await expect(adWrappers.nth(0)).toBeVisible();
    
    await adWrappers.nth(1).scrollIntoViewIfNeeded();
    await expect(adWrappers.nth(1)).toBeVisible();
    
    // Ensure pagination bar exists and we are on page 1
    const activePageBtn = page.locator('#paginationBar .pg-btn.active');
    await expect(activePageBtn).toHaveText('1');
  });
});
