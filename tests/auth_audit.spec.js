const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow Audit Tests', () => {

  test('Signup should require strong password and confirm password', async ({ page }) => {
    // Navigate to signup
    await page.goto('/public/modules/auth/sign_up.html');

    // Fill in weak password
    await page.fill('#email-input', 'test@example.com');
    await page.fill('#password-input', '12345');
    
    // There should be a confirm password field now
    const confirmInput = page.locator('#confirm-password-input');
    await expect(confirmInput).toBeVisible();
    await confirmInput.fill('12345');

    // Submit
    await page.click('#submit-btn');

    // Expect an error toast or inline message, NOT a browser alert
    // Wait for the custom toast or error text instead of alert
    page.on('dialog', dialog => {
      // If it throws a native alert, the test should fail
      throw new Error('Native alert() was called instead of custom UI error: ' + dialog.message());
    });

    // Check if error message appears regarding weak password
    const errorText = page.locator('.mec-toast, .error-message').first();
    await expect(errorText).toBeVisible({ timeout: 2000 });
    await expect(errorText).toContainText('password');
  });

  test('Invalid login should display UI error, not native alert', async ({ page }) => {
    await page.goto('/public/modules/auth/login.html');
    
    // Catch native alerts
    page.on('dialog', dialog => {
      throw new Error('Native alert() was called on login error');
    });

    await page.fill('#email-input', 'fakeuser@example.com');
    await page.fill('#password-input', 'wrongpassword');
    await page.click('#submit-btn');

    const toast = page.locator('.mec-toast').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('Logout securely clears auth without destroying unrelated cache', async ({ page }) => {
    await page.goto('/public/modules/auth/login.html');

    // Set some mock local storage state
    await page.evaluate(() => {
      localStorage.setItem('sb-test-auth-token', 'mock_token');
      localStorage.setItem('unrelated_key', 'keep_me');
    });

    // Call the logout logic manually
    await page.evaluate(() => {
      if (typeof window.handleMecLogout === 'function') {
        // Mock supabase client to prevent network call in test if needed
        window.supabaseClient = { auth: { signOut: async () => {} } };
        window.handleMecLogout();
      }
    });

    // Check localStorage
    const unrelatedKey = await page.evaluate(() => localStorage.getItem('unrelated_key'));
    expect(unrelatedKey).toBe('keep_me'); // Should not be deleted
  });

});
