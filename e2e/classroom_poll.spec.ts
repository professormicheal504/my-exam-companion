import { test, expect } from '@playwright/test';

test.describe('Classroom Polling', () => {
  test('should allow a user to vote and see updated counts', async ({ page }) => {
    // Navigate to a classroom discussion page in poll mode
    // Using a dummy exam_id, subject, year, and question key
    await page.goto('/modules/study/classroom/classroom_discussion.html?exam_id=nigeria%2Fjamb&subject=english_language&year=2023&q=1&mode=poll');

    // Wait for the poll options to be visible
    await page.waitForSelector('.poll-option');

    // Get the first poll option
    const firstOption = page.locator('.poll-option').first();
    
    // Check initial state (should not be voted)
    await expect(firstOption).not.toHaveClass(/voted/);

    // Click the first option
    await firstOption.click();

    // Confirm the vote in the modal
    const confirmBtn = page.locator('#pollModalConfirm');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // The option should now be marked as 'my-vote'
    await expect(firstOption).toHaveClass(/my-vote/);

    // Wait a moment for the refetch to complete and verify the text
    // The pctLabel should show at least 1 vote
    await expect(firstOption.locator('.poll-percent')).toContainText(/vote/i);
    
    // Refresh the page to ensure it's persistent
    await page.reload();

    // Wait for the poll options to be visible again
    await page.waitForSelector('.poll-option');

    // The option should still be marked as 'my-vote' because it's stored in localStorage
    // and fetched from the API correctly.
    const firstOptionReloaded = page.locator('.poll-option').first();
    await expect(firstOptionReloaded).toHaveClass(/my-vote/);
  });
});
