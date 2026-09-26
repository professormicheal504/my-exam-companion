export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Allow humans to get the standard SPA response quickly unless they are known bots
  // (We use a simple bot detection to only apply heavy HTML Rewriting/R2 fetches for bots)
  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);

  const examId = url.searchParams.get('exam_id') || 'Exam';
  const subject = url.searchParams.get('subject') || 'Subject';
  const year = url.searchParams.get('year') || 'Questions';

  // Format nicely: "nigeria/university_entrance/jamb" -> "JAMB"
  const parts = examId.split('/');
  const examFormatted = (parts.pop() || 'Exam').toUpperCase();
  const country = parts[0] ? parts[0].toUpperCase() : '';
  
  let subjectFormatted = subject.replace(/_/g, ' ');
  subjectFormatted = subjectFormatted.replace(/\b\w/g, c => c.toUpperCase());

  let title = `${examFormatted} ${subjectFormatted} ${year} Past Questions & Answers | My Exam Companion`;
  let description = `Practice free CBT exam past questions for ${examFormatted} ${subjectFormatted} ${year} online. Includes official answer keys, step-by-step explanations, and CBT timer.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  
  // Base canonical URL without parameters (since we use clean routing now)
  // But wait, this runs on the destination path, so url.pathname is the module HTML path!
  // It's better to construct the clean URL for canonical:
  let canonicalUrl = `https://myexamcompanion.pages.dev/study/${examId}/${subject}/${year}`;

  const response = await next();

  // If it's a bot, try to fetch the actual questions from R2 and inject them
  let questionsHtml = '';
  let schemas = [];

  if (isBot && env.QUESTIONS_BUCKET) {
    try {
      // The R2 object path is typically: examId / subject / objective / year .json
      // e.g. "nigeria/university_entrance/jamb/physics/objective/2024.json"
      const r2Key = `${examId}/${subject}/objective/${year}.json`;
      const obj = await env.QUESTIONS_BUCKET.get(r2Key);
      
      if (obj) {
        const data = await obj.json();
        
        let faqItems = [];
        let htmlBuilder = `<article class="pre-rendered-content"><h1>${title}</h1>`;
        
        if (data.data && Array.isArray(data.data)) {
          // Process first 20 questions for the bot snapshot (to keep payload small)
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
          
          // Generate Schema
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
    } catch (err) {
      console.error('Edge SSR R2 fetch failed:', err);
    }
  }

  // Schema for breadcrumbs
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}` },
      { "@type": "ListItem", "position": 4, "name": year, "item": canonicalUrl }
    ]
  });

  class HeadInjector {
    element(element) {
      // Remove default title if we want to override it (or handle it via TagRemover below)
      element.append(`<title>${title}</title>\n`, { html: true });
      element.append(`<meta name="description" content="${description}">\n`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">\n`, { html: true });
      
      // Open Graph Tags
      element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
      element.append(`<meta property="og:description" content="${description}">\n`, { html: true });
      element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">\n`, { html: true });
      element.append(`<meta property="og:type" content="website">\n`, { html: true });
      
      // Twitter Tags
      element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">\n`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });
      
      // Structured Data (JSON-LD)
      element.append(`<script type="application/ld+json">\n${JSON.stringify(schemas)}\n</script>\n`, { html: true });
    }
  }

  class BodyInjector {
    element(element) {
      if (questionsHtml) {
        // Inject pre-rendered questions into a noscript tag for crawlers to read
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
