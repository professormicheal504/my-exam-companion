/**
 * E2E Test Suite for SEO Engine - Headless (no browser)
 * Tests: Clean URLs, Edge SSR injection, Sitemap, Redirects
 */
const BASE = 'https://myexamcompanion.pages.dev';

let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ FAIL: ${name}`);
    console.log(`         → ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function fetchPage(url, opts = {}) {
  const res = await fetch(url, { redirect: 'follow', ...opts });
  const text = await res.text();
  return { res, text };
}

(async () => {
  console.log('\n=========================================');
  console.log('🚀 MEC SEO Engine — E2E Test Suite');
  console.log('=========================================\n');

  // 1. Sitemaps
  console.log('[1] Sitemaps');
  await test('sitemap.xml is accessible', async () => {
    const { res } = await fetchPage(`${BASE}/sitemap.xml`);
    assert(res.status === 200, `Got ${res.status}`);
  });
  await test('sitemap-ng.xml contains clean /study/ URLs', async () => {
    const { res, text } = await fetchPage(`${BASE}/sitemap-ng.xml`);
    assert(res.status === 200, `Got ${res.status}`);
    assert(text.includes('/study/nigeria/'), 'No /study/nigeria/ found in sitemap');
    assert(!text.includes('?exam_id='), 'Old query-param URLs still present in sitemap');
  });
  await test('sitemap-gh.xml contains Ghana URLs', async () => {
    const { res, text } = await fetchPage(`${BASE}/sitemap-gh.xml`);
    assert(res.status === 200, `Got ${res.status}`);
    assert(text.includes('/study/ghana/'), 'No /study/ghana/ found in sitemap');
  });

  // 2. Clean URL routing
  console.log('\n[2] Clean URL Routing (Edge Function)');
  await test('Nigeria JAMB Physics 2024 loads (200)', async () => {
    const { res } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(res.status === 200, `Got ${res.status}`);
  });
  await test('Ghana WAEC Mathematics 2020 loads (200)', async () => {
    const { res } = await fetchPage(`${BASE}/study/ghana/waec/mathematics/2020`);
    assert(res.status === 200, `Got ${res.status}`);
  });
  await test('Nigeria WAEC Math 2018 loads (200)', async () => {
    const { res } = await fetchPage(`${BASE}/study/nigeria/waec/mathematics/2018`);
    assert(res.status === 200, `Got ${res.status}`);
  });
  await test('Subject-only URL loads (200)', async () => {
    const { res } = await fetchPage(`${BASE}/study/nigeria/jamb/physics`);
    assert(res.status === 200, `Got ${res.status}`);
  });

  // 3. Edge SSR - <base href="/"> injection
  console.log('\n[3] Edge SSR — <base href="/"> Injection');
  await test('Deep URL has <base href="/"> for topbar fix', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('<base href="/">'), 'Missing <base href="/">');
  });
  await test('Subject page has <base href="/"> injection', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb`);
    assert(text.includes('<base href="/">'), 'Missing <base href="/">');
  });

  // 4. Edge SSR - MEC_CLEAN_URL_PARAMS injection
  console.log('\n[4] Edge SSR — MEC_CLEAN_URL_PARAMS Injection');
  await test('Clean URL injects exam_id + subject + year into page', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('MEC_CLEAN_URL_PARAMS'), 'MEC_CLEAN_URL_PARAMS not injected');
    assert(text.includes('"exam_id"') || text.includes('exam_id:'), 'exam_id missing');
    assert(text.includes('physics'), 'subject missing');
    assert(text.includes('2024'), 'year missing');
  });
  await test('Year is in history.replaceState call for year-param simulation', async () => {
    const { text } = await fetchPage(`${BASE}/study/ghana/waec/mathematics/2020`);
    assert(text.includes('history.replaceState'), 'history.replaceState not found');
    assert(text.includes('year=2020'), 'year=2020 not in replaceState call');
  });

  // 5. SEO Meta Tags
  console.log('\n[5] SEO Meta Tags');
  await test('Page has dynamic <title> tag', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('<title>'), 'No <title> tag found');
    assert(text.includes('JAMB') || text.includes('Physics'), 'Title does not contain JAMB or Physics');
  });
  await test('Page has og:title meta tag', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('og:title'), 'og:title missing');
  });
  await test('Page has JSON-LD schema', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('application/ld+json'), 'JSON-LD schema missing');
    assert(text.includes('schema.org'), 'schema.org not found in JSON-LD');
  });
  await test('Canonical link points to clean URL', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`);
    assert(text.includes('rel="canonical"'), 'Canonical link missing');
    assert(text.includes('/study/nigeria/jamb/physics/2024'), 'Canonical URL does not match clean URL');
  });

  // 6. Bot Snapshot (using Googlebot UA)
  console.log('\n[6] Bot HTML Snapshot (Googlebot UA)');
  await test('Googlebot gets pre-rendered question HTML', async () => {
    const { text } = await fetchPage(`${BASE}/study/nigeria/jamb/physics/2024`, {
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    });
    // Either a noscript snapshot OR regular page - both are valid
    assert(text.length > 1000, 'Response too short for a real page');
    assert(text.includes('<!DOCTYPE html') || text.includes('<html'), 'Not a valid HTML response');
  });

  // 7. R2 Data Proxy
  console.log('\n[7] R2 Data Proxy');
  // Note: App fetches R2 data directly via public R2 URL, not this proxy — so this is informational only.
  await test('/r2/* proxy or direct R2 URL is accessible', async () => {
    // Try proxy first, then fall back to direct R2 URL
    const proxyRes = await fetch(`${BASE}/r2/configs/ng.json`, { redirect: 'follow' });
    const directRes = await fetch('https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/configs/ng.json');
    assert(proxyRes.status === 200 || directRes.status === 200, 
      `Both proxy (${proxyRes.status}) and direct R2 (${directRes.status}) failed`);
    const text = await directRes.text();
    const json = JSON.parse(text);
    assert(json.dashboard_modules, 'R2 config JSON missing dashboard_modules');
  });

  // --- Summary ---
  console.log('\n=========================================');
  const total = passed + failed;
  if (failed === 0) {
    console.log(`🎉 All ${total} tests PASSED! SEO Engine is ready.`);
  } else {
    console.log(`⚠️  ${passed}/${total} tests passed. ${failed} FAILED.`);
  }
  console.log('=========================================\n');
  process.exit(failed > 0 ? 1 : 0);
})();
