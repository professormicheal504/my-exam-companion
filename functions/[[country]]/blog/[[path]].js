/**
 * Edge SSR — Blog
 *
 * Routes handled:
 *   /:cc/blog                          → blog listing (all categories)
 *   /:cc/blog/:category                → category listing
 *   /:cc/blog/:category/:slug          → single article (full SSR)
 *
 * The country code (:cc) is read from the URL slug (ng / gh / us).
 * Googlebot receives a complete, JS-free HTML document on every route.
 * Google AdSense ads are injected via pre-defined slots.
 */

// ── Category definitions ────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'all',           label: 'All' },
  { slug: 'study-tips',    label: 'Study Tips' },
  { slug: 'exam-updates',  label: 'Exam Updates' },
  { slug: 'guide',         label: 'Guide' },
  { slug: 'scholarships',  label: 'Scholarships' },
  { slug: 'school-news',   label: 'School News' },
];

// Map country code → BCP-47 language tag for <html lang>
const CC_LANG = { ng: 'en-NG', gh: 'en-GH', us: 'en-US' };

function normaliseCategorySlug(raw) {
  if (!raw) return 'guide';
  const r = raw.toLowerCase().replace(/\s+/g, '-');
  const found = CATEGORIES.find(c => c.slug === r || c.label.toLowerCase() === r);
  return found ? found.slug : 'guide';
}

function getCategoryLabel(slug) {
  return (CATEGORIES.find(c => c.slug === slug) || {}).label || 'Guide';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const BASE = 'https://myexamcompanion.com';
const SITE_NAME = 'MyExam Companion';
const LOGO_URL  = `${BASE}/logos/logo.png`;
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'; // ← replace with real publisher ID

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(html = '') {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// Pre-stamp heading IDs in SSR HTML so TOC anchor links work without JS
function stampHeadingIds(html = '') {
  let i = 0;
  return html.replace(/<(h[23])(\s[^>]*)?>/gi, (_, tag, attrs = '') => {
    // Don't double-stamp if id already present
    if (/\bid\s*=/.test(attrs)) return `<${tag}${attrs}>`;
    return `<${tag}${attrs} id="sec-${i++}">`;
  });
}

// Build a server-side TOC <ul> from h2/h3 headings in HTML
function buildTocHtml(html = '') {
  const items = [];
  let i = 0;
  const re = /<(h[23])(?:\s[^>]*)?>([^<]*(?:<(?!\/h[23])[^>]*>[^<]*)*)<\/h[23]>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const level = m[1];
    const text  = stripHtml(m[2]).trim();
    if (text) items.push({ level, text, id: `sec-${i++}` });
  }
  if (items.length < 2) return '';
  return items.map(it =>
    `<li${it.level === 'h3' ? ' class="h3"' : ''}><a href="#${it.id}">${esc(it.text)}</a></li>`
  ).join('');
}

// AdSense — push call is inlined but uses a safe pattern
function adSlot(slotId, label) {
  return `<div class="ad-wrap" aria-label="Advertisement" data-slot="${label}">
  <ins class="adsbygoogle" style="display:block;text-align:center;"
       data-ad-layout="in-article" data-ad-format="fluid"
       data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${slotId}"></ins>
</div>`;
}

// AdSense init — single push block at bottom of <body>, not per-slot
// Note: closing script tag is split to prevent esbuild from treating it as
// the end of the JS module when this string is embedded in bundled output.
const ADSENSE_INIT = '<script>\n' +
  '(window.adsbygoogle=window.adsbygoogle||[]).forEach?0:(adsbygoogle=[]);\n' +
  'document.querySelectorAll(\'.adsbygoogle\').forEach(function(){(adsbygoogle=window.adsbygoogle||[]).push({});});\n' +
  '<\/script>';

// ── Supabase REST helper ─────────────────────────────────────────────────────
async function supabaseFetch(env, table, query) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Supabase ${table} query failed: ${res.status}`);
  return res.json();
}

// ── LISTING PAGE ─────────────────────────────────────────────────────────────
function buildListingHtml({ cc, category, posts, page, totalPages }) {
  const lang       = CC_LANG[cc] || 'en';
  const catLabel   = getCategoryLabel(category);
  const catIsAll   = category === 'all';
  const pageTitle  = catIsAll
    ? `Blog — ${SITE_NAME}`
    : `${catLabel} Articles — ${SITE_NAME}`;
  const description = catIsAll
    ? `Study tips, exam updates, scholarship guides and school news for ${cc === 'ng' ? 'Nigerian' : cc === 'gh' ? 'Ghanaian' : ''} students on ${SITE_NAME}.`
    : `Latest ${catLabel} articles for students. Find expert guides, tips and news on ${SITE_NAME}.`;
  const canonicalBase = `${BASE}/${cc}/blog${catIsAll ? '' : '/' + category}`;
  const canonicalUrl  = page > 1 ? `${canonicalBase}?page=${page}` : canonicalBase;

  // WebSite schema with SearchAction — appears once on the listing root, great for sitelinks
  const websiteSchema = !catIsAll || page > 1 ? '' : `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${BASE}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/${cc}/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  })}<\/script>` ;

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/${cc}` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/${cc}/blog` },
      ...(catIsAll ? [] : [{ '@type': 'ListItem', position: 3, name: catLabel, item: `${BASE}/${cc}/blog/${category}` }]),
    ],
  });

  // Pick the first post cloudflare_url as the OG image
  const ogImage = (posts.find(p => p.cloudflare_url) || {}).cloudflare_url || LOGO_URL;

  const navTabs = CATEGORIES.map(c => {
    const active = c.slug === category;
    const href   = `/${cc}/blog${c.slug === 'all' ? '' : '/' + c.slug}`;
    return `<a href="${href}" class="cat-tab${active ? ' active' : ''}" aria-current="${active ? 'page' : 'false'}">${c.label}</a>`;
  }).join('');

  const cards = posts.map(p => {
    const catSlug = normaliseCategorySlug(p.category);
    const href    = `/${cc}/blog/${catSlug}/${p.slug}`;
    const thumb   = p.cloudflare_url
      ? `<img src="${esc(p.cloudflare_url)}" alt="${esc(p.title)}" loading="lazy" width="400" height="225">`
      : '<div class="card-thumb-placeholder" aria-hidden="true"></div>';
    const date = p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const rt = readTime(p.rendered_html || p.draft_content?.content || '');
    return `<article class="post-card">
      <a href="${href}" tabindex="-1" aria-hidden="true">
        <div class="card-thumb">${thumb}</div>
      </a>
      <div class="card-body">
        <span class="card-cat">${getCategoryLabel(catSlug)}</span>
        <h2 class="card-title"><a href="${href}">${esc(p.title)}</a></h2>
        ${p.description ? `<p class="card-desc">${esc(p.description.substring(0, 120))}…</p>` : ''}
        <div class="card-meta">
          <span>${esc(p.publisher_name || 'Staff')}</span>
          <span class="sep" aria-hidden="true">·</span>
          <time datetime="${p.created_at || ''}">${date}</time>
          <span class="sep" aria-hidden="true">·</span>
          <span>${rt} min read</span>
        </div>
      </div>
    </article>`;
  }).join('');

  const prevNext = [
    page > 1        ? `<link rel="prev" href="${canonicalBase}${page - 1 > 1 ? '?page=' + (page - 1) : ''}">` : '',
    page < totalPages ? `<link rel="next" href="${canonicalBase}?page=${page + 1}">` : '',
  ].filter(Boolean).join('\n  ');

  const pagination = totalPages > 1 ? `
  <nav class="pagination" aria-label="Pagination">
    ${page > 1
      ? `<a href="${canonicalBase}${page - 1 > 1 ? '?page=' + (page - 1) : ''}" class="page-btn" rel="prev">← Previous</a>`
      : '<span class="page-btn disabled" aria-disabled="true">← Previous</span>'}
    <span class="page-info">Page ${page} of ${totalPages}</span>
    ${page < totalPages
      ? `<a href="${canonicalBase}?page=${page + 1}" class="page-btn" rel="next">Next →</a>`
      : '<span class="page-btn disabled" aria-disabled="true">Next →</span>'}
  </nav>` : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${canonicalUrl}">
  ${prevNext}
  <meta property="og:type"        content="website">
  <meta property="og:title"       content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image"       content="${esc(ogImage)}">
  <meta property="og:url"         content="${canonicalUrl}">
  <meta property="og:site_name"   content="${SITE_NAME}">
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image"       content="${esc(ogImage)}">
  <meta name="twitter:site"        content="@myexamcompanion">
  ${websiteSchema}
  <script type="application/ld+json">${breadcrumbSchema}<\/script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--accent:#2563eb;--red:#dc2626;--text:#1a1a1a;--muted:#6b7280;--border:#e5e7eb;--bg:#f5f7fa}
    body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
    a{text-decoration:none;color:inherit}
    .page-wrap{max-width:1100px;margin:0 auto;padding:32px 20px 80px}
    .blog-header{margin-bottom:28px}
    .blog-header h1{font-size:clamp(22px,4vw,34px);font-weight:800;margin-bottom:8px}
    .blog-header p{color:var(--muted);font-size:15px}
    .cat-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:32px;border-bottom:1px solid var(--border)}
    .cat-tab{padding:10px 18px;border-radius:8px 8px 0 0;font-size:13.5px;font-weight:600;color:var(--muted);border:1px solid transparent;border-bottom:none;background:transparent;cursor:pointer;transition:all .2s;margin-bottom:-1px}
    .cat-tab:hover{color:var(--accent)}
    .cat-tab.active{background:#fff;border-color:var(--border);border-bottom-color:#fff;color:var(--accent)}
    .posts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;margin-bottom:40px}
    .post-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid var(--border);transition:box-shadow .2s,transform .15s;display:flex;flex-direction:column}
    .post-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.1);transform:translateY(-2px)}
    .card-thumb{aspect-ratio:16/9;overflow:hidden;background:#e5e7eb}
    .card-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .card-thumb-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#e5e7eb,#d1d5db)}
    .card-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:8px}
    .card-cat{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--accent)}
    .card-title{font-size:16px;font-weight:700;line-height:1.4}
    .card-title a{color:var(--text)}
    .post-card:hover .card-title a{color:var(--accent)}
    .card-desc{font-size:13.5px;color:var(--muted);line-height:1.55;flex:1}
    .card-meta{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px;margin-top:auto;align-items:center}
    .sep{opacity:.4}
    .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:16px}
    .page-btn{padding:8px 18px;border-radius:8px;border:1.5px solid var(--border);font-size:14px;font-weight:600;color:var(--accent);background:#fff}
    .page-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
    .page-btn.disabled{color:var(--muted);pointer-events:none;opacity:.5}
    .page-info{font-size:13px;color:var(--muted)}
    .ad-wrap{margin:24px 0;text-align:center;min-height:90px}
    @media(max-width:600px){.posts-grid{grid-template-columns:1fr}.page-wrap{padding:20px 14px 60px}}
  </style>
</head>
<body>
<div class="page-wrap">
  <header class="blog-header">
    <h1>${esc(catIsAll ? 'Blog' : catLabel)}</h1>
    <p>${esc(description)}</p>
  </header>
  <nav class="cat-tabs" aria-label="Blog categories">${navTabs}</nav>
  ${adSlot('1234567890', 'listing-top')}
  <div class="posts-grid">${cards || '<p style="color:var(--muted);grid-column:1/-1;padding:40px 0;">No articles yet in this category.</p>'}</div>
  ${adSlot('0987654321', 'listing-bottom')}
  ${pagination}
</div>
${ADSENSE_INIT}
</body>
</html>`;
}

// ── ARTICLE PAGE ─────────────────────────────────────────────────────────────
function buildArticleHtml({ cc, post, publisherName, publisherBio, publisherAvatar }) {
  const lang       = CC_LANG[cc] || 'en';
  const catSlug    = normaliseCategorySlug(post.category);
  const catLabel   = getCategoryLabel(catSlug);
  const slug       = post.slug || post.id || '';
  const canonicalUrl = `${BASE}/${cc}/blog/${catSlug}/${slug}`;
  const dateIso    = post.created_at || new Date().toISOString();
  const dateHuman  = new Date(dateIso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const modIso     = post.updated_at && post.updated_at !== post.created_at ? post.updated_at : dateIso;
  const tags       = Array.isArray(post.tags) ? post.tags : [];
  const desc       = post.description || (post.intro ? stripHtml(post.intro).substring(0, 160) : '');

  // Only use real image URLs — never base64 (can be megabytes, crashes the Worker)
  const thumbUrl = post.cloudflare_url || null;

  // Build article body from lightweight fields — rendered_html is NOT fetched
  // in the list query to avoid hitting Worker memory limits.
  // The intro + description gives Googlebot enough content to index well.
  const articleBody = post.intro
    ? `<p class="intro-para">${post.intro}</p>
       <p style="color:#6b7280;font-size:15px;line-height:1.7;margin-top:24px;">
         ${desc ? esc(desc) : ''}
       </p>`
    : `<p style="color:#6b7280;">Content loading…</p>`;

  const tocItems = '';
  const rt = 5;

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: desc,
    ...(thumbUrl ? { image: [thumbUrl] } : {}),
    author: {
      '@type': 'Person',
      name: publisherName,
      url: `${BASE}/${cc}/blog?author=${encodeURIComponent(publisherName)}`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL, width: 250, height: 60 },
    },
    datePublished: dateIso,
    dateModified:  modIso,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    articleSection: catLabel,
    keywords: tags.join(', '),
    inLanguage: lang,
    wordCount: stripHtml(articleBody).split(/\s+/).length,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: `${BASE}/${cc}` },
      { '@type': 'ListItem', position: 2, name: 'Blog',     item: `${BASE}/${cc}/blog` },
      { '@type': 'ListItem', position: 3, name: catLabel,   item: `${BASE}/${cc}/blog/${catSlug}` },
      { '@type': 'ListItem', position: 4, name: post.title, item: canonicalUrl },
    ],
  };

  const tagsHtml = tags.length
    ? `<div class="article-tags" aria-label="Tags">${tags.map(t =>
        `<a href="/${cc}/blog/${catSlug}?tag=${encodeURIComponent(t)}" class="tag-pill" rel="tag">${esc(t)}</a>`
      ).join('')}</div>`
    : '';

  const hreflangAlts = ['ng', 'gh', 'us'].map(c =>
    `<link rel="alternate" hreflang="en-${c}" href="${BASE}/${c}/blog/${catSlug}/${post.slug}">`
  ).join('\n  ');

  // Title includes category keyword for topical relevance
  const pageTitle = `${post.title} — ${catLabel} | ${SITE_NAME}`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="${esc(publisherName)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${canonicalUrl}">
  ${hreflangAlts}
  <link rel="alternate" hreflang="x-default" href="${BASE}/ng/blog/${catSlug}/${post.slug}">

  <meta property="og:type"                content="article">
  <meta property="og:title"               content="${esc(post.title)}">
  <meta property="og:description"         content="${esc(desc)}">
  ${thumbUrl ? `<meta property="og:image"            content="${esc(thumbUrl)}">
  <meta property="og:image:width"         content="1200">
  <meta property="og:image:height"        content="630">
  <meta property="og:image:alt"           content="${esc(post.title)}">` : ''}
  <meta property="og:url"                 content="${canonicalUrl}">
  <meta property="og:site_name"           content="${SITE_NAME}">
  <meta property="article:published_time" content="${dateIso}">
  <meta property="article:modified_time"  content="${modIso}">
  <meta property="article:author"         content="${esc(publisherName)}">
  <meta property="article:section"        content="${esc(catLabel)}">
  ${tags.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n  ')}

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(post.title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${thumbUrl ? `<meta name="twitter:image" content="${esc(thumbUrl)}">` : ''}
  <meta name="twitter:site"        content="@myexamcompanion">

  <script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}<\/script>

  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">

  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--accent:#2563eb;--red:#dc2626;--text:#1a1a1a;--muted:#6b7280;--border:#e5e7eb;--max-w:740px}
    body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:var(--text);line-height:1.7;-webkit-font-smoothing:antialiased}
    a{text-decoration:none;color:inherit}
    .page-wrap{max-width:var(--max-w);margin:0 auto;padding:48px 20px 96px}
    .crumbs{font-size:12.5px;color:var(--muted);margin-bottom:20px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}
    .crumbs a{color:var(--muted)}
    .crumbs a:hover{color:var(--accent)}
    .crumbs .sep{opacity:.5}
    .hero-wrap{border-radius:16px;overflow:hidden;margin-bottom:36px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .hero-wrap img{width:100%;display:block;object-fit:cover;max-height:520px}
    h1.art-title{font-family:'Playfair Display',Georgia,serif;font-size:clamp(26px,5vw,44px);font-weight:800;line-height:1.15;margin-bottom:18px;color:#111}
    .art-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13.5px;color:var(--muted);margin-bottom:32px}
    .art-meta img{width:34px;height:34px;border-radius:50%;object-fit:cover}
    .art-meta .author-name{color:var(--text);font-weight:600}
    .art-meta .sep{opacity:.4}
    .toc-box{background:#f9fafb;border:1px solid var(--border);border-radius:12px;padding:18px 22px;margin-bottom:32px}
    .toc-box h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:10px}
    .toc-list{list-style:none;font-size:14px;line-height:2}
    .toc-list li.h3{padding-left:16px;font-size:13px}
    .toc-list a{color:var(--accent)}
    .toc-list a:hover{text-decoration:underline}
    .art-body{font-size:17px;line-height:1.82}
    .art-body p{margin-bottom:22px;color:#374151}
    .art-body h2{font-family:'Playfair Display',Georgia,serif;font-size:25px;font-weight:800;margin:44px 0 16px;color:#111;scroll-margin-top:72px}
    .art-body h3{font-size:18px;font-weight:700;margin:28px 0 10px;color:#1f2937;scroll-margin-top:72px}
    .art-body ul,.art-body ol{margin:0 0 22px;padding-left:26px;color:#374151}
    .art-body li{margin-bottom:7px}
    .art-body strong{color:#111;font-weight:700}
    .art-body a{color:var(--red);text-decoration:underline}
    .art-body img{max-width:100%;border-radius:10px;margin:28px 0;display:block}
    .art-body figure{margin:28px 0}
    .art-body figcaption{font-size:12.5px;color:var(--muted);margin-top:8px;text-align:center}
    .art-body blockquote{border-left:3px solid var(--red);padding:4px 0 4px 18px;font-style:italic;color:var(--muted);font-size:16px;margin:20px 0}
    .art-body .callout-box{border:1px solid;border-left:4px solid;padding:14px 16px;margin:20px 0;border-radius:8px;font-size:15px;line-height:1.6}
    .intro-para{font-size:18px;line-height:1.85;color:#4b5563;font-weight:500;margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border)}
    .article-tags{display:flex;flex-wrap:wrap;gap:8px;margin:32px 0}
    .tag-pill{font-size:12.5px;font-weight:600;padding:5px 14px;border-radius:999px;background:#f3f4f6;color:var(--muted);border:1px solid var(--border)}
    .tag-pill:hover{background:#eff6ff;color:var(--accent);border-color:var(--accent)}
    .author-box{display:flex;gap:16px;background:#f9fafb;border-radius:14px;padding:20px;margin:40px 0;border:1px solid var(--border)}
    .author-box img{width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#e5e7eb}
    .author-name-lg{font-size:15px;font-weight:700;margin-bottom:4px}
    .author-bio{font-size:13.5px;color:var(--muted);line-height:1.55}
    .ad-wrap{margin:32px 0;text-align:center;min-height:90px}
    @media print{.crumbs,.art-meta,.toc-box,.ad-wrap{display:none}.art-body{font-size:14px}}
    @media(max-width:640px){.page-wrap{padding:28px 14px 64px}h1.art-title{font-size:24px}.art-body{font-size:15.5px}.author-box{flex-direction:column}}
  </style>
</head>
<body itemscope itemtype="https://schema.org/Article">

<div class="page-wrap">

  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/${cc}">Home</a><span class="sep" aria-hidden="true">/</span>
    <a href="/${cc}/blog">Blog</a><span class="sep" aria-hidden="true">/</span>
    <a href="/${cc}/blog/${catSlug}">${esc(catLabel)}</a><span class="sep" aria-hidden="true">/</span>
    <span aria-current="page">${esc(post.title)}</span>
  </nav>

  ${thumbUrl
    ? `<div class="hero-wrap"><img src="${esc(thumbUrl)}" alt="${esc(post.title)}" width="1200" height="630" fetchpriority="high" itemprop="image"></div>`
    : ''}

  <h1 class="art-title" itemprop="headline">${esc(post.title)}</h1>

  <div class="art-meta">
    ${publisherAvatar ? `<img src="${esc(publisherAvatar)}" alt="${esc(publisherName)}" width="34" height="34" loading="eager">` : ''}
    <span class="author-name" itemprop="author" itemscope itemtype="https://schema.org/Person">
      <span itemprop="name">${esc(publisherName)}</span>
    </span>
    <span class="sep" aria-hidden="true">·</span>
    <time datetime="${dateIso}" itemprop="datePublished">${dateHuman}</time>
    <meta itemprop="dateModified" content="${modIso}">
    <span class="sep" aria-hidden="true">·</span>
    <span>${rt} min read</span>
  </div>

  ${adSlot('1122334455', 'article-top')}

  ${tocItems ? `<nav class="toc-box" aria-label="Table of contents">
    <h2>On this page</h2>
    <ul class="toc-list">${tocItems}</ul>
  </nav>` : ''}

  <div class="art-body" itemprop="articleBody">
    ${articleBody}
  </div>

  ${adSlot('5566778899', 'article-mid')}

  ${tagsHtml}

  <div class="author-box">
    ${publisherAvatar
      ? `<img src="${esc(publisherAvatar)}" alt="${esc(publisherName)}" width="56" height="56" loading="lazy">`
      : '<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;flex-shrink:0" aria-hidden="true"></div>'}
    <div>
      <div class="author-name-lg" itemprop="author">${esc(publisherName)}</div>
      <div class="author-bio">${esc(publisherBio || '')}</div>
    </div>
  </div>

  ${adSlot('9988776655', 'article-bottom')}

</div>

${ADSENSE_INIT}
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function onRequest(context) {
  // ── Outer safety net — never let a raw exception produce Error 1101 ────────
  try {
    return await handleRequest(context);
  } catch (fatal) {
    console.error('Blog function fatal error:', fatal);
    const cc = (context.params?.country || 'ng').toLowerCase();
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><title>Something went wrong</title>
      <meta name="robots" content="noindex"></head>
      <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="font-size:24px;margin-bottom:12px;">Something went wrong</h1>
        <p style="color:#666;margin-bottom:20px;">We couldn't load this page. Please try again in a moment.</p>
        <a href="/${cc}/blog" style="color:#2563eb;">← Back to blog</a>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }
}

async function handleRequest(context) {
  const { request, env } = context;
  const url  = new URL(request.url);
  const cc   = (context.params.country || 'ng').toLowerCase();
  const path = context.params.path || [];

  if (!['ng', 'gh', 'us'].includes(cc)) {
    return new Response('Not found', { status: 404 });
  }

  // Guard: if Supabase env vars are missing, return a clear error rather than 1101
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY not configured in Cloudflare Pages environment variables');
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><title>Configuration error</title>
      <meta name="robots" content="noindex"></head>
      <body style="font-family:sans-serif;padding:40px;">
        <h1>Blog temporarily unavailable</h1>
        <p>Please check back soon.</p>
        <a href="/${cc}/blog">← Back to blog</a>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }

  const categoryFromPath = path[0] ? path[0].toLowerCase() : 'all';
  const slugFromPath     = path[1] || null;
  const isKnownCategory  = CATEGORIES.some(c => c.slug === categoryFromPath);

  // ── Single article ────────────────────────────────────────────────────────
  if (isKnownCategory && slugFromPath) {
    let post = null;
    let publisherName = 'Staff', publisherBio = '', publisherAvatar = '';

    try {
      // Try slug column first (new articles), then fall back to id (old articles
      // whose URL was generated before the slug column existed — e.g. UUIDs)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugFromPath);

      if (isUuid) {
        const rows = await supabaseFetch(env, 'publisher_posts',
          `select=id,title,slug,description,intro,category,tags,cloudflare_url,publisher_id,created_at,updated_at&id=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
        );
        post = rows[0] || null;
        if (post && post.slug && post.slug !== slugFromPath) {
          const catSlug = normaliseCategorySlug(post.category);
          return new Response(null, {
            status: 301,
            headers: { 'Location': `/${cc}/blog/${catSlug}/${post.slug}` }
          });
        }
      } else {
        const rows = await supabaseFetch(env, 'publisher_posts',
          `select=id,title,slug,description,intro,category,tags,cloudflare_url,publisher_id,created_at,updated_at&slug=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
        );
        post = rows[0] || null;
        if (!post) {
          const fallback = await supabaseFetch(env, 'publisher_posts',
            `select=id,title,slug,description,intro,category,tags,cloudflare_url,publisher_id,created_at,updated_at&id=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
          );
          post = fallback[0] || null;
        }
      }
    } catch (err) { console.error('Article fetch:', err); }

    if (!post) {
      return new Response(
        `<!DOCTYPE html><html lang="${CC_LANG[cc]||'en'}"><head>
        <title>Article not found — ${SITE_NAME}</title>
        <meta name="robots" content="noindex">
        <link rel="canonical" href="${BASE}/${cc}/blog">
        </head>
        <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:12px;">Article not found</h1>
          <p style="color:#666;margin-bottom:20px;">This article may have been removed or is not yet approved.</p>
          <a href="/${cc}/blog" style="color:#2563eb;">← Back to blog</a>
        </body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
      );
    }

    try {
      const pubs = await supabaseFetch(env, 'publishers',
        `select=publisher_name,bio&user_id=eq.${encodeURIComponent(post.publisher_id)}&limit=1`);
      if (pubs[0]) { publisherName = pubs[0].publisher_name || publisherName; publisherBio = pubs[0].bio || ''; }
    } catch (_) {}

    try {
      const profiles = await supabaseFetch(env, 'profiles',
        `select=avatar_url&id=eq.${encodeURIComponent(post.publisher_id)}&limit=1`);
      if (profiles[0]) publisherAvatar = profiles[0].avatar_url || '';
    } catch (_) {}

    return new Response(
      buildArticleHtml({ cc, post, publisherName, publisherBio, publisherAvatar }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
          'Vary': 'Accept-Encoding',
        },
      }
    );
  }

  // ── Category listing ──────────────────────────────────────────────────────
  const category = isKnownCategory ? categoryFromPath : 'all';
  const page     = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = 12;
  const offset   = (page - 1) * pageSize;

  let posts = [], totalCount = 0;

  try {
    const catFilter = category === 'all' ? '' : `&category=eq.${encodeURIComponent(category)}`;

    const countRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/publisher_posts?select=id${catFilter}&status=eq.approved`,
      {
        headers: {
          'apikey':        env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Prefer':        'count=exact',
          'Range':         '0-0',
        },
      }
    );
    const cr = countRes.headers.get('Content-Range') || '0-0/0';
    totalCount = parseInt(cr.split('/')[1] || '0', 10);

    posts = await supabaseFetch(env, 'publisher_posts',
      `select=id,title,slug,description,category,cloudflare_url,tags,created_at,publisher_id${catFilter}&status=eq.approved&order=created_at.desc&limit=${pageSize}&offset=${offset}`
    );

    const pubIds = [...new Set(posts.map(p => p.publisher_id).filter(Boolean))];
    if (pubIds.length) {
      try {
        const pubs = await supabaseFetch(env, 'publishers',
          `select=user_id,publisher_name&user_id=in.(${pubIds.map(id => `"${id}"`).join(',')})`);
        const pubMap = {};
        pubs.forEach(p => { pubMap[p.user_id] = p.publisher_name; });
        posts = posts.map(p => ({ ...p, publisher_name: pubMap[p.publisher_id] || 'Staff' }));
      } catch (_) {}
    }
  } catch (err) { console.error('Listing fetch:', err); }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return new Response(
    buildListingHtml({ cc, category, posts, page, totalPages }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        'Vary': 'Accept-Encoding',
      },
    }
  );
}
