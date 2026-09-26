export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  const examId  = url.searchParams.get('exam_id') || '';
  const subject = url.searchParams.get('subject') || '';
  const year    = url.searchParams.get('year') || '';
  const qKey    = url.searchParams.get('q') || url.searchParams.get('id') || '';
  const isPoll  = url.searchParams.get('mode') === 'poll';

  // Format readable names
  let subjectFormatted = subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const examFormatted  = examId.split('/').pop().toUpperCase();

  // Defaults
  let title       = `${examFormatted} ${subjectFormatted}${year ? ' ' + year : ''} — Explanation | My Exam Companion`;
  let description = `View the official answer and step-by-step explanation for this ${examFormatted} ${subjectFormatted}${year ? ' ' + year : ''} past question on My Exam Companion.`;
  let image       = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  let canonicalUrl = url.href.split('?')[0] + url.search;

  if (isPoll) {
    title       = `${examFormatted} ${subjectFormatted} — Poll | My Exam Companion`;
    description = `Vote your answer and see live community results for this ${examFormatted} ${subjectFormatted} question.`;
  }

  // Structured data schemas
  let schemas = [];
  let questionText  = '';
  let answerText    = '';
  let explanationText = '';
  let questionHtml  = ''; // for bot snapshots

  // Try to fetch question data from R2 for bots and richer meta
  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);

  if (qKey && env.QUESTIONS_BUCKET) {
    try {
      const obj = await env.QUESTIONS_BUCKET.get(`questions/${qKey}.json`);
      if (obj) {
        const data = await obj.json();
        const qExamBody = (data.examBody || examFormatted).toUpperCase();
        const qSubject  = data.subject || subjectFormatted;
        const qTopic    = Array.isArray(data.topic) ? data.topic[0] : (data.topic || '');

        questionText    = (data.question || '').replace(/<[^>]*>/g, '').trim();
        const correctOpt = (data.options || []).find(o => o.is_correct);
        answerText      = correctOpt ? (correctOpt.text || '').replace(/<[^>]*>/g, '').trim() : '';
        explanationText = (data.explanation || '').replace(/<[^>]*>/g, '').trim();

        title       = `${qExamBody} ${qSubject}${year ? ' ' + year : ''}${qTopic ? ' — ' + qTopic : ''} | My Exam Companion`;
        description = questionText
          ? `${questionText.substring(0, 120)}... — Answer & Explanation on My Exam Companion`
          : description;
        image       = `https://myexamcompanion.pages.dev/api/og-image?id=${encodeURIComponent(qKey)}`;

        if (isBot) {
          // Build a bot-readable article snippet
          const optionsHtml = (data.options || []).map(o => {
            const tag  = (o.tag || '').toUpperCase();
            const text = (o.text || '').replace(/<[^>]*>/g, '');
            return `<li${o.is_correct ? ' style="font-weight:bold"' : ''}>${tag}. ${text}</li>`;
          }).join('');

          questionHtml = `
<article itemscope itemtype="https://schema.org/Question" id="edge-ssr-snapshot">
  <h1 itemprop="name">${title}</h1>
  <p itemprop="text">${questionText}</p>
  ${optionsHtml ? `<ul>${optionsHtml}</ul>` : ''}
  <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
    <strong>Correct Answer:</strong>
    <p itemprop="text">${answerText}</p>
    ${explanationText ? `<strong>Explanation:</strong><p>${explanationText}</p>` : ''}
  </div>
</article>`;
        }

        schemas.push({
          "@context": "https://schema.org",
          "@type": "QAPage",
          "name": title,
          "description": description,
          "mainEntity": {
            "@type": "Question",
            "name": questionText.substring(0, 200),
            "text": questionText,
            "acceptedAnswer": answerText ? {
              "@type": "Answer",
              "text": `${answerText}. ${explanationText}`.trim()
            } : undefined
          }
        });
      }
    } catch (err) {
      console.error('Discussion Edge SSR R2 fetch failed:', err);
    }
  }

  // Always add breadcrumb schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",         "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted,  "item": `https://myexamcompanion.pages.dev/study/${examId}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}` },
      ...(year ? [{ "@type": "ListItem", "position": 4, "name": year, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}/${year}` }] : [])
    ]
  });

  // Fetch the static HTML page asset
  const response = await next();

  class TagRemover {
    element(element) { element.remove(); }
  }

  class HeadInjector {
    element(element) {
      // <base href="/"> ensures relative paths resolve correctly from any URL depth
      element.prepend(`<base href="/">\n`, { html: true });
      element.append(`<title>${title}</title>\n`, { html: true });
      element.append(`<meta name="description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
      element.append(`<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
      element.append(`<meta property="og:image:width" content="1200">\n`, { html: true });
      element.append(`<meta property="og:image:height" content="630">\n`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:type" content="article">\n`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
      element.append(`<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });
      element.append(`<script type="application/ld+json">\n${JSON.stringify(schemas)}\n</script>\n`, { html: true });
    }
  }

  class BodyInjector {
    element(element) {
      if (questionHtml) {
        element.prepend(`<noscript>${questionHtml}</noscript>`, { html: true });
      }
    }
  }

  return new HTMLRewriter()
    .on('title',                 new TagRemover())
    .on('meta[name="description"]', new TagRemover())
    .on('meta[property^="og:"]', new TagRemover())
    .on('meta[name^="twitter:"]', new TagRemover())
    .on('link[rel="canonical"]', new TagRemover())
    .on('head', new HeadInjector())
    .on('body', new BodyInjector())
    .transform(response);
}
