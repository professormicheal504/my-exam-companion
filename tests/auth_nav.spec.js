const { test, expect } = require('@playwright/test');

test.describe('Auth Guard Navigation', () => {
  test('Clicking Tutor should not redirect to login when authenticated via Supabase', async ({ page }) => {
    // Navigate to a page with the sidebar
    await page.goto('http://127.0.0.1:5500/public/modules/index.html');
    
    // Inject mock Supabase token into localStorage to simulate active session
    await page.evaluate(() => {
      localStorage.setItem('sb-alwplfsqzrijxqujrpyu-auth-token', JSON.stringify({
        access_token: 'fake_token',
        user: { id: '123', email: 'test@example.com' }
      }));
    });
    
    // Reload to apply token
    await page.reload();

    // Click on the Exam Studio flyout anchor
    await page.locator('.mec-sb-item[data-flyout="exam_studio"]').click();
    
    // Wait for flyout to render
    await page.waitForSelector('.mec-flyout-item');
    
    // Find the Tutor link and click it
    await page.locator('a.mec-flyout-item:has-text("Tutor")').click();
    
    // It should navigate to teacher_entry.html, NOT login.html
    await page.waitForURL('**/exam_hub/tutor/teacher_entry.html');
    
    // Assert the URL is correct
    const currentUrl = page.url();
    expect(currentUrl).toContain('teacher_entry.html');
    expect(currentUrl).not.toContain('login.html');
  });
});
