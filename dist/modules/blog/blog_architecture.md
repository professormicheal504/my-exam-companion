# Blog Architecture — My Exam Companion

> **Stack context:** Vanilla JS · Cloudflare Pages + Pages Functions · Supabase (PostgreSQL + Auth) · R2 (exam questions already live) · KV (poll votes pattern already live) · D1 (polls already live)

---

## 1. Current State (What's Already Working)

| Layer | Status | File(s) |
|---|---|---|
| Blog listing page | ✅ Done | `public/modules/blog/categories.html` |
| Article reader page | ✅ Done | `public/modules/blog/content.html` |
| Clean URL routing | ✅ Done | `functions/_middleware.js` |
| Sidebar nav item | ✅ Done | `public/components/sidebar.js` |
| `publisher_posts` DB table + RLS | ✅ Done | `supabase/migrations/20260819000000_publisher_posts.sql` |
| Publisher dashboard & editor review UI | ✅ Done | `public/modules/publisher_program/` + `public/modules/editor_program/` |
| Publish trigger (DB) | ⚠️ Stub | `on_post_approved` trigger body is `null` |
| SEO meta injection (bots/crawlers) | ❌ Missing | Bots get generic tags from the static shell |
| Likes persistence | ❌ Missing | Toggle is CSS-only, never saved |
| Comments system | ❌ Missing | No table, no UI |
| RSS feed | ❌ Missing | — |
| `content` + `excerpt` + `author_*` DB columns | ⚠️ Used in code, not in migration | Likely added directly in Supabase dashboard |

---

## 2. System Architecture

```
Publisher writes article
        │
        ▼
[publisher_posts] — Supabase DB (draft)
        │
Editor approves → status = 'approved'
        │
        ├──► Supabase DB trigger fires `on_post_approved`
        │         │
        │         ▼
        │    Cloudflare Worker (Edge Function)
        │         │
        │         ├──► Writes article JSON to R2: articles/{post-id}.json
        │         ├──► Writes metadata to KV: article:{post-id} (title, excerpt, image, author, date)
        │         └──► Appends post-id to KV list: recent_articles
        │
        ▼
Reader visits /ng/blog/{post-id}
        │
        ▼
functions/blog/[[slug]].js  ← Pages Function intercepts
        │
        ├──► Reads metadata from KV: article:{slug}
        ├──► Injects SEO meta tags + JSON-LD into content.html <head>
        └──► Returns hydrated HTML to browser / Googlebot / Opera News
                  │
                  ▼
            Browser JS runs
                  │
                  ├──► Fetches article body from R2 (or Supabase fallback)
                  ├──► Fetches like count from KV via /api/blog/likes?id=...
                  └──► Fetches comments JSON from R2 via /api/blog/comments?id=...
```

---

## 3. Database Schema

### 3.1 Missing columns — add to `publisher_posts`

```sql
-- Migration: add missing columns used by the frontend
ALTER TABLE public.publisher_posts
  ADD COLUMN IF NOT EXISTS content      text,
  ADD COLUMN IF NOT EXISTS excerpt      text,
  ADD COLUMN IF NOT EXISTS author_name  text,
  ADD COLUMN IF NOT EXISTS author_avatar text,
  ADD COLUMN IF NOT EXISTS slug         text unique,   -- human-readable URL slug
  ADD COLUMN IF NOT EXISTS tags         text[] default '{}',
  ADD COLUMN IF NOT EXISTS likes_count  integer default 0,
  ADD COLUMN IF NOT EXISTS comments_count integer default 0,
  ADD COLUMN IF NOT EXISTS shares_count integer default 0;

-- Public can read approved posts (needed for anon Supabase reads)
CREATE POLICY "Public can read approved posts"
  ON public.publisher_posts FOR SELECT
  USING (status = 'approved');
```

### 3.2 Comments table (new)

```sql
CREATE TABLE public.blog_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid REFERENCES public.publisher_posts(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"
  ON public.blog_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Cloudflare Storage (R2 & KV)

These follow the same patterns already used by the polls (KV) and exam questions (R2) features.

### 4.1 R2 Bucket: `mec-blog-content`

Add to `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "BLOG_BUCKET"
bucket_name = "mec-blog-content"
preview_bucket_name = "mec-blog-content-preview"
```

Key structure:

| R2 Key | Contents |
|---|---|
| `articles/{post-id}.json` | Full article data (title, body HTML, author, date, tags, etc.) |
| `comments/{post-id}.json` | Flat array of approved comments (static cache, rebuilt on new comment) |

### 4.2 KV Namespace: `MEC_BLOG`

Add to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MEC_BLOG"
id = "<create-in-cloudflare-dashboard>"
preview_id = "<preview-id>"
```

Key structure:

| KV Key | Value |
|---|---|
| `article:{post-id}` | JSON `{title, excerpt, thumbnail_url, author_name, slug, created_at}` — for SEO injection |
| `likes:{post-id}` | Integer string — current like count (fast read, synced to DB every 5 min) |
| `recent_articles` | JSON array of last 50 post-id strings |

---

## 5. Cloudflare Pages Functions

### 5.1 `functions/blog/[[slug]].js` — SEO Middleware (most important)

This is the key missing piece. Crawlers (Googlebot, Opera News, Flipboard) hit `/ng/blog/{slug}` and currently receive a generic HTML shell with no article-specific meta tags. This function fixes that.

```js
// functions/blog/[[slug]].js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = context.params.slug;          // e.g. "my-post-id" or UUID

  if (!slug) return context.next();

  // 1. Fetch article metadata from KV (fast, cached at edge)
  const meta = await context.env.MEC_BLOG.get(`article:${slug}`, 'json');
  if (!meta) return context.next();          // unknown slug → fall through

  // 2. Fetch the static content.html shell
  const assetRes = await context.env.ASSETS.fetch(
    new Request(new URL('/modules/blog/content', url).toString(), context.request)
  );
  let html = await assetRes.text();

  // 3. Inject per-article SEO into <head>
  const canonicalUrl = `${url.origin}/${url.pathname.split('/')[1]}/blog/${slug}`;
  const seoBlock = `
    <title>${esc(meta.title)} | My Exam Companion</title>
    <meta name="description" content="${esc(meta.excerpt)}">
    <meta property="og:title" content="${esc(meta.title)}">
    <meta property="og:description" content="${esc(meta.excerpt)}">
    <meta property="og:image" content="${esc(meta.thumbnail_url)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <link rel="canonical" href="${canonicalUrl}">
    <script type="application/ld+json">
    {
      "@context":"https://schema.org",
      "@type":"NewsArticle",
      "headline":"${esc(meta.title)}",
      "image":["${esc(meta.thumbnail_url)}"],
      "datePublished":"${meta.created_at}",
      "author":[{"@type":"Person","name":"${esc(meta.author_name)}"}],
      "publisher":{"@type":"Organization","name":"My Exam Companion","logo":{"@type":"ImageObject","url":"https://www.myexamcompanion.com/favicon.ico"}}
    }
    </script>`;

  html = html.replace(/<title>.*?<\/title>/, '').replace('</head>', seoBlock + '</head>');
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public,max-age=3600' } });
}

function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
```

### 5.2 `functions/api/blog/publish.js` — Publish Trigger

Called by the Supabase `on_post_approved` trigger (via Supabase Dashboard Webhook or `pg_net`). Serializes the article to R2 and warms the KV cache.

```js
// functions/api/blog/publish.js
export async function onRequestPost(context) {
  const { record } = await context.request.json();   // Supabase webhook payload
  if (record.status !== 'approved') return new Response('skip', { status: 200 });

  const article = {
    id: record.id,
    title: record.title,
    excerpt: record.excerpt,
    content: record.content,
    thumbnail_url: record.thumbnail_url,
    topics: record.topics,
    author_name: record.author_name,
    author_avatar: record.author_avatar,
    created_at: record.created_at,
    slug: record.slug || record.id,
    tags: record.tags || [],
  };

  // Write full article to R2
  await context.env.BLOG_BUCKET.put(
    `articles/${article.id}.json`,
    JSON.stringify(article),
    { httpMetadata: { contentType: 'application/json' } }
  );

  // Write lightweight metadata to KV (for SEO middleware)
  await context.env.MEC_BLOG.put(
    `article:${article.id}`,
    JSON.stringify({ title: article.title, excerpt: article.excerpt, thumbnail_url: article.thumbnail_url, author_name: article.author_name, created_at: article.created_at, slug: article.slug }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );

  // Also index by slug if different from id
  if (article.slug && article.slug !== article.id) {
    await context.env.MEC_BLOG.put(`article:${article.slug}`, JSON.stringify({ ...article, id: article.id }));
  }

  // Prepend to recent_articles KV list
  const existing = await context.env.MEC_BLOG.get('recent_articles', 'json') || [];
  const updated = [article.id, ...existing.filter(id => id !== article.id)].slice(0, 50);
  await context.env.MEC_BLOG.put('recent_articles', JSON.stringify(updated));

  return new Response('ok');
}
```

### 5.3 `functions/api/blog/likes.js` — Like Counts (KV-backed)

Follows the same pattern as the existing `functions/api/poll.js`.

```js
// functions/api/blog/likes.js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const postId = url.searchParams.get('id');
  if (!postId) return new Response('missing id', { status: 400 });

  if (context.request.method === 'GET') {
    const count = parseInt(await context.env.MEC_BLOG.get(`likes:${postId}`) || '0');
    return Response.json({ likes: count }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (context.request.method === 'POST') {
    const current = parseInt(await context.env.MEC_BLOG.get(`likes:${postId}`) || '0');
    await context.env.MEC_BLOG.put(`likes:${postId}`, String(current + 1));
    return Response.json({ likes: current + 1 });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
```

> **DB sync:** Add a Cloudflare Cron Trigger (`wrangler.toml` `[triggers] crons = ["*/5 * * * *"]`) that reads all `likes:*` KV keys and bulk-updates `publisher_posts.likes_count` in Supabase every 5 minutes.

### 5.4 `functions/api/blog/comments.js` — Comments

```js
// functions/api/blog/comments.js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const postId = url.searchParams.get('id');

  if (context.request.method === 'GET') {
    // Serve from R2 cache
    const cached = await context.env.BLOG_BUCKET.get(`comments/${postId}.json`);
    if (cached) return new Response(cached.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public,max-age=60' } });
    return Response.json([]);
  }

  if (context.request.method === 'POST') {
    // Write new comment to Supabase, then rebuild R2 cache
    const { body, user_id, author_name } = await context.request.json();
    // ... insert to blog_comments via Supabase REST API using service role key from env ...
    // ... refetch all comments for postId from Supabase ...
    // ... write updated comments array to R2: comments/{postId}.json ...
    return Response.json({ ok: true });
  }
}
```

### 5.5 `functions/api/blog/feed.xml` — RSS Feed

```js
// functions/api/blog/feed.xml.js
export async function onRequestGet(context) {
  const recentIds = await context.env.MEC_BLOG.get('recent_articles', 'json') || [];
  const articles = (await Promise.all(
    recentIds.slice(0, 20).map(id => context.env.BLOG_BUCKET.get(`articles/${id}.json`).then(r => r ? r.json() : null))
  )).filter(Boolean);

  const items = articles.map(a => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>https://www.myexamcompanion.com/ng/blog/${a.slug || a.id}</link>
      <description><![CDATA[${a.excerpt || ''}]]></description>
      <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
      <guid>https://www.myexamcompanion.com/ng/blog/${a.slug || a.id}</guid>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Exam Companion Blog</title>
    <link>https://www.myexamcompanion.com/ng/blog</link>
    <description>Study tips, exam updates and guides for JAMB, WAEC and NECO students.</description>
    <language>en</language>
    <atom:link href="https://www.myexamcompanion.com/api/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, { headers: { 'Content-Type': 'application/rss+xml', 'Cache-Control': 'public,max-age=900' } });
}
```

---

## 6. Frontend Changes

### 6.1 `categories.html` — use KV-backed list first

Replace the direct Supabase query with a fetch to the KV-backed JSON, falling back to Supabase for fresh installs:

```js
// Prefer edge-cached list (fast, no DB hit)
let posts = [];
try {
  const res = await fetch('/api/blog/recent');   // Worker reads KV recent_articles + fetches from R2
  if (res.ok) posts = await res.json();
} catch (_) {}

// Supabase fallback (for local dev or cache miss)
if (!posts.length) {
  const { data } = await sb.from('publisher_posts').select('...').eq('status','approved').order('created_at',{ascending:false}).limit(50);
  posts = data || [];
}
```

### 6.2 `content.html` — persist likes via API

Replace the CSS-only toggle with a real API call:

```js
// On load: fetch real like count
const likeRes = await fetch(`/api/blog/likes?id=${postId}`);
const { likes } = await likeRes.json();
document.getElementById('likesCount').textContent = `${likes} likes`;

// On click:
document.getElementById('likeBtn').addEventListener('click', async () => {
  if (liked) return;   // prevent double-like
  liked = true;
  likeBtn.classList.add('liked');
  const res = await fetch(`/api/blog/likes?id=${postId}`, { method: 'POST' });
  const { likes: newCount } = await res.json();
  document.getElementById('likesCount').textContent = `${newCount} likes`;
  // Store in localStorage to prevent re-liking across page loads
  localStorage.setItem(`mec_liked_${postId}`, '1');
});
```

---

## 7. Implementation Order (Priority)

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Add missing DB columns migration (`content`, `excerpt`, `author_name`, etc.) | Unblocks the publisher flow | Low |
| 2 | `functions/blog/[[slug]].js` SEO middleware | Google News + Opera News acceptance | Medium |
| 3 | `functions/api/blog/publish.js` + wire Supabase webhook | Activates R2 caching | Medium |
| 4 | Likes API (`functions/api/blog/likes.js`) + frontend wiring | Real engagement data | Low |
| 5 | Add `mec-blog-content` R2 bucket + `MEC_BLOG` KV to `wrangler.toml` | Required for 2–4 | Low |
| 6 | Comments table + `functions/api/blog/comments.js` | Community engagement | High |
| 7 | RSS feed (`functions/api/blog/feed.xml.js`) | News aggregators | Low |
| 8 | Cron trigger to sync KV likes → Supabase | Data durability | Low |

---

## 8. Performance Characteristics

| Scenario | DB reads | Source |
|---|---|---|
| 1,000,000 readers (article cached) | 1 | R2 CDN cache hit for all subsequent visitors |
| Like count display | 0 | KV read (sub-millisecond) |
| Like click | 0 | KV write (async) |
| Comments read | 0 | R2 static JSON (CDN cached) |
| New comment | 1 | Supabase insert → rebuild R2 cache |
| Article listing | 0 | KV `recent_articles` → R2 article metadata |
| Bot/SEO request | 0 | KV metadata read in Pages Function |

**Cost at 1M visitors/month:** Cloudflare Pages is free tier. R2 free tier: 10GB storage, 1M Class B reads/month. KV free tier: 10M reads/day. Supabase free tier: 500MB DB, 2GB bandwidth. This architecture stays within all free tiers up to very high traffic.

---

## 9. File Map

```
functions/
  blog/
    [[slug]].js            ← SEO middleware (NEW)
  api/
    blog/
      publish.js           ← Publish trigger receiver (NEW)
      likes.js             ← KV-backed like counts (NEW)
      comments.js          ← Comments read/write + R2 cache (NEW)
      feed.xml.js          ← RSS feed (NEW)
      recent.js            ← KV recent_articles list endpoint (NEW)

public/modules/blog/
  categories.html          ← Update: use /api/blog/recent first
  content.html             ← Update: wire real likes API
  blog_architecture.md     ← This file

supabase/migrations/
  202609XX_blog_columns.sql    ← Add missing columns (NEW)
  202609XX_blog_comments.sql   ← Comments table (NEW)

wrangler.toml              ← Add BLOG_BUCKET R2 + MEC_BLOG KV bindings
```
