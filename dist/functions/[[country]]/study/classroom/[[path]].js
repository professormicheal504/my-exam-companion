export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  const countryCode = context.params.country || 'ng';
  const path = context.params.path || [];
  
  const countryMap = { ng: 'nigeria', gh: 'ghana', us: 'usa' };
  const fullCountry = countryMap[countryCode] || countryCode;

  // If path is empty (e.g. /ng/study/classroom)
  if (path.length === 0) {
    const assetResp = await env.ASSETS.fetch(new Request(new URL('/modules/study/classroom/classroom_subject', request.url).toString(), { headers: request.headers }));
    return assetResp;
  }

  const exam = path[0];
  const examId = `${fullCountry}/${exam}`;
  const subject = path[1] || '';
  const year = path[2] || '';

  // --- DISCUSSION PAGE ---
  // New format: /[cc]/study/classroom/[exam]/[subject]/discussion/[qKey]
  // Old format: /[cc]/study/classroom/[exam]/[subject]/[qKey]/discussion  (legacy)
  const discussionIdx = path.indexOf('discussion');
  const isDiscussionPage = discussionIdx !== -1;

  if (isDiscussionPage) {
    // New format: discussion is at index 2, qKey at index 3
    // Old format: qKey at index 2, discussion at index 3
    let dSubject, dQKey;
    if (path[2] === 'discussion') {
      // New: /[exam]/[subject]/discussion/[qKey]
      dSubject = path[1] || '';
      dQKey    = path[3] || '';
    } else {
      // Old: /[exam]/[subject]/[qKey]/discussion
      dSubject = path[1] || '';
      dQKey    = path[2] || '';
    }
    const _dYearRaw = url.searchParams.get('year') || '';
    const dYear = _dYearRaw || (dQKey.match(/^(\d{4})_/) ? dQKey.match(/^(\d{4})_/)[1] : '');
    const dType    = url.searchParams.get('type') || 'objective';
    const dLocked  = url.searchParams.get('locked_answer') || '';
    const dMode    = url.searchParams.get('mode') || '';

    let dSubjectFmt = dSubject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const dExamFmt  = exam.toUpperCase();

    let title       = `${dExamFmt} ${dSubjectFmt} — Explanation | My Exam Companion`;
    let description = `View the official answer and step-by-step explanation for this ${dExamFmt} ${dSubjectFmt} past question.`;
    let image       = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
    const canonicalUrl = `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${dSubject}/discussion/${dQKey ? encodeURIComponent(dQKey) : ''}`;

    let schemas = [];
    let questionHtml = '';

    const userAgent = request.headers.get('User-Agent') || '';
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);

    if (dQKey && env.QUESTIONS_BUCKET) {
      try {
        const obj = await env.QUESTIONS_BUCKET.get(`questions/${dQKey}.json`);
        if (obj) {
          const data = await obj.json();
          const qText = (data.question || '').replace(/<[^>]*>/g, '').trim();
          const correctOpt = (data.options || []).find(o => o.is_correct);
          const ansText = correctOpt ? (correctOpt.text || '').replace(/<[^>]*>/g, '').trim() : '';
          const expText = (data.explanation || '').replace(/<[^>]*>/g, '').trim();
          const qTopic  = Array.isArray(data.topic) ? data.topic[0] : (data.topic || '');

          title       = `${dExamFmt} ${dSubjectFmt}${dYear ? ' ' + dYear : ''}${qTopic ? ' — ' + qTopic : ''} | My Exam Companion`;
          description = qText ? `${qText.substring(0, 120)}... — Answer & Explanation on My Exam Companion` : description;
          image       = `https://myexamcompanion.pages.dev/api/og-image?id=${encodeURIComponent(dQKey)}`;

          schemas.push({
            "@context": "https://schema.org",
            "@type": "QAPage",
            "name": title,
            "description": description,
            "mainEntity": {
              "@type": "Question",
              "name": qText.substring(0, 200),
              "text": qText,
              ...(ansText ? { "acceptedAnswer": { "@type": "Answer", "text": `${ansText}. ${expText}`.trim() } } : {})
            }
          });

          if (isBot) {
            const optionsHtml = (data.options || []).map(o => {
              const tag = (o.tag || '').toUpperCase();
              const txt = (o.text || '').replace(/<[^>]*>/g, '');
              return `<li${o.is_correct ? ' style="font-weight:bold"' : ''}>${tag}. ${txt}</li>`;
            }).join('');
            questionHtml = `<article itemscope itemtype="https://schema.org/Question"><h1 itemprop="name">${title}</h1><p itemprop="text">${qText}</p>${optionsHtml ? `<ul>${optionsHtml}</ul>` : ''}<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><strong>Correct Answer:</strong><p itemprop="text">${ansText}</p>${expText ? `<strong>Explanation:</strong><p>${expText}</p>` : ''}</div></article>`;
          }
        }
      } catch (err) {
        console.error('Discussion Edge SSR R2 fetch failed:', err);
      }
    }

    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home",         "item": "https://myexamcompanion.pages.dev/" },
        { "@type": "ListItem", "position": 2, "name": dExamFmt,       "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}` },
        { "@type": "ListItem", "position": 3, "name": dSubjectFmt,    "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${dSubject}` },
        { "@type": "ListItem", "position": 4, "name": "Discussion",   "item": canonicalUrl }
      ]
    });

    const assetResp = await env.ASSETS.fetch(new Request(new URL('/modules/study/classroom/classroom_discussion', request.url).toString(), { headers: request.headers }));

    class DDiscHeadInjector {
      element(element) {
        element.prepend(`<base href="/">\n`, { html: true });
        element.append(`<title>${title}</title>\n`, { html: true });
        element.append(`<meta name="description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
        element.append(`<link rel="canonical" href="${canonicalUrl}">\n`, { html: true });
        element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
        element.append(`<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
        element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
        element.append(`<meta property="og:url" content="${canonicalUrl}">\n`, { html: true });
        element.append(`<meta property="og:type" content="article">\n`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
        element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
        element.append(`<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">\n`, { html: true });
        element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });
        element.append(`<script type="application/ld+json">\n${JSON.stringify(schemas)}\n</script>\n`, { html: true });
        element.append(`<script>
window.MEC_CLEAN_URL_PARAMS = {
  exam_id: "${examId}",
  subject:  "${dSubject}",
  year:     "${dYear}",
  q_key:    "${dQKey}",
  type:     "${dType}",
  locked_answer: "${dLocked}",
  mode:     "${dMode}"
};
</script>\n`, { html: true });
      }
    }

    class DDiscBodyInjector {
      element(element) {
        if (questionHtml) {
          element.prepend(`<noscript>${questionHtml}</noscript>`, { html: true });
        }
      }
    }

    class TagRemover { element(element) { element.remove(); } }

    return new HTMLRewriter()
      .on('title',                     new TagRemover())
      .on('meta[name="description"]',  new TagRemover())
      .on('meta[property^="og:"]',     new TagRemover())
      .on('meta[name^="twitter:"]',    new TagRemover())
      .on('link[rel="canonical"]',     new TagRemover())
      .on('head', new DDiscHeadInjector())
      .on('body', new DDiscBodyInjector())
      .transform(assetResp);
  }

  const isSubjectPage = path.length === 1; // e.g. /ng/study/classroom/jamb
  const targetAsset = isSubjectPage 
    ? '/modules/study/classroom/classroom_subject'
    : '/modules/study/classroom/classroom_questions';

  const assetUrl = new URL(targetAsset, request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));

  if (isSubjectPage) {
    class SubjectInjector {
      element(element) {
        element.prepend(`<base href="/">\n`, { html: true });
        element.append(`<script>window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}" };</script>\n`, { html: true });
      }
    }
    return new HTMLRewriter().on('head', new SubjectInjector()).transform(response);
  }

  // --- QUESTION PAGE LOGIC (Edge SSR + Params) ---
  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);

  const examFormatted = exam.toUpperCase();
  let subjectFormatted = subject.replace(/_/g, ' ');
  subjectFormatted = subjectFormatted.replace(/\b\w/g, c => c.toUpperCase());

  const yearText = year ? ` ${year}` : '';
  let title = `${examFormatted} ${subjectFormatted}${yearText} Past Questions & Answers | My Exam Companion`;
  let description = `Practice free CBT exam past questions for ${examFormatted} ${subjectFormatted}${yearText} online. Includes official answer keys, step-by-step explanations, and CBT timer.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  
  let canonicalUrl = `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${subject}${year ? '/' + year : ''}`;

  let questionsHtml = '';
  let schemas = [];

  if (isBot && env.QUESTIONS_BUCKET) {
    try {
      // The R2 object path is typically: examId / subject / objective / year .json
      // Wait, what if year is not provided? We would need the index.json, but let's just do it for specific years to be safe.
      if (year) {
        const r2Key = `${examId}/${subject}/objective/${year}.json`;
        const obj = await env.QUESTIONS_BUCKET.get(r2Key);
        
        if (obj) {
          const data = await obj.json();
          let faqItems = [];
          let htmlBuilder = `<article class="pre-rendered-content"><h1>${title}</h1>`;
          
          if (data.data && Array.isArray(data.data)) {
            const questions = data.data.slice(0, 20);
            questions.forEach((q, idx) => {
              const qNum = idx + 1;
              const qText = (q.question || '').replace(/<[^>]*>/g, '');
              const ansObj = q.options ? q.options.find(o => o.is_correct) : null;
              const ansText = ansObj ? (ansObj.text || '').replace(/<[^>]*>/g, '') : 'See explanation';
              const expText = (q.explanation || '').replace(/<[^>]*>/g, '');
              
              htmlBuilder += `
                <section>
                  <h2>Question ${qNum}</h2>
                  <p>${qText}</p>
                  <p><strong>Correct Answer:</strong> ${ansText}</p>
                  ${expText ? `<p><strong>Explanation:</strong> ${expText}</p>` : ''}
                </section>
              `;
              
              faqItems.push({
                "@type": "Question",
                "name": `${examFormatted} ${subjectFormatted} ${year} Question ${qNum}: ${qText.substring(0, 100)}...`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `${ansText}. ${expText}`
                }
              });
            });
            htmlBuilder += `</article>`;
            questionsHtml = htmlBuilder;
            
            schemas.push({
              "@context": "https://schema.org",
              "@type": "Quiz",
              "name": title,
              "description": description,
              "educationalLevel": "Secondary Education",
              "hasPart": faqItems
            });
          }
        }
      }
    } catch (err) {
      console.error('Edge SSR R2 fetch failed:', err);
    }
  }

  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${subject}` },
      ...(year ? [{ "@type": "ListItem", "position": 4, "name": year, "item": canonicalUrl }] : [])
    ]
  });

  class HeadInjector {
    element(element) {
      // <base href="/"> MUST come first - fixes all relative paths (../../../) that
      // break when the page is served from a deep clean URL like /study/nigeria/jamb/math/2016
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
      
      // Pass params to client-side JS AND simulate query string so existing
      // raw `new URLSearchParams(window.location.search)` calls pick up year/type.
      const simulatedSearch = new URLSearchParams();
      if (subject) simulatedSearch.set('subject', subject);
      if (year) simulatedSearch.set('year', year);
      const searchStr = simulatedSearch.toString();
      element.append(`<script>
window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}", subject: "${subject}", year: "${year}" };
// Inject year/type into the URL so raw URLSearchParams(window.location.search) reads them
if (${!!year} && !window.location.search.includes('year=')) {
  history.replaceState(null, '', window.location.pathname + '?${searchStr}');
}
</script>\n`, { html: true });
    }
  }

  class BodyInjector {
    element(element) {
      if (questionsHtml) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${questionsHtml}</noscript>`, { html: true });
      }
    }
  }

  class TagRemover {
    element(element) {
      element.remove();
    }
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
