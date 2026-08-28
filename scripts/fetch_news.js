/**
 * scripts/fetch_news.js
 * Run via GitHub Actions cron or locally to refresh the cached news feed.
 * Reads the newsdata.io API key from Supabase app_settings,
 * fetches latest educational news, and writes to public/data/news.json.
 *
 * Usage: node scripts/fetch_news.js
 * Env vars needed: SUPABASE_URL, SUPABASE_ANON_KEY (set in GitHub Secrets)
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Supabase Config ───────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://alwplfsqzrijxqujrpyu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsd3BsZnNxenJpanhxdWpycHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjQ4OTUsImV4cCI6MjEwMTUwMDg5NX0.m73Ag_LllwlfqVacWq5UbBjLeMDpb-xsg8W3ZFYv3oI';

// ── NewsData Query ─────────────────────────────────────────────────────────────
const NEWS_QUERY    = 'education OR scholarship OR jamb OR waec OR neco';
const NEWS_LANG     = 'en';
const NEWS_CATEGORY = 'education';

async function main() {
  console.log('[fetch_news] Starting news fetch...');

  // 1. Get API key: try Supabase first, fallback to env var NEWSDATA_API_KEY
  let apiKey = process.env.NEWSDATA_API_KEY || null;

  if (!apiKey) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: setting, error: settingError } = await sb
      .from('app_settings')
      .select('value')
      .eq('key', 'newsdata_api_key')
      .single();

    if (settingError || !setting?.value) {
      console.error('[fetch_news] Could not retrieve API key from Supabase:', settingError?.message);
      process.exit(1);
    }
    apiKey = setting.value;
  }
  console.log('[fetch_news] API key retrieved successfully.');

  // 2. Fetch news from NewsData.io
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(NEWS_QUERY)}&language=${NEWS_LANG}&category=${NEWS_CATEGORY}&size=10`;

  let newsData;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    newsData = await res.json();
  } catch (err) {
    console.error('[fetch_news] Error fetching from NewsData.io:', err.message);
    process.exit(1);
  }

  if (!newsData.results || !newsData.results.length) {
    console.warn('[fetch_news] No articles returned. Aborting write.');
    process.exit(0);
  }

  // 3. Map to clean format
  const articles = newsData.results.map((a) => ({
    title:       a.title       || 'No title',
    description: a.description || a.content || '',
    url:         a.link        || '#',
    image:       a.image_url   || null,
    source:      a.source_id   || 'Unknown',
    author:      a.creator?.[0] || a.source_id || 'Unknown',
    published:   a.pubDate     || new Date().toISOString(),
    category:    a.category?.[0] || 'education',
  }));

  // 4. Write to public/data/news.json
  const outputDir  = path.join(__dirname, '..', 'public', 'data');
  const outputFile = path.join(outputDir, 'news.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const payload = {
    fetched_at: new Date().toISOString(),
    articles,
  };

  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[fetch_news] ✅ Written ${articles.length} articles to ${outputFile}`);
}

main().catch((err) => {
  console.error('[fetch_news] Unhandled error:', err);
  process.exit(1);
});
