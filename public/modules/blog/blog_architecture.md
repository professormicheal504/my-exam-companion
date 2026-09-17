# High-Performance Blog Architecture for SEO & News Aggregators

This document outlines the optimal architecture for the My Exam Companion Blog. The goal is to build a system that is blazing fast, highly optimized for SEO and News Aggregators (Google News, Flipboard, Opera News, NewsBreak), and extremely cost-efficient (aiming for < 5 database reads per article even with 1M+ visitors). The blog will be deeply integrated into the existing website shell, accessible directly from the main sidebar.

## 1. High-Level Workflow & System Components

The blog relies on Cloudflare's edge network to serve content at zero-cost bandwidth and near-zero database reads.

1. **Publisher (`public/modules/publisher_program`)**: Writers draft articles. Drafts are saved to Cloudflare R2 or D1.
2. **Editor (`public/modules/editor_program`)**: Editors review drafts. Upon approval, the article is published.
3. **Publishing Event**: When published, a Cloudflare Worker generates a static HTML snippet or a highly-cacheable JSON file containing the article's core content, metadata, and schema markup, and stores it in **Cloudflare R2**.
4. **Reader (`public/modules/blog/content.html`)**: Fetches the static R2 file via CDN. 
5. **Dynamic Data (Likes & Comments)**: Handled entirely via Cloudflare Workers caching to prevent database reads.

---

## 2. SEO & News Aggregator Optimization

To be accepted easily by Google News, Flipboard, and Opera News, the architecture must serve specific structured data and metadata natively:

### A. Dynamic Open Graph & Meta Tags
Since `content.html` is an SPA (Single Page Application) that loads content dynamically, News Aggregators might fail to scrape it if the meta tags aren't present on the initial load.
*   **Solution**: Use a **Cloudflare Pages Function / Middleware (`functions/blog/[[slug]].js`)** to intercept requests to `blog/content.html?id=...`. The middleware will fetch the article's metadata from KV/R2 and inject the exact `<title>`, `<meta name="description">`, `og:image`, and JSON-LD schema into the HTML *before* sending it to the crawler.

### B. Required JSON-LD Schema (NewsArticle)
Every article must inject this schema:
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title",
  "image": ["https://url.to/image.jpg"],
  "datePublished": "2026-09-17T08:00:00+08:00",
  "dateModified": "2026-09-17T09:20:00+08:00",
  "author": [{ "@type": "Person", "name": "Author Name" }]
}
```

### C. RSS Feeds
Google News and Flipboard rely heavily on RSS feeds.
*   **Solution**: A Cloudflare Worker at `api/blog/feed.xml` that auto-generates a valid RSS 2.0 feed based on the latest 50 published articles stored in a KV list.

---

## 3. Achieving "Zero Read" Scaling (Handling 1 Million Visitors)

If 1 million people visit, like, and comment, a traditional database would crash or cost a fortune in reads/writes. Here is how we bypass this using Cloudflare:

### A. Article Content (0 Reads)
*   **Storage**: Cloudflare R2 (Object Storage).
*   **Serving**: R2 is routed through Cloudflare CDN. When a user requests the article, it hits the Edge Cache. 1 million users = 1 R2 read (the first visitor), and 999,999 cached edge hits (free).

### B. Likes / Reactions (0 DB Reads, Aggregated Writes)
*   **Problem**: Fetching the current like count for every user = 1M reads.
*   **Solution**: 
    1. Store the total like count in **Cloudflare KV** (or a Durable Object). 
    2. When a user loads the page, the Worker returns the count from KV (KV reads are incredibly cheap/free).
    3. When a user clicks "Like", the Worker increments the KV value.
    4. A CRON job runs every 5 minutes to flush the final KV like count to the permanent Database (Supabase). This means 1M likes = 1 Database Write.

### C. Comments System (Cached Reads)
*   **Problem**: 1 million visitors reading comments = 1M DB queries.
*   **Solution**: 
    1. When a user posts a comment, it is written to the Database.
    2. Upon successful write, the Cloudflare Worker **regenerates a static JSON file** `comments_{article_id}.json` and saves it to R2/KV.
    3. When visitors load the article, the frontend simply fetches `comments_{article_id}.json` via CDN. 
    4. 1 Million visitors = 1 fetch from the Database (when the cache was built) + CDN cache hits.

---

## 4. Step-by-Step Implementation Plan

### Step 1: Storage Layer Setup (R2 & KV)
*   Create an R2 Bucket: `mec-blog-content`.
*   Create a KV Namespace: `MEC_BLOG_CACHE` (stores like counts and recent article lists).

### Step 2: Publisher & Editor Flow
*   **Publisher**: Writes article using a rich text editor. Saves draft to Database.
*   **Editor**: Reviews draft. Clicks "Publish".
*   **Publish Action**: Worker fetches the draft, converts it to a standard JSON format, uploads it to R2 `mec-blog-content/articles/{slug}.json`, and adds the slug to the KV `recent_articles` list.

### Step 3: SEO Middleware
*   Create `functions/blog/[slug].js`.
*   When a user requests `/blog/my-awesome-article`, the middleware fetches the JSON from R2.
*   It injects the SEO meta tags and JSON-LD into the `<head>` of `content.html` and returns the hydrated HTML to the browser/bot.

### Step 4: The Engagement API (Likes & Comments)
*   Create `functions/api/blog/likes.js`: Handles POST requests to increment likes in KV.
*   Create `functions/api/blog/comments.js`: Handles POST requests to add a comment to DB, then rebuilds the `comments_{slug}.json` cache in R2.

### Step 5: Frontend Integration & App Shell (Sidebar)
*   **Sidebar Integration**: Add a "Blog" or "News" tab to the existing `sidebar.js`/`sidebar.html` component.
*   **Categories Page (`categories.html`)**: Lives inside the main app shell. It fetches `https://cdn/recent_articles.json` on load and displays article cards.
*   **Content Page (`content.html`)**: When a user clicks an article, they navigate to `content.html?id=slug`. The Cloudflare Middleware intercepts this, injects the SEO tags, and serves the page. The JavaScript then mounts the article content, interactive comments, and likes components inside the standard website layout.

## Summary

This architecture guarantees that whether you have 100 visitors or 1,000,000 visitors, your backend Database reads will remain strictly under 5 per article (1 initial cache build + occasional CRON syncs). Cloudflare's Edge Cache handles 99.9% of the heavy lifting.
