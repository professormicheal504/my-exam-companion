# My Exam Companion — Advanced URL Architecture Plan
> **Version:** 1.1 | **Status:** Updated for Review | **Author:** Architecture Team

---

## 1. Executive Summary

This document defines the complete URL architecture migration from the current flat-path structure to a **country-prefixed, SEO-first URL hierarchy**. Every route is scoped under a two-letter country slug (`/ng`, `/gh`, `/us`), making URLs meaningful to search engines, enabling per-country sitemap generation, and delivering AEO (Answer Engine Optimisation) structured data at every page level.

---

## 2. Supported Countries

| Slug | Country | Existing Config Key |
|------|---------|---------------------|
| `ng` | Nigeria | `ng` |
| `gh` | Ghana   | `gh` |
| `us` | USA     | `us` |

> **Country detection order:** (1) URL slug -> (2) localStorage.mec_country -> (3) browser navigator.language -> (4) default `ng`

---

## 3. Complete URL Map (Old -> New)

### 3.1 Root & Country Entry

| Page | Old URL | New URL |
|------|---------|---------|
| Global Landing | `/` | `/` (unchanged -- shows country picker) |
| Nigeria Home | `/modules/index.html` | `/ng` |
| Ghana Home | -- | `/gh` |
| USA Home | -- | `/us` |

---

### 3.2 Study Section  `/[country]/study/...`

| Page | Old URL | New URL | Notes |
|------|---------|---------|-------|
| Classroom (subject picker) | `/modules/study/classroom/classroom_subject.html` | `/[cc]/study/classroom` | |
| Classroom Questions | `/modules/study/classroom/classroom_questions.html` | `/[cc]/study/classroom/[exam]/[subject]` | |
| Classroom Explanation | `/modules/study/classroom/classroom_explanation.html` | `/[cc]/study/classroom/[exam]/[subject]/[topic]` | |
| Study Past Questions | `/modules/study/study_past_questions/study_subject.html` | `/[cc]/study/past-questions` | |
| Past Q Player | `/modules/study/study_past_questions/study_past_questions.html` | `/[cc]/study/past-questions/[exam]/[subject]/[year]` | |
| Study Explanation | `/modules/study/study_past_questions/study_explanation.html` | `/[cc]/study/past-questions/[exam]/[subject]/[year]/[q]` | |
| Novel | `/modules/study/novel/novel.html` | `/[cc]/study/novel` | NG only |
| JAMB Syllabus | `/modules/study/syllabus/syllabus.html` | `/[cc]/study/syllabus` | NG only |
| Brochure | `/modules/study/brochure/brochure.html` | `/[cc]/study/brochure` | NG only |
| Topic Video Lessons | `/modules/study/topic_video/topic_video.html` | `/[cc]/study/videos` | |
| Scholarships | `/modules/study/scholarship/list_of_scholarship.html` | `/[cc]/study/scholarships` | |

> `[cc]` = country code (`ng` / `gh` / `us`), `[exam]` = exam body slug (e.g. `jamb`, `waec`), `[subject]` = subject slug, `[year]` = 4-digit year

---

### 3.3 Test / CBT Section  `/[country]/test/...`

| Page | Old URL | New URL |
|------|---------|---------|
| CBT Setup (exam picker) | `/modules/cbt_test/core/setup.html` | `/[cc]/test` |
| CBT Instruction | `/modules/cbt_test/core/instruction.html` | `/[cc]/test/[exam]/[subject]/[year]/instruction` |
| CBT Player | `/modules/cbt_test/core/cbt_player.html` | `/[cc]/test/[exam]/[subject]/[year]/play` |
| CBT Result | `/modules/cbt_test/core/result.html` | `/[cc]/test/result` |
| Deep Analysis | `/modules/cbt_test/core/deep_analysis.html` | `/[cc]/test/analysis` |
| JAMB Mock (date picker) | `/modules/cbt_test/jamb_mock_exam/mock_date_and_point.html` | `/[cc]/test/jamb-mock` |
| JAMB Mock Subjects | `/modules/cbt_test/jamb_mock_exam/subject.html` | `/[cc]/test/jamb-mock/[session]` |
| Live Arena | `/modules/cbt_test/live_quiz_arena/exam_body.html` | `/[cc]/test/live-arena` |
| Secondary School | `/modules/cbt_test/secondary_school/all_classes.html` | `/[cc]/test/secondary` |
| Secondary Subjects | `/modules/cbt_test/secondary_school/subjects.html` | `/[cc]/test/secondary/[class]` |
| Secondary Topics | `/modules/cbt_test/secondary_school/topic.html` | `/[cc]/test/secondary/[class]/[subject]` |
| Post-UTME Hub | `/modules/cbt_test/core/university_exam_post_utme.html` | `/[cc]/test/post-utme` |
| Post-UTME Subjects | `/modules/cbt_test/university_entrance_exam/available_subjects.html` | `/[cc]/test/post-utme/[university]` |
| University Exam Hub | `/modules/cbt_test/university_exam/university_exam.html` | `/[cc]/test/university` |
| University Courses | `/modules/cbt_test/university_exam/all_courses.html` | `/[cc]/test/university/[university]` |
| Leaderboard | `/modules/leaderboard/leaderboard.html` | `/[cc]/rank` |
| History | `/modules/history/history.html` | `/[cc]/history` |

---

### 3.4 Blog Section  `/[country]/blog/...`

| Page | Old URL | New URL |
|------|---------|---------|
| Blog Categories | `/modules/blog/categories.html` | `/[cc]/blog` |
| Blog Article | `/modules/blog/content.html` | `/[cc]/blog/[category]/[slug]` |

---

### 3.5 Utility & Account Pages

| Page | Old URL | New URL | Auth Required |
|------|---------|---------|---------------|
| Global Rank | `/modules/rank/rank.html` | `/[cc]/rank` | No |
| Earnings | `/modules/earnings/earnings.html` | `/[cc]/earnings` | Yes |
| Task | `/modules/task/task.html` | `/[cc]/task` | Yes |
| Referrals | `/modules/referrals/referrals.html` | `/[cc]/referral` | Yes |
| AI Tutor | `/modules/cbt_test/core/ai_plan.html` | `/[cc]/ai-tutor` | No |
| Pricing | `/modules/pricing/pricing.html` | `/[cc]/pricing` | No |
| Wallet Dashboard | `/modules/top_up/wallet_dashboard.html` | `/top-up` | Yes |
| Top-Up Amount Entry | `/modules/top_up/amount_entry.html` | `/top-up/add` | Yes |
| Checkout | `/modules/top_up/paystack_inline_checkout.html` | `/top-up/checkout` | Yes |
| Chat | `/modules/chat/admin_list.html` | `/[cc]/chat` | No |
| Chat Admin | `/modules/chat/chat_admin.html` | `/[cc]/chat/[admin]` | No |
| Exam Studio (Tutor) | `/modules/exam_hub/tutor/...` | `/[cc]/studio/tutor/...` | Yes |
| Exam Studio (Student) | `/modules/exam_hub/student/...` | `/[cc]/studio/student/...` | Yes |

> NOTE: `/top-up` pages are NOT country-scoped -- wallet is global across countries.

---

### 3.6 Auth Pages (No Country Prefix)

| Page | Old URL | New URL |
|------|---------|---------|
| Login | `/modules/auth/login.html` | `/login` |
| Sign Up | `/modules/auth/sign_up.html` | `/signup` |
| OTP Verify | `/modules/auth/otp.html` | `/verify` |
| Profile Setup | `/modules/auth/fill_form.html` | `/onboarding` |

---

## 4. SEO / AEO / GSC Architecture

### 4.1 Per-Page `<head>` Requirements

Every page MUST include:

```html
<!-- Primary SEO -->
<title>[Page Title] - My Exam Companion ([Country])</title>
<meta name="description" content="[150-160 char unique description]">
<link rel="canonical" href="https://myexamcompanion.com/[cc]/[path]">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="https://myexamcompanion.com/[cc]/[path]">
<meta property="og:image" content="https://myexamcompanion.com/assets/og/[page].jpg">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">

<!-- hreflang for multi-country (on shared content pages) -->
<link rel="alternate" hreflang="en-NG" href="https://myexamcompanion.com/ng/[path]">
<link rel="alternate" hreflang="en-GH" href="https://myexamcompanion.com/gh/[path]">
<link rel="alternate" hreflang="en-US" href="https://myexamcompanion.com/us/[path]">
<link rel="alternate" hreflang="x-default" href="https://myexamcompanion.com/">

<!-- JSON-LD Structured Data (page-specific, see section 4.2) -->
<script type="application/ld+json">{ ... }</script>
```

---

### 4.2 Structured Data (JSON-LD) by Page Type

| Page Type | Schema Type | Key Fields |
|-----------|-------------|------------|
| Home (`/ng`) | `WebSite` + `SearchAction` | `url`, `name`, `potentialAction` (sitelinks search box) |
| CBT Player | `Quiz` | `name`, `about`, `educationalLevel`, `hasPart` (questions) |
| Blog Article | `Article` | `headline`, `author`, `datePublished`, `image` |
| Blog Category | `CollectionPage` | `name`, `url`, `hasPart` |
| Pricing | `Product` + `Offer` | `name`, `price`, `priceCurrency`, `availability` |
| Leaderboard / Rank | `ItemList` | `numberOfItems`, `itemListElement` |
| Syllabus | `Course` | `name`, `provider`, `educationalLevel`, `hasCourseInstance` |
| Post-UTME Hub | `EducationalOrganization` | `name`, `url` |
| Study (subject) | `LearningResource` | `name`, `educationalLevel`, `teaches` |

---

### 4.3 Sitemap Strategy

```
/sitemap.xml                      <- Master index
  /sitemaps/ng/home.xml           <- Nigeria home + static pages
  /sitemaps/ng/study.xml          <- All /ng/study/* URLs
  /sitemaps/ng/test/jamb.xml      <- All JAMB CBT question URLs
  /sitemaps/ng/test/waec.xml
  /sitemaps/ng/test/neco.xml
  /sitemaps/ng/test/post-utme.xml
  /sitemaps/ng/blog.xml           <- All /ng/blog/* articles
  /sitemaps/gh/home.xml
  /sitemaps/gh/test/waec.xml
  /sitemaps/us/home.xml
  /sitemaps/us/test/sat.xml
  /sitemaps/brochure/ng/a.xml     <- Brochure institution pages (existing)
```

**Sitemap entry format:**
```xml
<url>
  <loc>https://myexamcompanion.com/ng/test/jamb/mathematics/2023/play</loc>
  <lastmod>2026-09-13</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

**Priority scale:**
- `1.0` -- Home pages (`/ng`, `/gh`, `/us`)
- `0.9` -- Section hubs (`/ng/test`, `/ng/study`, `/ng/blog`)
- `0.8` -- Individual subject/exam pages
- `0.7` -- Question/player pages
- `0.5` -- Utility pages (earnings, task, chat)

---

### 4.4 `robots.txt`

```
User-agent: *
Allow: /

# Block auth and account-only pages from indexing
Disallow: /login
Disallow: /signup
Disallow: /onboarding
Disallow: /verify
Disallow: /top-up/
Disallow: /*/earnings
Disallow: /*/task
Disallow: /*/studio/

# Block admin panels
Disallow: /modules/admin_panel/

Sitemap: https://myexamcompanion.com/sitemap.xml
```

---

### 4.5 `_headers` (Cloudflare Performance & SEO)

```
# Cache static assets aggressively
/components/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Never cache HTML pages (always fresh for crawlers)
/ng/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Robots-Tag: index, follow

/gh/*
  Cache-Control: public, max-age=0, must-revalidate

/us/*
  Cache-Control: public, max-age=0, must-revalidate

# Security headers (all pages)
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## 5. `_redirects` File (Complete)

```
# -- R2 Proxy --
/r2/* https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/:splat 200

# -- Country Entry Points (single file, country read from URL slug) --
/ng  /modules/index.html 200
/gh  /modules/index.html 200
/us  /modules/index.html 200

# -- Study --
/ng/study/classroom        /modules/study/classroom/classroom_subject.html 200
/ng/study/past-questions   /modules/study/study_past_questions/study_subject.html 200
/ng/study/novel            /modules/study/novel/novel.html 200
/ng/study/syllabus         /modules/study/syllabus/syllabus.html 200
/ng/study/brochure         /modules/study/brochure/brochure.html 200
/ng/study/videos           /modules/study/topic_video/topic_video.html 200
/ng/study/scholarships     /modules/study/scholarship/list_of_scholarship.html 200

/gh/study/classroom        /modules/study/classroom/classroom_subject.html 200
/gh/study/past-questions   /modules/study/study_past_questions/study_subject.html 200
/gh/study/videos           /modules/study/topic_video/topic_video.html 200

/us/study/classroom        /modules/study/classroom/classroom_subject.html 200
/us/study/past-questions   /modules/study/study_past_questions/study_subject.html 200

# -- Test / CBT --
/ng/test                   /modules/cbt_test/core/setup.html 200
/ng/test/result            /modules/cbt_test/core/result.html 200
/ng/test/analysis          /modules/cbt_test/core/deep_analysis.html 200
/ng/test/jamb-mock         /modules/cbt_test/jamb_mock_exam/mock_date_and_point.html 200
/ng/test/live-arena        /modules/cbt_test/live_quiz_arena/exam_body.html 200
/ng/test/secondary         /modules/cbt_test/secondary_school/all_classes.html 200
/ng/test/post-utme         /modules/cbt_test/core/university_exam_post_utme.html 200
/ng/test/university        /modules/cbt_test/university_exam/university_exam.html 200

/gh/test                   /modules/cbt_test/core/setup.html 200
/gh/test/result            /modules/cbt_test/core/result.html 200

/us/test                   /modules/cbt_test/core/setup.html 200
/us/test/result            /modules/cbt_test/core/result.html 200

# -- Blog --
/ng/blog   /modules/blog/categories.html 200
/gh/blog   /modules/blog/categories.html 200
/us/blog   /modules/blog/categories.html 200

# -- Utility (country-scoped) --
/ng/rank       /modules/rank/rank.html 200
/ng/earnings   /modules/earnings/earnings.html 200
/ng/task       /modules/task/task.html 200
/ng/referral   /modules/referrals/referrals.html 200
/ng/ai-tutor   /modules/cbt_test/core/ai_plan.html 200
/ng/pricing    /modules/pricing/pricing.html 200
/ng/chat       /modules/chat/admin_list.html 200
/ng/history    /modules/history/history.html 200

/gh/rank       /modules/rank/rank.html 200
/gh/ai-tutor   /modules/cbt_test/core/ai_plan.html 200
/gh/pricing    /modules/pricing/pricing.html 200

/us/rank       /modules/rank/rank.html 200
/us/ai-tutor   /modules/cbt_test/core/ai_plan.html 200
/us/pricing    /modules/pricing/pricing.html 200

# -- Wallet / Top-Up (global, no country prefix) --
/top-up            /modules/top_up/wallet_dashboard.html 200
/top-up/add        /modules/top_up/amount_entry.html 200
/top-up/checkout   /modules/top_up/paystack_inline_checkout.html 200

# -- Auth (global) --
/login       /modules/auth/login.html 200
/signup      /modules/auth/sign_up.html 200
/verify      /modules/auth/otp.html 200
/onboarding  /modules/auth/fill_form.html 200

# -- Legacy redirects (301 = permanent, preserves SEO) --
/pricing                    /ng/pricing 301
/modules/pricing            /ng/pricing 301
/wallet-dashboard           /top-up 301
/amount-entry               /top-up/add 301
/paystack-inline-checkout   /top-up/checkout 301
/modules/auth/login.html    /login 301
/modules/auth/sign_up.html  /signup 301
```

---

## 6. `nav.js` Route Registry Changes

Each route gets two new fields:

```js
{
  id: 'classroom',
  path: 'study/classroom/classroom_subject.html',   // physical file (unchanged)
  url: (cc) => `/${cc}/study/classroom`,            // new: function taking country code
  section: 'study',
  label: 'Enter Classroom',
  seo: {
    title: (cc) => `Study Classroom - ${COUNTRY_NAMES[cc]} Exam Companion`,
    description: (cc) => `Interactive study classroom for ${COUNTRY_NAMES[cc]} students.`,
  }
}
```

**`MEC_NAV.href(id, params)` upgrade:**
- Reads current country from `localStorage.mec_country` or URL slug
- Calls `route.url(cc)` instead of building a path
- Appends `params` as query string for dynamic segments

---

## 7. Country Detection & Persistence Logic

```js
function getCountry() {
  // 1. From URL slug (highest priority)
  const slug = window.location.pathname.split('/')[1];
  if (['ng', 'gh', 'us'].includes(slug)) {
    localStorage.setItem('mec_country', slug);
    return slug;
  }

  // 2. From localStorage (returning user)
  const stored = localStorage.getItem('mec_country');
  if (stored && ['ng', 'gh', 'us'].includes(stored)) return stored;

  // 3. From browser language
  const lang = navigator.language || '';
  if (lang.includes('GH')) return 'gh';
  if (lang.includes('US')) return 'us';

  // 4. Default
  return 'ng';
}
```

---

## 8. Implementation Phases

### Phase 1 -- Foundation (Week 1)
- [ ] Update `_redirects` with all new routes + legacy 301s
- [ ] Update `robots.txt` with new blocked paths
- [ ] Update `_headers` with caching + security rules
- [ ] Add `getCountry()` helper to `nav.js`
- [ ] Update `MEC_NAV.href()` to be country-aware

### Phase 2 -- Page SEO Updates (Week 1-2)
- [ ] Add `<link rel="canonical">` to every page template
- [ ] Add `hreflang` alternates to all indexable pages
- [ ] Add `<script type="application/ld+json">` blocks per page type
- [ ] Update page titles and meta descriptions to be country-specific

### Phase 3 -- Sitemap Rebuild (Week 2)
- [ ] Update `generate-sitemap.cjs` to output per-country, per-section sitemaps
- [ ] Update `sitemap.xml` master index
- [ ] Submit new sitemap to Google Search Console

### Phase 4 -- Country Entry Pages (Week 2-3)
- [ ] Update `public/modules/index.html` to act as the single entry point for `/ng`, `/gh`, and `/us`
- [ ] Implement JS logic in `modules/index.html` to filter content based on the country selected in step 4
- [ ] Update root `/` landing to redirect/link to country pages

### Phase 5 -- Auth URL Migration (Week 3)
- [ ] Update all login link references to `/login`
- [ ] Update auth redirect params to use new clean URLs
- [ ] Test all auth flows end-to-end

### Phase 6 -- GSC & Analytics (Week 3-4)
- [ ] Submit all new sitemaps in Google Search Console
- [ ] Set up country-level Google Analytics filters
- [ ] Create 301 redirect coverage report to confirm no broken links
- [ ] Run Lighthouse + Core Web Vitals audit on new URLs

---

## 9. AEO (Answer Engine Optimisation) Strategy

Answer engines (ChatGPT, Perplexity, Google SGE) prefer:

**1. FAQ schema on all exam/subject pages:**
```json
{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is JAMB cutoff for UNIBEN?",
    "acceptedAnswer": { "@type": "Answer", "text": "..." }
  }]
}
```

**2. BreadcrumbList schema on every nested page:**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Nigeria", "item": "/ng" },
    { "@type": "ListItem", "position": 2, "name": "Test", "item": "/ng/test" },
    { "@type": "ListItem", "position": 3, "name": "JAMB 2023", "item": "/ng/test/jamb/2023" }
  ]
}
```

**3. Descriptive `<h1>` tags matching search queries:**
- Bad:  `"Study"`
- Good: `"JAMB Past Questions 2024 - Practice Free Online (Nigeria)"`

**4. Meta descriptions must answer the question users ask, not just describe the page.**

---

## 10. Resolved Questions

> **RESOLVED -- Dynamic URL segments:** We will use a JS router that reads `window.location.pathname` and passes segments internally via query strings. This ensures compatibility with Cloudflare Pages `_redirects` which supports wildcards (`*`) but not named parameters.

> **RESOLVED -- Country home pages:** `/ng`, `/gh`, and `/us` will reuse the existing `modules/index.html` with a country filter applied via the URL slug.

> **RESOLVED -- Backward compatibility:** Old URLs will be kept alive via 301 redirects for a minimum of 12 months. This is essential to preserve Google ranking signals and ensure any existing backlinks or user bookmarks continue to function correctly while search engines index the new structure.

> **IMPORTANT -- Blog article slugs:** Current `blog/content.html` uses `?slug=...` query strings. To achieve `/ng/blog/[category]/[slug]`, the blog page must read category and slug from the URL path.

---

## 11. File & Folder Structure (Target State)

```
public/
  _redirects                         <- Updated (see section 5)
  _headers                           <- Updated (see section 4.5)
  robots.txt                         <- Updated (see section 4.4)
  sitemap.xml                        <- Master index
  sitemaps/
    ng/
      home.xml
      study.xml
      test/
        jamb.xml
        waec.xml
        neco.xml
        post-utme.xml
      blog.xml
    gh/ ...
    us/ ...
  components/
    nav.js                           <- Add getCountry(), country-aware href()
    sidebar.js                       <- Update links to use new URLs
    supabase.js                      <- Unchanged
    topbar.js                        <- Unchanged
  modules/
    index.html                       -> /ng, /gh, /us (Country homes via JS)
    auth/                            <- Unchanged files, new clean URLs
      login.html                     -> /login
      sign_up.html                   -> /signup
      otp.html                       -> /verify
      fill_form.html                 -> /onboarding
    study/                           <- Unchanged files, new clean URLs
    cbt_test/                        <- Unchanged files, new clean URLs
    blog/                            <- Unchanged files, new clean URLs
    top_up/                          <- Unchanged files, new clean URLs
      wallet_dashboard.html          -> /top-up
      amount_entry.html              -> /top-up/add
      paystack_inline_checkout.html  -> /top-up/checkout
    pricing/
      pricing.html                   -> /[cc]/pricing
    rank/rank.html                   -> /[cc]/rank
    earnings/earnings.html           -> /[cc]/earnings
    task/task.html                   -> /[cc]/task
    referrals/referrals.html         -> /[cc]/referral
    history/history.html             -> /[cc]/history
    chat/
      admin_list.html                -> /[cc]/chat
      chat_admin.html                -> /[cc]/chat/[admin]
```

---

*Last updated: 2026-09-13 | Update this document as implementation progresses.*
