import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// ─── Environment variables required ───────────────────────────────────────────
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// PUBLISHER_GITHUB_OWNER, PUBLISHER_GITHUB_REPO, PUBLISHER_GITHUB_TOKEN  (optional)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeJsonString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '')
}

// ─── Extract FAQ pairs from the editor's faq-callout HTML blocks ──────────────
// The editor renders: <div class="callout-box faq-callout">…<strong>Q: </strong><span>…</span>…<strong>A: </strong><span>…</span>…</div>
interface FaqItem { question: string; answer: string }

function extractFaqs(htmlContent: string): FaqItem[] {
  const faqs: FaqItem[] = []
  // Match each faq-callout block
  const faqBlockRegex = /class="[^"]*faq-callout[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<(?:div|p|h[123456]|blockquote|ul|ol|figure|section)|$)/gi
  let blockMatch: RegExpExecArray | null
  while ((blockMatch = faqBlockRegex.exec(htmlContent)) !== null) {
    const block = blockMatch[1]
    // Q
    const qMatch = /Q:\s*<\/strong>\s*<span[^>]*>([\s\S]*?)<\/span>/i.exec(block)
    // A
    const aMatch = /A:\s*<\/strong>\s*<span[^>]*>([\s\S]*?)<\/span>/i.exec(block)
    if (qMatch && aMatch) {
      const question = qMatch[1].replace(/<[^>]+>/g, '').trim()
      const answer   = aMatch[1].replace(/<[^>]+>/g, '').trim()
      if (question && answer &&
          question !== 'What is your question?' &&
          answer   !== 'Type your answer here') {
        faqs.push({ question, answer })
      }
    }
  }
  return faqs
}

// ─── Extract Pro Tips text ────────────────────────────────────────────────────
interface ProTip { text: string }

function extractProTips(htmlContent: string): ProTip[] {
  const tips: ProTip[] = []
  // tips callout: class="callout-box" with title "💡 Pro Tip"
  const tipBlockRegex = /class="[^"]*callout-box[^"]*"[^>]*>[\s\S]*?Pro Tip[\s\S]*?<span[^>]*contenteditable[^>]*>([\s\S]*?)<\/span>/gi
  let m: RegExpExecArray | null
  while ((m = tipBlockRegex.exec(htmlContent)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text && text !== 'Add your important information here') {
      tips.push({ text })
    }
  }
  return tips
}

// ─── Extract Key Takeaways ────────────────────────────────────────────────────
function extractKeyTakeaways(htmlContent: string): string[] {
  const takeaways: string[] = []
  const regex = /Key Takeaway[\s\S]*?<span[^>]*contenteditable[^>]*>([\s\S]*?)<\/span>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(htmlContent)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text && text !== 'Add your important information here') takeaways.push(text)
  }
  return takeaways
}

// ─── Build JSON-LD structured data blocks ─────────────────────────────────────
function buildJsonLd(params: {
  title: string
  description: string
  thumbnailUrl: string
  publisherName: string
  datePublished: string
  faqs: FaqItem[]
  tips: ProTip[]
  canonicalUrl: string
}): string {
  const { title, description, thumbnailUrl, publisherName, datePublished, faqs, tips, canonicalUrl } = params

  const schemas: unknown[] = []

  // 1. Article schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || title,
    image: thumbnailUrl || undefined,
    author: { '@type': 'Person', name: publisherName },
    publisher: {
      '@type': 'Organization',
      name: 'MyExam Companion',
      logo: { '@type': 'ImageObject', url: 'https://myexamcompanion.com/logo.png' }
    },
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
  })

  // 2. FAQPage schema — only if we have real Q&A pairs
  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    })
  }

  // 3. HowTo schema — map Pro Tips as steps if 3+
  if (tips.length >= 3) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: title,
      description: description || title,
      step: tips.map((tip, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        text: tip.text
      }))
    })
  }

  return schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n')
}

// ─── Build the full SEO HTML page ─────────────────────────────────────────────
function buildSeoHtml(params: {
  title: string
  description: string
  intro: string
  content: string
  thumbnailUrl: string
  tags: string[]
  category: string
  publisherName: string
  publisherBio: string
  publisherAvatar: string
  datePublished: string
  canonicalUrl: string
  faqs: FaqItem[]
  tips: ProTip[]
  takeaways: string[]
}): string {
  const {
    title, description, intro, content, thumbnailUrl,
    tags, category, publisherName, publisherBio, publisherAvatar,
    datePublished, canonicalUrl, faqs, tips, takeaways
  } = params

  const jsonLd = buildJsonLd({ title, description, thumbnailUrl, publisherName, datePublished, faqs, tips, canonicalUrl })

  // Inline FAQ accordion rendered inside the article for readers (and Googlebot)
  const faqSection = faqs.length > 0 ? `
    <section class="faq-section" aria-label="Frequently Asked Questions">
      <h2 class="faq-heading">Frequently Asked Questions</h2>
      <div class="faq-list">
        ${faqs.map((f, i) => `
        <details class="faq-item" ${i === 0 ? 'open' : ''}>
          <summary class="faq-q">${escapeHtml(f.question)}</summary>
          <div class="faq-a">${escapeHtml(f.answer)}</div>
        </details>`).join('')}
      </div>
    </section>` : ''

  // Pro Tips sidebar cards
  const tipsSection = tips.length > 0 ? `
    <aside class="tips-aside" aria-label="Pro Tips">
      <div class="tips-heading">💡 Pro Tips</div>
      <ul class="tips-list">
        ${tips.map(t => `<li>${escapeHtml(t.text)}</li>`).join('')}
      </ul>
    </aside>` : ''

  // Key takeaways box
  const takeawaysSection = takeaways.length > 0 ? `
    <div class="takeaways-box" aria-label="Key Takeaways">
      <div class="takeaways-heading">⭐ Key Takeaways</div>
      <ul class="takeaways-list">
        ${takeaways.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
      </ul>
    </div>` : ''

  // Tags line
  const tagsHtml = tags.length > 0
    ? `<div class="article-tags" aria-label="Tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>

  <!-- Primary SEO -->
  <meta name="description" content="${escapeHtml(description || title)}">
  ${category ? `<meta name="keywords" content="${escapeHtml([category, ...tags].join(', '))}">` : ''}
  <meta name="author" content="${escapeHtml(publisherName)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

  <!-- Open Graph -->
  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description || title)}">
  ${thumbnailUrl ? `<meta property="og:image" content="${escapeHtml(thumbnailUrl)}">` : ''}
  <meta property="og:url"         content="${escapeHtml(canonicalUrl)}">
  <meta property="og:site_name"   content="MyExam Companion">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description || title)}">
  ${thumbnailUrl ? `<meta name="twitter:image" content="${escapeHtml(thumbnailUrl)}">` : ''}

  <!-- Article metadata -->
  <meta property="article:published_time" content="${datePublished}">
  <meta property="article:author"         content="${escapeHtml(publisherName)}">
  ${category ? `<meta property="article:section" content="${escapeHtml(category)}">` : ''}
  ${tags.map(t => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n  ')}

  <!-- JSON-LD Structured Data -->
  ${jsonLd}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --max-w: 740px;
      --body-font: 'Inter', system-ui, -apple-system, sans-serif;
      --serif-font: 'Playfair Display', Georgia, serif;
      --text: #1a1a1a;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #ffffff;
      --accent: #2563eb;
      --accent-red: #dc2626;
      --faq-bg: #f0fdf4;
      --faq-border: #16a34a;
      --tips-bg: #fffbeb;
      --tips-border: #f59e0b;
      --takeaway-bg: #eff6ff;
      --takeaway-border: #3b82f6;
    }

    html { scroll-behavior: smooth; font-size: 16px; }
    body { font-family: var(--body-font); color: var(--text); background: var(--bg); line-height: 1.7; -webkit-font-smoothing: antialiased; }

    /* ── Layout ── */
    .page-wrap  { max-width: var(--max-w); margin: 0 auto; padding: 48px 24px 96px; }

    /* ── Hero ── */
    .hero-img-wrap { border-radius: 16px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .hero-img-wrap img { width: 100%; display: block; object-fit: cover; max-height: 520px; }

    /* ── Headline ── */
    h1.article-title {
      font-family: var(--serif-font);
      font-size: clamp(28px, 5vw, 46px);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 20px;
      color: #111;
    }

    /* ── Meta line ── */
    .article-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13.5px; color: var(--muted); margin-bottom: 32px; }
    .meta-avatar  { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; background: #e5e7eb; }
    .meta-sep     { opacity: .4; }

    /* ── TOC ── */
    .toc-box { background: #f9fafb; border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; margin-bottom: 36px; }
    .toc-box h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); margin-bottom: 12px; }
    .toc-list { list-style: none; line-height: 2; font-size: 14px; }
    .toc-list li.toc-h3 { padding-left: 18px; font-size: 13px; }
    .toc-list a { color: var(--accent); text-decoration: none; }
    .toc-list a:hover { text-decoration: underline; }

    /* ── Body content ── */
    .article-body { font-size: 17.5px; line-height: 1.8; }
    .article-body p          { margin-bottom: 22px; color: #374151; }
    .article-body h2         { font-family: var(--serif-font); font-size: 26px; font-weight: 800; margin: 44px 0 18px; color: #111; scroll-margin-top: 80px; }
    .article-body h3         { font-size: 19px; font-weight: 700; margin: 30px 0 12px; color: #1f2937; scroll-margin-top: 80px; }
    .article-body ul, .article-body ol { margin: 0 0 22px; padding-left: 28px; color: #374151; }
    .article-body li         { margin-bottom: 8px; }
    .article-body strong     { color: #111; font-weight: 700; }
    .article-body a          { color: var(--accent-red); }
    .article-body a:hover    { text-decoration: underline; }
    .article-body img        { max-width: 100%; border-radius: 10px; margin: 28px 0; display: block; }
    .article-body figure     { margin: 28px 0; }
    .article-body figcaption { font-size: 12.5px; color: var(--muted); margin-top: 8px; text-align: center; }

    /* ── Blockquote ── */
    .article-body blockquote {
      position: relative;
      margin: 48px 0;
      padding: 36px 32px;
      text-align: center;
      font-family: var(--serif-font);
      font-size: clamp(20px, 3vw, 26px);
      font-style: italic;
      font-weight: 700;
      line-height: 1.45;
      color: #111;
      background: linear-gradient(to bottom, #fcfcfc, #f5f7fa);
      border-radius: 16px;
      border: 1px solid #eaeaea;
      box-shadow: 0 8px 28px rgba(0,0,0,.04), inset 0 1px 0 #fff;
    }
    .article-body blockquote::before {
      content: '\201C';
      position: absolute;
      top: -22px; left: 50%;
      transform: translateX(-50%);
      font-size: 80px; line-height: 1;
      color: var(--accent);
      font-family: var(--serif-font);
      background: #fff; padding: 0 10px;
    }

    /* ── Callout boxes (preserved from editor) ── */
    .article-body .callout-box {
      border: 1px solid; border-left: 4px solid;
      padding: 14px 16px; margin: 18px 0; border-radius: 8px;
      font-size: 15px; line-height: 1.65;
    }

    /* ── Intro paragraph ── */
    .intro-para {
      font-size: 18px; line-height: 1.85; color: #4b5563;
      font-weight: 500; margin-bottom: 28px;
      padding-bottom: 28px; border-bottom: 1px solid var(--border);
    }

    /* ── Key Takeaways box ── */
    .takeaways-box {
      background: var(--takeaway-bg);
      border: 1px solid var(--takeaway-border);
      border-left: 4px solid var(--takeaway-border);
      border-radius: 10px; padding: 18px 20px; margin: 32px 0;
    }
    .takeaways-heading { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #1d4ed8; margin-bottom: 12px; }
    .takeaways-list    { padding-left: 20px; font-size: 15px; color: #1e3a8a; line-height: 1.8; }

    /* ── Pro Tips aside ── */
    .tips-aside {
      background: var(--tips-bg);
      border: 1px solid var(--tips-border);
      border-left: 4px solid var(--tips-border);
      border-radius: 10px; padding: 18px 20px; margin: 32px 0;
    }
    .tips-heading { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #92400e; margin-bottom: 12px; }
    .tips-list    { padding-left: 20px; font-size: 15px; color: #78350f; line-height: 1.8; }

    /* ── FAQ section ── */
    .faq-section  { margin: 48px 0 36px; }
    .faq-heading  { font-family: var(--serif-font); font-size: 24px; font-weight: 800; color: #111; margin-bottom: 20px; }
    .faq-item     { border: 1px solid var(--faq-border); border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
    .faq-item[open] { background: var(--faq-bg); }
    .faq-q        { cursor: pointer; padding: 14px 18px; font-size: 15.5px; font-weight: 600; color: #166534; list-style: none; user-select: none; display: flex; justify-content: space-between; align-items: center; }
    .faq-q::after { content: '+'; font-size: 20px; font-weight: 400; flex-shrink: 0; margin-left: 10px; }
    .faq-item[open] .faq-q::after { content: '−'; }
    .faq-q::-webkit-details-marker { display: none; }
    .faq-a        { padding: 0 18px 16px; font-size: 15px; color: #166534; line-height: 1.7; }

    /* ── Tags ── */
    .article-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 36px 0; }
    .tag { font-size: 12.5px; font-weight: 600; padding: 5px 14px; border-radius: 999px; background: #f3f4f6; color: #4b5563; border: 1px solid var(--border); }

    /* ── Author box ── */
    .author-box {
      display: flex; gap: 16px; background: #f9fafb;
      border-radius: 14px; padding: 20px; margin: 40px 0;
      border: 1px solid var(--border);
    }
    .author-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #e5e7eb; }
    .author-name   { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .author-bio    { font-size: 13.5px; color: var(--muted); line-height: 1.55; }

    /* ── Print ── */
    @media print {
      .toc-box, .tips-aside { display: none; }
      .faq-item { border: 1px solid #ccc; }
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .page-wrap { padding: 28px 16px 64px; }
      h1.article-title { font-size: 26px; }
      .article-body { font-size: 16px; }
      .author-box { flex-direction: column; }
    }
  </style>
</head>
<body>
<div class="page-wrap">

  ${thumbnailUrl ? `<div class="hero-img-wrap"><img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(title)}" loading="eager" fetchpriority="high"></div>` : ''}

  <h1 class="article-title">${escapeHtml(title)}</h1>

  <div class="article-meta">
    ${publisherAvatar ? `<img class="meta-avatar" src="${escapeHtml(publisherAvatar)}" alt="${escapeHtml(publisherName)}" width="34" height="34">` : ''}
    <span>${escapeHtml(publisherName)}</span>
    <span class="meta-sep">·</span>
    <time datetime="${datePublished}">${new Date(datePublished).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</time>
  </div>

  <!-- Key Takeaways (above the fold) -->
  ${takeawaysSection}

  <!-- TOC — injected by JS below -->
  <nav class="toc-box" id="toc" aria-label="Table of Contents" style="display:none;">
    <h2>On this page</h2>
    <ul class="toc-list" id="tocList"></ul>
  </nav>

  ${intro ? `<p class="intro-para">${intro}</p>` : ''}

  <!-- Pro Tips (placed before body so readers see them early) -->
  ${tipsSection}

  <div class="article-body" id="articleBody">
    ${content}
  </div>

  <!-- FAQ accordion -->
  ${faqSection}

  ${tagsHtml}

  <div class="author-box">
    ${publisherAvatar ? `<img class="author-avatar" src="${escapeHtml(publisherAvatar)}" alt="${escapeHtml(publisherName)}" width="56" height="56">` : '<div class="author-avatar"></div>'}
    <div>
      <div class="author-name">${escapeHtml(publisherName)}</div>
      <div class="author-bio">${escapeHtml(publisherBio || '')}</div>
    </div>
  </div>

</div>

<script>
  // Build Table of Contents from h2/h3 in article body
  (function() {
    var body = document.getElementById('articleBody');
    if (!body) return;
    var headings = body.querySelectorAll('h2, h3');
    if (headings.length < 2) return;
    var toc = document.getElementById('toc');
    var list = document.getElementById('tocList');
    var h2c = 0, h3c = 0;
    headings.forEach(function(h, i) {
      var id = 'section-' + i;
      h.id = id;
      var li = document.createElement('li');
      if (h.tagName === 'H3') { li.className = 'toc-h3'; h3c++; } else { h2c++; h3c = 0; }
      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    toc.style.display = '';
  })();
</script>
</body>
</html>`
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header.')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')      ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`)

    // ── Payload ───────────────────────────────────────────────────────────────
    const body = await req.json()
    const {
      draft_id,
      title,
      description = '',
      intro       = '',
      content,
      thumbnail_url = '',
      topics        = [],
      category      = ''
    } = body

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Missing title or content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    // ── Fetch publisher profile for SEO ───────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')              ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: pubData } = await supabaseAdmin
      .from('publishers')
      .select('publisher_name, bio')
      .eq('user_id', user.id)
      .maybeSingle()

    const publisherName   = pubData?.publisher_name || user.email?.split('@')[0] || 'Publisher'
    const publisherBio    = pubData?.bio            || ''
    const publisherAvatar = '' // fetching from profiles is optional; can be added

    // ── Parse structured content ──────────────────────────────────────────────
    const faqs      = extractFaqs(content)
    const tips      = extractProTips(content)
    const takeaways = extractKeyTakeaways(content)

    // ── Build canonical URL using category slug ───────────────────────────────
    // Normalise to one of the 6 canonical slugs
    const VALID_CATEGORY_SLUGS = ['study-tips', 'exam-updates', 'guide', 'scholarships', 'school-news']
    const rawCatSlug = (category || 'guide').toLowerCase().replace(/\s+/g, '-')
    const categorySlug = VALID_CATEGORY_SLUGS.includes(rawCatSlug) ? rawCatSlug : 'guide'

    const slugBase    = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    // Add a short random suffix (6 hex chars) to guarantee uniqueness without a date prefix
    const randomSuffix = Math.random().toString(16).slice(2, 8)
    const articleSlug  = `${slugBase}-${randomSuffix}`
    const canonicalUrl = `https://myexamcompanion.com/ng/blog/${categorySlug}/${articleSlug}`

    // ── Build SEO HTML ────────────────────────────────────────────────────────
    const seoHtml = buildSeoHtml({
      title,
      description,
      intro,
      content,
      thumbnailUrl: thumbnail_url,
      tags:         Array.isArray(topics) ? topics : [],
      category:     categorySlug,
      publisherName,
      publisherBio,
      publisherAvatar,
      datePublished: new Date().toISOString(),
      canonicalUrl,
      faqs,
      tips,
      takeaways
    })

    // ── Commit to GitHub (optional — if env vars configured) ──────────────────
    const githubOwner = Deno.env.get('PUBLISHER_GITHUB_OWNER')
    const githubRepo  = Deno.env.get('PUBLISHER_GITHUB_REPO')
    const githubToken = Deno.env.get('PUBLISHER_GITHUB_TOKEN')
    let   githubUrl: string | null = null

    if (githubOwner && githubRepo && githubToken) {
      const fileName  = `articles/${Date.now()}-${slugBase}.html`
      const apiUrl    = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${fileName}`
      const encoded   = btoa(unescape(encodeURIComponent(seoHtml)))

      const ghRes = await fetch(apiUrl, {
        method:  'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type':  'application/json',
          'User-Agent':    'Supabase-Edge-Function'
        },
        body: JSON.stringify({ message: `Add article: ${title}`, content: encoded })
      })

      if (!ghRes.ok) {
        const err = await ghRes.text()
        console.error('GitHub API error:', err)
        // Non-fatal: continue without GitHub URL
      } else {
        githubUrl = `https://cdn.jsdelivr.net/gh/${githubOwner}/${githubRepo}/${fileName}`
      }
    }

    // ── Upsert Supabase record ────────────────────────────────────────────────
    // If draft_id exists, UPDATE that row (transitions draft → pending).
    // Otherwise INSERT a new row. Using service role to bypass RLS for the
    // status transition (publisher RLS only allows draft→draft updates).
    const rowData = {
      publisher_id:  user.id,
      title,
      description,
      intro,
      category:      categorySlug,           // stored as canonical slug
      tags:          Array.isArray(topics) ? topics : [],
      thumbnail_url: thumbnail_url || null,
      github_url:    githubUrl,
      rendered_html: seoHtml,
      slug:          articleSlug,            // used in the public URL
      status:        'pending',
      last_saved_at: new Date().toISOString()
    }

    let resultData, resultError

    if (draft_id) {
      const { data, error } = await supabaseAdmin
        .from('publisher_posts')
        .update(rowData)
        .eq('id', draft_id)
        .eq('publisher_id', user.id)
        .select()
        .single()
      resultData  = data
      resultError = error
    } else {
      const { data, error } = await supabaseAdmin
        .from('publisher_posts')
        .insert(rowData)
        .select()
        .single()
      resultData  = data
      resultError = error
    }

    if (resultError) {
      console.error('DB upsert error:', resultError)
      throw new Error(`Database error: ${resultError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, post: resultData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('post-submission error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
