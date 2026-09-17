/**
 * E2E Test Suite: Brochure Edge SSR + Sitemap
 * Tests the /brochure/* clean URL system end-to-end against the live site.
 * Run: node scripts/e2e_brochure_test.mjs
 */

const BASE = 'https://myexamcompanion.pages.dev';
const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const USER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

let passed = 0;
let failed = 0;
const failures = [];

async function fetchPage(url, ua = USER_UA) {
  const res = await fetch(url, {
    headers: { 'User-Agent': ua },
    redirect: 'follow'
  });
  const text = await res.text();
  return { res, text };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  FAIL: ${name}`);
    console.error(`       → ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertContains(text, needle, message) {
  if (!text.includes(needle)) {
    throw new Error(`${message}\n       Expected to find: "${needle}"\n       In text (first 300 chars): "${text.substring(0, 300)}"`);
  }
}

function assertNotContains(text, needle, message) {
  if (text.includes(needle)) {
    throw new Error(`${message}\n       Did NOT expect to find: "${needle}"`);
  }
}

// ── 1. SITEMAP TESTS ─────────────────────────────────────────────────────────
console.log('\n📋  [1] Sitemap Tests');

await test('sitemap.xml references sitemap-brochure-ng.xml', async () => {
  const { res, text } = await fetchPage(`${BASE}/sitemap.xml`);
  assert(res.ok, `HTTP ${res.status}`);
  assertContains(text, 'sitemap-brochure-ng.xml', 'Master sitemap does not list brochure sitemap');
});

await test('sitemap-brochure-ng.xml is accessible', async () => {
  const { res, text } = await fetchPage(`${BASE}/sitemap-brochure-ng.xml`);
  assert(res.ok, `HTTP ${res.status} — sitemap-brochure-ng.xml not found`);
  assertContains(text, '<urlset', 'Not a valid XML sitemap');
  assertContains(text, '/brochure/ng', 'No brochure URLs found in sitemap');
});

await test('sitemap-brochure-ng.xml uses slug URLs (not numeric IDs)', async () => {
  const { text } = await fetchPage(`${BASE}/sitemap-brochure-ng.xml`);
  assertNotContains(text, '/brochure/ng/1</loc>', 'Sitemap still uses raw numeric IDs like /brochure/ng/1');
  assertNotContains(text, '/brochure/ng/2</loc>', 'Sitemap still uses raw numeric IDs like /brochure/ng/2');
  // Check that slugs look like school-name-id
  assert(text.match(/\/brochure\/ng\/[a-z][a-z0-9-]+-\d+<\/loc>/), 'Could not find slug-style URLs (name-id) in sitemap');
});

await test('sitemap-brochure-ng.xml has main list page /brochure/ng', async () => {
  const { text } = await fetchPage(`${BASE}/sitemap-brochure-ng.xml`);
  assertContains(text, `<loc>${BASE}/brochure/ng</loc>`, 'Main /brochure/ng page not in sitemap');
});

await test('sitemap-brochure-ng.xml has 100+ institution URLs', async () => {
  const { text } = await fetchPage(`${BASE}/sitemap-brochure-ng.xml`);
  const matches = text.match(/<loc>/g) || [];
  assert(matches.length > 100, `Only ${matches.length} URLs found in sitemap, expected > 100`);
  console.log(`       ℹ️  Total URLs in sitemap: ${matches.length}`);
});

// ── 2. EDGE FUNCTION — LIST PAGE ─────────────────────────────────────────────
console.log('\n🌍  [2] Edge Function — Institution List Page (/brochure/ng)');

await test('/brochure/ng returns HTTP 200 for regular user', async () => {
  const { res } = await fetchPage(`${BASE}/brochure/ng`);
  assert(res.ok, `Expected 200, got HTTP ${res.status}`);
});

await test('/brochure/ng injects <base href="/"> tag', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`);
  assertContains(text, '<base href="/">', 'Missing <base href="/"> — relative assets will break');
});

await test('/brochure/ng injects correct <title> for Nigeria', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`);
  assertContains(text, 'Nigeria', 'Title does not contain Nigeria');
  assertContains(text, '<title>', 'Missing <title> tag');
});

await test('/brochure/ng injects canonical link', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`);
  assertContains(text, `<link rel="canonical" href="${BASE}/brochure/ng">`, 'Missing canonical link');
});

await test('/brochure/ng injects MEC_BROCHURE_PARAMS with country=ng', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`);
  assertContains(text, 'MEC_BROCHURE_PARAMS', 'Missing MEC_BROCHURE_PARAMS injection');
  assertContains(text, 'country: "ng"', 'MEC_BROCHURE_PARAMS.country is not "ng"');
});

await test('/brochure/ng injects Schema.org ItemList for Googlebot', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`, BOT_UA);
  assertContains(text, '"@type":"ItemList"', 'Missing Schema.org ItemList schema');
  assertContains(text, 'EducationalOrganization', 'Missing institution data in schema');
});

await test('/brochure/ng serves SSR institution list HTML to Googlebot', async () => {
  const { text } = await fetchPage(`${BASE}/brochure/ng`, BOT_UA);
  assertContains(text, 'pre-rendered-content', 'Missing SSR snapshot in bot response');
  assertContains(text, 'edge-ssr-snapshot', 'Missing noscript SSR snapshot');
});

// ── 3. EDGE FUNCTION — INSTITUTION PAGE ─────────────────────────────────────
console.log('\n🏛️   [3] Edge Function — Single Institution Page');

// Get a real slug from the sitemap to test with
let testSlug = '';
let testSlugUrl = '';
try {
  const { text: smText } = await fetchPage(`${BASE}/sitemap-brochure-ng.xml`);
  const match = smText.match(/<loc>https:\/\/myexamcompanion\.pages\.dev\/brochure\/ng\/([a-z][a-z0-9-]+-\d+)<\/loc>/);
  if (match) {
    testSlug = match[1];
    testSlugUrl = `${BASE}/brochure/ng/${testSlug}`;
    console.log(`  ℹ️  Using real slug from sitemap: ${testSlug}`);
  } else {
    testSlugUrl = `${BASE}/brochure/ng/ambrose-alli-university-ekpoma-edo-state-2`;
    testSlug = 'ambrose-alli-university-ekpoma-edo-state-2';
    console.log(`  ⚠️  Could not extract slug from sitemap. Using fallback: ${testSlug}`);
  }
} catch(e) {
  testSlugUrl = `${BASE}/brochure/ng/ambrose-alli-university-ekpoma-edo-state-2`;
  testSlug = 'ambrose-alli-university-ekpoma-edo-state-2';
}

await test(`/${testSlug} returns HTTP 200`, async () => {
  const { res } = await fetchPage(testSlugUrl);
  assert(res.ok, `Expected 200, got HTTP ${res.status} for ${testSlugUrl}`);
});

await test(`/${testSlug} injects <base href="/">`, async () => {
  const { text } = await fetchPage(testSlugUrl);
  assertContains(text, '<base href="/">', 'Missing <base href="/"> tag');
});

await test(`/${testSlug} injects a dynamic <title>`, async () => {
  const { text } = await fetchPage(testSlugUrl);
  assertContains(text, '<title>', 'Missing <title> tag');
  assertNotContains(text, '<title>Institution Courses | My Exam Companion</title>', 'Title was NOT overridden by Edge Function — still shows default HTML title');
});

await test(`/${testSlug} injects canonical URL with slug`, async () => {
  const { text } = await fetchPage(testSlugUrl);
  assertContains(text, `<link rel="canonical" href="${testSlugUrl}">`, 'Canonical URL does not match the clean URL');
});

await test(`/${testSlug} injects MEC_BROCHURE_PARAMS with institution_id`, async () => {
  const { text } = await fetchPage(testSlugUrl);
  assertContains(text, 'institution_id', 'MEC_BROCHURE_PARAMS.institution_id not injected');
});

await test(`/${testSlug} injects Schema.org EducationalOrganization for Googlebot`, async () => {
  const { text } = await fetchPage(testSlugUrl, BOT_UA);
  assertContains(text, '"@type":"EducationalOrganization"', 'Missing Schema.org EducationalOrganization');
});

await test(`/${testSlug} serves SSR course list to Googlebot`, async () => {
  const { text } = await fetchPage(testSlugUrl, BOT_UA);
  assertContains(text, 'pre-rendered-content', 'Missing SSR course list in bot response');
});

await test(`/${testSlug} injects BreadcrumbList schema`, async () => {
  const { text } = await fetchPage(testSlugUrl, BOT_UA);
  assertContains(text, '"@type":"BreadcrumbList"', 'Missing BreadcrumbList schema');
});

// ── 4. SUMMARY ───────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log(`📊  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

if (failures.length > 0) {
  console.log('\n❌  Failed Tests:');
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     ${f.error.split('\n')[0]}`);
  });
}

console.log('─'.repeat(55) + '\n');

if (failed > 0) process.exit(1);
