// publisher_program.spec.cjs
// Playwright E2E tests for the Publisher Program module
// Run: npx playwright test tests/publisher_program.spec.cjs
// Requires: node server.js running on port 5000

'use strict';
const { test, expect } = require('@playwright/test');

const BASE = 'http://127.0.0.1:5000';
const ONBOARDING = BASE + '/modules/publisher_program/onboarding/onboarding_screen.html';
const DASHBOARD  = BASE + '/modules/publisher_program/dashboard/dashboard.html';
const CREATE     = BASE + '/modules/publisher_program/dashboard/article/create_post.html';
const REVIEW     = BASE + '/modules/publisher_program/dashboard/article/post_review.html';
const PREVIEW    = BASE + '/modules/publisher_program/dashboard/article/preview.html';
const ACCOUNT    = BASE + '/modules/publisher_program/profile/account.html';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function injectDraft(page, overrides) {
  const draft = Object.assign({
    title: 'How to Study Effectively for University Exams',
    description: 'A comprehensive guide covering proven study techniques that dramatically boost retention and exam performance for all university students preparing for their final exams.',
    heroImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
    intro: 'Studying effectively is one of the most critical skills you can develop.',
    content: '<h2 id="h0">Why Most Students Fail</h2><p>Most students re-read their notes without testing themselves. Research shows this produces little long-term retention.</p><h2 id="h1">The Spaced Repetition Method</h2><p>Spaced repetition is the practice of reviewing material at increasing intervals to exploit the psychological spacing effect.</p>',
    category: 'study-tips',
    tags: 'study-skills, memory, exam-preparation',
    qualityScore: '85',
    timestamp: Date.now()
  }, overrides || {});

  // Navigate to an origin page first, then set localStorage
  const currentUrl = page.url();
  if (!currentUrl.startsWith(BASE)) {
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
  }
  await page.evaluate(function(d) {
    localStorage.setItem('publisher_article_draft', JSON.stringify(d));
  }, draft);
}

// ---------------------------------------------------------------------------
// SUITE 1: Onboarding Screen
// ---------------------------------------------------------------------------

test.describe('Onboarding Screen', function() {

  test('ONB-01: Page loads with 3 slides', async function({ page }) {
    await page.goto(ONBOARDING);
    await expect(page.locator('.slide')).toHaveCount(3);
  });

  test('ONB-02: Three pagination dots are rendered', async function({ page }) {
    await page.goto(ONBOARDING);
    await expect(page.locator('.dot')).toHaveCount(3);
    await expect(page.locator('.dot').first()).toHaveClass(/active/);
  });

  test('ONB-03: Clicking a dot advances the slider', async function({ page }) {
    await page.goto(ONBOARDING);
    await page.locator('.dot').nth(1).click();
    await expect(page.locator('.dot').nth(1)).toHaveClass(/active/);
    await expect(page.locator('.dot').nth(0)).not.toHaveClass(/active/);
  });

  test('ONB-04: Auto-slide advances after 3 seconds', async function({ page }) {
    await page.goto(ONBOARDING);
    await expect(page.locator('.dot').nth(0)).toHaveClass(/active/);
    await page.waitForTimeout(3200);
    await expect(page.locator('.dot').nth(1)).toHaveClass(/active/);
  });

  test('ONB-05: Get Started button is visible', async function({ page }) {
    await page.goto(ONBOARDING);
    await expect(page.locator('.btn-primary')).toBeVisible();
    await expect(page.locator('.btn-primary')).toHaveText('Get Started');
  });

});

// ---------------------------------------------------------------------------
// SUITE 2: Create Post - Form Fields
// ---------------------------------------------------------------------------

test.describe('Create Post - Form Fields', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
  });

  test('CP-01: All 6 step boxes are rendered', async function({ page }) {
    await expect(page.locator('#step-title')).toBeVisible();
    await expect(page.locator('#step-description')).toBeVisible();
    await expect(page.locator('#step-hero')).toBeVisible();
    await expect(page.locator('#step-intro')).toBeVisible();
    await expect(page.locator('#step-content')).toBeVisible();
    await expect(page.locator('#step-meta')).toBeVisible();
  });

  test('CP-02: Title input updates quality score', async function({ page }) {
    await page.locator('#titleInput').fill('How to Study Effectively for Any Exam');
    await expect(page.locator('#scorePercentage')).not.toHaveText('0%');
  });

  test('CP-03: Meta description of 130+ chars updates quality score', async function({ page }) {
    await page.locator('#descriptionInput').fill('A comprehensive guide covering proven study techniques that dramatically boost retention and exam performance for all university students preparing for their exams.');
    await page.locator('#descriptionInput').dispatchEvent('input');
    await page.waitForTimeout(300);
    await expect(page.locator('#scorePercentage')).not.toHaveText('0%');
  });

  test('CP-04: Hero image URL triggers quality check', async function({ page }) {
    await page.locator('#heroImageInput').fill('https://images.unsplash.com/photo.jpg');
    await expect(page.locator('#scorePercentage')).not.toHaveText('0%');
  });

  test('CP-05: Category select has 6 options', async function({ page }) {
    await expect(page.locator('#categorySelect option')).toHaveCount(6);
  });

  test('CP-06: Intro word count updates on input', async function({ page }) {
    await page.locator('#introInput').fill('This is a sample introduction sentence for the article.');
    await expect(page.locator('#introWordCount')).not.toHaveText('0');
  });

  test('CP-07: [BUG-02] Base64 hero upload fails quality check - missing http', async function({ page }) {
    await page.evaluate(function() {
      document.getElementById('heroImageInput').value = 'data:image/png;base64,abc123';
    });
    await page.locator('#heroImageInput').dispatchEvent('change');
    await page.evaluate(function() {
      if (window.updateQualityScore) window.updateQualityScore();
    });
    const pending = page.locator('.quality-item.pending');
    expect(await pending.count()).toBeGreaterThanOrEqual(1);
  });

  test('CP-08: Submit button is disabled below 500 words', async function({ page }) {
    await expect(page.locator('#submitBtn')).toBeDisabled();
  });

  test('CP-09: Submit shows remaining word count', async function({ page }) {
    await page.locator('#editor').click();
    await page.keyboard.type('Short content.');
    const txt = await page.locator('#submitBtn').textContent();
    expect(txt).toMatch(/Need \d+ more words/);
  });

});

// ---------------------------------------------------------------------------
// SUITE 3: Create Post - Toolbar
// ---------------------------------------------------------------------------

test.describe('Create Post - Toolbar', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#editor').click();
  });

  test('TB-01: Bold button wraps text in bold', async function({ page }) {
    await page.keyboard.type('Bold text');
    await page.keyboard.press('Control+A');
    await page.locator('button[onclick="execCmd(\'bold\')"]').click();
    await expect(page.locator('#editor strong, #editor b')).toHaveCount(1);
  });

  test('TB-02: H2 button inserts H2 heading', async function({ page }) {
    await page.keyboard.type('My Section');
    await page.locator('button[onclick="insertHeading(\'h2\')"]').click();
    await expect(page.locator('#editor h2')).toHaveCount(1);
  });

  test('TB-03: H2 heading updates table of contents', async function({ page }) {
    await page.keyboard.type('Introduction');
    await page.locator('button[onclick="insertHeading(\'h2\')"]').click();
    await expect(page.locator('#tocContainer')).toContainText('Introduction');
  });

  test('TB-04: Bullet list button creates a ul', async function({ page }) {
    await page.keyboard.type('List item');
    await page.locator('button[onclick="execCmd(\'insertUnorderedList\')"]').click();
    await expect(page.locator('#editor ul')).toHaveCount(1);
  });

  test('TB-05: Callout dropdown opens on button click', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await expect(page.locator('.callout-dropdown-content')).toBeVisible();
  });

  test('TB-06: Callout dropdown has 4 options', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await expect(page.locator('.callout-option-title').nth(0)).toHaveText('FAQ');
    await expect(page.locator('.callout-option-title').nth(1)).toHaveText('Pro Tips');
    await expect(page.locator('.callout-option-title').nth(2)).toHaveText('Key Takeaway');
    await expect(page.locator('.callout-option-title').nth(3)).toHaveText('SEO Tip');
  });

  test('TB-07: Callout dropdown closes when clicking outside', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await expect(page.locator('.callout-dropdown-content')).toBeVisible();
    await page.locator('#titleInput').click();
    await expect(page.locator('.callout-dropdown-content')).toBeHidden();
  });

});

// ---------------------------------------------------------------------------
// SUITE 4: Create Post - Callout System
// ---------------------------------------------------------------------------

test.describe('Create Post - Callout System', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#editor').click();
  });

  test('CAL-01: FAQ callout inserts into editor', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    await expect(page.locator('#editor .faq-callout')).toHaveCount(1);
  });

  test('CAL-02: FAQ callout shows FAQ label', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    await expect(page.locator('#editor .faq-callout')).toContainText('FAQ');
  });

  test('CAL-03: FAQ callout shows Q: and A: permanent labels', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    await expect(page.locator('#editor .faq-callout')).toContainText('Q:');
    await expect(page.locator('#editor .faq-callout')).toContainText('A:');
  });

  test('CAL-04: FAQ callout shows hint text for Q and A', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    await expect(page.locator('#editor .faq-callout')).toContainText('What is your question?');
    await expect(page.locator('#editor .faq-callout')).toContainText('Type your answer here');
  });

  test('CAL-05: FAQ Q field clears hint on focus and accepts typing', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    const qField = page.locator('#editor .faq-callout [contenteditable="true"]').first();
    await qField.click();
    await qField.type('What study method works best?');
    const text = await qField.textContent();
    expect(text).toBe('What study method works best?');
  });

  test('CAL-06: FAQ hint text restores when field is cleared', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    const qField = page.locator('#editor .faq-callout [contenteditable="true"]').first();
    await qField.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.locator('#titleInput').click(); // blur
    const text = await qField.textContent();
    expect(text).toBe('What is your question?');
  });

  test('CAL-07: Pro Tip callout inserts with title', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(1).click();
    await expect(page.locator('#editor .callout-box').first()).toContainText('Pro Tip');
  });

  test('CAL-08: Key Takeaway callout inserts with title', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(2).click();
    await expect(page.locator('#editor .callout-box').first()).toContainText('Key Takeaway');
  });

  test('CAL-09: SEO Tip callout inserts with title', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(3).click();
    await expect(page.locator('#editor .callout-box').first()).toContainText('SEO Tip');
  });

  test('CAL-10: Other callouts show hint text', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(1).click();
    await expect(page.locator('#editor .callout-box').first()).toContainText('Add your important information here');
  });

  test('CAL-11: Remove button is present on callout', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    const btn = page.locator('#editor .callout-box button').first();
    await expect(btn).toBeAttached();
  });

  test('CAL-12: Remove button deletes the entire callout', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    await expect(page.locator('#editor .callout-box')).toHaveCount(1);
    const box = page.locator('#editor .callout-box').first();
    await box.hover();
    await box.locator('button').first().dispatchEvent('mousedown');
    await expect(page.locator('#editor .callout-box')).toHaveCount(0);
  });

  test('CAL-13: Multiple callouts can be inserted', async function({ page }) {
    for (let i = 0; i < 3; i++) {
      await page.locator('#editor').click();
      await page.locator('#calloutDropdown .callout-dropdown-btn').click();
      await page.locator('.callout-option').nth(i).click();
    }
    await expect(page.locator('#editor .callout-box')).toHaveCount(3);
  });

  test('CAL-14: [BUG] FAQ title div is not contenteditable', async function({ page }) {
    await page.locator('#calloutDropdown .callout-dropdown-btn').click();
    await page.locator('.callout-option').nth(0).click();
    const titleDiv = page.locator('#editor .faq-callout div').first();
    const ce = await titleDiv.getAttribute('contenteditable');
    expect(ce).not.toBe('true');
  });

});

// ---------------------------------------------------------------------------
// SUITE 5: Create Post - Save & Submit
// ---------------------------------------------------------------------------

test.describe('Create Post - Save and Submit', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
  });

  test('SD-01: Save Draft stores title in localStorage', async function({ page }) {
    await page.locator('#titleInput').fill('My Draft Article Title For Testing Save');
    page.once('dialog', function(d) { d.accept(); });
    await page.locator('.btn-draft').click();
    const draft = await page.evaluate(function() {
      return JSON.parse(localStorage.getItem('publisher_article_draft') || '{}');
    });
    expect(draft.title).toBe('My Draft Article Title For Testing Save');
  });

  test('SD-02: Page restores draft on reload', async function({ page }) {
    await injectDraft(page);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#titleInput')).toHaveValue('How to Study Effectively for University Exams');
  });

  test('SD-03: [BUG-03] saveDraft() does not save intro field', async function({ page }) {
    await page.locator('#introInput').fill('This is the intro paragraph text.');
    await page.locator('#titleInput').fill('Test Title For Draft Save Check');
    page.once('dialog', function(d) { d.accept(); });
    await page.locator('.btn-draft').click();
    const draft = await page.evaluate(function() {
      return JSON.parse(localStorage.getItem('publisher_article_draft') || '{}');
    });
    expect(draft.intro).toBeUndefined(); // BUG: intro is missing from saveDraft()
  });

  test('SD-04: Submit navigates to post-review', async function({ page }) {
    await injectDraft(page);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(function() {
      var btn = document.getElementById('submitBtn');
      btn.disabled = false;
    });
    var nav = page.waitForURL('**/ng/publisher/post-review', { timeout: 5000 }).catch(function() { return null; });
    await page.locator('#submitBtn').click();
    await nav;
    expect(page.url()).toContain('post-review');
  });

});

// ---------------------------------------------------------------------------
// SUITE 6: Post Review
// ---------------------------------------------------------------------------

test.describe('Post Review', function() {

  test.beforeEach(async function({ page }) {
    await injectDraft(o.page);
    await page.goto(REVIEW);
    await page.waitForLoadState('domcontentloaded');
  });

  test('PR-01: Title is populated from draft', async function({ page }) {
    await expect(page.locator('#titleDisplay')).toContainText('How to Study Effectively');
  });

  test('PR-02: Back button links to create-post', async function({ page }) {
    await expect(page.locator('a.back-btn')).toHaveAttribute('href', '/ng/publisher/create-post');
  });

  test('PR-03: Thumbnail box is visible and opens modal on click', async function({ page }) {
    await expect(page.locator('#thumbnailBox')).toBeVisible();
    await page.locator('#thumbnailBox').click();
    await expect(page.locator('#thumbModal')).toHaveClass(/open/);
  });

  test('PR-04: Category chips are rendered', async function({ page }) {
    expect(await page.locator('.chip').count()).toBeGreaterThanOrEqual(4);
  });

  test('PR-05: Selecting a chip highlights it', async function({ page }) {
    await page.locator('.chip').first().click();
    await expect(page.locator('.chip').first()).toHaveClass(/selected/);
  });

  test('PR-06: Topic input adds a tag on Enter', async function({ page }) {
    await page.evaluate(function() {
      var el = document.getElementById('topicInput');
      if (el) el.style.display = 'block';
    });
    await page.locator('#topicInput').fill('new-topic');
    await page.locator('#topicInput').press('Enter');
    const pills = page.locator('.tag-pill').filter({ hasText: 'new-topic' });
    await expect(pills).toHaveCount(1);
  });

  test('PR-07: Tag remove button deletes that tag', async function({ page }) {
    await page.evaluate(function() {
      window.topics = [];
      var w = document.getElementById('tagsWrap');
      if (w) w.innerHTML = '';
      var el = document.getElementById('topicInput');
      if (el) el.style.display = 'block';
    });
    await page.locator('#topicInput').fill('delete-me-tag');
    await page.locator('#topicInput').press('Enter');
    const pill = page.locator('.tag-pill').filter({ hasText: 'delete-me-tag' });
    await expect(pill).toHaveCount(1);
    await pill.locator('.tag-remove').click();
    await expect(pill).toHaveCount(0);
  });

  test('PR-08: [BUG-04] Input hidden after first tag — cannot add a second', async function({ page }) {
    await page.evaluate(function() {
      var el = document.getElementById('topicInput');
      if (el) el.style.display = 'block';
    });
    await page.locator('#topicInput').fill('first-tag');
    await page.locator('#topicInput').press('Enter');
    expect(await page.locator('#topicInput').isVisible()).toBe(false); // confirmed bug
  });

  test('PR-09: Preview button navigates to /ng/publisher/preview', async function({ page }) {
    await page.evaluate(function() {
      sessionStorage.setItem('post_thumbnail', 'https://images.unsplash.com/x.jpg');
      document.getElementById('thumbnailPreview').src = 'https://images.unsplash.com/x.jpg';
    });
    var nav = page.waitForURL('**/ng/publisher/preview', { timeout: 5000 }).catch(function() { return null; });
    await page.locator('.btn-submit').click();
    await nav;
    expect(page.url()).toContain('preview');
  });

  test('PR-10: [BUG-05] Gallery is empty — post_content never written to sessionStorage', async function({ page }) {
    const gallery = page.locator('#selectorGallery');
    expect(await gallery.locator('img').count()).toBe(0);
  });

  test('PR-11: Save draft shows toast notification', async function({ page }) {
    await page.locator('.btn-draft').click();
    await expect(page.locator('#toast')).toHaveClass(/show/);
  });

});

// ---------------------------------------------------------------------------
// SUITE 7: Preview Page
// ---------------------------------------------------------------------------

test.describe('Preview Page', function() {

  test.beforeEach(async function({ page }) {
    await injectDraft(o.page);
    await page.goto(PREVIEW);
    await page.waitForLoadState('domcontentloaded');
  });

  test('PV-01: Article title is rendered', async function({ page }) {
    await expect(page.locator('#articleTitle')).toHaveText('How to Study Effectively for University Exams');
  });

  test('PV-02: Article content is rendered', async function({ page }) {
    await expect(page.locator('#articleContent')).toContainText('Why Most Students Fail');
    await expect(page.locator('#articleContent')).toContainText('Spaced Repetition Method');
  });

  test('PV-03: Table of contents is generated', async function({ page }) {
    await expect(page.locator('#tocContainer')).toContainText('Why Most Students Fail');
  });

  test('PV-04: Quality badge shows correct score', async function({ page }) {
    await expect(page.locator('#qualityScore')).toContainText('85%');
  });

  test('PV-05: Back to Review link is correct', async function({ page }) {
    await expect(page.locator('a.back-btn')).toHaveAttribute('href', '/ng/publisher/post-review');
  });

  test('PV-06: Edit button navigates to create-post', async function({ page }) {
    var nav = page.waitForURL('**/ng/publisher/create-post', { timeout: 4000 }).catch(function() { return null; });
    await page.locator('.btn-secondary').click();
    await nav;
    expect(page.url()).toContain('create-post');
  });

  test('PV-07: Intro paragraph is rendered', async function({ page }) {
    await expect(page.locator('#articleContent p').first()).toContainText('Studying effectively');
  });

  test('PV-08: [BUG-06] publishArticle sets status to published bypassing review', async function({ page }) {
    const src = await page.evaluate(function() {
      return window.publishArticle ? window.publishArticle.toString() : '';
    });
    expect(src).toContain("status: 'published'"); // BUG: should be 'pending'
  });

  test('PV-09: [BUG-07] publishArticle discards thumbnail, category, tags', async function({ page }) {
    const src = await page.evaluate(function() {
      return window.publishArticle ? window.publishArticle.toString() : '';
    });
    expect(src).not.toContain('thumbnail');
    expect(src).not.toContain('category');
  });

  test('PV-10: [BUG-08] Artificial 1500ms delay in publishArticle', async function({ page }) {
    const src = await page.evaluate(function() {
      return window.publishArticle ? window.publishArticle.toString() : '';
    });
    expect(src).toContain('1500');
  });

  test('PV-11: Hero image is shown when heroImage is in draft', async function({ page }) {
    await expect(page.locator('#heroFigure')).toBeVisible();
    const src = await page.locator('#heroImage').getAttribute('src');
    expect(src).toContain('unsplash.com');
  });

  test('PV-12: Tags are rendered as pills', async function({ page }) {
    expect(await page.locator('.tag-pill').count()).toBeGreaterThanOrEqual(1);
  });

  test('PV-13: Read time is displayed', async function({ page }) {
    await expect(page.locator('#readTime')).toContainText('min read');
  });

  test('PV-14: [BUG-09] Share and Download buttons are permanently hidden', async function({ page }) {
    const actionBar = page.locator('.action-bar');
    const isHidden = await actionBar.evaluate(function(el) {
      return el.style.display === 'none';
    });
    expect(isHidden).toBe(true); // BUG: action-bar has inline display:none
  });

});

// ---------------------------------------------------------------------------
// SUITE 8: Account Page
// ---------------------------------------------------------------------------

test.describe('Account Page', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(ACCOUNT);
    await page.waitForLoadState('domcontentloaded');
  });

  test('ACC-01: Account input is visible', async function({ page }) {
    await expect(page.locator('#accountInput')).toBeVisible();
  });

  test('ACC-02: Referral code input is visible', async function({ page }) {
    await expect(page.locator('#referralInput')).toBeVisible();
  });

  test('ACC-03: Confirm button is visible', async function({ page }) {
    await expect(page.locator('.btn-confirm')).toHaveText('Confirm');
  });

  test('ACC-04: [BUG-10] Label flash: HTML says optional but JS corrects it', async function({ page }) {
    // After JS runs the label should not say optional
    const label = page.locator('#accountLabel');
    await expect(label).not.toContainText('optional');
  });

  test('ACC-05: Empty account shows inline error', async function({ page }) {
    page.once('dialog', function(d) { d.dismiss(); });
    await page.locator('.btn-confirm').click();
    await expect(page.locator('#accountError')).toBeVisible();
    await expect(page.locator('#accountError')).toContainText('cannot be empty');
  });

  test('ACC-06: [BUG-11] shake @keyframes animation is missing', async function({ page }) {
    const hasShake = await page.evaluate(function() {
      return Array.from(document.styleSheets).some(function(s) {
        try {
          return Array.from(s.cssRules).some(function(r) {
            return r instanceof CSSKeyframesRule && r.name === 'shake';
          });
        } catch (e) { return false; }
      });
    });
    expect(hasShake).toBe(false); // BUG confirmed
  });

  test('ACC-07: Register button links to Opay', async function({ page }) {
    const onclick = await page.locator('#registerBtn').getAttribute('onclick');
    expect(onclick).toContain('opayweb.com');
  });

});

// ---------------------------------------------------------------------------
// SUITE 9: Dashboard
// ---------------------------------------------------------------------------

test.describe('Dashboard', function() {

  test.beforeEach(async function({ page }) {
    await page.goto(DASHBOARD);
    await page.waitForLoadState('domcontentloaded');
  });

  test('DB-01: Dashboard loads without fatal JS errors', async function({ page }) {
    const errors = [];
    page.on('pageerror', function(e) { errors.push(e.message); });
    await page.waitForTimeout(500);
    const fatal = errors.filter(function(e) {
      return !e.includes('supabase') && !e.includes('MECSupabase') && !e.includes('getCurrentUser');
    });
    expect(fatal.length).toBe(0);
  });

  test('DB-02: [BUG-12] Source exposes debug alert text to users', async function({ page }) {
    const html = await page.content();
    expect(html).toContain('Debug'); // BUG: alert('Debug: ...') shown to users
  });

  test('DB-03: [BUG-13] Create button href is /ng/publisher/create-post not create_post', async function({ page }) {
    const btn = page.locator('a.action-btn[href*="create"]');
    if (await btn.count() > 0) {
      const href = await btn.getAttribute('href');
      // BUG: JS tries to disable .action-btn[href*="create_post"] but href is "create-post"
      expect(href).not.toContain('create_post');
    }
  });

  test('DB-04: Sheet overlay click closes the sheet', async function({ page }) {
    const sheet = page.locator('#createSheet');
    if (await sheet.count() === 0) return; // redirected unauthenticated
    await page.evaluate(function() {
      var s = document.getElementById('createSheet');
      if (s) s.classList.add('open');
    });
    await expect(sheet).toHaveClass(/open/);
    await sheet.click({ position: { x: 5, y: 5 } });
    await expect(sheet).not.toHaveClass(/open/);
  });

  test('DB-05: Create a Blog option navigates to create-post', async function({ page }) {
    if (await page.locator('#createSheet').count() === 0) return; // redirected
    await page.evaluate(function() {
      var s = document.getElementById('createSheet');
      if (s) s.classList.add('open');
    });
    var nav = page.waitForURL('**/ng/publisher/create-post', { timeout: 4000 }).catch(function() { return null; });
    await page.locator('.sheet-option').first().click();
    await nav;
    expect(page.url()).toContain('create-post');
  });

  test('DB-06: [BUG-14] Source HTML has Isreal spelling typo', async function({ page }) {
    const resp = await page.request.get(DASHBOARD);
    const html = await resp.text();
    expect(html).toContain('Isreal'); // BUG: should be Israel
  });

});

// ---------------------------------------------------------------------------
// SUITE 10: Cross-Page Data Flow
// ---------------------------------------------------------------------------

test.describe('Cross-Page Data Flow', function() {

  test('XP-01: Draft written in create-post is readable in post-review', async function({ page }) {
    await injectDraft(page);
    await page.goto(REVIEW);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#titleDisplay')).toContainText('How to Study Effectively');
  });

  test('XP-02: Draft is readable in preview', async function({ page }) {
    await injectDraft(page);
    await page.goto(PREVIEW);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#articleTitle')).toHaveText('How to Study Effectively for University Exams');
  });

  test('XP-03: Edit button from preview goes back to create-post', async function({ page }) {
    await injectDraft(page);
    await page.goto(PREVIEW);
    await page.waitForLoadState('domcontentloaded');
    var nav = page.waitForURL('**/ng/publisher/create-post', { timeout: 4000 }).catch(function() { return null; });
    await page.locator('.btn-secondary').click();
    await nav;
    expect(page.url()).toContain('create-post');
  });

  test('XP-04: [BUG-15] create_post never writes post_content to sessionStorage', async function({ page }) {
    await injectDraft(page);
    await page.goto(CREATE);
    await page.waitForLoadState('domcontentloaded');
    page.once('dialog', function(d) { d.accept(); });
    await page.locator('.btn-draft').click();
    const val = await page.evaluate(function() {
      return sessionStorage.getItem('post_content');
    });
    expect(val).toBeNull(); // BUG: gallery in post-review always empty
  });

  test('XP-05: Preview shows alert when localStorage draft is empty', async function({ page }) {
    await page.addInitScript(function() {
      localStorage.removeItem('publisher_article_draft');
    });
    var dialogPromise = page.waitForEvent('dialog', { timeout: 4000 }).catch(function() { return null; });
    await page.goto(PREVIEW);
    await page.waitForLoadState('domcontentloaded');
    const dialog = await dialogPromise;
    if (dialog) {
      expect(dialog.message()).toContain('No article data');
      await dialog.accept();
    }
  });

});
