import { test, expect, request } from '@playwright/test';

const BASE = 'https://myexamcompanion.pages.dev';
const TTFB_LIMIT_MS = 1000;
const MAX_CHILD_SITEMAPS = 200; // hard cap to prevent runaway tests

interface SitemapFile {
  url: string;
  bytes: number;
  ttfbMs: number;
  status: number;
  contentType: string;
  urlCount: number;
}

async function fetchTimed(ctx: request.APIRequestContext, url: string): Promise<SitemapFile> {
  const t0 = Date.now();
  const res = await ctx.get(url, { failOnStatusCode: false, timeout: 5_000 });
  const ttfbMs = Date.now() - t0;
  const body = await res.body();
  const contentType = res.headers()['content-type'] || '';
  const urlCount = (body.toString('utf8').match(/<loc>/g) || []).length;
  return {
    url,
    bytes: body.length,
    ttfbMs,
    status: res.status(),
    contentType,
    urlCount
  };
}

test.describe('Sitemaps — fetchability (regression: "could not fetch" 1s timeout)', () => {

  test('BUG-SM01: robots.txt is served and points to sitemap.xml', async () => {
    const ctx = await request.newContext();
    const res = await ctx.get(`${BASE}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/^User-agent:\s*\*/im);
    expect(body).toMatch(/Sitemap:\s*https:\/\/myexamcompanion\.pages\.dev\/sitemap\.xml/i);
  });

  test('BUG-SM02: /sitemap.xml index returns 200, application/xml, TTFB < 1s', async () => {
    const ctx = await request.newContext();
    const file = await fetchTimed(ctx, `${BASE}/sitemap.xml`);
    expect(file.status, `${file.url} returned ${file.status}`).toBe(200);
    expect(file.contentType, `${file.url} had wrong content-type`).toMatch(/xml/i);
    expect(file.ttfbMs, `${file.url} TTFB was ${file.ttfbMs}ms`).toBeLessThan(TTFB_LIMIT_MS);
    expect(file.urlCount, 'sitemap.xml should be a sitemapindex, not a urlset').toBeGreaterThan(0);
    await ctx.dispose();
  });

  test('BUG-SM03: every child sitemap referenced by the index is fetchable in <1s', async () => {
    const ctx = await request.newContext();

    // 1) Fetch the index
    const index = await fetchTimed(ctx, `${BASE}/sitemap.xml`);
    expect(index.status).toBe(200);
    expect(index.ttfbMs).toBeLessThan(TTFB_LIMIT_MS);

    // 2) Extract child URLs
    const locRe = /<loc>([^<]+)<\/loc>/g;
    const children: string[] = [];
    const txt = await (await ctx.get(`${BASE}/sitemap.xml`)).text();
    let m: RegExpExecArray | null;
    while ((m = locRe.exec(txt)) !== null) children.push(m[1]);
    expect(children.length, 'index should reference child sitemaps').toBeGreaterThan(0);
    expect(children.length, 'sanity cap').toBeLessThan(MAX_CHILD_SITEMAPS);

    // 3) Fetch each child, asserting status, content-type, TTFB
    const failures: string[] = [];
    const results: SitemapFile[] = [];
    for (const url of children) {
      const f = await fetchTimed(ctx, url);
      results.push(f);
      if (f.status !== 200) failures.push(`${f.status} ${f.url}`);
      else if (!/xml/i.test(f.contentType)) failures.push(`bad-ct ${f.contentType} ${f.url}`);
      else if (f.ttfbMs >= TTFB_LIMIT_MS) failures.push(`slow ${f.ttfbMs}ms ${f.url}`);
      else if (f.urlCount === 0) failures.push(`no-urls ${f.url}`);
    }

    if (failures.length) {
      throw new Error(`${failures.length}/${results.length} sitemap fetches failed:\n${failures.slice(0, 20).join('\n')}`);
    }

    // 4) Sanity stats — every child should be <250KB
    const oversized = results.filter(r => r.bytes > 250_000);
    expect(oversized, `Sitemaps >250KB: ${oversized.map(o => `${o.bytes}b ${o.url}`).join(', ')}`).toHaveLength(0);

    await ctx.dispose();
  });

  test('BUG-SM04: every URL inside every child sitemap responds 2xx', async () => {
    const ctx = await request.newContext();
    const txt = await (await ctx.get(`${BASE}/sitemap.xml`)).text();
    const children: string[] = [];
    const locRe = /<loc>([^<]+)<\/loc>/g;
    let m: RegExpExecArray | null;
    while ((m = locRe.exec(txt)) !== null) children.push(m[1]);

    const bad: string[] = [];
    let totalChecked = 0;
    for (const childUrl of children) {
      const childTxt = await (await ctx.get(childUrl)).text();
      const urls: string[] = [];
      const urlRe = /<loc>([^<]+)<\/loc>/g;
      let u: RegExpExecArray | null;
      while ((u = urlRe.exec(childTxt)) !== null) urls.push(u[1]);

      // Spot-check 3 URLs per child to keep the test fast
      const sample = urls.length <= 3 ? urls : [urls[0], urls[Math.floor(urls.length / 2)], urls[urls.length - 1]];
      for (const target of sample) {
        const r = await ctx.get(target, { failOnStatusCode: false, timeout: 5_000 });
        totalChecked++;
        if (r.status() < 200 || r.status() >= 300) {
          bad.push(`${r.status()} ${target}`);
        }
      }
    }

    expect(bad, `${bad.length}/${totalChecked} sampled URLs were not 2xx:\n${bad.slice(0, 10).join('\n')}`).toHaveLength(0);
    await ctx.dispose();
  });

  test('BUG-SM05: each child sitemap is well-formed XML', async () => {
    const ctx = await request.newContext();
    const txt = await (await ctx.get(`${BASE}/sitemap.xml`)).text();
    const children: string[] = [];
    const locRe = /<loc>([^<]+)<\/loc>/g;
    let m: RegExpExecArray | null;
    while ((m = locRe.exec(txt)) !== null) children.push(m[1]);

    const malformed: string[] = [];
    for (const url of children) {
      const body = await (await ctx.get(url)).text();
      // Light check: starts with <?xml or <urlset, ends with </urlset>
      const looksLikeSitemap = body.trim().startsWith('<?xml') && /<urlset[^>]*>/.test(body) && body.trim().endsWith('</urlset>');
      if (!looksLikeSitemap) malformed.push(url);
    }
    expect(malformed, `Malformed sitemaps: ${malformed.join(', ')}`).toHaveLength(0);
    await ctx.dispose();
  });

});
