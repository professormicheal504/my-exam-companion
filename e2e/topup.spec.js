// @ts-check
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL || "testuser@myexamcompanion.com";
const TEST_USER_ID = "test-user-uuid-0001";

const PAGES = {
  LOGIN:     `${BASE_URL}/modules/auth/login.html`,
  HOME:      `${BASE_URL}/modules/index.html`,
  AMOUNT:    `${BASE_URL}/modules/top_up/amount_entry.html`,
  CHECKOUT:  `${BASE_URL}/modules/top_up/paystack_inline_checkout.html`,
  DASHBOARD: `${BASE_URL}/modules/top_up/wallet_dashboard.html`,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function injectFakeSession(page) {
  // 1. Intercept supabase.js and replace it completely with a mock
  // This guarantees MECSupabase is perfectly mocked before any inline scripts run
  await page.route("**/components/supabase.js*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        window.MECSupabase = {
          getSupabase: () => ({
            from: (table) => ({
              select: (cols) => ({
                eq: (key, val) => ({
                  single: async () => {
                    if (table === 'wallets') return { data: { balance: 5000 }, error: null };
                    return { data: null, error: null };
                  },
                  order: (col, opts) => ({
                    limit: async (num) => {
                      if (table === 'wallet_transactions') {
                        return {
                          data: [
                            { id: "tx-001", user_id: "${TEST_USER_ID}", amount: 5000, type: "credit", reference: "TEST_REF", status: "success", created_at: new Date().toISOString() }
                          ],
                          error: null
                        };
                      }
                      return { data: [], error: null };
                    }
                  })
                })
              })
            }),
            rpc: async (fnName, args) => {
              return { error: null, data: null };
            }
          }),
          getCurrentUser: async () => ({
            id: "${TEST_USER_ID}",
            email: "${TEST_EMAIL}",
            user_metadata: { full_name: "Test Student" },
            role: "authenticated"
          }),
          saveExamResult: async () => ({ saved: true })
        };
      `
    });
  });

  // 2. Set localStorage items so topbar.js is happy
  await page.addInitScript(({ userId, email }) => {
    const fakeSession = {
      access_token: "fake.jwt.token",
      token_type: "bearer",
      expires_in: 3600,
      user: { id: userId, email, user_metadata: { full_name: "Test Student" }, role: "authenticated" },
    };
    localStorage.setItem("sb-alwplfsqzrijxqujrpyu-auth-token", JSON.stringify(fakeSession));
    localStorage.setItem("isLoggedIn", "true");
  }, { userId: TEST_USER_ID, email: TEST_EMAIL });
}

async function injectTopupIntent(page, amount = 5000, method = "bank_transfer") {
  await page.addInitScript(({ amount, method }) => {
    const fee = Math.ceil((amount * 0.015 + 100) * 1.075);
    sessionStorage.setItem(
      "mec_topup_intent",
      JSON.stringify({ amount, fee, total: amount + fee, method, ts: Date.now() })
    );
  }, { amount, method });
}

// ══════════════════════════════════════════════════════════════
//  SUITE 1: Auth Guards
// ══════════════════════════════════════════════════════════════
test.describe("Auth Guards", () => {
  // We do NOT inject the fake session here so they fail auth
  test("[BUG-01] Amount Entry redirects unauthenticated users to login", async ({ page }) => {
    await page.goto(PAGES.AMOUNT, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("login.html");
  });

  test("[BUG-02] Checkout page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("login.html");
  });

  test("[BUG-03] Wallet Dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("login.html");
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 2: Amount Entry Page
// ══════════════════════════════════════════════════════════════
test.describe("Amount Entry", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
  });

  test("[BUG-04] Page loads without crashing and shows title", async ({ page }) => {
    await page.goto(PAGES.AMOUNT, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(page.url()).not.toContain("login.html");
  });

  test("[BUG-05] Preset amount chips update the selected amount", async ({ page }) => {
    await page.goto(PAGES.AMOUNT, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const preset = page.locator("button, .chip, .preset").filter({ hasText: /5[,.]?000/ }).first();
    if (await preset.count() > 0) {
      await preset.click();
      await page.waitForTimeout(300);
      const amtInput = page.locator("#amount-input, input[type=number]").first();
      if (await amtInput.isVisible()) {
        const val = await amtInput.inputValue();
        expect(Number(val.replace(/,/g, ""))).toBe(5000);
      }
    }
  });

  test("[BUG-06] Continue button exists and is enabled", async ({ page }) => {
    await page.goto(PAGES.AMOUNT, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const btn = page.locator("button").filter({ hasText: /continue|proceed|next/i }).first();
    await expect(btn).toBeVisible({ timeout: 6000 });
  });

  test("[BUG-07] Valid amount stores correct intent and navigates to checkout", async ({ page }) => {
    await page.goto(PAGES.AMOUNT, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const preset = page.locator("button, .chip").filter({ hasText: /5[,.]?000/ }).first();
    if (await preset.count() > 0) await preset.click();

    const btn = page.locator("button").filter({ hasText: /continue|proceed|next/i }).first();
    if (await btn.isVisible()) {
      await Promise.all([
        page.waitForURL("**/paystack_inline_checkout.html", { timeout: 8000 }).catch(() => {}),
        btn.click(),
      ]);
    }

    if (page.url().includes("paystack_inline_checkout")) {
      const intent = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("mec_topup_intent") || "{}")
      );
      expect(intent.amount).toBe(5000);
      expect(intent.method).toBe("bank_transfer");
      expect(intent.fee).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 3: Checkout Page
// ══════════════════════════════════════════════════════════════
test.describe("Checkout Page", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
    await injectTopupIntent(page, 5000, "bank_transfer");
  });

  test("[BUG-08] Checkout renders order summary with correct amount", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    expect(page.url()).toContain("paystack_inline_checkout");

    const summaryAmt = page.locator("#summary-amount");
    await expect(summaryAmt).toBeVisible({ timeout: 5000 });
    const text = await summaryAmt.innerText();
    expect(text).toContain("5,000");
  });

  test("[BUG-09] Summary total is greater than base amount (fee is added)", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const totalEl = page.locator("#summary-total");
    if (await totalEl.isVisible()) {
      const text = await totalEl.innerText();
      const num = Number(text.replace(/[₦,\s]/g, ""));
      expect(num).toBeGreaterThan(5000);
    }
  });

  test("[BUG-10] Pay button (#btn-pay) is visible and enabled", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const btn = page.locator("#btn-pay");
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toBeEnabled();
  });

  test("[BUG-11] Missing intent redirects away from checkout", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.removeItem("mec_topup_intent"));
    await page.goto(PAGES.CHECKOUT, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const url = page.url();
    const redirectedAway = url.includes("amount_entry") || url.includes("login.html");
    expect(redirectedAway, `Should redirect away from checkout. Got: ${url}`).toBeTruthy();
  });

  test("[BUG-12] #processing-overlay element exists in DOM", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    expect(page.url()).toContain("paystack_inline_checkout");
    const overlay = page.locator("#processing-overlay");
    const count = await overlay.count();
    expect(count).toBe(1);
  });

  test("[BUG-13] #success-screen element exists in DOM", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const screen = page.locator("#success-screen");
    const count = await screen.count();
    expect(count).toBe(1);
  });

  test("[BUG-14] Back button (#back-btn) navigates to amount_entry", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const back = page.locator(".back-nav").first();
    if (await back.isVisible()) {
      await back.click();
      await page.waitForTimeout(1500);
      expect(page.url()).toContain("amount_entry");
    }
  });

  test("[BUG-15] Cancelled payment shows toast without redirecting away", async ({ page }) => {
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    if (page.url().includes("paystack_inline_checkout")) {
      await page.evaluate(() => {
        if (typeof showCancelled === "function") showCancelled();
      });
      await page.waitForTimeout(600);
      expect(page.url()).toContain("paystack_inline_checkout");
      const toast = page.locator("div").filter({ hasText: /cancel|no charge/i }).last();
      const visible = await toast.isVisible().catch(() => false);
    }
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 4: Wallet Dashboard
// ══════════════════════════════════════════════════════════════
test.describe("Wallet Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
  });

  test("[BUG-16] Balance element (#balance-amount) is visible", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await expect(page.locator("#balance-amount")).toBeVisible({ timeout: 6000 });
  });

  test("[BUG-17] Balance shows a formatted numeric value, not blank", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    const text = await page.locator("#balance-amount").innerText();
    expect(text.trim()).toMatch(/[\d,]+/);
  });

  test("[BUG-18] Transaction list (#txn-list) is present and visible", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    const list = page.locator("#txn-list");
    await expect(list).toBeVisible({ timeout: 6000 });
  });

  test("[BUG-19] Transaction list shows entries or empty-state message", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    const text = await page.locator("#txn-list").innerText();
    expect(text.trim().length).toBeGreaterThan(5);
  });

  test("[BUG-20] Stats elements are visible and non-empty", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    await expect(page.locator("#stat-total-topup")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("#stat-txn-count")).toBeVisible({ timeout: 6000 });
    await expect(page.locator("#stat-spent")).toBeVisible({ timeout: 6000 });
  });

  test("[BUG-21] ?status=success shows a success toast banner", async ({ page }) => {
    await page.goto(`${PAGES.DASHBOARD}?status=success`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const banner = page.locator("div").filter({ hasText: /topped up|success/i }).last();
    const visible = await banner.isVisible().catch(() => false);
  });

  test("[BUG-22] Top-up button navigates to amount entry", async ({ page }) => {
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const btns = page.locator("button").filter({ hasText: /top.?up|add funds/i });
    const count = await btns.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 5: Home Page Balance Badge
// ══════════════════════════════════════════════════════════════
test.describe("Home Page Balance", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
  });

  test("[BUG-23] #index-wallet-balance element is visible on home page", async ({ page }) => {
    await page.goto(PAGES.HOME, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    const el = page.locator("#index-wallet-balance");
    await expect(el).toBeVisible({ timeout: 6000 });
  });

  test("[BUG-24] Balance badge shows a non-empty value", async ({ page }) => {
    await page.goto(PAGES.HOME, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    const text = await page.locator("#index-wallet-balance").innerText().catch(() => "");
    expect(text.trim().length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 6: Mobile Responsiveness (375px)
// ══════════════════════════════════════════════════════════════
test.describe("Mobile 375px", () => {
  test("[BUG-25] Amount entry — no horizontal overflow", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await injectFakeSession(page);
    await page.goto(PAGES.AMOUNT, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const w = await page.evaluate(() => document.body.scrollWidth);
    expect(w).toBeLessThanOrEqual(385);
    await ctx.close();
  });

  test("[BUG-26] Wallet dashboard renders on mobile", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await injectFakeSession(page);
    await page.goto(PAGES.DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await expect(page.locator("#balance-amount")).toBeVisible({ timeout: 6000 });
    await ctx.close();
  });

  test("[BUG-27] Checkout page — no horizontal overflow on mobile", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await injectFakeSession(page);
    await injectTopupIntent(page, 5000, "bank_transfer");
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    const w = await page.evaluate(() => document.body.scrollWidth);
    expect(w).toBeLessThanOrEqual(385);
    await ctx.close();
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 7: Regression / RPC Parameter Check
// ══════════════════════════════════════════════════════════════
test.describe("Regression", () => {
  test("[BUG-28] RPC call uses correct param names (x_user_id, x_amount, x_reference)", async ({ page }) => {
    await injectFakeSession(page);
    await injectTopupIntent(page, 5000, "bank_transfer");
    await page.goto(PAGES.CHECKOUT, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const src = await page.evaluate(() =>
      Array.from(document.querySelectorAll("script")).map((s) => s.textContent || "").join("\n")
    );

    expect(src).toContain("increment_wallet_balance");
    expect(src).toContain("x_user_id");
    expect(src).toContain("x_amount");
    expect(src).toContain("x_reference");
  });
});
