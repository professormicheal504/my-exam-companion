function toSlug(name, id) {
  const slugName = (name || 'institution')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${slugName}-${id}`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // /[cc]/study/brochure/[slug]
  const country = params.country || 'ng';
  const slugSegment = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug || '');

  // Extract numeric ID from end of slug: "university-of-lagos-42" -> "42"
  const idMatch = slugSegment.match(/-?(\d+)$/);
  const institutionId = idMatch ? idMatch[1] : slugSegment;

  const isInstitutionPage = !!institutionId;

  const COUNTRY_NAMES = {
    ng: 'Nigeria', gh: 'Ghana', us: 'United States', uk: 'United Kingdom'
  };
  const countryName = COUNTRY_NAMES[country] || country.toUpperCase();

  const targetAsset = isInstitutionPage
    ? '/modules/study/brochure/course'
    : '/modules/study/brochure/brochure';

  const assetUrl = new URL(targetAsset, url.origin);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));

  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);

  const R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

  let title = '';
  let description = '';
  let canonicalUrl = '';
  let ssrHtml = '';
  let schemas = [];

  if (!isInstitutionPage) {
    title = `${countryName} Universities & Polytechnics Brochure — Courses & Requirements | My Exam Companion`;
    description = `Browse all ${countryName} universities, polytechnics, and colleges of education. Find available courses, UTME subject combinations, and O'Level requirements for free.`;
    canonicalUrl = `https://www.myexamcompanion.com/${country}/study/brochure`;
  } else {
    const instNameFormatted = slugSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    title = `${instNameFormatted} — Courses, Requirements & Subject Combinations | My Exam Companion`;
    description = `Find all available courses at ${instNameFormatted} in ${countryName}. View UTME subject combinations, O'Level requirements, and direct entry requirements for free.`;
    canonicalUrl = `https://www.myexamcompanion.com/${country}/study/brochure/${slugSegment}`;

    if (isBot) {
      try {
        const r2Res = await fetch(`${R2_BASE}/${country}/brochure/institutions/${institutionId}.json`);
        if (r2Res.ok) {
          const data = await r2Res.json();
          const instInfo = data.institution || {};
          const courses = data.programmes || [];
          const realName = instInfo.school_name || instNameFormatted;

          title = `${realName} — Courses, Requirements & Subject Combinations | My Exam Companion`;
          description = `Find all available courses at ${realName} in ${countryName}. View UTME subject combinations, O'Level requirements, and direct entry requirements for free.`;

          let courseHtml = `<article class="pre-rendered-content"><h1>${title}</h1>`;
          courseHtml += `<p>${realName} offers ${courses.length} accredited programmes.</p><ul>`;

          const schemaOffers = [];
          courses.slice(0, 30).forEach(course => {
            const cName = course.course_name || '';
            const utme = course.utme_requirements || '';
            courseHtml += `<li><strong>${cName}</strong>${utme ? ' — UTME: ' + utme : ''}</li>`;
            schemaOffers.push({
              '@type': 'EducationalOccupationalProgram',
              'name': cName,
              'provider': { '@type': 'EducationalOrganization', 'name': realName }
            });
          });

          courseHtml += `</ul></article>`;
          ssrHtml = courseHtml;

          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            'name': realName,
            'url': canonicalUrl,
            'description': description,
            'hasOfferCatalog': {
              '@type': 'OfferCatalog',
              'name': `${realName} Courses`,
              'numberOfItems': courses.length,
              'itemListElement': schemaOffers
            }
          });
        }
      } catch (err) {
        console.error('[Brochure Edge] Institution course fetch error:', err);
      }
    }
  }

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `https://www.myexamcompanion.com/${country}` },
      { '@type': 'ListItem', 'position': 2, 'name': `${countryName} Brochure`, 'item': `https://www.myexamcompanion.com/${country}/study/brochure` },
      ...(isInstitutionPage ? [{ '@type': 'ListItem', 'position': 3, 'name': slugSegment.replace(/-/g, ' '), 'item': canonicalUrl }] : [])
    ]
  });

  const image = `https://www.myexamcompanion.com/api/og-image?title=${encodeURIComponent(title)}`;
  const ssrSnapshot = ssrHtml;
  const clientParams = isInstitutionPage
    ? `{ country: "${country}", institution_id: "${institutionId}" }`
    : `{ country: "${country}" }`;

  class HeadInjector {
    element(element) {
      element.prepend(`<base href="/">\n`, { html: true });
      element.append(`<title>${title}</title>\n`, { html: true });
      element.append(`<meta name="description" content="${description}">\n`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
      element.append(`<meta property="og:description" content="${description}">\n`, { html: true });
      element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:type" content="website">\n`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">\n`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });
      element.append(`<script type="application/ld+json">\n${JSON.stringify(schemas)}\n</script>\n`, { html: true });
      element.append(`<script>window.MEC_BROCHURE_PARAMS = ${clientParams};</script>\n`, { html: true });
    }
  }

  class BodyInjector {
    element(element) {
      if (ssrSnapshot) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${ssrSnapshot}</noscript>`, { html: true });
      }
    }
  }

  class TagRemover {
    element(element) { element.remove(); }
  }

  return new HTMLRewriter()
    .on('title', new TagRemover())
    .on('meta[name="description"]', new TagRemover())
    .on('meta[property^="og:"]', new TagRemover())
    .on('meta[name^="twitter:"]', new TagRemover())
    .on('link[rel="canonical"]', new TagRemover())
    .on('head', new HeadInjector())
    .on('body', new BodyInjector())
    .transform(response);
}
