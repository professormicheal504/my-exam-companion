export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  // path will be an array of the captured path segments
  // e.g. for /study/nigeria/waec/mathematics/2018 -> ["nigeria", "waec", "mathematics", "2018"]
  const path = context.params.path || [];
  
  if (path.length < 2) {
    // Just /study/ or /study/nigeria -> 404 or redirect to /
    return Response.redirect(url.origin + '/', 302);
  }

  const country = path[0];
  const exam = path[1];
  const examId = `${country}/${exam}`;
  const subject = path[2] || '';
  const year = path[3] || '';

  const isSubjectPage = path.length === 2;
  // Request WITHOUT .html — Cloudflare Pages serves extensionless URLs directly.
  // Requesting with .html causes a redirect which breaks HTMLRewriter injection.
  const targetAsset = isSubjectPage 
    ? '/modules/study/classroom/classroom_subject'
    : '/modules/study/classroom/classroom_questions';

  // Fetch the actual HTML file from the local Pages project
  const assetUrl = new URL(targetAsset, request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));

  // If it's the subject page, we just pass the parameters down to the JS and return.
  // The client side will do the rest.
  if (isSubjectPage) {
    class SubjectInjector {
      element(element) {
        // <base href="/"> fixes relative paths (../../../) that break from clean URL depths
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
  
  let canonicalUrl = `https://myexamcompanion.pages.dev/study/${examId}/${subject}${year ? '/' + year : ''}`;

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
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}` },
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
