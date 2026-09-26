export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // path segments: e.g. /syllabus/ng/jamb/mathematics -> ['ng', 'jamb', 'mathematics']
  const path = context.params.path || [];

  // /syllabus with nothing → redirect to default
  if (path.length === 0) {
    return Response.redirect(url.origin + '/syllabus/ng/jamb', 302);
  }

  // Need at least country + exam
  if (path.length < 2) {
    return Response.redirect(url.origin + '/syllabus/ng/jamb', 302);
  }

  const country = path[0].toLowerCase();   // e.g. ng, us, gh
  const exam    = path[1].toLowerCase();   // e.g. jamb, waec, sat
  const subject = path[2] ? path[2].toLowerCase() : ''; // e.g. mathematics (optional)

  // Build human-readable labels for meta tags
  const COUNTRY_NAMES = {
    ng: 'Nigeria', us: 'United States', gh: 'Ghana',
    uk: 'United Kingdom', ke: 'Kenya', za: 'South Africa'
  };
  const countryName   = COUNTRY_NAMES[country] || country.toUpperCase();
  const examFormatted = exam.toUpperCase();
  const subjectFormatted = subject
    ? subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  const canonicalUrl = subject
    ? `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}/${subject}`
    : `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}`;

  const title = subject
    ? `${examFormatted} ${subjectFormatted} Syllabus ${new Date().getFullYear()} | My Exam Companion`
    : `${examFormatted} Syllabus ${new Date().getFullYear()} — All Subjects | My Exam Companion`;

  const description = subject
    ? `Download and study the complete ${examFormatted} ${subjectFormatted} syllabus. View all topics, objectives, and recommended textbooks for ${countryName} students.`
    : `Browse the complete ${examFormatted} syllabus for all subjects. Detailed topics, learning objectives, and study guides for ${countryName} students preparing for ${examFormatted}.`;

  const image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;

  // Structured data
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",        "item": "https://myexamcompanion.pages.dev/" },
        { "@type": "ListItem", "position": 2, "name": "Syllabus",    "item": "https://myexamcompanion.pages.dev/syllabus" },
        { "@type": "ListItem", "position": 3, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}` },
        ...(subject ? [{ "@type": "ListItem", "position": 4, "name": subjectFormatted, "item": canonicalUrl }] : [])
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": title,
      "description": description,
      "provider": { "@type": "Organization", "name": "My Exam Companion", "url": "https://myexamcompanion.pages.dev" },
      "educationalLevel": "Secondary Education",
      "inLanguage": "en",
      "url": canonicalUrl
    }
  ];

  // Fetch the syllabus HTML asset
  const assetResp = await env.ASSETS.fetch(
    new Request(new URL('/modules/study/syllabus/syllabus', request.url).toString(), { headers: request.headers })
  );

  class HeadInjector {
    element(element) {
      // base href fixes all relative paths (../../../) at clean URL depth
      element.prepend(`<base href="/">\n`, { html: true });

      element.append(`<title>${title}</title>\n`, { html: true });
      element.append(`<meta name="description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">\n`, { html: true });

      element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
      element.append(`<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:type" content="website">\n`, { html: true });

      element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
      element.append(`<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });

      element.append(`<script type="application/ld+json">\n${JSON.stringify(schemas)}\n</script>\n`, { html: true });

      // Inject params so client syllabus.js can read them directly
      element.append(`<script>
window.MEC_SYLLABUS_PARAMS = {
  country: "${country}",
  exam:    "${exam}",
  subject: "${subject}"
};
</script>\n`, { html: true });
    }
  }

  class TagRemover { element(element) { element.remove(); } }

  return new HTMLRewriter()
    .on('title',                    new TagRemover())
    .on('meta[name="description"]', new TagRemover())
    .on('meta[property^="og:"]',    new TagRemover())
    .on('meta[name^="twitter:"]',   new TagRemover())
    .on('link[rel="canonical"]',    new TagRemover())
    .on('head', new HeadInjector())
    .transform(assetResp);
}
