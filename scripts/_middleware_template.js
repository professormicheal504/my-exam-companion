export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (url.hostname.endsWith('.pages.dev')) {
    return Response.redirect('https://myexamcompanion.com' + path + url.search, 301);
  }
  if (url.hostname === 'www.myexamcompanion.com') {
    return Response.redirect('https://myexamcompanion.com' + path + url.search, 301);
  }

  // ── Full SSR for Blog Article URLs ─────────────────────────────────────────
  const blogMatch = path.match(/^\/([a-z]{2})\/blog\/([\w-]+)\/([\w-]+)$/);
  if (blogMatch) {
    const country = blogMatch[1], category = blogMatch[2], slug = blogMatch[3];
    const r2Url = `https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/${country}/blog/${category}/${slug}.json`;
    let post = null;
    try { const r = await fetch(r2Url); if (r.ok) post = await r.json(); } catch(e) {}
    if (post) {
      const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const strip = h => h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      const canonical = `https://myexamcompanion.com/${country}/blog/${category}/${slug}`;
      const desc = (post.description||post.intro||post.title||'').slice(0,160);
      const image = post.thumbnail_url||'https://www.myexamcompanion.com/favicon.ico';
      const pubName = post.publisher_name||post.author||'MEC Staff';
      const firstName = pubName.split(' ')[0];
      const avatar = post.publisher_avatar_url||post.avatar_url||'';
      const bio = post.publisher_bio||'A contributor at My Exam Companion.';
      const thumbUrl = post.thumbnail_url||post.hero_image_url||'';
      const updated = post.updated_at||post.date||'';
      const dateIso = updated ? new Date(updated).toISOString() : '';
      const dateHuman = updated ? new Date(updated).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}) : '';
      const rawTags = post.tags||[];
      const tags = Array.isArray(rawTags) ? rawTags : String(rawTags).split(',').map(t=>t.trim()).filter(Boolean);
      const catLabel = {'study-tips':'Study Tips','exam-updates':'Exam Updates','guide':'Guide','scholarships':'Scholarships','school-news':'School News'}[category]||'Articles';

      let body = post.rendered_html||post.content||'';

      // ── Strategy 1: Extract ONLY the pure article prose from <div class="art-body">
      // The rendered_html stored in R2 is the full SSR page (sidebar, topbar, h1, TOC,
      // art-body, tags, author-box, footer). We only want the inner prose content.
      const artBodyMatch = body.match(/<div[^>]*\bclass="art-body"[^>]*>([\s\S]+?)(?=<div[^>]*\b(?:article-tags|author-box)\b|<\/div>\s*<\/div>\s*<\/div>\s*<app-footer)/i);
      if (artBodyMatch) {
        body = artBodyMatch[1];
      } else {
        // ── Strategy 2: Extract <body> then strip all layout shell elements
        const bm = body.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        body = bm ? bm[1] : body;
        // Remove entire web component trees
        body = body.replace(/<app-sidebar[\s\S]*?<\/app-sidebar>/gi,'');
        body = body.replace(/<app-topbar[\s\S]*?<\/app-topbar>/gi,'');
        body = body.replace(/<app-footer[\s\S]*?<\/app-footer>/gi,'');
        // Remove opening tags of layout wrappers (closing </div> tags left are harmless)
        body = body.replace(/<div[^>]+class="(?:app|main-wrapper|inner|page-wrap|progress-bar-container|progress-bar|hero-wrap)[^"]*"[^>]*>/gi,'');
        // Remove complete self-contained blocks that appear before or after the article prose
        body = body.replace(/<(?:nav|div)[^>]+class="[^"]*(?:crumbs|toc-box|art-meta|post-meta|article-tags|author-box|engagement-summary|action-bar|related-section|post-tags|hero-img-wrap)[^"]*"[^>]*>[\s\S]*?<\/(?:nav|div)>/gi,'');
        // Remove all h1 tags (the template re-adds the proper h1)
        body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi,'');
        // Remove script/style blocks that leaked in from the stored page
        body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'');
        body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'');
      }

      // Build TOC from h2/h3 headings
      const tocItems = []; let hi=0;
      const tocRe = /<(h[23])(?:\s[^>]*)?>([\s\S]*?)<\/h[23]>/gi; let tm;
      while((tm=tocRe.exec(body))!==null){ const t=strip(tm[2]).trim(); if(t) tocItems.push({lvl:tm[1],t,id:`sec-${hi++}`}); }
      let si=0;
      body = body.replace(/<(h[23])([^>]*)?>/gi,(_,tag,attrs)=>{
        if(attrs&&/\bid\s*=/.test(attrs)) return `<${tag}${attrs}>`;
        return `<${tag}${attrs||''} id="sec-${si++}">`;
      });
      const rt = Math.max(1,Math.round(strip(body).split(/\s+/).length/200));
      const tocHtml = tocItems.length>=2
        ? `<nav class="toc-box" aria-label="Table of contents"><h2>On this page</h2><ul class="toc-list">${tocItems.map(it=>`<li${it.lvl==='h3'?' class="h3"':''}><a href="#${it.id}">${esc(it.t)}</a></li>`).join('')}</ul></nav>`
        : '';
      const tagsHtml = tags.length ? `<div class="article-tags">${tags.map(t=>`<span class="tag-pill">${esc(t)}</span>`).join('')}</div>` : '';
      const heroHtml = thumbUrl ? `<div class="hero-wrap"><img src="${esc(thumbUrl)}" alt="${esc(post.title)}" width="1200" height="630" fetchpriority="high"></div>` : '';
      const avHtml = avatar ? `<img src="${esc(avatar)}" alt="${esc(firstName)}" width="34" height="34" loading="eager">` : '';
      const avLg = avatar ? `<img src="${esc(avatar)}" alt="${esc(firstName)}" width="56" height="56" loading="lazy">` : '<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;flex-shrink:0"></div>';

      const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(post.title)} | My Exam Companion</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/components/topbar.css">
<link rel="stylesheet" href="/components/dark-mode.css">
<link rel="stylesheet" href="/components/sidebar.css">
<link rel="stylesheet" href="/components/footer.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--accent:#2563eb;--red:#dc2626;--text:#1a1a1a;--muted:#6b7280;--border:#e5e7eb;--bg-base:#f7f7f7;--bg-card:#fff}
html{font-family:Inter,sans-serif;scroll-behavior:smooth;font-size:14px;-webkit-text-size-adjust:100%}
body{background:var(--bg-base);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{text-decoration:none;color:inherit}img{display:block;max-width:100%}
.app{display:flex;min-height:100vh}
.main-wrapper{margin-left:72px;flex:1;display:flex;flex-direction:column;min-height:100vh}
@media(max-width:600px){.main-wrapper{margin-left:0}}
.progress-bar-container{position:sticky;top:0;width:100%;height:3px;background:0 0;z-index:500}
.progress-bar{height:100%;background:#2563eb;width:0%;transition:width .1s}
.inner{flex:1;padding:24px 40px 80px}@media(max-width:640px){.inner{padding:12px 14px 60px}}
app-footer{display:block;width:100%}
.page-wrap{max-width:760px;margin:0 auto;background:var(--bg-card);padding:40px;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,.03)}
@media(max-width:640px){.page-wrap{padding:24px 16px;border-radius:16px}}
.crumbs{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#9aa0a6;margin-bottom:24px;flex-wrap:wrap}
.crumbs a{color:#9aa0a6}.crumbs a:hover{color:#2563eb}.crumbs .sep{opacity:.5}
.hero-wrap{border-radius:16px;overflow:hidden;margin-bottom:36px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
.hero-wrap img{width:100%;display:block;object-fit:cover;max-height:520px}
h1.art-title{font-family:"Playfair Display",Georgia,serif;font-size:clamp(26px,5vw,44px);font-weight:800;line-height:1.15;margin-bottom:18px;color:#111}
.art-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13.5px;color:var(--muted);margin-bottom:32px}
.art-meta img{width:34px;height:34px;border-radius:50%;object-fit:cover}.art-meta .author-name{color:var(--text);font-weight:600}.art-meta .sep{opacity:.4}
.toc-box{background:#f9fafb;border:1px solid var(--border);border-radius:12px;padding:18px 22px;margin-bottom:32px}
.toc-box h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:10px}
.toc-list{list-style:none;font-size:14px;line-height:2}.toc-list li.h3{padding-left:16px;font-size:13px}
.toc-list a{color:#2563eb}.toc-list a:hover{text-decoration:underline}
.art-body{font-size:17px;line-height:1.82}.art-body p{margin-bottom:22px;color:#374151}
.art-body h2{font-family:"Playfair Display",Georgia,serif;font-size:25px;font-weight:800;margin:44px 0 16px;color:#111;scroll-margin-top:72px}
.art-body h3{font-size:18px;font-weight:700;margin:28px 0 10px;color:#1f2937;scroll-margin-top:72px}
.art-body ul,.art-body ol{margin:0 0 22px;padding-left:26px;color:#374151}.art-body li{margin-bottom:7px}
.art-body strong{color:#111;font-weight:700}.art-body a{color:#dc2626;text-decoration:underline}
.art-body img{max-width:100%;border-radius:10px;margin:28px 0;display:block}
.art-body blockquote{border-left:3px solid #dc2626;padding:4px 0 4px 18px;font-style:italic;color:var(--muted);font-size:16px;margin:20px 0}
.art-body figure{margin:28px 0}.art-body figcaption{font-size:12.5px;color:var(--muted);margin-top:8px;text-align:center}
.article-tags{display:flex;flex-wrap:wrap;gap:8px;margin:32px 0}
.tag-pill{font-size:12.5px;font-weight:600;padding:5px 14px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.author-box{display:flex;gap:16px;background:#f9fafb;border-radius:14px;padding:20px;margin:40px 0;border:1px solid var(--border)}
.author-box img,.author-box div:first-child{width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0;background:#e5e7eb}
.author-name-lg{font-size:17px;font-weight:800;margin-bottom:4px;color:#111}.author-bio{font-size:14.5px;color:var(--muted);line-height:1.55}
</style>
<script>(function(){try{var t=localStorage.getItem('mec_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()</script>
</head><body>
<div class="app">
  <app-sidebar data-base="/"></app-sidebar>
  <div class="main-wrapper">
    <app-topbar data-base="/"></app-topbar>
    <div class="progress-bar-container"><div class="progress-bar" id="reading-progress"></div></div>
    <div class="inner">
      <div class="page-wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="/${country}">Home</a> <span class="sep">/</span>
          <a href="/${country}/blog">Blog</a> <span class="sep">/</span>
          <a href="/${country}/blog/${category}">${catLabel}</a> <span class="sep">/</span>
          <span aria-current="page">${esc(post.title)}</span>
        </nav>
        ${heroHtml}
        <h1 class="art-title">${esc(post.title)}</h1>
        <div class="art-meta">
          ${avHtml}
          <span class="author-name">${esc(firstName)}</span>
          <span class="sep">·</span>
          <time datetime="${dateIso}">${dateHuman}</time>
          <span class="sep">·</span>
          <span>${rt} min read</span>
        </div>
        ${tocHtml}
        <div class="art-body">${body}</div>
        ${tagsHtml}
        <div class="author-box">
          ${avLg}
          <div>
            <div class="author-name-lg">About ${esc(firstName)}</div>
            <div class="author-bio">${esc(bio)}</div>
          </div>
        </div>
      </div>
    </div>
    <app-footer data-base="/"></app-footer>
  </div>
</div>
<script src="/components/nav.js" defer></script>
<script src="/components/topbar.js" defer></script>
<script src="/components/sidebar.js" defer></script>
<script src="/components/footer.js" defer></script>
<script>
document.addEventListener('scroll',function(){
  var s=window.scrollY,d=document.body.scrollHeight-window.innerHeight;
  var pb=document.getElementById('reading-progress');
  if(pb&&d>0)pb.style.width=Math.min(100,Math.round(s/d*100))+'%';
});
</script>
</body></html>`;

      const respHeaders = { 'Content-Type': 'text/html;charset=UTF-8', 'X-Robots-Tag': 'index, follow' };
      if (updated) respHeaders['Last-Modified'] = new Date(updated).toUTCString();
      return new Response(html, { status: 200, headers: respHeaders });
    }
  }

  const exactRoutes = /*EXACT_ROUTES*/;
  const prefixRoutes = /*PREFIX_ROUTES*/;

  if (exactRoutes[path]) {
    return context.env.ASSETS.fetch(new Request(new URL(exactRoutes[path], context.request.url).toString(), context.request));
  }

  for (const [prefix, dest] of Object.entries(prefixRoutes)) {
    if (path.startsWith(prefix)) {
      return context.env.ASSETS.fetch(new Request(new URL(dest, context.request.url).toString(), context.request));
    }
  }

  return context.next();
}
