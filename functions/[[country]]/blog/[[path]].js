/**
 * Edge SSR â€” Blog
 *
 * Routes handled:
 *   /:cc/blog                          â†’ blog listing (all categories)
 *   /:cc/blog/:category                â†’ category listing
 *   /:cc/blog/:category/:slug          â†’ single article (full SSR)
 *
 * The country code (:cc) is read from the URL slug (ng / gh / us).
 * Googlebot receives a complete, JS-free HTML document on every route.
 * Google AdSense ads are injected via pre-defined slots.
 */

// â”€â”€ Category definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES = [
  { slug: 'all',           label: 'All' },
  { slug: 'study-tips',    label: 'Study Tips' },
  { slug: 'exam-updates',  label: 'Exam Updates' },
  { slug: 'guide',         label: 'Guide' },
  { slug: 'scholarships',  label: 'Scholarships' },
  { slug: 'school-news',   label: 'School News' },
];

// Map country code â†’ BCP-47 language tag for <html lang>
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

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BASE = 'https://myexamcompanion.com';
const SITE_NAME = 'MyExam Companion';
const LOGO_URL  = `${BASE}/logos/logo.png`;
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'; // â† replace with real publisher ID

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

// AdSense â€” push call is inlined but uses a safe pattern
function adSlot(slotId, label) {
  return `<div class="ad-wrap" aria-label="Advertisement" data-slot="${label}">
  <ins class="adsbygoogle" style="display:block;text-align:center;"
       data-ad-layout="in-article" data-ad-format="fluid"
       data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${slotId}"></ins>
</div>`;
}

// AdSense init â€” single push block at bottom of <body>, not per-slot
// Note: closing script tag is split to prevent esbuild from treating it as
// the end of the JS module when this string is embedded in bundled output.
const ADSENSE_INIT = '<script>\n' +
  '(window.adsbygoogle=window.adsbygoogle||[]).forEach?0:(adsbygoogle=[]);\n' +
  'document.querySelectorAll(\'.adsbygoogle\').forEach(function(){(adsbygoogle=window.adsbygoogle||[]).push({});});\n' +
  '<\/script>';

// â”€â”€ Supabase REST helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ LISTING PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildListingHtml({ cc, category, posts, page, totalPages }) {
  const lang       = CC_LANG[cc] || 'en';
  const catLabel   = getCategoryLabel(category);
  const catIsAll   = category === 'all';
  const pageTitle  = catIsAll
    ? `Blog â€” ${SITE_NAME}`
    : `${catLabel} Articles â€” ${SITE_NAME}`;
  const description = catIsAll
    ? `Study tips, exam updates, scholarship guides and school news for ${cc === 'ng' ? 'Nigerian' : cc === 'gh' ? 'Ghanaian' : ''} students on ${SITE_NAME}.`
    : `Latest ${catLabel} articles for students. Find expert guides, tips and news on ${SITE_NAME}.`;
  const canonicalBase = `${BASE}/${cc}/blog${catIsAll ? '' : '/' + category}`;
  const canonicalUrl  = page > 1 ? `${canonicalBase}?page=${page}` : canonicalBase;

  // WebSite schema with SearchAction â€” appears once on the listing root, great for sitelinks
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
        ${p.description ? `<p class="card-desc">${esc(p.description.substring(0, 120))}â€¦</p>` : ''}
        <div class="card-meta">
          <span>${esc(p.publisher_name || 'Staff')}</span>
          <span class="sep" aria-hidden="true">Â·</span>
          <time datetime="${p.created_at || ''}">${date}</time>
          <span class="sep" aria-hidden="true">Â·</span>
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
      ? `<a href="${canonicalBase}${page - 1 > 1 ? '?page=' + (page - 1) : ''}" class="page-btn" rel="prev">â† Previous</a>`
      : '<span class="page-btn disabled" aria-disabled="true">â† Previous</span>'}
    <span class="page-info">Page ${page} of ${totalPages}</span>
    ${page < totalPages
      ? `<a href="${canonicalBase}?page=${page + 1}" class="page-btn" rel="next">Next â†’</a>`
      : '<span class="page-btn disabled" aria-disabled="true">Next â†’</span>'}
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

// â”€â”€ ARTICLE PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Only use real image URLs â€” never base64 (can be megabytes, crashes the Worker)
  const thumbUrl = post.cloudflare_url || null;

  // Build article body from lightweight fields â€” rendered_html is NOT fetched
  // in the list query to avoid hitting Worker memory limits.
  // The intro + description gives Googlebot enough content to index well.
  const articleBody = post.intro
    ? `<p class="intro-para">${post.intro}</p>
       <p style="color:#6b7280;font-size:15px;line-height:1.7;margin-top:24px;">
         ${desc ? esc(desc) : ''}
       </p>`
    : `<p style="color:#6b7280;">Content loadingâ€¦</p>`;

  const tocItems = '';
  const rt = 5;

  // â”€â”€ JSON-LD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const pageTitle = `${post.title} â€” ${catLabel} | ${SITE_NAME}`;

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
    <span class="sep" aria-hidden="true">Â·</span>
    <time datetime="${dateIso}" itemprop="datePublished">${dateHuman}</time>
    <meta itemprop="dateModified" content="${modIso}">
    <span class="sep" aria-hidden="true">Â·</span>
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

// â”€â”€ Main handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function onRequest(context) {
  // Tell Pages to fall through to static assets if something completely unexpected happens
  context.passThroughOnException();

  // â”€â”€ Outer safety net â€” never let a raw exception produce Error 1101 â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const result = await handleRequest(context);
    if (!(result instanceof Response)) {
      console.error('Blog handleRequest returned non-Response:', typeof result);
      throw new Error('handleRequest must return a Response');
    }
    return result;
  } catch (fatal) {
    console.error('Blog function fatal error:', fatal?.message || String(fatal), fatal?.stack);
    const cc = (context.params?.country || 'ng').toLowerCase();
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><title>Something went wrong</title>
      <meta name="robots" content="noindex"></head>
      <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="font-size:24px;margin-bottom:12px;">Something went wrong</h1>
        <p style="color:#666;margin-bottom:20px;">We couldn't load this page. Please try again in a moment.</p>
        <a href="/${cc}/blog" style="color:#2563eb;">â† Back to blog</a>
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
        <a href="/${cc}/blog">â† Back to blog</a>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }

  const categoryFromPath = path[0] ? path[0].toLowerCase() : null;
  const slugFromPath     = path[1] || null;
  const isKnownCategory  = CATEGORIES.some(c => c.slug === categoryFromPath);

  // â”€â”€ Listing & category pages â†’ redirect to categories.html SPA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ── Listing & category pages → serve embedded categories.html content ──
  // This serves the blog listing page content at /ng/blog while preserving the URL
  if (!slugFromPath) {
    const lang = CC_LANG[cc] || 'en';
    const pageTitle = `Blog — Study Tips, Exam Updates & Guides | ${SITE_NAME}`;
    const description = `Practical study tips, exam registration updates, scholarship guides, and ${cc === 'ng' ? 'JAMB/WAEC' : 'exam'} news to help students prepare with confidence.`;
    const canonicalUrl = `${url.origin}/${cc}/blog`;

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<script>
  /* Anti-flash: apply saved theme before first paint */
  (function() {
    try {
      var t = localStorage.getItem('mec_theme') || 'light';
      document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
  })();
</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${BASE}/assets/og-blog.png">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(pageTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:site" content="@myexamcompanion">

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "${SITE_NAME} Blog",
    "description": "${esc(description)}",
    "url": "${canonicalUrl}",
    "publisher": {
      "@type": "Organization",
      "name": "${SITE_NAME}",
      "logo": { "@type": "ImageObject", "url": "${BASE}/favicon.ico" }
    }
  }
  </script>

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='10' fill='%232563eb'/><text x='50%25' y='50%25' font-family='sans-serif' font-weight='800' font-size='22' fill='white' dominant-baseline='central' text-anchor='middle'>M</text></svg>">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet">

  <!-- App Shell -->
  <link rel="stylesheet" href="/components/topbar.css?v=13">
  <link rel="stylesheet" href="/components/dark-mode.css">
  <link rel="stylesheet" href="/components/sidebar.css?v=23">
  <link rel="stylesheet" href="/components/footer.css">

  <style>
    /* == Reset ================================================== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-family: 'Inter', sans-serif; scroll-behavior: smooth; font-size: 14px; -webkit-text-size-adjust: 100%; }
    body { background: var(--bg-base, #F7F7F7); color: var(--text-primary, #1a1a1a); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }
    img { display: block; max-width: 100%; }
    ul, ol { list-style: none; }
    button { background: none; border: none; cursor: pointer; font-family: inherit; }

    /* == App Shell =============================================== */
    .app { display: flex; min-height: 100vh; }
    .main-wrapper { margin-left: 72px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; }
    @media (max-width: 600px) { .main-wrapper { margin-left: 0; } }

    /* == Content area =========================================== */
    .content { flex: 1; background: var(--bg-card, #fff); border-radius: 20px 0 0 0; padding: 32px 40px 80px; }
    .wrap { max-width: 760px; margin: 0 auto; }

    /* == Page header ============================================ */
    .page-head { margin-bottom: 22px; }
    .page-head h1 { font-size: 26px; font-weight: 800; margin: 0 0 6px; color: var(--text-primary); }
    .page-head p { color: #8b929b; margin: 0; font-size: 14.5px; }

    /* == Topic tabs ============================================= */
    .topic-tabs {
      display: flex; gap: 8px; flex-wrap: wrap;
      margin-bottom: 26px; padding-bottom: 18px;
      border-bottom: 1px solid var(--border, #ececec);
    }
    .topic-tab {
      font-size: 13.5px; font-weight: 600; padding: 8px 16px; border-radius: 999px;
      border: 1px solid var(--border, #e5e5e5); background: var(--bg-card, #fff);
      color: #6b7280; cursor: pointer; transition: all 0.15s;
    }
    .topic-tab:hover { border-color: #2563eb; color: #2563eb; }
    .topic-tab.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    [data-theme="dark"] .topic-tab.active { background: #f8fafc; color: #0f172a; border-color: #f8fafc; }

    .no-results { display: none; padding: 40px 0; text-align: center; color: #9aa0a6; font-size: 14.5px; }
    .no-results.show { display: block; }

    /* == Post card ============================================== */
    .post-card {
      border: 1px solid var(--border, #ececec); border-radius: 16px; overflow: hidden;
      margin-bottom: 20px; background: var(--bg-card, #fff);
      transition: box-shadow 0.2s, transform 0.2s;
      display: block; color: inherit;
    }
    .post-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }

    .thumb { height: 190px; position: relative; overflow: hidden; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
    .post-card:hover .thumb img { transform: scale(1.03); }
    .thumb .tag {
      position: absolute; top: 14px; left: 14px;
      background: rgba(255,255,255,0.92); color: #2563eb;
      font-size: 11.5px; font-weight: 700; padding: 5px 12px; border-radius: 999px;
    }

    .card-body { padding: 18px 20px 6px; }
    .card-body h2 { font-size: 18px; margin: 0 0 8px; font-weight: 700; line-height: 1.35; color: var(--text-primary); }
    .card-body p { margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.5; }
    .card-meta { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #9aa0a6; margin-bottom: 4px; }
    .avatar-sm { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }

    /* == Engagement row ========================================= */
    .eng-row {
      display: flex; align-items: center; gap: 18px;
      font-size: 13px; color: #6b7280;
      padding: 12px 0; border-top: 1px solid var(--border, #f1f1f1); margin-top: 6px;
    }
    .eng-item { display: flex; align-items: center; gap: 6px; }
    .eng-item svg { width: 17px; height: 17px; stroke: currentColor; stroke-width: 1.8; fill: none; }
    .eng-item.like { color: #2563eb; }

    /* == Loading / empty states ================================= */
    .loading-state { padding: 60px 24px; text-align: center; color: #9aa0a6; font-size: 14.5px; }
    .skeleton-card {
      border-radius: 16px; overflow: hidden; margin-bottom: 20px;
      background: var(--bg-card, #fff); border: 1px solid var(--border, #ececec);
    }
    .skel-thumb { height: 190px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
    .skel-body { padding: 18px 20px 20px; }
    .skel-line { height: 14px; border-radius: 6px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 10px; }
    .skel-line.short { width: 55%; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* == Mobile ================================================= */
    @media (max-width: 640px) {
      .content { border-radius: 0; padding: 22px 16px 60px; }
    }
  </style>
</head>

<body>
<div class="app">
  <!-- Sidebar web component -->
  <app-sidebar></app-sidebar>

  <div class="main-wrapper">
    <!-- Topbar web component -->
    <app-topbar></app-topbar>

    <main class="content" id="main-content">
      <div class="wrap">

        <div class="page-head">
          <h1>Blog</h1>
          <p>Study tips, exam updates, and guides — picked for you.</p>
        </div>

        <!-- Topic filter tabs -->
        <nav class="topic-tabs" aria-label="Filter posts by topic" role="tablist" id="topicTabsNav">
          <button class="topic-tab active" data-topic="all" role="tab" aria-selected="true">All</button>
          <button class="topic-tab" data-topic="Study Tips" role="tab" aria-selected="false">Study Tips</button>
          <button class="topic-tab" data-topic="Exam Updates" role="tab" aria-selected="false">Exam Updates</button>
          <button class="topic-tab" data-topic="Guides" role="tab" aria-selected="false">Guides</button>
          <button class="topic-tab" data-topic="Scholarships" role="tab" aria-selected="false">Scholarships</button>
          <button class="topic-tab" data-topic="School News" role="tab" aria-selected="false">School News</button>
        </nav>

        <!-- Dynamic article list -->
        <section aria-label="Blog posts" id="postList">
          <!-- Skeleton placeholders while loading -->
          <div class="skeleton-card"><div class="skel-thumb"></div><div class="skel-body"><div class="skel-line"></div><div class="skel-line short"></div></div></div>
          <div class="skeleton-card"><div class="skel-thumb"></div><div class="skel-body"><div class="skel-line"></div><div class="skel-line short"></div></div></div>
          <div class="skeleton-card"><div class="skel-thumb"></div><div class="skel-body"><div class="skel-line"></div><div class="skel-line short"></div></div></div>
        </section>

        <p class="no-results" id="noResults" role="status">No posts in this topic yet — check back soon.</p>

      </div>
    </main>

    <app-footer></app-footer>
  </div><!-- /main-wrapper -->
</div><!-- /app -->

<!-- Scripts -->
<script src="/components/nav.js" defer></script>
<script src="/components/topbar.js?v=4" defer></script>
<script src="/components/sidebar.js?v=20" defer></script>
<script src="/components/footer.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/components/supabase.js"></script>

<script>
  let allPosts = [];

  // ── Helpers ──────────────────────────────────────────────────────────────
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7)   return days + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getReadTime(post) {
    const src = (post.rendered_html || (post.description || '') + ' ' + (post.intro || ''));
    const words = src.replace(/<[^>]+>/g, ' ').split(/\\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
  }

  function getCategoryLabel(slug) {
    const map = {
      'study-tips':   'Study Tips',
      'exam-updates': 'Exam Updates',
      'guide':        'Guide',
      'scholarships': 'Scholarships',
      'school-news':  'School News',
    };
    return map[slug] || (slug ? slug.replace(/-/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase()) : 'Article');
  }

  // ── Build clean article URL ───────────────────────────────────────────────
  function articleHref(post) {
    const cc       = '${cc}';
    const catSlug  = post.category || 'guide';
    const artSlug  = post.slug || post.id;
    return \`/\${cc}/blog/\${catSlug}/\${artSlug}\`;
  }

  // ── Render post cards ─────────────────────────────────────────────────────
  function renderPosts(posts) {
    const list      = document.getElementById('postList');
    const noResults = document.getElementById('noResults');

    if (!posts || posts.length === 0) {
      list.innerHTML = '';
      noResults.classList.add('show');
      return;
    }
    noResults.classList.remove('show');

    list.innerHTML = posts.map(post => {
      const catLabel = getCategoryLabel(post.category);
      const date     = timeAgo(post.created_at);
      const href     = articleHref(post);
      const desc     = post.description || post.intro || '';
      const authorName   = post.publisher_name || 'MEC Staff';
      const authorAvatar = post.avatar_url || '';

      const imgSrc = post.cloudflare_url;
      const img = imgSrc
        ? \`<img src="\${imgSrc}" alt="\${(post.title || '').replace(/"/g, '&quot;')}" loading="lazy">\`
        : \`<div style="width:100%;height:100%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:13px;color:#aaa;">No image</div>\`;

      return \`
        <article class="post-card" itemscope itemtype="https://schema.org/BlogPosting">
          <a href="\${href}" aria-label="\${(post.title || '').replace(/"/g, '&quot;')}">
            <div class="thumb">
              \${img}
              <span class="tag">\${catLabel}</span>
            </div>
            <div class="card-body">
              <h2 itemprop="headline">\${post.title || 'Untitled'}</h2>
              \${desc ? \`<p itemprop="description">\${desc.substring(0, 140)}\${desc.length > 140 ? '…' : ''}</p>\` : ''}
              <div class="card-meta">
                \${authorAvatar ? \`<img class="avatar-sm" src="\${authorAvatar}" alt="\${authorName}" loading="lazy">\` : ''}
                <span itemprop="author" itemscope itemtype="https://schema.org/Person">
                  <span itemprop="name">\${authorName}</span>
                </span>
                <span>&middot;</span>
                <time itemprop="datePublished" datetime="\${post.created_at || ''}">\${date}</time>
                <span>&middot;</span>
                <span>\${getReadTime(post)}</span>
              </div>
              <div class="eng-row" role="group" aria-label="Post stats">
                <div class="eng-item like">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"></path></svg>
                  \${post.likes_count || 0}
                </div>
                <div class="eng-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  \${post.comments_count || 0}
                </div>
                <div class="eng-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                  \${post.shares_count || 0}
                </div>
              </div>
            </div>
          </a>
        </article>\`;
    }).join('');
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('postList');

    if (typeof window.MECSupabase === 'undefined') {
      list.innerHTML = '<p class="loading-state">Unable to load posts right now. Please try again later.</p>';
      return;
    }

    const sb = window.MECSupabase.getSupabase();

    const { data: posts, error } = await sb
      .from('publisher_posts')
      .select('id, title, slug, description, intro, category, tags, cloudflare_url, created_at, publisher_id, likes_count, comments_count, shares_count')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Blog fetch error:', error);
      list.innerHTML = '<p class="loading-state">Failed to load posts. Please refresh.</p>';
      return;
    }

    let enriched = posts || [];
    if (enriched.length > 0) {
      const pubIds = [...new Set(enriched.map(p => p.publisher_id).filter(Boolean))];
      if (pubIds.length) {
        try {
          const { data: pubs } = await sb
            .from('publishers')
            .select('user_id, publisher_name');
          const { data: profiles } = await sb
            .from('profiles')
            .select('id, avatar_url');
          const pubMap  = {};
          const avatarMap = {};
          (pubs     || []).forEach(p => { pubMap[p.user_id]   = p.publisher_name; });
          (profiles || []).forEach(p => { avatarMap[p.id]      = p.avatar_url;     });
          enriched = enriched.map(p => ({
            ...p,
            publisher_name: pubMap[p.publisher_id]   || 'MEC Staff',
            avatar_url:     avatarMap[p.publisher_id] || '',
          }));
        } catch (_) {}
      }
    }

    allPosts = enriched;

    if (allPosts.length === 0) {
      list.innerHTML = '';
      document.getElementById('noResults').classList.add('show');
      return;
    }

    renderPosts(allPosts);

    // ── Category tab filtering ────────────────────────────────────────────
    const TAB_TO_SLUG = {
      'all':          'all',
      'Study Tips':   'study-tips',
      'Exam Updates': 'exam-updates',
      'Guides':       'guide',
      'Scholarships': 'scholarships',
      'School News':  'school-news',
    };

    document.querySelectorAll('.topic-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.topic-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const topic    = tab.dataset.topic;
        const catSlug  = TAB_TO_SLUG[topic] || topic.toLowerCase().replace(/\\s+/g, '-');
        const filtered = catSlug === 'all'
          ? allPosts
          : allPosts.filter(p => (p.category || '') === catSlug);
        renderPosts(filtered);
      });
    });
  });
</script>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        'Vary': 'Accept-Encoding',
      },
    });
  }

  // â”€â”€ Single article â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isKnownCategory && slugFromPath) {
    let post = null;
    let publisherName = 'Staff', publisherBio = '', publisherAvatar = '';

    try {
      // Try slug column first (new articles), then fall back to id (old articles
      // whose URL was generated before the slug column existed â€” e.g. UUIDs)
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
        <title>Article not found â€” ${SITE_NAME}</title>
        <meta name="robots" content="noindex">
        <link rel="canonical" href="${BASE}/${cc}/blog">
        </head>
        <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
          <h1 style="font-size:24px;margin-bottom:12px;">Article not found</h1>
          <p style="color:#666;margin-bottom:20px;">This article may have been removed or is not yet approved.</p>
          <a href="/${cc}/blog" style="color:#2563eb;">â† Back to blog</a>
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

  // â”€â”€ Unknown path with slug but unrecognised category â†’ try SSR anyway â”€â”€â”€
  // Fall back to redirect to listing if we can't serve the article.
  if (!isKnownCategory) {
    return Response.redirect(`${url.origin}/modules/blog/categories.html`, 302);
  }

  // (Dead code path â€” all listing routes already redirected above)
  return Response.redirect(`${url.origin}/modules/blog/categories.html`, 302);
}
