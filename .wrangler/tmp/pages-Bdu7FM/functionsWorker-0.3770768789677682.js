var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// modules/study/classroom/classroom_discussion.html.js
async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const examId = url.searchParams.get("exam_id") || "";
  const subject = url.searchParams.get("subject") || "";
  const year = url.searchParams.get("year") || "";
  const qKey = url.searchParams.get("q") || url.searchParams.get("id") || "";
  const isPoll = url.searchParams.get("mode") === "poll";
  let subjectFormatted = subject.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const examFormatted = examId.split("/").pop().toUpperCase();
  let title = `${examFormatted} ${subjectFormatted}${year ? " " + year : ""} \u2014 Explanation | My Exam Companion`;
  let description = `View the official answer and step-by-step explanation for this ${examFormatted} ${subjectFormatted}${year ? " " + year : ""} past question on My Exam Companion.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  let canonicalUrl = url.href.split("?")[0] + url.search;
  if (isPoll) {
    title = `${examFormatted} ${subjectFormatted} \u2014 Poll | My Exam Companion`;
    description = `Vote your answer and see live community results for this ${examFormatted} ${subjectFormatted} question.`;
  }
  let schemas = [];
  let questionText = "";
  let answerText = "";
  let explanationText = "";
  let questionHtml = "";
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  if (qKey && env.QUESTIONS_BUCKET) {
    try {
      const obj = await env.QUESTIONS_BUCKET.get(`questions/${qKey}.json`);
      if (obj) {
        const data = await obj.json();
        const qExamBody = (data.examBody || examFormatted).toUpperCase();
        const qSubject = data.subject || subjectFormatted;
        const qTopic = Array.isArray(data.topic) ? data.topic[0] : data.topic || "";
        questionText = (data.question || "").replace(/<[^>]*>/g, "").trim();
        const correctOpt = (data.options || []).find((o) => o.is_correct);
        answerText = correctOpt ? (correctOpt.text || "").replace(/<[^>]*>/g, "").trim() : "";
        explanationText = (data.explanation || "").replace(/<[^>]*>/g, "").trim();
        title = `${qExamBody} ${qSubject}${year ? " " + year : ""}${qTopic ? " \u2014 " + qTopic : ""} | My Exam Companion`;
        description = questionText ? `${questionText.substring(0, 120)}... \u2014 Answer & Explanation on My Exam Companion` : description;
        image = `https://myexamcompanion.pages.dev/api/og-image?id=${encodeURIComponent(qKey)}`;
        if (isBot) {
          const optionsHtml = (data.options || []).map((o) => {
            const tag = (o.tag || "").toUpperCase();
            const text = (o.text || "").replace(/<[^>]*>/g, "");
            return `<li${o.is_correct ? ' style="font-weight:bold"' : ""}>${tag}. ${text}</li>`;
          }).join("");
          questionHtml = `
<article itemscope itemtype="https://schema.org/Question" id="edge-ssr-snapshot">
  <h1 itemprop="name">${title}</h1>
  <p itemprop="text">${questionText}</p>
  ${optionsHtml ? `<ul>${optionsHtml}</ul>` : ""}
  <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
    <strong>Correct Answer:</strong>
    <p itemprop="text">${answerText}</p>
    ${explanationText ? `<strong>Explanation:</strong><p>${explanationText}</p>` : ""}
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
            } : void 0
          }
        });
      }
    } catch (err) {
      console.error("Discussion Edge SSR R2 fetch failed:", err);
    }
  }
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}` },
      ...year ? [{ "@type": "ListItem", "position": 4, "name": year, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}/${year}` }] : []
    ]
  });
  const response = await next();
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:image:width" content="1200">
`, { html: true });
      element.append(`<meta property="og:image:height" content="630">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="article">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (questionHtml) {
        element.prepend(`<noscript>${questionHtml}</noscript>`, { html: true });
      }
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest, "onRequest");

// modules/study/classroom/classroom_questions.html.js
async function onRequest2(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  const examId = url.searchParams.get("exam_id") || "Exam";
  const subject = url.searchParams.get("subject") || "Subject";
  const year = url.searchParams.get("year") || "Questions";
  const parts = examId.split("/");
  const examFormatted = (parts.pop() || "Exam").toUpperCase();
  const country = parts[0] ? parts[0].toUpperCase() : "";
  let subjectFormatted = subject.replace(/_/g, " ");
  subjectFormatted = subjectFormatted.replace(/\b\w/g, (c) => c.toUpperCase());
  let title = `${examFormatted} ${subjectFormatted} ${year} Past Questions & Answers | My Exam Companion`;
  let description = `Practice free CBT exam past questions for ${examFormatted} ${subjectFormatted} ${year} online. Includes official answer keys, step-by-step explanations, and CBT timer.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  let canonicalUrl = `https://myexamcompanion.pages.dev/study/${examId}/${subject}/${year}`;
  const response = await next();
  let questionsHtml = "";
  let schemas = [];
  if (isBot && env.QUESTIONS_BUCKET) {
    try {
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
            const qText = (q.question || "").replace(/<[^>]*>/g, "");
            const ansObj = q.options ? q.options.find((o) => o.is_correct) : null;
            const ansText = ansObj ? (ansObj.text || "").replace(/<[^>]*>/g, "") : "See explanation";
            const expText = (q.explanation || "").replace(/<[^>]*>/g, "");
            htmlBuilder += `
              <section>
                <h2>Question ${qNum}</h2>
                <p>${qText}</p>
                <p><strong>Correct Answer:</strong> ${ansText}</p>
                ${expText ? `<p><strong>Explanation:</strong> ${expText}</p>` : ""}
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
    } catch (err) {
      console.error("Edge SSR R2 fetch failed:", err);
    }
  }
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
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (questionsHtml) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${questionsHtml}</noscript>`, { html: true });
      }
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest2, "onRequest");

// [[country]]/study/brochure/[[slug]].js
async function onRequest3(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const country = params.country || "ng";
  const slugSegment = Array.isArray(params.slug) ? params.slug.join("/") : params.slug || "";
  const idMatch = slugSegment.match(/-?(\d+)$/);
  const institutionId = idMatch ? idMatch[1] : slugSegment;
  const isInstitutionPage = !!institutionId;
  const COUNTRY_NAMES = {
    ng: "Nigeria",
    gh: "Ghana",
    us: "United States",
    uk: "United Kingdom"
  };
  const countryName = COUNTRY_NAMES[country] || country.toUpperCase();
  const targetAsset = isInstitutionPage ? "/modules/study/brochure/course" : "/modules/study/brochure/brochure";
  const assetUrl = new URL(targetAsset, url.origin);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  const R2_BASE = "https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev";
  let title = "";
  let description = "";
  let canonicalUrl = "";
  let ssrHtml = "";
  let schemas = [];
  if (!isInstitutionPage) {
    title = `${countryName} Universities & Polytechnics Brochure \u2014 Courses & Requirements | My Exam Companion`;
    description = `Browse all ${countryName} universities, polytechnics, and colleges of education. Find available courses, UTME subject combinations, and O'Level requirements for free.`;
    canonicalUrl = `https://www.myexamcompanion.com/${country}/study/brochure`;
  } else {
    const instNameFormatted = slugSegment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${instNameFormatted} \u2014 Courses, Requirements & Subject Combinations | My Exam Companion`;
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
          title = `${realName} \u2014 Courses, Requirements & Subject Combinations | My Exam Companion`;
          description = `Find all available courses at ${realName} in ${countryName}. View UTME subject combinations, O'Level requirements, and direct entry requirements for free.`;
          let courseHtml = `<article class="pre-rendered-content"><h1>${title}</h1>`;
          courseHtml += `<p>${realName} offers ${courses.length} accredited programmes.</p><ul>`;
          const schemaOffers = [];
          courses.slice(0, 30).forEach((course) => {
            const cName = course.course_name || "";
            const utme = course.utme_requirements || "";
            courseHtml += `<li><strong>${cName}</strong>${utme ? " \u2014 UTME: " + utme : ""}</li>`;
            schemaOffers.push({
              "@type": "EducationalOccupationalProgram",
              "name": cName,
              "provider": { "@type": "EducationalOrganization", "name": realName }
            });
          });
          courseHtml += `</ul></article>`;
          ssrHtml = courseHtml;
          schemas.push({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": realName,
            "url": canonicalUrl,
            "description": description,
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": `${realName} Courses`,
              "numberOfItems": courses.length,
              "itemListElement": schemaOffers
            }
          });
        }
      } catch (err) {
        console.error("[Brochure Edge] Institution course fetch error:", err);
      }
    }
  }
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `https://www.myexamcompanion.com/${country}` },
      { "@type": "ListItem", "position": 2, "name": `${countryName} Brochure`, "item": `https://www.myexamcompanion.com/${country}/study/brochure` },
      ...isInstitutionPage ? [{ "@type": "ListItem", "position": 3, "name": slugSegment.replace(/-/g, " "), "item": canonicalUrl }] : []
    ]
  });
  const image = `https://www.myexamcompanion.com/api/og-image?title=${encodeURIComponent(title)}`;
  const ssrSnapshot = ssrHtml;
  const clientParams = isInstitutionPage ? `{ country: "${country}", institution_id: "${institutionId}" }` : `{ country: "${country}" }`;
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
      element.append(`<script>window.MEC_BROCHURE_PARAMS = ${clientParams};<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (ssrSnapshot) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${ssrSnapshot}</noscript>`, { html: true });
      }
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest3, "onRequest");

// [[country]]/study/classroom/[[path]].js
async function onRequest4(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const countryCode = context.params.country || "ng";
  const path = context.params.path || [];
  const countryMap = { ng: "nigeria", gh: "ghana", us: "usa" };
  const fullCountry = countryMap[countryCode] || countryCode;
  if (path.length === 0) {
    const assetResp = await env.ASSETS.fetch(new Request(new URL("/modules/study/classroom/classroom_subject", request.url).toString(), { headers: request.headers }));
    return assetResp;
  }
  const exam = path[0];
  const examId = `${fullCountry}/${exam}`;
  const subject = path[1] || "";
  const year = path[2] || "";
  const discussionIdx = path.indexOf("discussion");
  const isDiscussionPage = discussionIdx !== -1;
  if (isDiscussionPage) {
    let dSubject, dQKey;
    if (path[2] === "discussion") {
      dSubject = path[1] || "";
      dQKey = path[3] || "";
    } else {
      dSubject = path[1] || "";
      dQKey = path[2] || "";
    }
    const _dYearRaw = url.searchParams.get("year") || "";
    const dYear = _dYearRaw || (dQKey.match(/^(\d{4})_/) ? dQKey.match(/^(\d{4})_/)[1] : "");
    const dType = url.searchParams.get("type") || "objective";
    const dLocked = url.searchParams.get("locked_answer") || "";
    const dMode = url.searchParams.get("mode") || "";
    let dSubjectFmt = dSubject.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const dExamFmt = exam.toUpperCase();
    let title2 = `${dExamFmt} ${dSubjectFmt} \u2014 Explanation | My Exam Companion`;
    let description2 = `View the official answer and step-by-step explanation for this ${dExamFmt} ${dSubjectFmt} past question.`;
    let image2 = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title2)}`;
    const canonicalUrl2 = `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${dSubject}/discussion/${dQKey ? encodeURIComponent(dQKey) : ""}`;
    let schemas2 = [];
    let questionHtml = "";
    const userAgent2 = request.headers.get("User-Agent") || "";
    const isBot2 = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent2);
    if (dQKey && env.QUESTIONS_BUCKET) {
      try {
        const obj = await env.QUESTIONS_BUCKET.get(`questions/${dQKey}.json`);
        if (obj) {
          const data = await obj.json();
          const qText = (data.question || "").replace(/<[^>]*>/g, "").trim();
          const correctOpt = (data.options || []).find((o) => o.is_correct);
          const ansText = correctOpt ? (correctOpt.text || "").replace(/<[^>]*>/g, "").trim() : "";
          const expText = (data.explanation || "").replace(/<[^>]*>/g, "").trim();
          const qTopic = Array.isArray(data.topic) ? data.topic[0] : data.topic || "";
          title2 = `${dExamFmt} ${dSubjectFmt}${dYear ? " " + dYear : ""}${qTopic ? " \u2014 " + qTopic : ""} | My Exam Companion`;
          description2 = qText ? `${qText.substring(0, 120)}... \u2014 Answer & Explanation on My Exam Companion` : description2;
          image2 = `https://myexamcompanion.pages.dev/api/og-image?id=${encodeURIComponent(dQKey)}`;
          schemas2.push({
            "@context": "https://schema.org",
            "@type": "QAPage",
            "name": title2,
            "description": description2,
            "mainEntity": {
              "@type": "Question",
              "name": qText.substring(0, 200),
              "text": qText,
              ...ansText ? { "acceptedAnswer": { "@type": "Answer", "text": `${ansText}. ${expText}`.trim() } } : {}
            }
          });
          if (isBot2) {
            const optionsHtml = (data.options || []).map((o) => {
              const tag = (o.tag || "").toUpperCase();
              const txt = (o.text || "").replace(/<[^>]*>/g, "");
              return `<li${o.is_correct ? ' style="font-weight:bold"' : ""}>${tag}. ${txt}</li>`;
            }).join("");
            questionHtml = `<article itemscope itemtype="https://schema.org/Question"><h1 itemprop="name">${title2}</h1><p itemprop="text">${qText}</p>${optionsHtml ? `<ul>${optionsHtml}</ul>` : ""}<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><strong>Correct Answer:</strong><p itemprop="text">${ansText}</p>${expText ? `<strong>Explanation:</strong><p>${expText}</p>` : ""}</div></article>`;
          }
        }
      } catch (err) {
        console.error("Discussion Edge SSR R2 fetch failed:", err);
      }
    }
    schemas2.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
        { "@type": "ListItem", "position": 2, "name": dExamFmt, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}` },
        { "@type": "ListItem", "position": 3, "name": dSubjectFmt, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${dSubject}` },
        { "@type": "ListItem", "position": 4, "name": "Discussion", "item": canonicalUrl2 }
      ]
    });
    const assetResp = await env.ASSETS.fetch(new Request(new URL("/modules/study/classroom/classroom_discussion", request.url).toString(), { headers: request.headers }));
    class DDiscHeadInjector {
      static {
        __name(this, "DDiscHeadInjector");
      }
      element(element) {
        element.prepend(`<base href="/">
`, { html: true });
        element.append(`<title>${title2}</title>
`, { html: true });
        element.append(`<meta name="description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<link rel="canonical" href="${canonicalUrl2}">
`, { html: true });
        element.append(`<meta property="og:title" content="${title2}">
`, { html: true });
        element.append(`<meta property="og:description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<meta property="og:image" content="${image2}">
`, { html: true });
        element.append(`<meta property="og:url" content="${canonicalUrl2}">
`, { html: true });
        element.append(`<meta property="og:type" content="article">
`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
        element.append(`<meta name="twitter:title" content="${title2}">
`, { html: true });
        element.append(`<meta name="twitter:description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<meta name="twitter:image" content="${image2}">
`, { html: true });
        element.append(`<script type="application/ld+json">
${JSON.stringify(schemas2)}
<\/script>
`, { html: true });
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
<\/script>
`, { html: true });
      }
    }
    class DDiscBodyInjector {
      static {
        __name(this, "DDiscBodyInjector");
      }
      element(element) {
        if (questionHtml) {
          element.prepend(`<noscript>${questionHtml}</noscript>`, { html: true });
        }
      }
    }
    class TagRemover2 {
      static {
        __name(this, "TagRemover");
      }
      element(element) {
        element.remove();
      }
    }
    return new HTMLRewriter().on("title", new TagRemover2()).on('meta[name="description"]', new TagRemover2()).on('meta[property^="og:"]', new TagRemover2()).on('meta[name^="twitter:"]', new TagRemover2()).on('link[rel="canonical"]', new TagRemover2()).on("head", new DDiscHeadInjector()).on("body", new DDiscBodyInjector()).transform(assetResp);
  }
  const isSubjectPage = path.length === 1;
  const targetAsset = isSubjectPage ? "/modules/study/classroom/classroom_subject" : "/modules/study/classroom/classroom_questions";
  const assetUrl = new URL(targetAsset, request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));
  if (isSubjectPage) {
    class SubjectInjector {
      static {
        __name(this, "SubjectInjector");
      }
      element(element) {
        element.prepend(`<base href="/">
`, { html: true });
        element.append(`<script>window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}" };<\/script>
`, { html: true });
      }
    }
    return new HTMLRewriter().on("head", new SubjectInjector()).transform(response);
  }
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  const examFormatted = exam.toUpperCase();
  let subjectFormatted = subject.replace(/_/g, " ");
  subjectFormatted = subjectFormatted.replace(/\b\w/g, (c) => c.toUpperCase());
  const yearText = year ? ` ${year}` : "";
  let title = `${examFormatted} ${subjectFormatted}${yearText} Past Questions & Answers | My Exam Companion`;
  let description = `Practice free CBT exam past questions for ${examFormatted} ${subjectFormatted}${yearText} online. Includes official answer keys, step-by-step explanations, and CBT timer.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  let canonicalUrl = `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${subject}${year ? "/" + year : ""}`;
  let questionsHtml = "";
  let schemas = [];
  if (isBot && env.QUESTIONS_BUCKET) {
    try {
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
              const qText = (q.question || "").replace(/<[^>]*>/g, "");
              const ansObj = q.options ? q.options.find((o) => o.is_correct) : null;
              const ansText = ansObj ? (ansObj.text || "").replace(/<[^>]*>/g, "") : "See explanation";
              const expText = (q.explanation || "").replace(/<[^>]*>/g, "");
              htmlBuilder += `
                <section>
                  <h2>Question ${qNum}</h2>
                  <p>${qText}</p>
                  <p><strong>Correct Answer:</strong> ${ansText}</p>
                  ${expText ? `<p><strong>Explanation:</strong> ${expText}</p>` : ""}
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
      console.error("Edge SSR R2 fetch failed:", err);
    }
  }
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/${countryCode}/study/classroom/${exam}/${subject}` },
      ...year ? [{ "@type": "ListItem", "position": 4, "name": year, "item": canonicalUrl }] : []
    ]
  });
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
      const simulatedSearch = new URLSearchParams();
      if (subject) simulatedSearch.set("subject", subject);
      if (year) simulatedSearch.set("year", year);
      const searchStr = simulatedSearch.toString();
      element.append(`<script>
window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}", subject: "${subject}", year: "${year}" };
// Inject year/type into the URL so raw URLSearchParams(window.location.search) reads them
if (${!!year} && !window.location.search.includes('year=')) {
  history.replaceState(null, '', window.location.pathname + '?${searchStr}');
}
<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (questionsHtml) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${questionsHtml}</noscript>`, { html: true });
      }
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest4, "onRequest");

// [[country]]/blog/[[path]].js
var CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "study-tips", label: "Study Tips" },
  { slug: "exam-updates", label: "Exam Updates" },
  { slug: "guide", label: "Guide" },
  { slug: "scholarships", label: "Scholarships" },
  { slug: "school-news", label: "School News" }
];
var CC_LANG = { ng: "en-NG", gh: "en-GH", us: "en-US" };
function normaliseCategorySlug(raw) {
  if (!raw) return "guide";
  const r = raw.toLowerCase().replace(/\s+/g, "-");
  const found = CATEGORIES.find((c) => c.slug === r || c.label.toLowerCase() === r);
  return found ? found.slug : "guide";
}
__name(normaliseCategorySlug, "normaliseCategorySlug");
function getCategoryLabel(slug) {
  return (CATEGORIES.find((c) => c.slug === slug) || {}).label || "Guide";
}
__name(getCategoryLabel, "getCategoryLabel");
var BASE = "https://myexamcompanion.com";
var SITE_NAME = "MyExam Companion";
var LOGO_URL = `${BASE}/logos/logo.png`;
var ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
__name(esc, "esc");
function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
__name(stripHtml, "stripHtml");
function readTime(html = "") {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
__name(readTime, "readTime");
function adSlot(slotId, label) {
  return `<div class="ad-wrap" aria-label="Advertisement" data-slot="${label}">
  <ins class="adsbygoogle" style="display:block;text-align:center;"
       data-ad-layout="in-article" data-ad-format="fluid"
       data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${slotId}"></ins>
</div>`;
}
__name(adSlot, "adSlot");
var ADSENSE_INIT = "<script>\n(window.adsbygoogle=window.adsbygoogle||[]).forEach?0:(adsbygoogle=[]);\ndocument.querySelectorAll('.adsbygoogle').forEach(function(){(adsbygoogle=window.adsbygoogle||[]).push({});});\n<\/script>";
async function supabaseFetch(env, table, query) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error(`Supabase ${table} query failed: ${res.status}`);
  return res.json();
}
__name(supabaseFetch, "supabaseFetch");
function buildListingHtml({ cc, category, posts, page, totalPages }) {
  const lang = CC_LANG[cc] || "en";
  const catLabel = getCategoryLabel(category);
  const catIsAll = category === "all";
  const pageTitle = catIsAll ? `Blog \u2014 ${SITE_NAME}` : `${catLabel} Articles \u2014 ${SITE_NAME}`;
  const description = catIsAll ? `Study tips, exam updates, scholarship guides and school news for ${cc === "ng" ? "Nigerian" : cc === "gh" ? "Ghanaian" : ""} students on ${SITE_NAME}.` : `Latest ${catLabel} articles for students. Find expert guides, tips and news on ${SITE_NAME}.`;
  const canonicalBase = `${BASE}/${cc}/blog${catIsAll ? "" : "/" + category}`;
  const canonicalUrl = page > 1 ? `${canonicalBase}?page=${page}` : canonicalBase;
  const websiteSchema = !catIsAll || page > 1 ? "" : `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${BASE}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE}/${cc}/blog?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    }
  })}<\/script>`;
  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/${cc}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/${cc}/blog` },
      ...catIsAll ? [] : [{ "@type": "ListItem", position: 3, name: catLabel, item: `${BASE}/${cc}/blog/${category}` }]
    ]
  });
  const ogImage = (posts.find((p) => p.thumbnail_url && !p.thumbnail_url.startsWith("data:")) || {}).thumbnail_url || LOGO_URL;
  const navTabs = CATEGORIES.map((c) => {
    const active = c.slug === category;
    const href = `/${cc}/blog${c.slug === "all" ? "" : "/" + c.slug}`;
    return `<a href="${href}" class="cat-tab${active ? " active" : ""}" aria-current="${active ? "page" : "false"}">${c.label}</a>`;
  }).join("");
  const cards = posts.map((p) => {
    const catSlug = normaliseCategorySlug(p.category);
    const href = `/${cc}/blog/${catSlug}/${p.slug}`;
    const thumb = p.thumbnail_url && !p.thumbnail_url.startsWith("data:") ? `<img src="${esc(p.thumbnail_url)}" alt="${esc(p.title)}" loading="lazy" width="400" height="225">` : '<div class="card-thumb-placeholder" aria-hidden="true"></div>';
    const date = p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
    const rt = readTime(p.rendered_html || p.draft_content?.content || "");
    return `<article class="post-card">
      <a href="${href}" tabindex="-1" aria-hidden="true">
        <div class="card-thumb">${thumb}</div>
      </a>
      <div class="card-body">
        <span class="card-cat">${getCategoryLabel(catSlug)}</span>
        <h2 class="card-title"><a href="${href}">${esc(p.title)}</a></h2>
        ${p.description ? `<p class="card-desc">${esc(p.description.substring(0, 120))}\u2026</p>` : ""}
        <div class="card-meta">
          <span>${esc(p.publisher_name || "Staff")}</span>
          <span class="sep" aria-hidden="true">\xB7</span>
          <time datetime="${p.created_at || ""}">${date}</time>
          <span class="sep" aria-hidden="true">\xB7</span>
          <span>${rt} min read</span>
        </div>
      </div>
    </article>`;
  }).join("");
  const prevNext = [
    page > 1 ? `<link rel="prev" href="${canonicalBase}${page - 1 > 1 ? "?page=" + (page - 1) : ""}">` : "",
    page < totalPages ? `<link rel="next" href="${canonicalBase}?page=${page + 1}">` : ""
  ].filter(Boolean).join("\n  ");
  const pagination = totalPages > 1 ? `
  <nav class="pagination" aria-label="Pagination">
    ${page > 1 ? `<a href="${canonicalBase}${page - 1 > 1 ? "?page=" + (page - 1) : ""}" class="page-btn" rel="prev">\u2190 Previous</a>` : '<span class="page-btn disabled" aria-disabled="true">\u2190 Previous</span>'}
    <span class="page-info">Page ${page} of ${totalPages}</span>
    ${page < totalPages ? `<a href="${canonicalBase}?page=${page + 1}" class="page-btn" rel="next">Next \u2192</a>` : '<span class="page-btn disabled" aria-disabled="true">Next \u2192</span>'}
  </nav>` : "";
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
    <h1>${esc(catIsAll ? "Blog" : catLabel)}</h1>
    <p>${esc(description)}</p>
  </header>
  <nav class="cat-tabs" aria-label="Blog categories">${navTabs}</nav>
  ${adSlot("1234567890", "listing-top")}
  <div class="posts-grid">${cards || '<p style="color:var(--muted);grid-column:1/-1;padding:40px 0;">No articles yet in this category.</p>'}</div>
  ${adSlot("0987654321", "listing-bottom")}
  ${pagination}
</div>
${ADSENSE_INIT}
</body>
</html>`;
}
__name(buildListingHtml, "buildListingHtml");
function buildArticleHtml({ cc, post, publisherName, publisherBio, publisherAvatar }) {
  const lang = CC_LANG[cc] || "en";
  const catSlug = normaliseCategorySlug(post.category);
  const catLabel = getCategoryLabel(catSlug);
  const slug = post.slug || post.id || "";
  const canonicalUrl = `${BASE}/${cc}/blog/${catSlug}/${slug}`;
  const dateIso = post.created_at || (/* @__PURE__ */ new Date()).toISOString();
  const dateHuman = new Date(dateIso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const modIso = post.updated_at && post.updated_at !== post.created_at ? post.updated_at : dateIso;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const desc = post.description || (post.intro ? stripHtml(post.intro).substring(0, 160) : "");
  let thumbUrl = post.thumbnail_url && !post.thumbnail_url.startsWith("data:") ? post.thumbnail_url : null;
  if (thumbUrl && thumbUrl.includes("pub-d048d28d4cd54d579def4bf758d5a298.r2.dev")) {
    const pathPart = thumbUrl.split(".r2.dev/")[1];
    thumbUrl = `/r2/${pathPart}`;
  }
  const firstName = publisherName ? publisherName.split(" ")[0] : "Staff";
  const articleBody = post.contentHtml ? post.contentHtml : post.intro ? `<p class="intro-para">${post.intro}</p>
         <p style="color:#6b7280;font-size:15px;line-height:1.7;margin-top:24px;">
           ${desc ? esc(desc) : ""}
         </p>` : `<p style="color:#6b7280;">Content loading\u2026</p>`;
  const tocItems = "";
  const rt = 5;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: desc,
    ...thumbUrl ? { image: [thumbUrl] } : {},
    author: {
      "@type": "Person",
      name: publisherName,
      url: `${BASE}/${cc}/blog?author=${encodeURIComponent(publisherName)}`
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 250, height: 60 }
    },
    datePublished: dateIso,
    dateModified: modIso,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    articleSection: catLabel,
    keywords: tags.join(", "),
    inLanguage: lang,
    wordCount: stripHtml(articleBody).split(/\s+/).length
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/${cc}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/${cc}/blog` },
      { "@type": "ListItem", position: 3, name: catLabel, item: `${BASE}/${cc}/blog/${catSlug}` },
      { "@type": "ListItem", position: 4, name: post.title, item: canonicalUrl }
    ]
  };
  const tagsHtml = tags.length ? `<div class="article-tags" aria-label="Tags">${tags.map(
    (t) => `<a href="/${cc}/blog/${catSlug}?tag=${encodeURIComponent(t)}" class="tag-pill" rel="tag">${esc(t)}</a>`
  ).join("")}</div>` : "";
  const hreflangAlts = ["ng", "gh", "us"].map(
    (c) => `<link rel="alternate" hreflang="en-${c}" href="${BASE}/${c}/blog/${catSlug}/${post.slug}">`
  ).join("\n  ");
  const pageTitle = `${post.title} \u2014 ${catLabel} | ${SITE_NAME}`;
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
  <meta property="og:image:alt"           content="${esc(post.title)}">` : ""}
  <meta property="og:url"                 content="${canonicalUrl}">
  <meta property="og:site_name"           content="${SITE_NAME}">
  <meta property="article:published_time" content="${dateIso}">
  <meta property="article:modified_time"  content="${modIso}">
  <meta property="article:author"         content="${esc(publisherName)}">
  <meta property="article:section"        content="${esc(catLabel)}">
  ${tags.map((t) => `<meta property="article:tag" content="${esc(t)}">`).join("\n  ")}

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(post.title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${thumbUrl ? `<meta name="twitter:image" content="${esc(thumbUrl)}">` : ""}
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
    .author-name-lg{font-size:17px;font-weight:800;margin-bottom:4px;color:#111}
    .author-bio{font-size:14.5px;color:var(--muted);line-height:1.55}
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

  ${thumbUrl ? `<div class="hero-wrap"><img src="${esc(thumbUrl)}" alt="${esc(post.title)}" width="1200" height="630" fetchpriority="high" itemprop="image"></div>` : ""}

  <h1 class="art-title" itemprop="headline">${esc(post.title)}</h1>

  <div class="art-meta">
    ${publisherAvatar ? `<img src="${esc(publisherAvatar)}" alt="${esc(firstName)}" width="34" height="34" loading="eager">` : ""}
    <span class="author-name" itemprop="author" itemscope itemtype="https://schema.org/Person">
      <span itemprop="name">${esc(firstName)}</span>
    </span>
    <span class="sep" aria-hidden="true">\xB7</span>
    <time datetime="${dateIso}" itemprop="datePublished">${dateHuman}</time>
    <meta itemprop="dateModified" content="${modIso}">
    <span class="sep" aria-hidden="true">\xB7</span>
    <span>${rt} min read</span>
  </div>

  ${adSlot("1122334455", "article-top")}

  ${tocItems ? `<nav class="toc-box" aria-label="Table of contents">
    <h2>On this page</h2>
    <ul class="toc-list">${tocItems}</ul>
  </nav>` : ""}

  <div class="art-body" itemprop="articleBody">
    ${articleBody.replace(publisherName, "")}
  </div>

  ${adSlot("5566778899", "article-mid")}

  ${tagsHtml}

  <div class="author-box">
    ${publisherAvatar ? `<img src="${esc(publisherAvatar)}" alt="${esc(firstName)}" width="56" height="56" loading="lazy">` : '<div style="width:56px;height:56px;border-radius:50%;background:#e5e7eb;flex-shrink:0" aria-hidden="true"></div>'}
    <div>
      <div class="author-name-lg" itemprop="author">About ${esc(firstName)}</div>
      <div class="author-bio">${esc(publisherBio || "A contributor at My Exam Companion.")}</div>
    </div>
  </div>

  ${adSlot("9988776655", "article-bottom")}

</div>

${ADSENSE_INIT}
</body>
</html>`;
}
__name(buildArticleHtml, "buildArticleHtml");
async function onRequest5(context) {
  const url = new URL(context.request.url);
  const debugMode = url.searchParams.get("debug") === "1";
  const steps = [];
  const log = /* @__PURE__ */ __name((step, data) => steps.push({ step, data, ts: Date.now() }), "log");
  try {
    log("start", { url: url.pathname });
    const result = await handleRequest(context, log);
    log("success", { status: result.status });
    return result;
  } catch (fatal) {
    const errMsg = fatal instanceof Error ? fatal.message : String(fatal);
    const errStack = fatal instanceof Error ? fatal.stack : "";
    console.error("Blog function fatal error:", errMsg, errStack);
    log("FATAL", { error: errMsg, stack: errStack });
    const cc = (context.params?.country || "ng").toLowerCase();
    if (debugMode) {
      const report = steps.map(
        (s, i) => `<tr style="background:${i % 2 ? "#f9fafb" : "#fff"}">
          <td style="padding:8px 12px;font-family:monospace;font-size:12px;border:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:8px 12px;font-family:monospace;font-size:12px;border:1px solid #e5e7eb;font-weight:${s.step === "FATAL" ? "bold" : 400};color:${s.step === "FATAL" ? "#dc2626" : "inherit"}">${s.step}</td>
          <td style="padding:8px 12px;font-family:monospace;font-size:11px;border:1px solid #e5e7eb;word-break:break-all;max-width:500px">${JSON.stringify(s.data).substring(0, 500)}</td>
        </tr>`
      ).join("");
      return new Response(
        `<!DOCTYPE html><html lang="en"><head><title>Debug \u2014 Blog Worker</title>
        <meta name="robots" content="noindex">
        <style>body{font-family:sans-serif;padding:32px;max-width:900px;margin:0 auto}table{width:100%;border-collapse:collapse}h1{color:#dc2626;margin-bottom:8px}h2{margin:24px 0 8px}pre{background:#f9fafb;padding:16px;border-radius:8px;overflow:auto;font-size:12px;border:1px solid #e5e7eb}</style>
        </head><body>
        <h1>\u{1F534} Worker Diagnostic Report</h1>
        <p style="color:#666">URL: <code>${url.pathname}</code></p>
        <h2>Step Trace</h2>
        <table><thead><tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb">#</th><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb">Step</th><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb">Data</th></tr></thead>
        <tbody>${report}</tbody></table>
        <h2>Fatal Error</h2>
        <pre>${errMsg}

${errStack}</pre>
        </body></html>`,
        { status: 500, headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } }
      );
    }
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><title>Something went wrong</title>
      <meta name="robots" content="noindex"></head>
      <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="font-size:24px;margin-bottom:12px;">Something went wrong</h1>
        <p style="color:#666;margin-bottom:20px;">We couldn't load this page. Please try again in a moment.</p>
        <a href="/${cc}/blog" style="color:#2563eb;">\u2190 Back to blog</a>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html;charset=UTF-8" } }
    );
  }
}
__name(onRequest5, "onRequest");
async function handleRequest(context, log = () => {
}) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cc = (context.params.country || "ng").toLowerCase();
  const path = context.params.path || [];
  log("routing", { cc, path, hasSupabaseUrl: !!env.SUPABASE_URL, hasAnonKey: !!env.SUPABASE_ANON_KEY });
  if (!["ng", "gh", "us"].includes(cc)) {
    return new Response("Not found", { status: 404 });
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY not configured in Cloudflare Pages environment variables");
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><title>Configuration error</title>
      <meta name="robots" content="noindex"></head>
      <body style="font-family:sans-serif;padding:40px;">
        <h1>Blog temporarily unavailable</h1>
        <p>Please check back soon.</p>
        <a href="/${cc}/blog">\u2190 Back to blog</a>
      </body></html>`,
      { status: 503, headers: { "Content-Type": "text/html;charset=UTF-8" } }
    );
  }
  const categoryFromPath = path[0] ? path[0].toLowerCase() : "all";
  const slugFromPath = path[1] || null;
  const isKnownCategory = CATEGORIES.some((c) => c.slug === categoryFromPath);
  if (isKnownCategory && slugFromPath) {
    const objectKey = `${cc}/blog/${categoryFromPath}/${slugFromPath}.json`;
    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      log("cache-hit", { key: objectKey });
      return cachedResponse;
    }
    if (!env.BLOG_BUCKET) {
      log("missing-bucket-binding", {});
      return context.next();
    }
    try {
      log("r2-fetch-json", { key: objectKey });
      const r2Object = await env.BLOG_BUCKET.get(objectKey);
      if (!r2Object) {
        log("r2-json-not-found", { key: objectKey });
        return context.next();
      }
      const articleData = await r2Object.json();
      const post = {
        id: articleData.id,
        title: articleData.title,
        slug: articleData.slug,
        category: articleData.category,
        description: articleData.description,
        thumbnail_url: articleData.thumbnail_url,
        tags: articleData.tags || [],
        created_at: articleData.date,
        contentHtml: articleData.content
      };
      let pubName = "MEC Staff", pubBio = "", pubAvatar = "";
      const pid = articleData.author_id || articleData.publisher_id;
      if (pid) {
        try {
          const pubRes = await supabaseFetch(env, "publishers", `select=publisher_name,bio,avatar_url&user_id=eq.${pid}&limit=1`);
          if (pubRes && pubRes[0]) {
            pubName = pubRes[0].publisher_name || pubName;
            pubBio = pubRes[0].bio || pubBio;
            pubAvatar = pubRes[0].avatar_url || pubAvatar;
          } else {
            const profRes = await supabaseFetch(env, "profiles", `select=display_name,bio,avatar_url&id=eq.${pid}&limit=1`);
            if (profRes && profRes[0]) {
              pubName = profRes[0].display_name || pubName;
              pubBio = profRes[0].bio || pubBio;
              pubAvatar = profRes[0].avatar_url || pubAvatar;
            }
          }
        } catch (e) {
          log("publisher-fetch-error", { error: e.message });
        }
      }
      const html = buildArticleHtml({
        cc,
        post,
        publisherName: pubName,
        publisherBio: pubBio,
        publisherAvatar: pubAvatar
      });
      let response = new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800"
        }
      });
      context.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      log("r2-json-error", { error: err.message });
      return context.next();
    }
  }
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugFromPath);
    console.log("article-fetch", { slugFromPath, isUuid });
    let post = null;
    const selectFields = "id,slug,category,cloudflare_url,title,description,intro,thumbnail_url,tags,created_at,updated_at,publisher_id";
    try {
      if (isUuid) {
        const rows = await supabaseFetch(
          env,
          "publisher_posts",
          `select=${selectFields}&id=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
        );
        post = rows[0] || null;
      } else {
        const rows = await supabaseFetch(
          env,
          "publisher_posts",
          `select=${selectFields}&slug=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
        );
        post = rows[0] || null;
        if (!post) {
          const fb2 = await supabaseFetch(
            env,
            "publisher_posts",
            `select=${selectFields}&id=eq.${encodeURIComponent(slugFromPath)}&status=eq.approved&limit=1`
          );
          post = fb2[0] || null;
        }
      }
      console.log("article-found", { found: !!post, slug: post?.slug, cloudflare_url: post?.cloudflare_url });
    } catch (dbErr) {
      console.log("article-db-error", { error: dbErr.message });
    }
    if (!post) {
      return new Response(
        `<!DOCTYPE html><html><head><title>Not found</title><meta name="robots" content="noindex"></head>
          <body style="font-family:sans-serif;padding:40px">
            <h1>Article not found</h1>
            <p>This article may have been removed or is not yet approved.</p>
            <a href="/${cc}/blog" style="color:#2563eb">\u2190 Back to blog</a>
          </body></html>`,
        { status: 404, headers: { "Content-Type": "text/html;charset=UTF-8" } }
      );
    }
    if (isUuid && post.slug && post.slug !== slugFromPath) {
      const cat = (post.category || "guide").toLowerCase().replace(/\s+/g, "-");
      return new Response(null, { status: 301, headers: { "Location": `/${cc}/blog/${cat}/${post.slug}` } });
    }
    if (post.cloudflare_url) {
      console.log("r2-fetch", { url: post.cloudflare_url });
      try {
        const r2 = await fetch(post.cloudflare_url);
        console.log("r2-status", { status: r2.status, ok: r2.ok });
        if (r2.ok) {
          const contentType = r2.headers.get("content-type") || "";
          if (contentType.includes("application/json") || post.cloudflare_url.endsWith(".json")) {
            const jsonData = await r2.json();
            post.contentHtml = jsonData.content || "";
            let pubName = "Staff", pubBio = "", pubAvatar = "";
            if (post.publisher_id) {
              try {
                const pubProfile = await supabaseFetch(env, "publishers", `select=publisher_name,bio,avatar_url&user_id=eq.${post.publisher_id}&limit=1`);
                if (pubProfile && pubProfile[0]) {
                  pubName = pubProfile[0].publisher_name || "Staff";
                  pubBio = pubProfile[0].bio || "";
                  pubAvatar = pubProfile[0].avatar_url || "";
                } else {
                  const profRes = await supabaseFetch(env, "profiles", `select=display_name,bio,avatar_url&id=eq.${post.publisher_id}&limit=1`);
                  if (profRes && profRes[0]) {
                    pubName = profRes[0].display_name || "Staff";
                    pubBio = profRes[0].bio || "";
                    pubAvatar = profRes[0].avatar_url || "";
                  }
                }
              } catch (e) {
              }
            }
            const fullHtml = buildArticleHtml({
              cc,
              post,
              publisherName: pubName,
              publisherBio: pubBio,
              publisherAvatar: pubAvatar
            });
            return new Response(fullHtml, {
              status: 200,
              headers: {
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
              }
            });
          } else {
            const rawHtml = await r2.text();
            const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            post.contentHtml = bodyMatch ? bodyMatch[1] : rawHtml;
            let pubName = "Staff", pubBio = "", pubAvatar = "";
            if (post.publisher_id) {
              try {
                const pubProfile = await supabaseFetch(env, "publishers", `select=publisher_name,bio,avatar_url&user_id=eq.${post.publisher_id}&limit=1`);
                if (pubProfile && pubProfile[0]) {
                  pubName = pubProfile[0].publisher_name || "Staff";
                  pubBio = pubProfile[0].bio || "";
                  pubAvatar = pubProfile[0].avatar_url || "";
                } else {
                  const profRes = await supabaseFetch(env, "profiles", `select=display_name,bio,avatar_url&id=eq.${post.publisher_id}&limit=1`);
                  if (profRes && profRes[0]) {
                    pubName = profRes[0].display_name || "Staff";
                    pubBio = profRes[0].bio || "";
                    pubAvatar = profRes[0].avatar_url || "";
                  }
                }
              } catch (e) {
              }
            }
            const fullHtml = buildArticleHtml({
              cc,
              post,
              publisherName: pubName,
              publisherBio: pubBio,
              publisherAvatar: pubAvatar
            });
            return new Response(fullHtml, {
              status: 200,
              headers: {
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
              }
            });
          }
        }
        console.log("r2-not-ok", { status: r2.status });
      } catch (r2Err) {
        console.log("r2-error", { error: r2Err.message });
      }
    } else {
      console.log("no-r2-url", { cloudflare_url: post.cloudflare_url });
    }
    return new Response(
      `<!DOCTYPE html><html><head><title>Article loading</title><meta name="robots" content="noindex"></head>
        <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto">
          <h1 style="font-size:22px">Article is being processed</h1>
          <p style="color:#666;margin:16px 0">This article was approved but hasn't finished publishing yet. Please check back in a moment.</p>
          <a href="/${cc}/blog" style="color:#2563eb">\u2190 Back to blog</a>
        </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } }
    );
  } catch (articleErr) {
    console.error("article-handler-error", { error: articleErr.message });
    return new Response(
      `<!DOCTYPE html><html><head><title>Error</title></head>
        <body style="font-family:sans-serif;padding:40px">
          <h1>Something went wrong</h1><p>${articleErr.message}</p>
          <a href="/${cc}/blog" style="color:#2563eb">\u2190 Back to blog</a>
        </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html;charset=UTF-8" } }
    );
  }
  const category = isKnownCategory ? categoryFromPath : "all";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = 12;
  const offset = (page - 1) * pageSize;
  let posts = [], totalCount = 0;
  try {
    if (!env.BLOG_BUCKET) throw new Error("No BLOG_BUCKET bound");
    const indexKey = `${cc}/blog/index.json`;
    const r2Object = await env.BLOG_BUCKET.get(indexKey);
    if (r2Object) {
      let allPosts = await r2Object.json();
      if (!Array.isArray(allPosts)) allPosts = [];
      if (category !== "all") {
        allPosts = allPosts.filter((p) => p.category === category);
      }
      totalCount = allPosts.length;
      posts = allPosts.slice(offset, offset + pageSize);
    }
  } catch (err) {
    console.error("Listing fetch from R2:", err);
  }
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  return new Response(
    buildListingHtml({ cc, category, posts, page, totalPages }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        "Vary": "Accept-Encoding"
      }
    }
  );
}
__name(handleRequest, "handleRequest");

// api/poll.js
function isValidId(id2) {
  return typeof id2 === "string" && /^[a-zA-Z0-9_\-\.\:\+ ]{1,80}$/.test(id2);
}
__name(isValidId, "isValidId");
async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const id2 = searchParams.get("id") || searchParams.get("pollId");
  if (!isValidId(id2)) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }
  try {
    const qObj = await env.QUESTIONS_BUCKET.get(`questions/${id2}.json`);
    if (!qObj) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const question = await qObj.json();
    const counts = {};
    for (const opt of question.options) {
      const optStr = typeof opt === "string" ? opt : opt.tag || opt.text;
      const val = await env.POLL_VOTES.get(`${id2}:${optStr}`);
      counts[optStr] = parseInt(val || "0", 10);
    }
    return Response.json({ id: id2, options: question.options, counts }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
    });
  } catch (err) {
    console.error("KV GET Error:", err);
    return Response.json({ counts: {} }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const { id: rawId, pollId, option } = body || {};
  const id2 = rawId || pollId;
  if (!isValidId(id2) || typeof option !== "string" || option.length > 100) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const qObj = await env.QUESTIONS_BUCKET.get(`questions/${id2}.json`);
    if (!qObj) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const question = await qObj.json();
    const validOptions = question.options.map((opt) => typeof opt === "string" ? opt : (opt.tag || opt.text).toUpperCase());
    if (!validOptions.includes(option.toUpperCase()) && !validOptions.includes(option)) {
    }
    const key = `${id2}:${option.toUpperCase()}`;
    try {
      const current = await env.POLL_VOTES.get(key);
      const next = parseInt(current || "0", 10) + 1;
      await env.POLL_VOTES.put(key, String(next));
      return Response.json({ success: true, option, total: next });
    } catch (err) {
      return Response.json(
        { error: "vote_limit_reached", message: "Voting is busy right now, try again later." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("KV POST Error:", err);
    return Response.json(
      { error: "vote_limit_reached", message: "Voting is busy right now, try again later." },
      { status: 429 }
    );
  }
}
__name(onRequestPost, "onRequestPost");

// ../node_modules/workers-og/dist/index.js
import My from "./ef4866ecae192fd87727067cf2c0c0cf9fb8b020-yoga-ZMNYPE6Z.wasm";
import Wy from "./8b09a8aa3d916dc11b1a9d60545210c131c1ae36-resvg-LFIOYO65.wasm";
var af = Object.create;
var to = Object.defineProperty;
var of = Object.getOwnPropertyDescriptor;
var sf = Object.getOwnPropertyNames;
var lf = Object.getPrototypeOf;
var uf = Object.prototype.hasOwnProperty;
var Ke = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "Ke");
var ff = /* @__PURE__ */ __name((e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function") for (let i of sf(t)) !uf.call(e, i) && i !== r && to(e, i, { get: /* @__PURE__ */ __name(() => t[i], "get"), enumerable: !(n = of(t, i)) || n.enumerable });
  return e;
}, "ff");
var _t = /* @__PURE__ */ __name((e, t, r) => (r = e != null ? af(lf(e)) : {}, ff(t || !e || !e.__esModule ? to(r, "default", { value: e, enumerable: true }) : r, e)), "_t");
var ho = Ke((jy, co) => {
  var gi = 0, ao = -3;
  function Dr() {
    this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
  }
  __name(Dr, "Dr");
  function cf(e, t) {
    this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new Dr(), this.dtree = new Dr();
  }
  __name(cf, "cf");
  var oo = new Dr(), so = new Dr(), mi = new Uint8Array(30), bi = new Uint16Array(30), lo = new Uint8Array(30), uo = new Uint16Array(30), hf = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), ro = new Dr(), Bt = new Uint8Array(320);
  function fo(e, t, r, n) {
    var i, a;
    for (i = 0; i < r; ++i) e[i] = 0;
    for (i = 0; i < 30 - r; ++i) e[i + r] = i / r | 0;
    for (a = n, i = 0; i < 30; ++i) t[i] = a, a += 1 << e[i];
  }
  __name(fo, "fo");
  function pf(e, t) {
    var r;
    for (r = 0; r < 7; ++r) e.table[r] = 0;
    for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, r = 0; r < 24; ++r) e.trans[r] = 256 + r;
    for (r = 0; r < 144; ++r) e.trans[24 + r] = r;
    for (r = 0; r < 8; ++r) e.trans[168 + r] = 280 + r;
    for (r = 0; r < 112; ++r) e.trans[176 + r] = 144 + r;
    for (r = 0; r < 5; ++r) t.table[r] = 0;
    for (t.table[5] = 32, r = 0; r < 32; ++r) t.trans[r] = r;
  }
  __name(pf, "pf");
  var no = new Uint16Array(16);
  function di(e, t, r, n) {
    var i, a;
    for (i = 0; i < 16; ++i) e.table[i] = 0;
    for (i = 0; i < n; ++i) e.table[t[r + i]]++;
    for (e.table[0] = 0, a = 0, i = 0; i < 16; ++i) no[i] = a, a += e.table[i];
    for (i = 0; i < n; ++i) t[r + i] && (e.trans[no[t[r + i]]++] = i);
  }
  __name(di, "di");
  function df(e) {
    e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
    var t = e.tag & 1;
    return e.tag >>>= 1, t;
  }
  __name(df, "df");
  function Gt(e, t, r) {
    if (!t) return r;
    for (; e.bitcount < 24; ) e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
    var n = e.tag & 65535 >>> 16 - t;
    return e.tag >>>= t, e.bitcount -= t, n + r;
  }
  __name(Gt, "Gt");
  function vi(e, t) {
    for (; e.bitcount < 24; ) e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
    var r = 0, n = 0, i = 0, a = e.tag;
    do
      n = 2 * n + (a & 1), a >>>= 1, ++i, r += t.table[i], n -= t.table[i];
    while (n >= 0);
    return e.tag = a, e.bitcount -= i, t.trans[r + n];
  }
  __name(vi, "vi");
  function vf(e, t, r) {
    var n, i, a, o, l, s;
    for (n = Gt(e, 5, 257), i = Gt(e, 5, 1), a = Gt(e, 4, 4), o = 0; o < 19; ++o) Bt[o] = 0;
    for (o = 0; o < a; ++o) {
      var u = Gt(e, 3, 0);
      Bt[hf[o]] = u;
    }
    for (di(ro, Bt, 0, 19), l = 0; l < n + i; ) {
      var f = vi(e, ro);
      switch (f) {
        case 16:
          var c = Bt[l - 1];
          for (s = Gt(e, 2, 3); s; --s) Bt[l++] = c;
          break;
        case 17:
          for (s = Gt(e, 3, 3); s; --s) Bt[l++] = 0;
          break;
        case 18:
          for (s = Gt(e, 7, 11); s; --s) Bt[l++] = 0;
          break;
        default:
          Bt[l++] = f;
          break;
      }
    }
    di(t, Bt, 0, n), di(r, Bt, n, i);
  }
  __name(vf, "vf");
  function io(e, t, r) {
    for (; ; ) {
      var n = vi(e, t);
      if (n === 256) return gi;
      if (n < 256) e.dest[e.destLen++] = n;
      else {
        var i, a, o, l;
        for (n -= 257, i = Gt(e, mi[n], bi[n]), a = vi(e, r), o = e.destLen - Gt(e, lo[a], uo[a]), l = o; l < o + i; ++l) e.dest[e.destLen++] = e.dest[l];
      }
    }
  }
  __name(io, "io");
  function gf(e) {
    for (var t, r, n; e.bitcount > 8; ) e.sourceIndex--, e.bitcount -= 8;
    if (t = e.source[e.sourceIndex + 1], t = 256 * t + e.source[e.sourceIndex], r = e.source[e.sourceIndex + 3], r = 256 * r + e.source[e.sourceIndex + 2], t !== (~r & 65535)) return ao;
    for (e.sourceIndex += 4, n = t; n; --n) e.dest[e.destLen++] = e.source[e.sourceIndex++];
    return e.bitcount = 0, gi;
  }
  __name(gf, "gf");
  function mf(e, t) {
    var r = new cf(e, t), n, i, a;
    do {
      switch (n = df(r), i = Gt(r, 2, 0), i) {
        case 0:
          a = gf(r);
          break;
        case 1:
          a = io(r, oo, so);
          break;
        case 2:
          vf(r, r.ltree, r.dtree), a = io(r, r.ltree, r.dtree);
          break;
        default:
          a = ao;
      }
      if (a !== gi) throw new Error("Data error");
    } while (!n);
    return r.destLen < r.dest.length ? typeof r.dest.slice == "function" ? r.dest.slice(0, r.destLen) : r.dest.subarray(0, r.destLen) : r.dest;
  }
  __name(mf, "mf");
  pf(oo, so);
  fo(mi, bi, 4, 3);
  fo(lo, uo, 2, 1);
  mi[28] = 0;
  bi[28] = 258;
  co.exports = mf;
});
var go = Ke((zy, vo) => {
  var bf = new Uint8Array(new Uint32Array([305419896]).buffer)[0] === 18, po = /* @__PURE__ */ __name((e, t, r) => {
    let n = e[t];
    e[t] = e[r], e[r] = n;
  }, "po"), yf = /* @__PURE__ */ __name((e) => {
    let t = e.length;
    for (let r = 0; r < t; r += 4) po(e, r, r + 3), po(e, r + 1, r + 2);
  }, "yf"), xf = /* @__PURE__ */ __name((e) => {
    bf && yf(e);
  }, "xf");
  vo.exports = { swap32LE: xf };
});
var xo = Ke((Vy, yo) => {
  var mo = ho(), { swap32LE: wf } = go(), wi = 11, gr = 5, Sf = wi - gr, Ef = 65536 >> wi, kf = 1 << Sf, Tf = kf - 1, gn = 2, _f = 1 << gr, yi = _f - 1, bo = 65536 >> gr, Lf = 1024 >> gr, Cf = bo + Lf, Of = Cf, Af = 32, Pf = Of + Af, If = 1 << gn, xi = class {
    static {
      __name(this, "xi");
    }
    constructor(t) {
      let r = typeof t.readUInt32BE == "function" && typeof t.slice == "function";
      if (r || t instanceof Uint8Array) {
        let n;
        if (r) this.highStart = t.readUInt32LE(0), this.errorValue = t.readUInt32LE(4), n = t.readUInt32LE(8), t = t.slice(12);
        else {
          let i = new DataView(t.buffer);
          this.highStart = i.getUint32(0, true), this.errorValue = i.getUint32(4, true), n = i.getUint32(8, true), t = t.subarray(12);
        }
        t = mo(t, new Uint8Array(n)), t = mo(t, new Uint8Array(n)), wf(t), this.data = new Uint32Array(t.buffer);
      } else ({ data: this.data, highStart: this.highStart, errorValue: this.errorValue } = t);
    }
    get(t) {
      let r;
      return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (r = (this.data[t >> gr] << gn) + (t & yi), this.data[r]) : t <= 65535 ? (r = (this.data[bo + (t - 55296 >> gr)] << gn) + (t & yi), this.data[r]) : t < this.highStart ? (r = this.data[Pf - Ef + (t >> wi)], r = this.data[r + (t >> gr & Tf)], r = (r << gn) + (t & yi), this.data[r]) : this.data[this.data.length - If];
    }
  };
  yo.exports = xi;
});
var wo = Ke((mn) => {
  var Rf = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  (function(e) {
    "use strict";
    var t = typeof Uint8Array < "u" ? Uint8Array : Array, r = 43, n = 47, i = 48, a = 97, o = 65, l = 45, s = 95;
    function u(h) {
      var p = h.charCodeAt(0);
      if (p === r || p === l) return 62;
      if (p === n || p === s) return 63;
      if (p < i) return -1;
      if (p < i + 10) return p - i + 26 + 26;
      if (p < o + 26) return p - o;
      if (p < a + 26) return p - a + 26;
    }
    __name(u, "u");
    function f(h) {
      var p, m, v, g, y, x;
      if (h.length % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
      var _ = h.length;
      y = h.charAt(_ - 2) === "=" ? 2 : h.charAt(_ - 1) === "=" ? 1 : 0, x = new t(h.length * 3 / 4 - y), v = y > 0 ? h.length - 4 : h.length;
      var L = 0;
      function T(E) {
        x[L++] = E;
      }
      __name(T, "T");
      for (p = 0, m = 0; p < v; p += 4, m += 3) g = u(h.charAt(p)) << 18 | u(h.charAt(p + 1)) << 12 | u(h.charAt(p + 2)) << 6 | u(h.charAt(p + 3)), T((g & 16711680) >> 16), T((g & 65280) >> 8), T(g & 255);
      return y === 2 ? (g = u(h.charAt(p)) << 2 | u(h.charAt(p + 1)) >> 4, T(g & 255)) : y === 1 && (g = u(h.charAt(p)) << 10 | u(h.charAt(p + 1)) << 4 | u(h.charAt(p + 2)) >> 2, T(g >> 8 & 255), T(g & 255)), x;
    }
    __name(f, "f");
    function c(h) {
      var p, m = h.length % 3, v = "", g, y;
      function x(L) {
        return Rf.charAt(L);
      }
      __name(x, "x");
      function _(L) {
        return x(L >> 18 & 63) + x(L >> 12 & 63) + x(L >> 6 & 63) + x(L & 63);
      }
      __name(_, "_");
      for (p = 0, y = h.length - m; p < y; p += 3) g = (h[p] << 16) + (h[p + 1] << 8) + h[p + 2], v += _(g);
      switch (m) {
        case 1:
          g = h[h.length - 1], v += x(g >> 2), v += x(g << 4 & 63), v += "==";
          break;
        case 2:
          g = (h[h.length - 2] << 8) + h[h.length - 1], v += x(g >> 10), v += x(g >> 4 & 63), v += x(g << 2 & 63), v += "=";
          break;
      }
      return v;
    }
    __name(c, "c");
    e.toByteArray = f, e.fromByteArray = c;
  })(typeof mn > "u" ? mn.base64js = {} : mn);
});
var Io = Ke((Xy, Po) => {
  var _i = 40, Li = 41, yn = 39, Ci = 34, Oi = 92, Lr = 47, Ai = 44, Pi = 58, xn = 42, qf = 117, Xf = 85, Yf = 43, Zf = /^[a-f0-9?-]+$/i;
  Po.exports = function(e) {
    for (var t = [], r = e, n, i, a, o, l, s, u, f, c = 0, h = r.charCodeAt(c), p = r.length, m = [{ nodes: t }], v = 0, g, y = "", x = "", _ = ""; c < p; ) if (h <= 32) {
      n = c;
      do
        n += 1, h = r.charCodeAt(n);
      while (h <= 32);
      o = r.slice(c, n), a = t[t.length - 1], h === Li && v ? _ = o : a && a.type === "div" ? (a.after = o, a.sourceEndIndex += o.length) : h === Ai || h === Pi || h === Lr && r.charCodeAt(n + 1) !== xn && (!g || g && g.type === "function" && g.value !== "calc") ? x = o : t.push({ type: "space", sourceIndex: c, sourceEndIndex: n, value: o }), c = n;
    } else if (h === yn || h === Ci) {
      n = c, i = h === yn ? "'" : '"', o = { type: "string", sourceIndex: c, quote: i };
      do
        if (l = false, n = r.indexOf(i, n + 1), ~n) for (s = n; r.charCodeAt(s - 1) === Oi; ) s -= 1, l = !l;
        else r += i, n = r.length - 1, o.unclosed = true;
      while (l);
      o.value = r.slice(c + 1, n), o.sourceEndIndex = o.unclosed ? n : n + 1, t.push(o), c = n + 1, h = r.charCodeAt(c);
    } else if (h === Lr && r.charCodeAt(c + 1) === xn) n = r.indexOf("*/", c), o = { type: "comment", sourceIndex: c, sourceEndIndex: n + 2 }, n === -1 && (o.unclosed = true, n = r.length, o.sourceEndIndex = n), o.value = r.slice(c + 2, n), t.push(o), c = n + 2, h = r.charCodeAt(c);
    else if ((h === Lr || h === xn) && g && g.type === "function" && g.value === "calc") o = r[c], t.push({ type: "word", sourceIndex: c - x.length, sourceEndIndex: c + o.length, value: o }), c += 1, h = r.charCodeAt(c);
    else if (h === Lr || h === Ai || h === Pi) o = r[c], t.push({ type: "div", sourceIndex: c - x.length, sourceEndIndex: c + o.length, value: o, before: x, after: "" }), x = "", c += 1, h = r.charCodeAt(c);
    else if (_i === h) {
      n = c;
      do
        n += 1, h = r.charCodeAt(n);
      while (h <= 32);
      if (f = c, o = { type: "function", sourceIndex: c - y.length, value: y, before: r.slice(f + 1, n) }, c = n, y === "url" && h !== yn && h !== Ci) {
        n -= 1;
        do
          if (l = false, n = r.indexOf(")", n + 1), ~n) for (s = n; r.charCodeAt(s - 1) === Oi; ) s -= 1, l = !l;
          else r += ")", n = r.length - 1, o.unclosed = true;
        while (l);
        u = n;
        do
          u -= 1, h = r.charCodeAt(u);
        while (h <= 32);
        f < u ? (c !== u + 1 ? o.nodes = [{ type: "word", sourceIndex: c, sourceEndIndex: u + 1, value: r.slice(c, u + 1) }] : o.nodes = [], o.unclosed && u + 1 !== n ? (o.after = "", o.nodes.push({ type: "space", sourceIndex: u + 1, sourceEndIndex: n, value: r.slice(u + 1, n) })) : (o.after = r.slice(u + 1, n), o.sourceEndIndex = n)) : (o.after = "", o.nodes = []), c = n + 1, o.sourceEndIndex = o.unclosed ? n : c, h = r.charCodeAt(c), t.push(o);
      } else v += 1, o.after = "", o.sourceEndIndex = c + 1, t.push(o), m.push(o), t = o.nodes = [], g = o;
      y = "";
    } else if (Li === h && v) c += 1, h = r.charCodeAt(c), g.after = _, g.sourceEndIndex += _.length, _ = "", v -= 1, m[m.length - 1].sourceEndIndex = c, m.pop(), g = m[v], t = g.nodes;
    else {
      n = c;
      do
        h === Oi && (n += 1), n += 1, h = r.charCodeAt(n);
      while (n < p && !(h <= 32 || h === yn || h === Ci || h === Ai || h === Pi || h === Lr || h === _i || h === xn && g && g.type === "function" && g.value === "calc" || h === Lr && g.type === "function" && g.value === "calc" || h === Li && v));
      o = r.slice(c, n), _i === h ? y = o : (qf === o.charCodeAt(0) || Xf === o.charCodeAt(0)) && Yf === o.charCodeAt(1) && Zf.test(o.slice(2)) ? t.push({ type: "unicode-range", sourceIndex: c, sourceEndIndex: n, value: o }) : t.push({ type: "word", sourceIndex: c, sourceEndIndex: n, value: o }), c = n;
    }
    for (c = m.length - 1; c; c -= 1) m[c].unclosed = true, m[c].sourceEndIndex = r.length;
    return m[0].nodes;
  };
});
var Fo = Ke((Yy, Ro) => {
  Ro.exports = /* @__PURE__ */ __name(function e(t, r, n) {
    var i, a, o, l;
    for (i = 0, a = t.length; i < a; i += 1) o = t[i], n || (l = r(o, i, t)), l !== false && o.type === "function" && Array.isArray(o.nodes) && e(o.nodes, r, n), n && r(o, i, t);
  }, "e");
});
var Mo = Ke((Zy, No) => {
  function Do(e, t) {
    var r = e.type, n = e.value, i, a;
    return t && (a = t(e)) !== void 0 ? a : r === "word" || r === "space" ? n : r === "string" ? (i = e.quote || "", i + n + (e.unclosed ? "" : i)) : r === "comment" ? "/*" + n + (e.unclosed ? "" : "*/") : r === "div" ? (e.before || "") + n + (e.after || "") : Array.isArray(e.nodes) ? (i = Uo(e.nodes, t), r !== "function" ? i : n + "(" + (e.before || "") + i + (e.after || "") + (e.unclosed ? "" : ")")) : n;
  }
  __name(Do, "Do");
  function Uo(e, t) {
    var r, n;
    if (Array.isArray(e)) {
      for (r = "", n = e.length - 1; ~n; n -= 1) r = Do(e[n], t) + r;
      return r;
    }
    return Do(e, t);
  }
  __name(Uo, "Uo");
  No.exports = Uo;
});
var Bo = Ke((Jy, Wo) => {
  var wn = 45, Sn = 43, Ii = 46, Jf = 101, Qf = 69;
  function Kf(e) {
    var t = e.charCodeAt(0), r;
    if (t === Sn || t === wn) {
      if (r = e.charCodeAt(1), r >= 48 && r <= 57) return true;
      var n = e.charCodeAt(2);
      return r === Ii && n >= 48 && n <= 57;
    }
    return t === Ii ? (r = e.charCodeAt(1), r >= 48 && r <= 57) : t >= 48 && t <= 57;
  }
  __name(Kf, "Kf");
  Wo.exports = function(e) {
    var t = 0, r = e.length, n, i, a;
    if (r === 0 || !Kf(e)) return false;
    for (n = e.charCodeAt(t), (n === Sn || n === wn) && t++; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); ) t += 1;
    if (n = e.charCodeAt(t), i = e.charCodeAt(t + 1), n === Ii && i >= 48 && i <= 57) for (t += 2; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); ) t += 1;
    if (n = e.charCodeAt(t), i = e.charCodeAt(t + 1), a = e.charCodeAt(t + 2), (n === Jf || n === Qf) && (i >= 48 && i <= 57 || (i === Sn || i === wn) && a >= 48 && a <= 57)) for (t += i === Sn || i === wn ? 3 : 2; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); ) t += 1;
    return { number: e.slice(0, t), unit: e.slice(t) };
  };
});
var Ri = Ke((Qy, jo) => {
  var ec = Io(), Go = Fo(), $o = Mo();
  function nr(e) {
    return this instanceof nr ? (this.nodes = ec(e), this) : new nr(e);
  }
  __name(nr, "nr");
  nr.prototype.toString = function() {
    return Array.isArray(this.nodes) ? $o(this.nodes) : "";
  };
  nr.prototype.walk = function(e, t) {
    return Go(this.nodes, e, t), this;
  };
  nr.unit = Bo();
  nr.walk = Go;
  nr.stringify = $o;
  jo.exports = nr;
});
var Ho = Ke((Ky, Vo) => {
  "use strict";
  Vo.exports = function(e) {
    return typeof e == "string" ? zo(e) : Fi(e);
  };
  function Fi(e) {
    return !e || typeof e != "object" || rc(e) || nc(e) ? e : tc(e) ? oc(e, Fi) : sc(ac(e), function(t, r) {
      var n = zo(r);
      return t[n] = Fi(e[r]), t;
    }, {});
  }
  __name(Fi, "Fi");
  function zo(e) {
    return e.replace(/[_.-](\w|$)/g, function(t, r) {
      return r.toUpperCase();
    });
  }
  __name(zo, "zo");
  var tc = Array.isArray || function(e) {
    return Object.prototype.toString.call(e) === "[object Array]";
  }, rc = /* @__PURE__ */ __name(function(e) {
    return Object.prototype.toString.call(e) === "[object Date]";
  }, "rc"), nc = /* @__PURE__ */ __name(function(e) {
    return Object.prototype.toString.call(e) === "[object RegExp]";
  }, "nc"), ic = Object.prototype.hasOwnProperty, ac = Object.keys || function(e) {
    var t = [];
    for (var r in e) ic.call(e, r) && t.push(r);
    return t;
  };
  function oc(e, t) {
    if (e.map) return e.map(t);
    for (var r = [], n = 0; n < e.length; n++) r.push(t(e[n], n));
    return r;
  }
  __name(oc, "oc");
  function sc(e, t, r) {
    if (e.reduce) return e.reduce(t, r);
    for (var n = 0; n < e.length; n++) r = t(r, e[n], n);
    return r;
  }
  __name(sc, "sc");
});
var qo = Ke((ex, lc) => {
  lc.exports = { black: "#000000", silver: "#c0c0c0", gray: "#808080", white: "#ffffff", maroon: "#800000", red: "#ff0000", purple: "#800080", fuchsia: "#ff00ff", green: "#008000", lime: "#00ff00", olive: "#808000", yellow: "#ffff00", navy: "#000080", blue: "#0000ff", teal: "#008080", aqua: "#00ffff", orange: "#ffa500", aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc", bisque: "#ffe4c4", blanchedalmond: "#ffebcd", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899", lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", limegreen: "#32cd32", linen: "#faf0e6", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", oldlace: "#fdf5e6", olivedrab: "#6b8e23", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", whitesmoke: "#f5f5f5", yellowgreen: "#9acd32", rebeccapurple: "#663399" };
});
var Yo = Ke((tx, Xo) => {
  "use strict";
  Xo.exports = qo();
});
var kn = Ke((Ar) => {
  "use strict";
  Object.defineProperty(Ar, "__esModule", { value: true });
  function Wi(e) {
    return e && typeof e == "object" && "default" in e ? e.default : e;
  }
  __name(Wi, "Wi");
  var Qo = Ri(), uc = Wi(Qo), fc = Wi(Ho()), cc = Wi(Yo()), hc = /* @__PURE__ */ __name(function(t) {
    return t.type !== "string" ? null : t.value.replace(/\\([0-9a-f]{1,6})(?:\s|$)/gi, function(r, n) {
      return String.fromCharCode(parseInt(n, 16));
    }).replace(/\\/g, "");
  }, "hc"), pc = /^(#(?:[0-9a-f]{3,4}){1,2})$/i, dc = /^(rgba?|hsla?|hwb|lab|lch|gray|color)$/, vc = /* @__PURE__ */ __name(function(t) {
    return t.type === "word" && (pc.test(t.value) || t.value in cc || t.value === "transparent") ? t.value : t.type === "function" && dc.test(t.value) ? Qo.stringify(t) : null;
  }, "vc"), gc = /^(none)$/i, mc = /^(auto)$/i, bc = /(^-?[_a-z][_a-z0-9-]*$)/i, yc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)$/i, xc = /^(0$|(?:[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?=px$))/i, wc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(ch|em|ex|rem|vh|vw|vmin|vmax|cm|mm|in|pc|pt))$/i, Sc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:deg|rad))$/i, Ec = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?%)$/i, Bi = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      return t(r) ? "<token>" : null;
    };
  }, "Bi"), kc = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      return r.type === t ? r.value : null;
    };
  }, "kc"), qe = /* @__PURE__ */ __name(function(t, r) {
    return r === void 0 && (r = String), function(n) {
      if (n.type !== "word") return null;
      var i = n.value.match(t);
      if (i === null) return null;
      var a = r(i[1]);
      return a;
    };
  }, "qe"), Ze = Bi(function(e) {
    return e.type === "space";
  }), Ko = Bi(function(e) {
    return e.type === "div" && e.value === "/";
  }), Tc = Bi(function(e) {
    return e.type === "div" && e.value === ",";
  }), _c = kc("word"), Gi = qe(gc), Ni = qe(mc), Or = qe(yc, Number), vt = qe(xc, Number), qt = qe(wc), es = qe(Sc, function(e) {
    return e.toLowerCase();
  }), $i = qe(Ec), En = qe(bc), Lc = hc, Mr = vc, Mi = qe(/^(none|underline|line-through)$/i), Cc = /* @__PURE__ */ __name(function(t) {
    var r = t.expect(Or);
    return t.hasTokens() && (t.expect(Ko), r /= t.expect(Or)), { aspectRatio: r };
  }, "Cc"), Oc = qe(/^(solid|dashed|dotted)$/), Ac = 1, Pc = "black", Ic = "solid", Rc = /* @__PURE__ */ __name(function(t) {
    var r, n, i;
    if (t.matches(Gi)) return t.expectEmpty(), { borderWidth: 0, borderColor: "black", borderStyle: "solid" };
    for (var a = 0; a < 3 && t.hasTokens(); ) a !== 0 && t.expect(Ze), r === void 0 && t.matches(vt, qt) ? r = t.lastValue : n === void 0 && t.matches(Mr) ? n = t.lastValue : i === void 0 && t.matches(Oc) ? i = t.lastValue : t.throw(), a += 1;
    return t.expectEmpty(), r === void 0 && (r = Ac), n === void 0 && (n = Pc), i === void 0 && (i = Ic), { borderWidth: r, borderColor: n, borderStyle: i };
  }, "Rc"), Wr = /* @__PURE__ */ __name(function(t) {
    var r = t.types, n = r === void 0 ? [vt, qt, $i] : r, i = t.directions, a = i === void 0 ? ["Top", "Right", "Bottom", "Left"] : i, o = t.prefix, l = o === void 0 ? "" : o, s = t.suffix, u = s === void 0 ? "" : s;
    return function(f) {
      var c, h = [];
      for (h.push(f.expect.apply(f, n)); h.length < 4 && f.hasTokens(); ) f.expect(Ze), h.push(f.expect.apply(f, n));
      f.expectEmpty();
      var p = h[0], m = h[1], v = m === void 0 ? p : m, g = h[2], y = g === void 0 ? p : g, x = h[3], _ = x === void 0 ? v : x, L = /* @__PURE__ */ __name(function(E) {
        return "" + l + a[E] + u;
      }, "L");
      return c = {}, c[L(0)] = p, c[L(1)] = v, c[L(2)] = y, c[L(3)] = _, c;
    };
  }, "Wr"), ts = /* @__PURE__ */ __name(function(t) {
    var r = t.expect(vt), n = t.matches(Ze) ? t.expect(vt) : r;
    return t.expectEmpty(), { width: r, height: n };
  }, "ts"), rs = /* @__PURE__ */ __name(function(t) {
    var r, n, i, a;
    if (t.matches(Gi)) return t.expectEmpty(), { offset: { width: 0, height: 0 }, radius: 0, color: "black" };
    for (var o = false; t.hasTokens(); ) o && t.expect(Ze), r === void 0 && t.matches(vt, qt) ? (r = t.lastValue, t.expect(Ze), n = t.expect(vt, qt), t.saveRewindPoint(), t.matches(Ze) && t.matches(vt, qt) ? i = t.lastValue : t.rewind()) : a === void 0 && t.matches(Mr) ? a = t.lastValue : t.throw(), o = true;
    return r === void 0 && t.throw(), { offset: { width: r, height: n }, radius: i !== void 0 ? i : 0, color: a !== void 0 ? a : "black" };
  }, "rs"), Fc = /* @__PURE__ */ __name(function(t) {
    var r = rs(t), n = r.offset, i = r.radius, a = r.color;
    return { shadowOffset: n, shadowRadius: i, shadowColor: a, shadowOpacity: 1 };
  }, "Fc"), Dc = 1, Uc = 1, Nc = 0, Mc = /* @__PURE__ */ __name(function(t) {
    var r, n, i;
    if (t.matches(Gi)) return t.expectEmpty(), { flexGrow: 0, flexShrink: 0, flexBasis: "auto" };
    if (t.saveRewindPoint(), t.matches(Ni) && !t.hasTokens()) return { flexGrow: 1, flexShrink: 1, flexBasis: "auto" };
    t.rewind();
    for (var a = 0; a < 2 && t.hasTokens(); ) a !== 0 && t.expect(Ze), r === void 0 && t.matches(Or) ? (r = t.lastValue, t.saveRewindPoint(), t.matches(Ze) && t.matches(Or) ? n = t.lastValue : t.rewind()) : i === void 0 && t.matches(vt, qt, $i) ? i = t.lastValue : i === void 0 && t.matches(Ni) ? i = "auto" : t.throw(), a += 1;
    return t.expectEmpty(), r === void 0 && (r = Dc), n === void 0 && (n = Uc), i === void 0 && (i = Nc), { flexGrow: r, flexShrink: n, flexBasis: i };
  }, "Mc"), Wc = qe(/(nowrap|wrap|wrap-reverse)/), Bc = qe(/(row|row-reverse|column|column-reverse)/), Gc = "nowrap", $c = "row", jc = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i = 0; i < 2 && t.hasTokens(); ) i !== 0 && t.expect(Ze), r === void 0 && t.matches(Wc) ? r = t.lastValue : n === void 0 && t.matches(Bc) ? n = t.lastValue : t.throw(), i += 1;
    return t.expectEmpty(), r === void 0 && (r = Gc), n === void 0 && (n = $c), { flexWrap: r, flexDirection: n };
  }, "jc"), ns = /* @__PURE__ */ __name(function(t) {
    var r;
    if (t.matches(Lc)) r = t.lastValue;
    else for (r = t.expect(En); t.hasTokens(); ) {
      t.expect(Ze);
      var n = t.expect(En);
      r += " " + n;
    }
    return t.expectEmpty(), { fontFamily: r };
  }, "ns"), zc = qe(/^(normal)$/), Vc = qe(/^(italic)$/), Hc = qe(/^([1-9]00|bold)$/), qc = qe(/^(small-caps)$/), Xc = "normal", Yc = "normal", Zc = [], Jc = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i, a, o = 0; o < 3 && t.hasTokens(); ) {
      if (!t.matches(zc)) if (r === void 0 && t.matches(Vc)) r = t.lastValue;
      else if (n === void 0 && t.matches(Hc)) n = t.lastValue;
      else if (i === void 0 && t.matches(qc)) i = [t.lastValue];
      else break;
      t.expect(Ze), o += 1;
    }
    var l = t.expect(vt, qt);
    t.matches(Ko) && (a = t.expect(vt, qt)), t.expect(Ze);
    var s = ns(t), u = s.fontFamily;
    r === void 0 && (r = Xc), n === void 0 && (n = Yc), i === void 0 && (i = Zc);
    var f = { fontStyle: r, fontWeight: n, fontVariant: i, fontSize: l, fontFamily: u };
    return a !== void 0 && (f.lineHeight = a), f;
  }, "Jc"), Qc = /* @__PURE__ */ __name(function(t) {
    for (var r = [t.expect(En)]; t.hasTokens(); ) t.expect(Ze), r.push(t.expect(En));
    return { fontVariant: r };
  }, "Qc"), Kc = qe(/(flex-(?:start|end)|center|stretch|space-(?:between|around))/), eh = qe(/(flex-(?:start|end)|center|space-(?:between|around|evenly))/), th = /* @__PURE__ */ __name(function(t) {
    var r = t.expect(Kc), n;
    return t.hasTokens() ? (t.expect(Ze), n = t.expect(eh)) : n = "stretch", t.expectEmpty(), { alignContent: r, justifyContent: n };
  }, "th"), rh = qe(/^(solid|double|dotted|dashed)$/), nh = "none", ih = "solid", ah = "black", oh = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i, a = false; t.hasTokens(); ) {
      if (a && t.expect(Ze), r === void 0 && t.matches(Mi)) {
        var o = [t.lastValue.toLowerCase()];
        t.saveRewindPoint(), o[0] !== "none" && t.matches(Ze) && t.matches(Mi) ? (o.push(t.lastValue.toLowerCase()), o.sort().reverse()) : t.rewind(), r = o.join(" ");
      } else n === void 0 && t.matches(rh) ? n = t.lastValue : i === void 0 && t.matches(Mr) ? i = t.lastValue : t.throw();
      a = true;
    }
    return { textDecorationLine: r !== void 0 ? r : nh, textDecorationColor: i !== void 0 ? i : ah, textDecorationStyle: n !== void 0 ? n : ih };
  }, "oh"), sh = /* @__PURE__ */ __name(function(t) {
    for (var r = [], n = false; t.hasTokens(); ) n && t.expect(Ze), r.push(t.expect(Mi).toLowerCase()), n = true;
    return r.sort().reverse(), { textDecorationLine: r.join(" ") };
  }, "sh"), lh = /* @__PURE__ */ __name(function(t) {
    var r = rs(t), n = r.offset, i = r.radius, a = r.color;
    return { textShadowOffset: n, textShadowRadius: i, textShadowColor: a };
  }, "lh"), ji = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      var n = r.expect(t);
      return r.expectEmpty(), n;
    };
  }, "ji"), Di = ji(Or), Zo = ji(vt), Cr = ji(es), zi = /* @__PURE__ */ __name(function(t) {
    return function(r, n) {
      return function(i) {
        var a, o, l = i.expect(t), s;
        if (i.hasTokens()) i.expect(Tc), s = i.expect(t);
        else if (n !== void 0) s = n;
        else return l;
        return i.expectEmpty(), [(a = {}, a[r + "Y"] = s, a), (o = {}, o[r + "X"] = l, o)];
      };
    };
  }, "zi"), uh = zi(Or), fh = zi(vt), ch = zi(es), hh = { perspective: Di, scale: uh("scale"), scaleX: Di, scaleY: Di, translate: fh("translate", 0), translateX: Zo, translateY: Zo, rotate: Cr, rotateX: Cr, rotateY: Cr, rotateZ: Cr, skewX: Cr, skewY: Cr, skew: ch("skew", "0deg") }, ph = /* @__PURE__ */ __name(function(t) {
    for (var r = [], n = false; t.hasTokens(); ) {
      n && t.expect(Ze);
      var i = t.expectFunction(), a = i.functionName, o = hh[a](i);
      if (!Array.isArray(o)) {
        var l;
        o = [(l = {}, l[a] = o, l)];
      }
      r = o.concat(r), n = true;
    }
    return { transform: r };
  }, "ph"), dh = /* @__PURE__ */ __name(function(t) {
    return { backgroundColor: t.expect(Mr) };
  }, "dh"), vh = Wr({ types: [Mr], prefix: "border", suffix: "Color" }), gh = Wr({ directions: ["TopLeft", "TopRight", "BottomRight", "BottomLeft"], prefix: "border", suffix: "Radius" }), mh = Wr({ prefix: "border", suffix: "Width" }), bh = Wr({ types: [vt, qt, $i, Ni], prefix: "margin" }), yh = Wr({ prefix: "padding" }), xh = /* @__PURE__ */ __name(function(t) {
    return { fontWeight: t.expect(_c) };
  }, "xh"), wh = /* @__PURE__ */ __name(function(t) {
    return { shadowOffset: ts(t) };
  }, "wh"), Sh = /* @__PURE__ */ __name(function(t) {
    return { textShadowOffset: ts(t) };
  }, "Sh"), is = { aspectRatio: Cc, background: dh, border: Rc, borderColor: vh, borderRadius: gh, borderWidth: mh, boxShadow: Fc, flex: Mc, flexFlow: jc, font: Jc, fontFamily: ns, fontVariant: Qc, fontWeight: xh, margin: bh, padding: yh, placeContent: th, shadowOffset: wh, textShadow: lh, textShadowOffset: Sh, textDecoration: oh, textDecorationLine: sh, transform: ph }, Jo, rx = Jo != null ? new RegExp(Jo.join("|")) : null, Ui = "SYMBOL_MATCH", Eh = (function() {
    function e(r, n) {
      this.index = 0, this.nodes = r, this.functionName = n != null ? n.value : null, this.lastValue = null, this.rewindIndex = -1;
    }
    __name(e, "e");
    var t = e.prototype;
    return t.hasTokens = function() {
      return this.index <= this.nodes.length - 1;
    }, t[Ui] = function() {
      if (!this.hasTokens()) return null;
      for (var r = this.nodes[this.index], n = 0; n < arguments.length; n += 1) {
        var i = n < 0 || arguments.length <= n ? void 0 : arguments[n], a = i(r);
        if (a !== null) return this.index += 1, this.lastValue = a, a;
      }
      return null;
    }, t.matches = function() {
      return this[Ui].apply(this, arguments) !== null;
    }, t.expect = function() {
      var n = this[Ui].apply(this, arguments);
      return n !== null ? n : this.throw();
    }, t.matchesFunction = function() {
      var n = this.nodes[this.index];
      if (n.type !== "function") return null;
      var i = new e(n.nodes, n);
      return this.index += 1, this.lastValue = null, i;
    }, t.expectFunction = function() {
      var n = this.matchesFunction();
      return n !== null ? n : this.throw();
    }, t.expectEmpty = function() {
      this.hasTokens() && this.throw();
    }, t.throw = function() {
      throw new Error("Unexpected token type: " + this.nodes[this.index].type);
    }, t.saveRewindPoint = function() {
      this.rewindIndex = this.index;
    }, t.rewind = function() {
      if (this.rewindIndex === -1) throw new Error("Internal error");
      this.index = this.rewindIndex, this.lastValue = null;
    }, e;
  })(), kh = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?:px)?$/i, Th = /^true|false$/i, _h = /^null$/i, Lh = /^undefined$/i, as = /* @__PURE__ */ __name(function(t, r) {
    if (0) var n, i;
    var a = r.match(kh);
    if (a !== null) return Number(a[1]);
    var o = r.match(Th);
    if (o !== null) return o[0].toLowerCase() === "true";
    var l = r.match(_h);
    if (l !== null) return null;
    var s = r.match(Lh);
    if (s === null) return r;
  }, "as"), Ch = /* @__PURE__ */ __name(function(t, r) {
    var n = uc(r), i = new Eh(n.nodes);
    return is[t](i);
  }, "Ch"), Oh = Ch, os = /* @__PURE__ */ __name(function(t, r, n) {
    var i, a = n === false || !(t in is), o = r.trim(), l = a ? (i = {}, i[t] = as(t, o), i) : Oh(t, o);
    return l;
  }, "os"), ss = /* @__PURE__ */ __name(function(t) {
    var r = /^--\w+/.test(t);
    return r ? t : fc(t);
  }, "ss"), Ah = /* @__PURE__ */ __name(function(t, r) {
    return r === void 0 && (r = []), t.reduce(function(n, i) {
      var a = ss(i[0]), o = i[1], l = r.indexOf(a) === -1;
      return Object.assign(n, os(a, o, l));
    }, {});
  }, "Ah");
  Ar.default = Ah;
  Ar.getPropertyName = ss;
  Ar.getStylesForProperty = os;
  Ar.transformRawValue = as;
});
var us = Ke((ls, Tn) => {
  (function(e) {
    function t(o) {
      if (!(this instanceof t)) return new t();
      this.backgrounds = o || [];
    }
    __name(t, "t");
    t.prototype.toString = function() {
      return this.backgrounds.join(", ");
    };
    function r(o) {
      if (!(this instanceof r)) return new r(o);
      o = o || {};
      var l = this;
      function s(u, f) {
        l[u] = u in o ? o[u] : f;
      }
      __name(s, "s");
      s("color", ""), s("image", "none"), s("attachment", "scroll"), s("clip", "border-box"), s("origin", "padding-box"), s("position", "0% 0%"), s("repeat", "repeat"), s("size", "auto");
    }
    __name(r, "r");
    r.prototype.toString = function() {
      var o = [this.image, this.repeat, this.attachment, this.position + " / " + this.size, this.origin, this.clip];
      return this.color && o.unshift(this.color), o.join(" ");
    }, e.BackgroundList = t, e.Background = r;
    function n(o) {
      var l = [], s = /[,\(\)]/, u = 0, f = "";
      if (o == null) return l;
      for (; o.length; ) {
        var c = s.exec(o);
        if (!c) break;
        var h = c[0], p = false;
        switch (h) {
          case ",":
            u || (l.push(f.trim()), f = "", p = true);
            break;
          case "(":
            u++;
            break;
          case ")":
            u--;
            break;
        }
        var m = c.index + 1;
        f += o.slice(0, p ? m - 1 : m), o = o.slice(m);
      }
      return (f.length || o.length) && l.push((f + o).trim()), l;
    }
    __name(n, "n");
    function i(o) {
      return o.trim();
    }
    __name(i, "i");
    function a(o) {
      return (o || "").split(",").map(i);
    }
    __name(a, "a");
    e.parseElementStyle = function(o) {
      var l = new t();
      if (o == null) return l;
      for (var s = n(o.backgroundImage), u = o.backgroundColor, f = a(o.backgroundAttachment), c = a(o.backgroundClip), h = a(o.backgroundOrigin), p = a(o.backgroundPosition), m = a(o.backgroundRepeat), v = a(o.backgroundSize), g, y = 0, x = s.length; y < x; y++) g = new r({ image: s[y], attachment: f[y % f.length], clip: c[y % c.length], origin: h[y % h.length], position: p[y % p.length], repeat: m[y % m.length], size: v[y % v.length] }), y === x - 1 && (g.color = u), l.backgrounds.push(g);
      return l;
    };
  })((function(e) {
    return typeof Tn < "u" && Tn.exports !== void 0 ? Tn.exports : e.cssBgParser = {};
  })(ls));
});
var cs = Ke((ix, fs) => {
  var Ph = /,(?![^\(]*\))/, Ih = /\s(?![^(]*\))/, Rh = /^[0-9]+[a-zA-Z%]+?$/, Fh = /* @__PURE__ */ __name((e) => {
    let t = e.split(Ih), r = t.includes("inset"), n = t.slice(-1)[0], i = Uh(n) ? void 0 : n, a = t.filter((f) => f !== "inset").filter((f) => f !== i).map(Nh), [o, l, s, u] = a;
    return { inset: r, offsetX: o, offsetY: l, blurRadius: s, spreadRadius: u, color: i };
  }, "Fh"), Dh = /* @__PURE__ */ __name((e) => {
    let { inset: t, offsetX: r = 0, offsetY: n = 0, blurRadius: i = 0, spreadRadius: a, color: o } = e || {};
    return [t ? "inset" : null, r, n, i, a, o].filter((l) => l != null).map(Mh).map((l) => ("" + l).trim()).join(" ");
  }, "Dh"), Uh = /* @__PURE__ */ __name((e) => e === "0" || Rh.test(e), "Uh"), Nh = /* @__PURE__ */ __name((e) => {
    if (!/px$/.test(e) && e !== "0") return e;
    let t = parseFloat(e);
    return isNaN(t) ? e : t;
  }, "Nh"), Mh = /* @__PURE__ */ __name((e) => typeof e == "number" && e !== 0 ? e + "px" : e, "Mh"), Wh = /* @__PURE__ */ __name((e) => e.split(Ph).map((t) => t.trim()).map(Fh), "Wh"), Bh = /* @__PURE__ */ __name((e) => e.map(Dh).join(", "), "Bh");
  fs.exports = { parse: Wh, stringify: Bh };
});
var qi = Ke((Vi, Hi) => {
  (function(e, t) {
    typeof Vi == "object" && typeof Hi < "u" ? Hi.exports = t() : typeof define == "function" && define.amd ? define(t) : (e = e || self).parseCssColor = t();
  })(Vi, function() {
    "use strict";
    var e = { aliceblue: [240, 248, 255], antiquewhite: [250, 235, 215], aqua: [0, 255, 255], aquamarine: [127, 255, 212], azure: [240, 255, 255], beige: [245, 245, 220], bisque: [255, 228, 196], black: [0, 0, 0], blanchedalmond: [255, 235, 205], blue: [0, 0, 255], blueviolet: [138, 43, 226], brown: [165, 42, 42], burlywood: [222, 184, 135], cadetblue: [95, 158, 160], chartreuse: [127, 255, 0], chocolate: [210, 105, 30], coral: [255, 127, 80], cornflowerblue: [100, 149, 237], cornsilk: [255, 248, 220], crimson: [220, 20, 60], cyan: [0, 255, 255], darkblue: [0, 0, 139], darkcyan: [0, 139, 139], darkgoldenrod: [184, 134, 11], darkgray: [169, 169, 169], darkgreen: [0, 100, 0], darkgrey: [169, 169, 169], darkkhaki: [189, 183, 107], darkmagenta: [139, 0, 139], darkolivegreen: [85, 107, 47], darkorange: [255, 140, 0], darkorchid: [153, 50, 204], darkred: [139, 0, 0], darksalmon: [233, 150, 122], darkseagreen: [143, 188, 143], darkslateblue: [72, 61, 139], darkslategray: [47, 79, 79], darkslategrey: [47, 79, 79], darkturquoise: [0, 206, 209], darkviolet: [148, 0, 211], deeppink: [255, 20, 147], deepskyblue: [0, 191, 255], dimgray: [105, 105, 105], dimgrey: [105, 105, 105], dodgerblue: [30, 144, 255], firebrick: [178, 34, 34], floralwhite: [255, 250, 240], forestgreen: [34, 139, 34], fuchsia: [255, 0, 255], gainsboro: [220, 220, 220], ghostwhite: [248, 248, 255], gold: [255, 215, 0], goldenrod: [218, 165, 32], gray: [128, 128, 128], green: [0, 128, 0], greenyellow: [173, 255, 47], grey: [128, 128, 128], honeydew: [240, 255, 240], hotpink: [255, 105, 180], indianred: [205, 92, 92], indigo: [75, 0, 130], ivory: [255, 255, 240], khaki: [240, 230, 140], lavender: [230, 230, 250], lavenderblush: [255, 240, 245], lawngreen: [124, 252, 0], lemonchiffon: [255, 250, 205], lightblue: [173, 216, 230], lightcoral: [240, 128, 128], lightcyan: [224, 255, 255], lightgoldenrodyellow: [250, 250, 210], lightgray: [211, 211, 211], lightgreen: [144, 238, 144], lightgrey: [211, 211, 211], lightpink: [255, 182, 193], lightsalmon: [255, 160, 122], lightseagreen: [32, 178, 170], lightskyblue: [135, 206, 250], lightslategray: [119, 136, 153], lightslategrey: [119, 136, 153], lightsteelblue: [176, 196, 222], lightyellow: [255, 255, 224], lime: [0, 255, 0], limegreen: [50, 205, 50], linen: [250, 240, 230], magenta: [255, 0, 255], maroon: [128, 0, 0], mediumaquamarine: [102, 205, 170], mediumblue: [0, 0, 205], mediumorchid: [186, 85, 211], mediumpurple: [147, 112, 219], mediumseagreen: [60, 179, 113], mediumslateblue: [123, 104, 238], mediumspringgreen: [0, 250, 154], mediumturquoise: [72, 209, 204], mediumvioletred: [199, 21, 133], midnightblue: [25, 25, 112], mintcream: [245, 255, 250], mistyrose: [255, 228, 225], moccasin: [255, 228, 181], navajowhite: [255, 222, 173], navy: [0, 0, 128], oldlace: [253, 245, 230], olive: [128, 128, 0], olivedrab: [107, 142, 35], orange: [255, 165, 0], orangered: [255, 69, 0], orchid: [218, 112, 214], palegoldenrod: [238, 232, 170], palegreen: [152, 251, 152], paleturquoise: [175, 238, 238], palevioletred: [219, 112, 147], papayawhip: [255, 239, 213], peachpuff: [255, 218, 185], peru: [205, 133, 63], pink: [255, 192, 203], plum: [221, 160, 221], powderblue: [176, 224, 230], purple: [128, 0, 128], rebeccapurple: [102, 51, 153], red: [255, 0, 0], rosybrown: [188, 143, 143], royalblue: [65, 105, 225], saddlebrown: [139, 69, 19], salmon: [250, 128, 114], sandybrown: [244, 164, 96], seagreen: [46, 139, 87], seashell: [255, 245, 238], sienna: [160, 82, 45], silver: [192, 192, 192], skyblue: [135, 206, 235], slateblue: [106, 90, 205], slategray: [112, 128, 144], slategrey: [112, 128, 144], snow: [255, 250, 250], springgreen: [0, 255, 127], steelblue: [70, 130, 180], tan: [210, 180, 140], teal: [0, 128, 128], thistle: [216, 191, 216], tomato: [255, 99, 71], turquoise: [64, 224, 208], violet: [238, 130, 238], wheat: [245, 222, 179], white: [255, 255, 255], whitesmoke: [245, 245, 245], yellow: [255, 255, 0], yellowgreen: [154, 205, 50] }, t = new RegExp(/^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/, "i"), r = "-?\\d*(?:\\.\\d+)", n = "(" + r + "?)", i = "(" + r + "?%)", a = (`^
  hsla?\\(
    \\s*(-?\\d*(?:\\.\\d+)?(?:deg|rad|turn)?)\\s*,
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), o = new RegExp(a), l = (`^
  hsla?\\(
    \\s*(-?\\d*(?:\\.\\d+)?(?:deg|rad|turn)?)\\s*
    \\s+` + i + `
    \\s+` + i + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), s = new RegExp(l), u = (`^
  rgba?\\(
    \\s*` + n + `\\s*,
    \\s*` + n + `\\s*,
    \\s*` + n + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), f = new RegExp(u), c = (`^
  rgba?\\(
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), h = new RegExp(c), p = (`^
  rgba?\\(
    \\s*` + n + `
    \\s+` + n + `
    \\s+` + n + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
$
`).replace(/\n|\s/g, ""), m = new RegExp(p), v = (`^
  rgba?\\(
    \\s*` + i + `
    \\s+` + i + `
    \\s+` + i + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
$
`).replace(/\n|\s/g, ""), g = new RegExp(v), y = new RegExp(/^transparent$/, "i"), x = new RegExp("[^#a-f\\d]", "gi"), _ = new RegExp("^#?[a-f\\d]{3}[a-f\\d]?$|^#?[a-f\\d]{6}([a-f\\d]{2})?$", "i"), L = /* @__PURE__ */ __name(function(M, H, Q) {
      return Math.min(Math.max(H, M), Q);
    }, "L"), T = /* @__PURE__ */ __name(function(M) {
      var H = M;
      return typeof H != "number" && (H = H.endsWith("%") ? 255 * parseFloat(H) / 100 : parseFloat(H)), L(Math.round(H), 0, 255);
    }, "T"), E = /* @__PURE__ */ __name(function(M) {
      return L(parseFloat(M), 0, 100);
    }, "E");
    function R(M) {
      var H = M;
      return typeof H != "number" && (H = H.endsWith("%") ? parseFloat(H) / 100 : parseFloat(H)), L(H, 0, 1);
    }
    __name(R, "R");
    function C(M) {
      var H = (function(Q, ee) {
        if (ee === void 0 && (ee = {}), typeof Q != "string" || x.test(Q) || !_.test(Q)) throw new TypeError("Expected a valid hex string");
        var P = 1;
        (Q = Q.replace(/^#/, "")).length === 8 && (P = Number.parseInt(Q.slice(6, 8), 16) / 255, Q = Q.slice(0, 6)), Q.length === 4 && (P = Number.parseInt(Q.slice(3, 4).repeat(2), 16) / 255, Q = Q.slice(0, 3)), Q.length === 3 && (Q = Q[0] + Q[0] + Q[1] + Q[1] + Q[2] + Q[2]);
        var U = Number.parseInt(Q, 16), O = U >> 16, X = U >> 8 & 255, K = 255 & U, ne = typeof ee.alpha == "number" ? ee.alpha : P;
        return ee.format === "array" ? [O, X, K, ne] : ee.format === "css" ? "rgb(" + O + " " + X + " " + K + (ne === 1 ? "" : " / " + Number((100 * ne).toFixed(2)) + "%") + ")" : { red: O, green: X, blue: K, alpha: ne };
      })(M, { format: "array" });
      return D([null, H[0], H[1], H[2], H[3]]);
    }
    __name(C, "C");
    function D(M) {
      var H = M[1], Q = M[2], ee = M[3], P = M[4];
      return P === void 0 && (P = 1), { type: "rgb", values: [H, Q, ee].map(T), alpha: R(P === null ? 1 : P) };
    }
    __name(D, "D");
    return function(M) {
      if (typeof M != "string") return null;
      var H = t.exec(M);
      if (H) return C(H[0]);
      var Q = s.exec(M) || o.exec(M);
      if (Q) return (function(U) {
        var O = U[1], X = U[2], K = U[3], ne = U[4];
        ne === void 0 && (ne = 1);
        var ie = O;
        return { type: "hsl", values: [ie = ie.endsWith("turn") ? 360 * parseFloat(ie) / 1 : ie.endsWith("rad") ? Math.round(180 * parseFloat(ie) / Math.PI) : parseFloat(ie), E(X), E(K)], alpha: R(ne === null ? 1 : ne) };
      })(Q);
      var ee = m.exec(M) || g.exec(M) || f.exec(M) || h.exec(M);
      if (ee) return D(ee);
      if (y.exec(M)) return D([null, 0, 0, 0, 0]);
      var P = e[M.toLowerCase()];
      return P ? D([null, P[0], P[1], P[2], 1]) : null;
    };
  });
});
var ps = Ke((ax, hs) => {
  "use strict";
  var Gh = /["'&<>]/;
  hs.exports = $h;
  function $h(e) {
    var t = "" + e, r = Gh.exec(t);
    if (!r) return t;
    var n, i = "", a = 0, o = 0;
    for (a = r.index; a < t.length; a++) {
      switch (t.charCodeAt(a)) {
        case 34:
          n = "&quot;";
          break;
        case 38:
          n = "&amp;";
          break;
        case 39:
          n = "&#39;";
          break;
        case 60:
          n = "&lt;";
          break;
        case 62:
          n = "&gt;";
          break;
        default:
          continue;
      }
      o !== a && (i += t.substring(o, a)), o = a + 1, i += n;
    }
    return o !== a ? i + t.substring(o, a) : i;
  }
  __name($h, "$h");
});
var Lo = _t(xo(), 1);
var Co = _t(wo(), 1);
var Ti = {};
var Ff = 5;
var So = 12;
var Df = 13;
var Uf = 16;
var Nf = 17;
var Mf = 22;
var Eo = 28;
var ko = 31;
var Wf = 33;
var bn = 34;
var Bf = 35;
var Si = 36;
var Ei = 37;
var Oo = 38;
var Gf = 39;
var $f = 40;
var Ur = 41;
var jf = 42;
var d = 0;
var b = 1;
var _e = 2;
var Ao = 3;
var k = 4;
var zf = [[k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, k, Ao, k, k, k, k, k, k, k, k, k, k, k], [d, k, k, b, b, k, k, k, k, b, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, k, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [k, k, k, b, b, b, k, k, k, b, b, b, b, b, b, b, b, b, b, b, k, _e, k, b, b, b, b, b, b, b, b, b, b], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, b, b, b, b, b, b, k, _e, k, b, b, b, b, b, b, b, b, b, b], [d, k, k, b, b, b, k, k, k, d, d, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, d, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, d, b, d, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, d, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, d, d, b, b, b, b, b, b, b, d, d, k, _e, k, b, b, b, b, b, d, b, b, b, d], [b, k, k, b, b, b, k, k, k, d, d, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, d, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, d, b, k, k, k, d, d, b, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, d, b, k, k, k, d, d, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, b, b, b, b, b, b, k, _e, k, b, b, b, b, b, b, b, b, b, d], [d, k, k, b, b, b, k, k, k, d, d, d, d, d, d, b, b, b, d, k, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, d, k, d, d, d, d, d, d, d, d, d, d, d, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, b, b, b, b, b, b, k, _e, k, b, b, b, b, b, b, b, b, b, b], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, b, b, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, b, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, b, b, b, b, d, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, b, b, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, b, d, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, d, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, b, d, d, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, b, b, d], [d, k, k, b, b, b, k, k, k, d, b, d, d, d, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [b, k, k, b, b, b, k, k, k, b, b, b, b, b, d, b, b, b, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d], [d, k, k, b, b, d, k, k, k, d, d, d, d, d, d, d, d, d, d, d, k, _e, k, d, d, d, d, d, d, d, d, b, d]];
var Vf = Co.default.toByteArray("AAgOAAAAAAAQ4QAAAQ0P8vDtnQuMXUUZx+eyu7d7797d9m5bHoWltKVUlsjLWE0VJNigQoMVqkStEoNQQUl5GIo1KKmogEgqkKbBRki72lYabZMGKoGAjQRtJJDaCCIRiiigREBQS3z+xzOTnZ3O+3HOhd5NfpkzZx7fN9988zivu2M9hGwB28F94DnwEngd/Asc1EtIs9c/bIPDwCxwLDgezHcodyo4w5C+CCwBS8FnwSXgCnA1uFbI93XwbXAbWAfWgx+CzWAb+An4KfgFeAzsYWWfYuFz4CXwGvgb+Dfo6yNkEEwGh4CZYB44FpwI3g1OY+kfBItZOo2fB84Hy8DF4HJwNbiWpV8PVoO1LH4n2NRXyN+KcAd4kNVP9XsY4aPgcfAbsBfs6SniL4K/sPjfEf6HlanXCRkCw2BGvUh/keWfXS/CY+pFXs7x9XHmM94LTmWIeU2cgbxnS/k/B3kf86jDhU8L9V2E40vAFWAlWFUfb++NOL4F3C7JX4/4GiE+hvgWsF0oS7mXldspnN+F493gyXrh9xTav0cg3EvzgVfBG6wsmVSEkxBOBgdPGpd7JI6PnqRvJ68/xlbHof53gPeA94OzwLngk+ACsAwsByvASrAK3MB0Ws3CtQjvBJvAVrADPMDSHkb4CNijaccTwvnf4fiPEs8Lxy+D18A/QU8/xjgYBjPAbDAKTgYLwOngTHAO+EQ/8wuEF4EvsPiVCFf2+9tsFStzA8LVHuXXBsi6QyqzUYiPMR/7Mc7dAx7oL8bzw/3u/Bw8Bp4Az4AXwCtgHzsmDXP5fiF9iiVvly5d0sHngar16NKlS5cuXbp06fLmYlqHXrcd3ph4P0THUY3iXh49novju4S0tzfs5d+JPKewfAsRntZb3K9ZhOMlrO6lCC8An28U9+OuovcPcPxlVu5rCL/VmHh/iHIrzn3fIPu7SN8Axmg+8AOwEWwCm7tp3bRuWjetm5Y8bSu4B9zbKO6ZVsnORrVU3f4uXTqZ2H3sLoyx3eDXjfDndE9qyj6L838CfwVvgFpzYnof4oNgOhgBc8Fos9DrZIQLmtXPP1MmF6wGj4H+KXoWguvADkXaPil+YpuQy8Am8Ey7ODdtmJDF4HowBp4De6HDTNjhfHAHeBr0DBBy0kDxfPbcgSIusgrcWhtnJ8vL+TPix7UIOQtcBq4C28Cr4KRBnANbwSuDE+s50JgyNNFuXbp06XIgsXjIvPafjvXozKY+fVFz/z0LT1uCtKVSWbrOLWPnztG8e0Xfy7ol8XtZJi7WtG+5od2UFXQ/A12vUeS7jp27yVKHjdsU9lXB869TyNvAzt0lpP2oWbwLdjiO78bx/Sz+EMJHwK9Y/LcIfw+eZ3F67/Hl5vh9xX80J+rwX8SvRDhpgL17iPAQMHNArfPrqHPewLheI+AERV6efwV418B4nOZ/H+IfYHV8GOF5LJ3eAz0fx8sM9S0fUNud39O9CulfGZhY5huI3wzWgNvBelbHZoTbNPVpfYjKQpkHwUNgl0LWblbnk0LbbDxr0OMFpL3iqWdu9nWYPlVAWkXY39LnGdCkDbeqv1YNbfcMQ3t9oe8lzm6NH9N1ZB6Ln4BwfkJZJk7RyFnYKt6b/JDQXx9p5X+eFdqOjzM9P9MB/lUlFzr20aXIdzlY4dmn9F3YqtvoO76/2hp/D/xA5Zue88nNyL8GbFbs075X0tyUig3Qd2MCnf//HjnzpbsR3g9+1kHzzVjdnE71/qVBX9rGPUh/ysNWe1neFzvIDi5zAufV1sT0N0poR22wkFUfTOPfA4N2mbZ5fSrqOHSw+IbkSBbOGSzSRgf91/GTUWYBOB2cIZQ/G8cfBZ8CFwrnL8XxF8FKcA24jqXdiPA7Qr61OF7H4mMItwzuv2/YLth1ISt3Hzu3k4W7EH5JqPdRHD/O4k+z8A8IX5Lq3y7Z4nXE9xn6kX6vQ4bKfy+ok+hH+xf3hq9dnTTHhjKd2GmDuWA242iHMq4cC7A8kJ7i8o1+skSa7Jieo38HCWnoNjKFhdSFBxzpZ7QE6lI8N4S14aASZcryaV/WWHw66f6NHuCoxuQxmvM56GX9QMd8Q4D65ywGP+ZzRJuM+zQvx/MOS2VFeqQ4IXnH26zM9Xe6/E6D+4foAzzuajPZp8Qyw5ayZVDWuH0z0BtYRkeIDqH9KO9VbH1btd/lhNqCzvl8zeLnG0S/hnU6baHfpiuO6yy0rd+DHURo/zYF5H26j03rQsip2ndzz82u1z9N4VjWKWeb68Tedpt95HRVXp7H1R6p+/Wt4FPy/PpWwscOLRJ+PVWF/+W0iVyGzs18TIvXkOJ1Wxm66vSXz+vylenrZcj1ub439W+K8RNCGTJi2p/TJ1K23VaXr35tRpnzmjxequgfcfyk6B/TGBVlyedsNgpdd/h+W1U3P99QyFPNo1X3TwpM/WLTIWYfoBqXrv6iskHZ/RFr79R6hIyHBrH3f1nrUVnjP8SnZZ+rYtzr9Exld5MNbPNErusAPg+77u/eDOPftU9yj39TH7rezxd1LvsZQJlzkWlOirG/79zjMj/mtHUKu7vKy+3/LnXr9okyKedjX5/0He9iP/j63LwOQdarEVlfy8OO/Lqw023j6xcqmwxLiOd6heM2i9cV9LJy8jMJ23yQ+rpbfu7EQ/pXE8KYvUSqvVnb4XzZa6LrHMXHR+zcLvqWbm/Bn0/HzIs6fWPHoat8XfnDKmZGxRxeMbn2UqZ5Q94nmcZRbqqUXbZ8+lcjE+cPX11t814orvvAXNcG8vqj2vvk1MGn3anlj0bIT72v47bvE+Lc98T9b6r7AKn6j+8Duf7D0nnZx/j7Zjn0j9nbpSTndaLr9WNLivP+iN23xF7L+fqv6ZouFyb78jxVXvv5jJ9YUs9/sddO8h7KNg5jrhfaJGztT6G7KF+1d6yCmD5Kdb2fan60rSc552fZr3zeQ9DpnPp+Si5cx5Ktv2QfSzF/mMbWdOm46rFI4XstnU9xeqX4NKb7TKEdcr6pZOK3ID1k/LvFHkVczEuZLEDr499YqvqBym1aEHWgcvoYOtv0M91qQl5TfpO/in6rWx8OVpT1Wedkv3f5xom3T/xeR/6Gx6V86PWAOB4bBpqWdN+yTcVxjIyGRz/FrDGu6w/3d7kPm8StX8RyPu+uuvpNju/vTLJV37GpvoM0oZPnW87VLnL/5pDno1NoW1R6yedU6TyUv3u19a3KFnIbTLYz+ZCLP4T0tU1uivFgso0pnsJ/UtXvarNY28Xq5cvkBDrQP/E5ZaiuQwwfmTlsOiQRU1fMuqrDd/3ISSuwjOwXOfTyGUMpZIXq4GpLn3pUcdfzch2x7XO1u2uZHOPb1G6b3Xg9PH1IIWeEpJlPQtqos2EKW8b0u8rnuP1UeVLoXJb9be0uG9nnbchjU+XTszT5VeNBThPHnc5OKj1U9aj0GTHIVaGy1YhEWT4ixns00DT+XEzWn/7VAsIc63Cov3OdyhwjrnaqQqZvWKXdypRdlq+k8msZ031U+Rm4fA+3TtyeR9hwfW9G9yxDN0fZMN33F+9TE6md4hwoxumfaUzI9fN3PFT3xVV2msrQ3UsnChm6Nulk8TndpS28D3zX9tTIPsF/z7Am5OkTjm1tI1JZW74+4VgsZ0N3L1yXV3WeP5uR7TGHHdvC3JQlxybfpd22tDlk/2eofRK8TzrN/qnar/K/OUTth6I/+jAnEptNbPvFHP2gs40N3+dfMWtwqvVct7/wfd8gtQ7imifial9ZJ9/3IHLYU6eDj3+4PhsNhX+vwvcWLnu6kGfEMe8DuciPfUfGZB8X/7HJy/Gefe5n+VRGFd/wyP2ta7/LO4yh/sbLV/k9lev6kfO9Dt/5U67b1/6u/epqB1U9Me23jfHY9sscAg4tkbLl+e4/U36rJ9ddxfd6sg5vq5ice42Wpk/pb9FOJ36/W9tpv4kbC79nUbZceX8Zu6/qJ+P3WvhvA8v3reh7Jbn2d6rrNC7XNZTLma4Ba0JI9efX2uLzF5scG/w9UNU1ZxW+ymUfzELeTllXlQ1rUuhzjS5fp9c964iFBOqeSz63bU065nZKdU+mDEz3qHIjjifquw0pnb/raRtvrnsYcb46ihT3taoYz6brdNW9l6rWRnE/navdPn1XlR1km7hcz1WlH/elKuSOSvLLuE8U6m8uzwRdfcGl73VyTHuyMvzJ1Sa2cWDTP/Z63Kc94n2B1PYr24dz1JlyHLlcP+S4B6vD1c9EW4q2LWstCvUjeVy63k/LMYdUNd5D1xQfvVTzX1VjkMsUv88N8VH5fReVn/Fjn++/h6X6Q8a6b1/q3g/i/ewi0/Scs8zxXeV6mWIOUPlPzBgdFerW+bZrm2P18dnjuK6HunEp+rHvPMXbr+sHVb/lnL+pTP57jPw9Cvk3PW178JD9qChfzuvTf7Htl38L1QUf/VKu9SFjwWbTWPvFEvu7Uq76y7+31g6QlYPc669pbsm9Xur2LWI9Pu8ypfDXqm3A2z8s1FWGn4ntL9NfQu2oSlftX9uetvTtv7J8Ql4zxfXGZ3zk8PeQ9w59x2uMfqI8/q5eKh/l9cb2rwsu9rSNl06ZP2Pmxtz+rNMx93yno0n2/82rVH7rQ+y9P15H6FyRun9ViH81ATmffI7nJ5r8uXXW6enbP6b/B8/l5OifVHYLnb9S39s2zcc+Ph+rh8+eQgVPS72elzGWY/tUtbbabBpDiI7yN1q6/4th2y+ErAc5+9BVvu/7KamJbWNZeuqI/R4tRf+YyD1HmOZM1bMV3/14Sn10c0Xu+Sj1nOXb5jL73ncdy02uvlXZNde65dOHYl7Vs4KYuS6FzWLn2zJlpZqPXPVPOa5yzKOyn1VhT9lmMfdbfH7D11Wf2PXN5h9y+dD287+qxgSnaYmnIrRtIb8pJe6/Uv9OVer6Whn0zfGO/BEloZI9ojmfAlUflClDd178bTmVHVTpZXOkAlk/lb42UujmI89HH5V+cl7XtowY6vTxLVWok6UrGzoGTHN+bB+6ri05687VNpvfuvRfaP2uMlNQth1D5JjGelm/8yn+9p3p/7qk9gnfeddXZmq/Sm333PJT659Kv1zjNbZ9uv2Oi//67CV8/N1nj1DmviyXDNVeJkaeaX8UsyesYg8cu2+NvdaPfb+lLDu5tvt/");
var Hf = new Lo.default(Vf);
var To = /* @__PURE__ */ __name(function(e) {
  switch (e) {
    case Wf:
      return So;
    case Gf:
    case $f:
    case jf:
      return So;
    case Bf:
      return Ff;
    default:
      return e;
  }
}, "To");
var _o = /* @__PURE__ */ __name(function(e) {
  switch (e) {
    case Ei:
    case Oo:
      return bn;
    case Ur:
      return Mf;
    default:
      return e;
  }
}, "_o");
var Nr = class {
  static {
    __name(this, "Nr");
  }
  constructor(t, r = false) {
    this.position = t, this.required = r;
  }
};
var ki = class {
  static {
    __name(this, "ki");
  }
  nextCodePoint() {
    let t = this.string.charCodeAt(this.pos++), r = this.string.charCodeAt(this.pos);
    return 55296 <= t && t <= 56319 && 56320 <= r && r <= 57343 ? (this.pos++, (t - 55296) * 1024 + (r - 56320) + 65536) : t;
  }
  nextCharClass() {
    return To(Hf.get(this.nextCodePoint()));
  }
  getSimpleBreak() {
    switch (this.nextClass) {
      case Ur:
        return false;
      case bn:
      case Ei:
      case Oo:
        return this.curClass = bn, false;
      case Si:
        return this.curClass = Si, false;
    }
    return null;
  }
  getPairTableBreak(t) {
    let r = false;
    switch (zf[this.curClass][this.nextClass]) {
      case d:
        r = true;
        break;
      case b:
        r = t === Ur;
        break;
      case _e:
        if (r = t === Ur, !r) return r = false, r;
        break;
      case Ao:
        if (t !== Ur) return r;
        break;
      case k:
        break;
    }
    return this.LB8a && (r = false), this.LB21a && (this.curClass === Uf || this.curClass === Nf) ? (r = false, this.LB21a = false) : this.LB21a = this.curClass === Df, this.curClass === Eo ? (this.LB30a++, this.LB30a == 2 && this.nextClass === Eo && (r = true, this.LB30a = 0)) : this.LB30a = 0, this.curClass = this.nextClass, r;
  }
  nextBreak() {
    if (this.curClass == null) {
      let t = this.nextCharClass();
      this.curClass = _o(t), this.nextClass = t, this.LB8a = t === ko, this.LB30a = 0;
    }
    for (; this.pos < this.string.length; ) {
      this.lastPos = this.pos;
      let t = this.nextClass;
      if (this.nextClass = this.nextCharClass(), this.curClass === bn || this.curClass === Si && this.nextClass !== Ei) return this.curClass = _o(To(this.nextClass)), new Nr(this.lastPos, true);
      let r = this.getSimpleBreak();
      if (r === null && (r = this.getPairTableBreak(t)), this.LB8a = this.nextClass === ko, r) return new Nr(this.lastPos);
    }
    return this.lastPos < this.string.length ? (this.lastPos = this.string.length, new Nr(this.string.length)) : null;
  }
  constructor(t) {
    this.string = t, this.pos = 0, this.lastPos = 0, this.curClass = null, this.nextClass = null, this.LB8a = false, this.LB21a = false, this.LB30a = 0;
  }
};
Ti = ki;
var Rt = _t(kn(), 1);
var Eu = _t(us(), 1);
var ku = _t(cs(), 1);
var Tu = _t(qi(), 1);
var _u = _t(Ri(), 1);
var Lu = _t(kn(), 1);
var La = _t(ps(), 1);
function Yi(e, t = ",") {
  let r = [], n = 0, i = 0;
  t = new RegExp(t);
  for (let a = 0; a < e.length; a++) e[a] === "(" ? i++ : e[a] === ")" && i--, i === 0 && t.test(e[a]) && (r.push(e.slice(n, a).trim()), n = a + 1);
  return r.push(e.slice(n).trim()), r;
}
__name(Yi, "Yi");
function Xi(e) {
  let t = [];
  for (let r = 0, n = e.length; r < n; ) {
    let [i, a] = Yi(e[r], /\s+/);
    jh(e[r + 1]) ? (t.push({ color: i, offset: mr(a), hint: mr(e[r + 1]) }), r += 2) : (t.push({ color: i, offset: mr(a) }), r++);
  }
  return t;
}
__name(Xi, "Xi");
var gs = /^(-?\d+\.?\d*)(%|vw|vh|px|em|rem|deg|rad|grad|turn)$/;
function jh(e) {
  return gs.test(e);
}
__name(jh, "jh");
function mr(e) {
  if (!e) return;
  let [, t, r] = e.trim().match(gs) || [];
  return { value: t, unit: r };
}
__name(mr, "mr");
function ms(e) {
  if (!/^(repeating-)?linear-gradient/.test(e)) throw new SyntaxError(`could not find syntax for this item: ${e}`);
  let [, t, r] = e.match(/(repeating-)?linear-gradient\((.+)\)/), n = { orientation: { type: "directional", value: "bottom" }, repeating: !!t, stops: [] }, i = Yi(r), a = zh(i[0]);
  return a && (n.orientation = a, i.shift()), { ...n, stops: Xi(i) };
}
__name(ms, "ms");
function zh(e) {
  return e.startsWith("to ") ? { type: "directional", value: e.replace("to ", "") } : ["turn", "deg", "grad", "rad"].some((t) => e.endsWith(t)) ? { type: "angular", value: mr(e) } : null;
}
__name(zh, "zh");
var Vh = /* @__PURE__ */ new Set(["closest-corner", "closest-side", "farthest-corner", "farthest-side"]);
var Hh = /* @__PURE__ */ new Set(["center", "left", "top", "right", "bottom"]);
function ds(e) {
  return Vh.has(e);
}
__name(ds, "ds");
function vs(e) {
  return Hh.has(e);
}
__name(vs, "vs");
function qh(e) {
  let t = Array(2).fill("");
  for (let r = 0; r < 2; r++) e[r] ? t[r] = e[r] : t[r] = "center";
  return t;
}
__name(qh, "qh");
function bs(e) {
  if (!/(repeating-)?radial-gradient/.test(e)) throw new SyntaxError(`could not find syntax for this item: ${e}`);
  let [, t, r] = e.match(/(repeating-)?radial-gradient\((.+)\)/), n = { shape: "ellipse", repeating: !!t, size: [{ type: "keyword", value: "farthest-corner" }], position: { x: { type: "keyword", value: "center" }, y: { type: "keyword", value: "center" } }, stops: [] }, i = Yi(r);
  if (Xh(i[0])) return { ...n, stops: Xi(i) };
  let a = i[0].split("at").map((u) => u.trim()), o = ((a[0] || "").match(/(circle|ellipse)/) || [])[1], l = (a[0] || "").match(/(-?\d+\.?\d*(vw|vh|px|em|rem|%|rad|grad|turn|deg)?|closest-corner|closest-side|farthest-corner|farthest-side)/g) || [], s = qh((a[1] || "").split(" "));
  return o ? n.shape = o : l.length === 1 && !ds(l[0]) ? n.shape = "circle" : n.shape = "ellipse", l.length === 0 && l.push("farthest-corner"), n.size = l.map((u) => ds(u) ? { type: "keyword", value: u } : { type: "length", value: mr(u) }), n.position.x = vs(s[0]) ? { type: "keyword", value: s[0] } : { type: "length", value: mr(s[0]) }, n.position.y = vs(s[1]) ? { type: "keyword", value: s[1] } : { type: "length", value: mr(s[1]) }, (o || l.length > 0 || a[1]) && i.shift(), { ...n, stops: Xi(i) };
}
__name(bs, "bs");
function Xh(e) {
  return /(circle|ellipse|at)/.test(e) ? false : /^(rgba?|hwb|hsl|lab|lch|oklab|color|#|[a-zA-Z]+)/.test(e);
}
__name(Xh, "Xh");
var Pu = _t(qi(), 1);
var Ca = _t(kn(), 1);
var wt = Uint8Array;
var yr = Uint16Array;
var Hs = Uint32Array;
var qs = new wt([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
var Xs = new wt([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
var Yh = new wt([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var Ys = /* @__PURE__ */ __name(function(e, t) {
  for (var r = new yr(31), n = 0; n < 31; ++n) r[n] = t += 1 << e[n - 1];
  for (var i = new Hs(r[30]), n = 1; n < 30; ++n) for (var a = r[n]; a < r[n + 1]; ++a) i[a] = a - r[n] << 5 | n;
  return [r, i];
}, "Ys");
var Zs = Ys(qs, 2);
var Js = Zs[0];
var Zh = Zs[1];
Js[28] = 258, Zh[258] = 28;
var Jh = Ys(Xs, 0);
var Qh = Jh[0];
var aa = new yr(32768);
for (Oe = 0; Oe < 32768; ++Oe) Xt = (Oe & 43690) >>> 1 | (Oe & 21845) << 1, Xt = (Xt & 52428) >>> 2 | (Xt & 13107) << 2, Xt = (Xt & 61680) >>> 4 | (Xt & 3855) << 4, aa[Oe] = ((Xt & 65280) >>> 8 | (Xt & 255) << 8) >>> 1;
var Xt;
var Oe;
var Gr = /* @__PURE__ */ __name(function(e, t, r) {
  for (var n = e.length, i = 0, a = new yr(t); i < n; ++i) e[i] && ++a[e[i] - 1];
  var o = new yr(t);
  for (i = 0; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
  var l;
  if (r) {
    l = new yr(1 << t);
    var s = 15 - t;
    for (i = 0; i < n; ++i) if (e[i]) for (var u = i << 4 | e[i], f = t - e[i], c = o[e[i] - 1]++ << f, h = c | (1 << f) - 1; c <= h; ++c) l[aa[c] >>> s] = u;
  } else for (l = new yr(n), i = 0; i < n; ++i) e[i] && (l[i] = aa[o[e[i] - 1]++] >>> 15 - e[i]);
  return l;
}, "Gr");
var zr = new wt(288);
for (Oe = 0; Oe < 144; ++Oe) zr[Oe] = 8;
var Oe;
for (Oe = 144; Oe < 256; ++Oe) zr[Oe] = 9;
var Oe;
for (Oe = 256; Oe < 280; ++Oe) zr[Oe] = 7;
var Oe;
for (Oe = 280; Oe < 288; ++Oe) zr[Oe] = 8;
var Oe;
var Qs = new wt(32);
for (Oe = 0; Oe < 32; ++Oe) Qs[Oe] = 5;
var Oe;
var Kh = Gr(zr, 9, 1);
var ep = Gr(Qs, 5, 1);
var Zi = /* @__PURE__ */ __name(function(e) {
  for (var t = e[0], r = 1; r < e.length; ++r) e[r] > t && (t = e[r]);
  return t;
}, "Zi");
var Lt = /* @__PURE__ */ __name(function(e, t, r) {
  var n = t / 8 | 0;
  return (e[n] | e[n + 1] << 8) >> (t & 7) & r;
}, "Lt");
var Ji = /* @__PURE__ */ __name(function(e, t) {
  var r = t / 8 | 0;
  return (e[r] | e[r + 1] << 8 | e[r + 2] << 16) >> (t & 7);
}, "Ji");
var tp = /* @__PURE__ */ __name(function(e) {
  return (e + 7) / 8 | 0;
}, "tp");
var rp = /* @__PURE__ */ __name(function(e, t, r) {
  (t == null || t < 0) && (t = 0), (r == null || r > e.length) && (r = e.length);
  var n = new (e.BYTES_PER_ELEMENT == 2 ? yr : e.BYTES_PER_ELEMENT == 4 ? Hs : wt)(r - t);
  return n.set(e.subarray(t, r)), n;
}, "rp");
var np = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data"];
var or = /* @__PURE__ */ __name(function(e, t, r) {
  var n = new Error(t || np[e]);
  if (n.code = e, Error.captureStackTrace && Error.captureStackTrace(n, or), !r) throw n;
  return n;
}, "or");
var ip = /* @__PURE__ */ __name(function(e, t, r) {
  var n = e.length;
  if (!n || r && r.f && !r.l) return t || new wt(0);
  var i = !t || r, a = !r || r.i;
  r || (r = {}), t || (t = new wt(n * 3));
  var o = /* @__PURE__ */ __name(function($) {
    var he = t.length;
    if ($ > he) {
      var fe = new wt(Math.max(he * 2, $));
      fe.set(t), t = fe;
    }
  }, "o"), l = r.f || 0, s = r.p || 0, u = r.b || 0, f = r.l, c = r.d, h = r.m, p = r.n, m = n * 8;
  do {
    if (!f) {
      l = Lt(e, s, 1);
      var v = Lt(e, s + 1, 3);
      if (s += 3, v) if (v == 1) f = Kh, c = ep, h = 9, p = 5;
      else if (v == 2) {
        var _ = Lt(e, s, 31) + 257, L = Lt(e, s + 10, 15) + 4, T = _ + Lt(e, s + 5, 31) + 1;
        s += 14;
        for (var E = new wt(T), R = new wt(19), C = 0; C < L; ++C) R[Yh[C]] = Lt(e, s + C * 3, 7);
        s += L * 3;
        for (var D = Zi(R), M = (1 << D) - 1, H = Gr(R, D, 1), C = 0; C < T; ) {
          var Q = H[Lt(e, s, M)];
          s += Q & 15;
          var g = Q >>> 4;
          if (g < 16) E[C++] = g;
          else {
            var ee = 0, P = 0;
            for (g == 16 ? (P = 3 + Lt(e, s, 3), s += 2, ee = E[C - 1]) : g == 17 ? (P = 3 + Lt(e, s, 7), s += 3) : g == 18 && (P = 11 + Lt(e, s, 127), s += 7); P--; ) E[C++] = ee;
          }
        }
        var U = E.subarray(0, _), O = E.subarray(_);
        h = Zi(U), p = Zi(O), f = Gr(U, h, 1), c = Gr(O, p, 1);
      } else or(1);
      else {
        var g = tp(s) + 4, y = e[g - 4] | e[g - 3] << 8, x = g + y;
        if (x > n) {
          a && or(0);
          break;
        }
        i && o(u + y), t.set(e.subarray(g, x), u), r.b = u += y, r.p = s = x * 8, r.f = l;
        continue;
      }
      if (s > m) {
        a && or(0);
        break;
      }
    }
    i && o(u + 131072);
    for (var X = (1 << h) - 1, K = (1 << p) - 1, ne = s; ; ne = s) {
      var ee = f[Ji(e, s) & X], ie = ee >>> 4;
      if (s += ee & 15, s > m) {
        a && or(0);
        break;
      }
      if (ee || or(2), ie < 256) t[u++] = ie;
      else if (ie == 256) {
        ne = s, f = null;
        break;
      } else {
        var V = ie - 254;
        if (ie > 264) {
          var C = ie - 257, Y = qs[C];
          V = Lt(e, s, (1 << Y) - 1) + Js[C], s += Y;
        }
        var A = c[Ji(e, s) & K], B = A >>> 4;
        A || or(3), s += A & 15;
        var O = Qh[B];
        if (B > 3) {
          var Y = Xs[B];
          O += Ji(e, s) & (1 << Y) - 1, s += Y;
        }
        if (s > m) {
          a && or(0);
          break;
        }
        i && o(u + 131072);
        for (var ae = u + V; u < ae; u += 4) t[u] = t[u - O], t[u + 1] = t[u + 1 - O], t[u + 2] = t[u + 2 - O], t[u + 3] = t[u + 3 - O];
        u = ae;
      }
    }
    r.l = f, r.p = ne, r.b = u, r.f = l, f && (l = 1, r.m = h, r.d = c, r.n = p);
  } while (!l);
  return u == t.length ? t : rp(t, 0, u);
}, "ip");
var ap = new wt(0);
function op(e, t) {
  return ip(e, t);
}
__name(op, "op");
var sp = typeof TextDecoder < "u" && new TextDecoder();
var lp = 0;
try {
  sp.decode(ap, { stream: true }), lp = 1;
} catch {
}
function at() {
  this.commands = [], this.fill = "black", this.stroke = null, this.strokeWidth = 1;
}
__name(at, "at");
at.prototype.moveTo = function(e, t) {
  this.commands.push({ type: "M", x: e, y: t });
};
at.prototype.lineTo = function(e, t) {
  this.commands.push({ type: "L", x: e, y: t });
};
at.prototype.curveTo = at.prototype.bezierCurveTo = function(e, t, r, n, i, a) {
  this.commands.push({ type: "C", x1: e, y1: t, x2: r, y2: n, x: i, y: a });
};
at.prototype.quadTo = at.prototype.quadraticCurveTo = function(e, t, r, n) {
  this.commands.push({ type: "Q", x1: e, y1: t, x: r, y: n });
};
at.prototype.close = at.prototype.closePath = function() {
  this.commands.push({ type: "Z" });
};
at.prototype.extend = function(e) {
  e.commands && (e = e.commands), Array.prototype.push.apply(this.commands, e);
};
at.prototype.toPathData = function(e) {
  e = e !== void 0 ? e : 2;
  function t(o) {
    return Math.round(o) === o ? "" + Math.round(o) : o.toFixed(e);
  }
  __name(t, "t");
  function r() {
    for (var o = arguments, l = "", s = 0; s < arguments.length; s += 1) {
      var u = o[s];
      u >= 0 && s > 0 && (l += " "), l += t(u);
    }
    return l;
  }
  __name(r, "r");
  for (var n = "", i = 0; i < this.commands.length; i += 1) {
    var a = this.commands[i];
    a.type === "M" ? n += "M" + r(a.x, a.y) : a.type === "L" ? n += "L" + r(a.x, a.y) : a.type === "C" ? n += "C" + r(a.x1, a.y1, a.x2, a.y2, a.x, a.y) : a.type === "Q" ? n += "Q" + r(a.x1, a.y1, a.x, a.y) : a.type === "Z" && (n += "Z");
  }
  return n;
};
var up = [".notdef", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "endash", "dagger", "daggerdbl", "periodcentered", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "questiondown", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "ring", "cedilla", "hungarumlaut", "ogonek", "caron", "emdash", "AE", "ordfeminine", "Lslash", "Oslash", "OE", "ordmasculine", "ae", "dotlessi", "lslash", "oslash", "oe", "germandbls", "onesuperior", "logicalnot", "mu", "trademark", "Eth", "onehalf", "plusminus", "Thorn", "onequarter", "divide", "brokenbar", "degree", "thorn", "threequarters", "twosuperior", "registered", "minus", "eth", "multiply", "threesuperior", "copyright", "Aacute", "Acircumflex", "Adieresis", "Agrave", "Aring", "Atilde", "Ccedilla", "Eacute", "Ecircumflex", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Ntilde", "Oacute", "Ocircumflex", "Odieresis", "Ograve", "Otilde", "Scaron", "Uacute", "Ucircumflex", "Udieresis", "Ugrave", "Yacute", "Ydieresis", "Zcaron", "aacute", "acircumflex", "adieresis", "agrave", "aring", "atilde", "ccedilla", "eacute", "ecircumflex", "edieresis", "egrave", "iacute", "icircumflex", "idieresis", "igrave", "ntilde", "oacute", "ocircumflex", "odieresis", "ograve", "otilde", "scaron", "uacute", "ucircumflex", "udieresis", "ugrave", "yacute", "ydieresis", "zcaron", "exclamsmall", "Hungarumlautsmall", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "266 ff", "onedotenleader", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "isuperior", "lsuperior", "msuperior", "nsuperior", "osuperior", "rsuperior", "ssuperior", "tsuperior", "ff", "ffi", "ffl", "parenleftinferior", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "exclamdownsmall", "centoldstyle", "Lslashsmall", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "Dotaccentsmall", "Macronsmall", "figuredash", "hypheninferior", "Ogoneksmall", "Ringsmall", "Cedillasmall", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "zerosuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall", "001.000", "001.001", "001.002", "001.003", "Black", "Bold", "Book", "Light", "Medium", "Regular", "Roman", "Semibold"];
var fp = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "", "endash", "dagger", "daggerdbl", "periodcentered", "", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "", "questiondown", "", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "", "ring", "cedilla", "", "hungarumlaut", "ogonek", "caron", "emdash", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "AE", "", "ordfeminine", "", "", "", "", "Lslash", "Oslash", "OE", "ordmasculine", "", "", "", "", "", "ae", "", "", "", "dotlessi", "", "", "lslash", "oslash", "oe", "germandbls"];
var cp = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclamsmall", "Hungarumlautsmall", "", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "", "", "isuperior", "", "", "lsuperior", "msuperior", "nsuperior", "osuperior", "", "", "rsuperior", "ssuperior", "tsuperior", "", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdownsmall", "centoldstyle", "Lslashsmall", "", "", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "", "Dotaccentsmall", "", "", "Macronsmall", "", "", "figuredash", "hypheninferior", "", "", "Ogoneksmall", "Ringsmall", "Cedillasmall", "", "", "", "onequarter", "onehalf", "threequarters", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "", "", "zerosuperior", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall"];
function Ks(e) {
  this.font = e;
}
__name(Ks, "Ks");
Ks.prototype.charToGlyphIndex = function(e) {
  var t = e.codePointAt(0), r = this.font.glyphs;
  if (r) {
    for (var n = 0; n < r.length; n += 1) for (var i = r.get(n), a = 0; a < i.unicodes.length; a += 1) if (i.unicodes[a] === t) return n;
  }
  return null;
};
function el(e) {
  this.cmap = e;
}
__name(el, "el");
el.prototype.charToGlyphIndex = function(e) {
  return this.cmap.glyphIndexMap[e.codePointAt(0)] || 0;
};
function On(e, t) {
  this.encoding = e, this.charset = t;
}
__name(On, "On");
On.prototype.charToGlyphIndex = function(e) {
  var t = e.codePointAt(0), r = this.encoding[t];
  return this.charset.indexOf(r);
};
function hp(e) {
  for (var t, r = e.tables.cmap.glyphIndexMap, n = Object.keys(r), i = 0; i < n.length; i += 1) {
    var a = n[i], o = r[a];
    t = e.glyphs.get(o), t.addUnicode(parseInt(a));
  }
}
__name(hp, "hp");
function pp(e) {
  e._IndexToUnicodeMap = {};
  for (var t = e.tables.cmap.glyphIndexMap, r = Object.keys(t), n = 0; n < r.length; n += 1) {
    var i = r[n], a = t[i];
    e._IndexToUnicodeMap[a] === void 0 ? e._IndexToUnicodeMap[a] = { unicodes: [parseInt(i)] } : e._IndexToUnicodeMap[a].unicodes.push(parseInt(i));
  }
}
__name(pp, "pp");
function dp(e, t) {
  t.lowMemory ? pp(e) : hp(e);
}
__name(dp, "dp");
function tl(e) {
  throw new Error(e);
}
__name(tl, "tl");
function ys(e, t) {
  e || tl(t);
}
__name(ys, "ys");
var Ae = { fail: tl, argument: ys, assert: ys };
function vp(e, t) {
  var r = t || new at();
  return { configurable: true, get: /* @__PURE__ */ __name(function() {
    return typeof r == "function" && (r = r()), r;
  }, "get"), set: /* @__PURE__ */ __name(function(n) {
    r = n;
  }, "set") };
}
__name(vp, "vp");
function Jt(e) {
  this.bindConstructorValues(e);
}
__name(Jt, "Jt");
Jt.prototype.bindConstructorValues = function(e) {
  this.index = e.index || 0, this.name = e.name || null, this.unicode = e.unicode || void 0, this.unicodes = e.unicodes || e.unicode !== void 0 ? [e.unicode] : [], "xMin" in e && (this.xMin = e.xMin), "yMin" in e && (this.yMin = e.yMin), "xMax" in e && (this.xMax = e.xMax), "yMax" in e && (this.yMax = e.yMax), "advanceWidth" in e && (this.advanceWidth = e.advanceWidth), Object.defineProperty(this, "path", vp(this, e.path));
};
Jt.prototype.addUnicode = function(e) {
  this.unicodes.length === 0 && (this.unicode = e), this.unicodes.push(e);
};
Jt.prototype.getPath = function(e, t, r, n, i) {
  e = e !== void 0 ? e : 0, t = t !== void 0 ? t : 0, r = r !== void 0 ? r : 72;
  var a, o;
  n || (n = {});
  var l = n.xScale, s = n.yScale;
  if (n.hinting && i && i.hinting && (o = this.path && i.hinting.exec(this, r)), o) a = i.hinting.getCommands(o), e = Math.round(e), t = Math.round(t), l = s = 1;
  else {
    a = this.path.commands;
    var u = 1 / (this.path.unitsPerEm || 1e3) * r;
    l === void 0 && (l = u), s === void 0 && (s = u);
  }
  for (var f = new at(), c = 0; c < a.length; c += 1) {
    var h = a[c];
    h.type === "M" ? f.moveTo(e + h.x * l, t + -h.y * s) : h.type === "L" ? f.lineTo(e + h.x * l, t + -h.y * s) : h.type === "Q" ? f.quadraticCurveTo(e + h.x1 * l, t + -h.y1 * s, e + h.x * l, t + -h.y * s) : h.type === "C" ? f.curveTo(e + h.x1 * l, t + -h.y1 * s, e + h.x2 * l, t + -h.y2 * s, e + h.x * l, t + -h.y * s) : h.type === "Z" && f.closePath();
  }
  return f;
};
Jt.prototype.getContours = function() {
  if (this.points === void 0) return [];
  for (var e = [], t = [], r = 0; r < this.points.length; r += 1) {
    var n = this.points[r];
    t.push(n), n.lastPointOfContour && (e.push(t), t = []);
  }
  return Ae.argument(t.length === 0, "There are still points left in the current contour."), e;
};
Jt.prototype.getMetrics = function() {
  for (var e = this.path.commands, t = [], r = [], n = 0; n < e.length; n += 1) {
    var i = e[n];
    i.type !== "Z" && (t.push(i.x), r.push(i.y)), (i.type === "Q" || i.type === "C") && (t.push(i.x1), r.push(i.y1)), i.type === "C" && (t.push(i.x2), r.push(i.y2));
  }
  var a = { xMin: Math.min.apply(null, t), yMin: Math.min.apply(null, r), xMax: Math.max.apply(null, t), yMax: Math.max.apply(null, r), leftSideBearing: this.leftSideBearing };
  return isFinite(a.xMin) || (a.xMin = 0), isFinite(a.xMax) || (a.xMax = this.advanceWidth), isFinite(a.yMin) || (a.yMin = 0), isFinite(a.yMax) || (a.yMax = 0), a.rightSideBearing = this.advanceWidth - a.leftSideBearing - (a.xMax - a.xMin), a;
};
function _n(e, t, r) {
  Object.defineProperty(e, t, { get: /* @__PURE__ */ __name(function() {
    return e.path, e[r];
  }, "get"), set: /* @__PURE__ */ __name(function(n) {
    e[r] = n;
  }, "set"), enumerable: true, configurable: true });
}
__name(_n, "_n");
function la(e, t) {
  if (this.font = e, this.glyphs = {}, Array.isArray(t)) for (var r = 0; r < t.length; r++) {
    var n = t[r];
    n.path.unitsPerEm = e.unitsPerEm, this.glyphs[r] = n;
  }
  this.length = t && t.length || 0;
}
__name(la, "la");
la.prototype.get = function(e) {
  if (this.glyphs[e] === void 0) {
    this.font._push(e), typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
    var t = this.glyphs[e], r = this.font._IndexToUnicodeMap[e];
    if (r) for (var n = 0; n < r.unicodes.length; n++) t.addUnicode(r.unicodes[n]);
    this.glyphs[e].advanceWidth = this.font._hmtxTableData[e].advanceWidth, this.glyphs[e].leftSideBearing = this.font._hmtxTableData[e].leftSideBearing;
  } else typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
  return this.glyphs[e];
};
la.prototype.push = function(e, t) {
  this.glyphs[e] = t, this.length++;
};
function gp(e, t) {
  return new Jt({ index: t, font: e });
}
__name(gp, "gp");
function mp(e, t, r, n, i, a) {
  return function() {
    var o = new Jt({ index: t, font: e });
    return o.path = function() {
      r(o, n, i);
      var l = a(e.glyphs, o);
      return l.unitsPerEm = e.unitsPerEm, l;
    }, _n(o, "xMin", "_xMin"), _n(o, "xMax", "_xMax"), _n(o, "yMin", "_yMin"), _n(o, "yMax", "_yMax"), o;
  };
}
__name(mp, "mp");
function bp(e, t, r, n) {
  return function() {
    var i = new Jt({ index: t, font: e });
    return i.path = function() {
      var a = r(e, i, n);
      return a.unitsPerEm = e.unitsPerEm, a;
    }, i;
  };
}
__name(bp, "bp");
var jt = { GlyphSet: la, glyphLoader: gp, ttfGlyphLoader: mp, cffGlyphLoader: bp };
function Qi(e, t) {
  for (var r = 0, n = e.length - 1; r <= n; ) {
    var i = r + n >>> 1, a = e[i].tag;
    if (a === t) return i;
    a < t ? r = i + 1 : n = i - 1;
  }
  return -r - 1;
}
__name(Qi, "Qi");
function xs(e, t) {
  for (var r = 0, n = e.length - 1; r <= n; ) {
    var i = r + n >>> 1, a = e[i];
    if (a === t) return i;
    a < t ? r = i + 1 : n = i - 1;
  }
  return -r - 1;
}
__name(xs, "xs");
function ws(e, t) {
  for (var r, n = 0, i = e.length - 1; n <= i; ) {
    var a = n + i >>> 1;
    r = e[a];
    var o = r.start;
    if (o === t) return r;
    o < t ? n = a + 1 : i = a - 1;
  }
  if (n > 0) return r = e[n - 1], t > r.end ? 0 : r;
}
__name(ws, "ws");
function Vr(e, t) {
  this.font = e, this.tableName = t;
}
__name(Vr, "Vr");
Vr.prototype = { searchTag: Qi, binSearch: xs, getTable: /* @__PURE__ */ __name(function(e) {
  var t = this.font.tables[this.tableName];
  return !t && e && (t = this.font.tables[this.tableName] = this.createDefaultTable()), t;
}, "getTable"), getDefaultScriptName: /* @__PURE__ */ __name(function() {
  var e = this.getTable();
  if (e) {
    for (var t = false, r = 0; r < e.scripts.length; r++) {
      var n = e.scripts[r].tag;
      if (n === "DFLT") return n;
      n === "latn" && (t = true);
    }
    if (t) return "latn";
  }
}, "getDefaultScriptName"), getScriptTable: /* @__PURE__ */ __name(function(e, t) {
  var r = this.getTable(t);
  if (r) {
    e = e || "DFLT";
    var n = r.scripts, i = Qi(r.scripts, e);
    if (i >= 0) return n[i].script;
    if (t) {
      var a = { tag: e, script: { defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }, langSysRecords: [] } };
      return n.splice(-1 - i, 0, a), a.script;
    }
  }
}, "getScriptTable"), getLangSysTable: /* @__PURE__ */ __name(function(e, t, r) {
  var n = this.getScriptTable(e, r);
  if (n) {
    if (!t || t === "dflt" || t === "DFLT") return n.defaultLangSys;
    var i = Qi(n.langSysRecords, t);
    if (i >= 0) return n.langSysRecords[i].langSys;
    if (r) {
      var a = { tag: t, langSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] } };
      return n.langSysRecords.splice(-1 - i, 0, a), a.langSys;
    }
  }
}, "getLangSysTable"), getFeatureTable: /* @__PURE__ */ __name(function(e, t, r, n) {
  var i = this.getLangSysTable(e, t, n);
  if (i) {
    for (var a, o = i.featureIndexes, l = this.font.tables[this.tableName].features, s = 0; s < o.length; s++) if (a = l[o[s]], a.tag === r) return a.feature;
    if (n) {
      var u = l.length;
      return Ae.assert(u === 0 || r >= l[u - 1].tag, "Features must be added in alphabetical order."), a = { tag: r, feature: { params: 0, lookupListIndexes: [] } }, l.push(a), o.push(u), a.feature;
    }
  }
}, "getFeatureTable"), getLookupTables: /* @__PURE__ */ __name(function(e, t, r, n, i) {
  var a = this.getFeatureTable(e, t, r, i), o = [];
  if (a) {
    for (var l, s = a.lookupListIndexes, u = this.font.tables[this.tableName].lookups, f = 0; f < s.length; f++) l = u[s[f]], l.lookupType === n && o.push(l);
    if (o.length === 0 && i) {
      l = { lookupType: n, lookupFlag: 0, subtables: [], markFilteringSet: void 0 };
      var c = u.length;
      return u.push(l), s.push(c), [l];
    }
  }
  return o;
}, "getLookupTables"), getGlyphClass: /* @__PURE__ */ __name(function(e, t) {
  switch (e.format) {
    case 1:
      return e.startGlyph <= t && t < e.startGlyph + e.classes.length ? e.classes[t - e.startGlyph] : 0;
    case 2:
      var r = ws(e.ranges, t);
      return r ? r.classId : 0;
  }
}, "getGlyphClass"), getCoverageIndex: /* @__PURE__ */ __name(function(e, t) {
  switch (e.format) {
    case 1:
      var r = xs(e.glyphs, t);
      return r >= 0 ? r : -1;
    case 2:
      var n = ws(e.ranges, t);
      return n ? n.index + t - n.start : -1;
  }
}, "getCoverageIndex"), expandCoverage: /* @__PURE__ */ __name(function(e) {
  if (e.format === 1) return e.glyphs;
  for (var t = [], r = e.ranges, n = 0; n < r.length; n++) for (var i = r[n], a = i.start, o = i.end, l = a; l <= o; l++) t.push(l);
  return t;
}, "expandCoverage") };
function Hr(e) {
  Vr.call(this, e, "gpos");
}
__name(Hr, "Hr");
Hr.prototype = Vr.prototype;
Hr.prototype.init = function() {
  var e = this.getDefaultScriptName();
  this.defaultKerningTables = this.getKerningTables(e);
};
Hr.prototype.getKerningValue = function(e, t, r) {
  for (var n = 0; n < e.length; n++) for (var i = e[n].subtables, a = 0; a < i.length; a++) {
    var o = i[a], l = this.getCoverageIndex(o.coverage, t);
    if (!(l < 0)) switch (o.posFormat) {
      case 1:
        for (var s = o.pairSets[l], u = 0; u < s.length; u++) {
          var f = s[u];
          if (f.secondGlyph === r) return f.value1 && f.value1.xAdvance || 0;
        }
        break;
      case 2:
        var c = this.getGlyphClass(o.classDef1, t), h = this.getGlyphClass(o.classDef2, r), p = o.classRecords[c][h];
        return p.value1 && p.value1.xAdvance || 0;
    }
  }
  return 0;
};
Hr.prototype.getKerningTables = function(e, t) {
  if (this.font.tables.gpos) return this.getLookupTables(e, t, "kern", 2);
};
function gt(e) {
  Vr.call(this, e, "gsub");
}
__name(gt, "gt");
function yp(e, t) {
  var r = e.length;
  if (r !== t.length) return false;
  for (var n = 0; n < r; n++) if (e[n] !== t[n]) return false;
  return true;
}
__name(yp, "yp");
function ua(e, t, r) {
  for (var n = e.subtables, i = 0; i < n.length; i++) {
    var a = n[i];
    if (a.substFormat === t) return a;
  }
  if (r) return n.push(r), r;
}
__name(ua, "ua");
gt.prototype = Vr.prototype;
gt.prototype.createDefaultTable = function() {
  return { version: 1, scripts: [{ tag: "DFLT", script: { defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }, langSysRecords: [] } }], features: [], lookups: [] };
};
gt.prototype.getSingle = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 1), a = 0; a < i.length; a++) for (var o = i[a].subtables, l = 0; l < o.length; l++) {
    var s = o[l], u = this.expandCoverage(s.coverage), f = void 0;
    if (s.substFormat === 1) {
      var c = s.deltaGlyphId;
      for (f = 0; f < u.length; f++) {
        var h = u[f];
        n.push({ sub: h, by: h + c });
      }
    } else {
      var p = s.substitute;
      for (f = 0; f < u.length; f++) n.push({ sub: u[f], by: p[f] });
    }
  }
  return n;
};
gt.prototype.getMultiple = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 2), a = 0; a < i.length; a++) for (var o = i[a].subtables, l = 0; l < o.length; l++) {
    var s = o[l], u = this.expandCoverage(s.coverage), f = void 0;
    for (f = 0; f < u.length; f++) {
      var c = u[f], h = s.sequences[f];
      n.push({ sub: c, by: h });
    }
  }
  return n;
};
gt.prototype.getAlternates = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 3), a = 0; a < i.length; a++) for (var o = i[a].subtables, l = 0; l < o.length; l++) for (var s = o[l], u = this.expandCoverage(s.coverage), f = s.alternateSets, c = 0; c < u.length; c++) n.push({ sub: u[c], by: f[c] });
  return n;
};
gt.prototype.getLigatures = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 4), a = 0; a < i.length; a++) for (var o = i[a].subtables, l = 0; l < o.length; l++) for (var s = o[l], u = this.expandCoverage(s.coverage), f = s.ligatureSets, c = 0; c < u.length; c++) for (var h = u[c], p = f[c], m = 0; m < p.length; m++) {
    var v = p[m];
    n.push({ sub: [h].concat(v.components), by: v.ligGlyph });
  }
  return n;
};
gt.prototype.addSingle = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 1, true)[0], a = ua(i, 2, { substFormat: 2, coverage: { format: 1, glyphs: [] }, substitute: [] });
  Ae.assert(a.coverage.format === 1, "Single: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, l = this.binSearch(a.coverage.glyphs, o);
  l < 0 && (l = -1 - l, a.coverage.glyphs.splice(l, 0, o), a.substitute.splice(l, 0, 0)), a.substitute[l] = t.by;
};
gt.prototype.addMultiple = function(e, t, r, n) {
  Ae.assert(t.by instanceof Array && t.by.length > 1, 'Multiple: "by" must be an array of two or more ids');
  var i = this.getLookupTables(r, n, e, 2, true)[0], a = ua(i, 1, { substFormat: 1, coverage: { format: 1, glyphs: [] }, sequences: [] });
  Ae.assert(a.coverage.format === 1, "Multiple: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, l = this.binSearch(a.coverage.glyphs, o);
  l < 0 && (l = -1 - l, a.coverage.glyphs.splice(l, 0, o), a.sequences.splice(l, 0, 0)), a.sequences[l] = t.by;
};
gt.prototype.addAlternate = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 3, true)[0], a = ua(i, 1, { substFormat: 1, coverage: { format: 1, glyphs: [] }, alternateSets: [] });
  Ae.assert(a.coverage.format === 1, "Alternate: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, l = this.binSearch(a.coverage.glyphs, o);
  l < 0 && (l = -1 - l, a.coverage.glyphs.splice(l, 0, o), a.alternateSets.splice(l, 0, 0)), a.alternateSets[l] = t.by;
};
gt.prototype.addLigature = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 4, true)[0], a = i.subtables[0];
  a || (a = { substFormat: 1, coverage: { format: 1, glyphs: [] }, ligatureSets: [] }, i.subtables[0] = a), Ae.assert(a.coverage.format === 1, "Ligature: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub[0], l = t.sub.slice(1), s = { ligGlyph: t.by, components: l }, u = this.binSearch(a.coverage.glyphs, o);
  if (u >= 0) {
    for (var f = a.ligatureSets[u], c = 0; c < f.length; c++) if (yp(f[c].components, l)) return;
    f.push(s);
  } else u = -1 - u, a.coverage.glyphs.splice(u, 0, o), a.ligatureSets.splice(u, 0, [s]);
};
gt.prototype.getFeature = function(e, t, r) {
  if (/ss\d\d/.test(e)) return this.getSingle(e, t, r);
  switch (e) {
    case "aalt":
    case "salt":
      return this.getSingle(e, t, r).concat(this.getAlternates(e, t, r));
    case "dlig":
    case "liga":
    case "rlig":
      return this.getLigatures(e, t, r);
    case "ccmp":
      return this.getMultiple(e, t, r).concat(this.getLigatures(e, t, r));
    case "stch":
      return this.getMultiple(e, t, r);
  }
};
gt.prototype.add = function(e, t, r, n) {
  if (/ss\d\d/.test(e)) return this.addSingle(e, t, r, n);
  switch (e) {
    case "aalt":
    case "salt":
      return typeof t.by == "number" ? this.addSingle(e, t, r, n) : this.addAlternate(e, t, r, n);
    case "dlig":
    case "liga":
    case "rlig":
      return this.addLigature(e, t, r, n);
    case "ccmp":
      return t.by instanceof Array ? this.addMultiple(e, t, r, n) : this.addLigature(e, t, r, n);
  }
};
function Br(e, t) {
  if (!e) throw t;
}
__name(Br, "Br");
function Ss(e, t) {
  return e.getUint8(t);
}
__name(Ss, "Ss");
function An(e, t) {
  return e.getUint16(t, false);
}
__name(An, "An");
function xp(e, t) {
  return e.getInt16(t, false);
}
__name(xp, "xp");
function fa(e, t) {
  return e.getUint32(t, false);
}
__name(fa, "fa");
function rl(e, t) {
  var r = e.getInt16(t, false), n = e.getUint16(t + 2, false);
  return r + n / 65535;
}
__name(rl, "rl");
function wp(e, t) {
  for (var r = "", n = t; n < t + 4; n += 1) r += String.fromCharCode(e.getInt8(n));
  return r;
}
__name(wp, "wp");
function Sp(e, t, r) {
  for (var n = 0, i = 0; i < r; i += 1) n <<= 8, n += e.getUint8(t + i);
  return n;
}
__name(Sp, "Sp");
function Ep(e, t, r) {
  for (var n = [], i = t; i < r; i += 1) n.push(e.getUint8(i));
  return n;
}
__name(Ep, "Ep");
function kp(e) {
  for (var t = "", r = 0; r < e.length; r += 1) t += String.fromCharCode(e[r]);
  return t;
}
__name(kp, "kp");
var Tp = { byte: 1, uShort: 2, short: 2, uLong: 4, fixed: 4, longDateTime: 8, tag: 4 };
function W(e, t) {
  this.data = e, this.offset = t, this.relativeOffset = 0;
}
__name(W, "W");
W.prototype.parseByte = function() {
  var e = this.data.getUint8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
W.prototype.parseChar = function() {
  var e = this.data.getInt8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
W.prototype.parseCard8 = W.prototype.parseByte;
W.prototype.parseUShort = function() {
  var e = this.data.getUint16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
W.prototype.parseCard16 = W.prototype.parseUShort;
W.prototype.parseSID = W.prototype.parseUShort;
W.prototype.parseOffset16 = W.prototype.parseUShort;
W.prototype.parseShort = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
W.prototype.parseF2Dot14 = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
  return this.relativeOffset += 2, e;
};
W.prototype.parseULong = function() {
  var e = fa(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
W.prototype.parseOffset32 = W.prototype.parseULong;
W.prototype.parseFixed = function() {
  var e = rl(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
W.prototype.parseString = function(e) {
  var t = this.data, r = this.offset + this.relativeOffset, n = "";
  this.relativeOffset += e;
  for (var i = 0; i < e; i++) n += String.fromCharCode(t.getUint8(r + i));
  return n;
};
W.prototype.parseTag = function() {
  return this.parseString(4);
};
W.prototype.parseLongDateTime = function() {
  var e = fa(this.data, this.offset + this.relativeOffset + 4);
  return e -= 2082844800, this.relativeOffset += 8, e;
};
W.prototype.parseVersion = function(e) {
  var t = An(this.data, this.offset + this.relativeOffset), r = An(this.data, this.offset + this.relativeOffset + 2);
  return this.relativeOffset += 4, e === void 0 && (e = 4096), t + r / e / 10;
};
W.prototype.skip = function(e, t) {
  t === void 0 && (t = 1), this.relativeOffset += Tp[e] * t;
};
W.prototype.parseULongList = function(e) {
  e === void 0 && (e = this.parseULong());
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++) t[i] = r.getUint32(n), n += 4;
  return this.relativeOffset += e * 4, t;
};
W.prototype.parseOffset16List = W.prototype.parseUShortList = function(e) {
  e === void 0 && (e = this.parseUShort());
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++) t[i] = r.getUint16(n), n += 2;
  return this.relativeOffset += e * 2, t;
};
W.prototype.parseShortList = function(e) {
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++) t[i] = r.getInt16(n), n += 2;
  return this.relativeOffset += e * 2, t;
};
W.prototype.parseByteList = function(e) {
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++) t[i] = r.getUint8(n++);
  return this.relativeOffset += e, t;
};
W.prototype.parseList = function(e, t) {
  t || (t = e, e = this.parseUShort());
  for (var r = new Array(e), n = 0; n < e; n++) r[n] = t.call(this);
  return r;
};
W.prototype.parseList32 = function(e, t) {
  t || (t = e, e = this.parseULong());
  for (var r = new Array(e), n = 0; n < e; n++) r[n] = t.call(this);
  return r;
};
W.prototype.parseRecordList = function(e, t) {
  t || (t = e, e = this.parseUShort());
  for (var r = new Array(e), n = Object.keys(t), i = 0; i < e; i++) {
    for (var a = {}, o = 0; o < n.length; o++) {
      var l = n[o], s = t[l];
      a[l] = s.call(this);
    }
    r[i] = a;
  }
  return r;
};
W.prototype.parseRecordList32 = function(e, t) {
  t || (t = e, e = this.parseULong());
  for (var r = new Array(e), n = Object.keys(t), i = 0; i < e; i++) {
    for (var a = {}, o = 0; o < n.length; o++) {
      var l = n[o], s = t[l];
      a[l] = s.call(this);
    }
    r[i] = a;
  }
  return r;
};
W.prototype.parseStruct = function(e) {
  if (typeof e == "function") return e.call(this);
  for (var t = Object.keys(e), r = {}, n = 0; n < t.length; n++) {
    var i = t[n], a = e[i];
    r[i] = a.call(this);
  }
  return r;
};
W.prototype.parseValueRecord = function(e) {
  if (e === void 0 && (e = this.parseUShort()), e !== 0) {
    var t = {};
    return e & 1 && (t.xPlacement = this.parseShort()), e & 2 && (t.yPlacement = this.parseShort()), e & 4 && (t.xAdvance = this.parseShort()), e & 8 && (t.yAdvance = this.parseShort()), e & 16 && (t.xPlaDevice = void 0, this.parseShort()), e & 32 && (t.yPlaDevice = void 0, this.parseShort()), e & 64 && (t.xAdvDevice = void 0, this.parseShort()), e & 128 && (t.yAdvDevice = void 0, this.parseShort()), t;
  }
};
W.prototype.parseValueRecordList = function() {
  for (var e = this.parseUShort(), t = this.parseUShort(), r = new Array(t), n = 0; n < t; n++) r[n] = this.parseValueRecord(e);
  return r;
};
W.prototype.parsePointer = function(e) {
  var t = this.parseOffset16();
  if (t > 0) return new W(this.data, this.offset + t).parseStruct(e);
};
W.prototype.parsePointer32 = function(e) {
  var t = this.parseOffset32();
  if (t > 0) return new W(this.data, this.offset + t).parseStruct(e);
};
W.prototype.parseListOfLists = function(e) {
  for (var t = this.parseOffset16List(), r = t.length, n = this.relativeOffset, i = new Array(r), a = 0; a < r; a++) {
    var o = t[a];
    if (o === 0) {
      i[a] = void 0;
      continue;
    }
    if (this.relativeOffset = o, e) {
      for (var l = this.parseOffset16List(), s = new Array(l.length), u = 0; u < l.length; u++) this.relativeOffset = o + l[u], s[u] = e.call(this);
      i[a] = s;
    } else i[a] = this.parseUShortList();
  }
  return this.relativeOffset = n, i;
};
W.prototype.parseCoverage = function() {
  var e = this.offset + this.relativeOffset, t = this.parseUShort(), r = this.parseUShort();
  if (t === 1) return { format: 1, glyphs: this.parseUShortList(r) };
  if (t === 2) {
    for (var n = new Array(r), i = 0; i < r; i++) n[i] = { start: this.parseUShort(), end: this.parseUShort(), index: this.parseUShort() };
    return { format: 2, ranges: n };
  }
  throw new Error("0x" + e.toString(16) + ": Coverage format must be 1 or 2.");
};
W.prototype.parseClassDef = function() {
  var e = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1) return { format: 1, startGlyph: this.parseUShort(), classes: this.parseUShortList() };
  if (t === 2) return { format: 2, ranges: this.parseRecordList({ start: W.uShort, end: W.uShort, classId: W.uShort }) };
  throw new Error("0x" + e.toString(16) + ": ClassDef format must be 1 or 2.");
};
W.list = function(e, t) {
  return function() {
    return this.parseList(e, t);
  };
};
W.list32 = function(e, t) {
  return function() {
    return this.parseList32(e, t);
  };
};
W.recordList = function(e, t) {
  return function() {
    return this.parseRecordList(e, t);
  };
};
W.recordList32 = function(e, t) {
  return function() {
    return this.parseRecordList32(e, t);
  };
};
W.pointer = function(e) {
  return function() {
    return this.parsePointer(e);
  };
};
W.pointer32 = function(e) {
  return function() {
    return this.parsePointer32(e);
  };
};
W.tag = W.prototype.parseTag;
W.byte = W.prototype.parseByte;
W.uShort = W.offset16 = W.prototype.parseUShort;
W.uShortList = W.prototype.parseUShortList;
W.uLong = W.offset32 = W.prototype.parseULong;
W.uLongList = W.prototype.parseULongList;
W.struct = W.prototype.parseStruct;
W.coverage = W.prototype.parseCoverage;
W.classDef = W.prototype.parseClassDef;
var Es = { reserved: W.uShort, reqFeatureIndex: W.uShort, featureIndexes: W.uShortList };
W.prototype.parseScriptList = function() {
  return this.parsePointer(W.recordList({ tag: W.tag, script: W.pointer({ defaultLangSys: W.pointer(Es), langSysRecords: W.recordList({ tag: W.tag, langSys: W.pointer(Es) }) }) })) || [];
};
W.prototype.parseFeatureList = function() {
  return this.parsePointer(W.recordList({ tag: W.tag, feature: W.pointer({ featureParams: W.offset16, lookupListIndexes: W.uShortList }) })) || [];
};
W.prototype.parseLookupList = function(e) {
  return this.parsePointer(W.list(W.pointer(function() {
    var t = this.parseUShort();
    Ae.argument(1 <= t && t <= 9, "GPOS/GSUB lookup type " + t + " unknown.");
    var r = this.parseUShort(), n = r & 16;
    return { lookupType: t, lookupFlag: r, subtables: this.parseList(W.pointer(e[t])), markFilteringSet: n ? this.parseUShort() : void 0 };
  }))) || [];
};
W.prototype.parseFeatureVariationsList = function() {
  return this.parsePointer32(function() {
    var e = this.parseUShort(), t = this.parseUShort();
    Ae.argument(e === 1 && t < 1, "GPOS/GSUB feature variations table unknown.");
    var r = this.parseRecordList32({ conditionSetOffset: W.offset32, featureTableSubstitutionOffset: W.offset32 });
    return r;
  }) || [];
};
var se = { getByte: Ss, getCard8: Ss, getUShort: An, getCard16: An, getShort: xp, getULong: fa, getFixed: rl, getTag: wp, getOffset: Sp, getBytes: Ep, bytesToString: kp, Parser: W };
function ks(e, t, r, n, i) {
  var a;
  return (t & n) > 0 ? (a = e.parseByte(), t & i || (a = -a), a = r + a) : (t & i) > 0 ? a = r : a = r + e.parseShort(), a;
}
__name(ks, "ks");
function nl(e, t, r) {
  var n = new se.Parser(t, r);
  e.numberOfContours = n.parseShort(), e._xMin = n.parseShort(), e._yMin = n.parseShort(), e._xMax = n.parseShort(), e._yMax = n.parseShort();
  var i, a;
  if (e.numberOfContours > 0) {
    for (var o = e.endPointIndices = [], l = 0; l < e.numberOfContours; l += 1) o.push(n.parseUShort());
    e.instructionLength = n.parseUShort(), e.instructions = [];
    for (var s = 0; s < e.instructionLength; s += 1) e.instructions.push(n.parseByte());
    var u = o[o.length - 1] + 1;
    i = [];
    for (var f = 0; f < u; f += 1) if (a = n.parseByte(), i.push(a), (a & 8) > 0) for (var c = n.parseByte(), h = 0; h < c; h += 1) i.push(a), f += 1;
    if (Ae.argument(i.length === u, "Bad flags."), o.length > 0) {
      var p = [], m;
      if (u > 0) {
        for (var v = 0; v < u; v += 1) a = i[v], m = {}, m.onCurve = !!(a & 1), m.lastPointOfContour = o.indexOf(v) >= 0, p.push(m);
        for (var g = 0, y = 0; y < u; y += 1) a = i[y], m = p[y], m.x = ks(n, a, g, 2, 16), g = m.x;
        for (var x = 0, _ = 0; _ < u; _ += 1) a = i[_], m = p[_], m.y = ks(n, a, x, 4, 32), x = m.y;
      }
      e.points = p;
    } else e.points = [];
  } else if (e.numberOfContours === 0) e.points = [];
  else {
    e.isComposite = true, e.points = [], e.components = [];
    for (var L = true; L; ) {
      i = n.parseUShort();
      var T = { glyphIndex: n.parseUShort(), xScale: 1, scale01: 0, scale10: 0, yScale: 1, dx: 0, dy: 0 };
      (i & 1) > 0 ? (i & 2) > 0 ? (T.dx = n.parseShort(), T.dy = n.parseShort()) : T.matchedPoints = [n.parseUShort(), n.parseUShort()] : (i & 2) > 0 ? (T.dx = n.parseChar(), T.dy = n.parseChar()) : T.matchedPoints = [n.parseByte(), n.parseByte()], (i & 8) > 0 ? T.xScale = T.yScale = n.parseF2Dot14() : (i & 64) > 0 ? (T.xScale = n.parseF2Dot14(), T.yScale = n.parseF2Dot14()) : (i & 128) > 0 && (T.xScale = n.parseF2Dot14(), T.scale01 = n.parseF2Dot14(), T.scale10 = n.parseF2Dot14(), T.yScale = n.parseF2Dot14()), e.components.push(T), L = !!(i & 32);
    }
    if (i & 256) {
      e.instructionLength = n.parseUShort(), e.instructions = [];
      for (var E = 0; E < e.instructionLength; E += 1) e.instructions.push(n.parseByte());
    }
  }
}
__name(nl, "nl");
function Ki(e, t) {
  for (var r = [], n = 0; n < e.length; n += 1) {
    var i = e[n], a = { x: t.xScale * i.x + t.scale01 * i.y + t.dx, y: t.scale10 * i.x + t.yScale * i.y + t.dy, onCurve: i.onCurve, lastPointOfContour: i.lastPointOfContour };
    r.push(a);
  }
  return r;
}
__name(Ki, "Ki");
function _p(e) {
  for (var t = [], r = [], n = 0; n < e.length; n += 1) {
    var i = e[n];
    r.push(i), i.lastPointOfContour && (t.push(r), r = []);
  }
  return Ae.argument(r.length === 0, "There are still points left in the current contour."), t;
}
__name(_p, "_p");
function il(e) {
  var t = new at();
  if (!e) return t;
  for (var r = _p(e), n = 0; n < r.length; ++n) {
    var i = r[n], a = null, o = i[i.length - 1], l = i[0];
    if (o.onCurve) t.moveTo(o.x, o.y);
    else if (l.onCurve) t.moveTo(l.x, l.y);
    else {
      var s = { x: (o.x + l.x) * 0.5, y: (o.y + l.y) * 0.5 };
      t.moveTo(s.x, s.y);
    }
    for (var u = 0; u < i.length; ++u) if (a = o, o = l, l = i[(u + 1) % i.length], o.onCurve) t.lineTo(o.x, o.y);
    else {
      var f = a, c = l;
      a.onCurve || (f = { x: (o.x + a.x) * 0.5, y: (o.y + a.y) * 0.5 }), l.onCurve || (c = { x: (o.x + l.x) * 0.5, y: (o.y + l.y) * 0.5 }), t.quadraticCurveTo(o.x, o.y, c.x, c.y);
    }
    t.closePath();
  }
  return t;
}
__name(il, "il");
function al(e, t) {
  if (t.isComposite) for (var r = 0; r < t.components.length; r += 1) {
    var n = t.components[r], i = e.get(n.glyphIndex);
    if (i.getPath(), i.points) {
      var a = void 0;
      if (n.matchedPoints === void 0) a = Ki(i.points, n);
      else {
        if (n.matchedPoints[0] > t.points.length - 1 || n.matchedPoints[1] > i.points.length - 1) throw Error("Matched points out of range in " + t.name);
        var o = t.points[n.matchedPoints[0]], l = i.points[n.matchedPoints[1]], s = { xScale: n.xScale, scale01: n.scale01, scale10: n.scale10, yScale: n.yScale, dx: 0, dy: 0 };
        l = Ki([l], s)[0], s.dx = o.x - l.x, s.dy = o.y - l.y, a = Ki(i.points, s);
      }
      t.points = t.points.concat(a);
    }
  }
  return il(t.points);
}
__name(al, "al");
function Lp(e, t, r, n) {
  for (var i = new jt.GlyphSet(n), a = 0; a < r.length - 1; a += 1) {
    var o = r[a], l = r[a + 1];
    o !== l ? i.push(a, jt.ttfGlyphLoader(n, a, nl, e, t + o, al)) : i.push(a, jt.glyphLoader(n, a));
  }
  return i;
}
__name(Lp, "Lp");
function Cp(e, t, r, n) {
  var i = new jt.GlyphSet(n);
  return n._push = function(a) {
    var o = r[a], l = r[a + 1];
    o !== l ? i.push(a, jt.ttfGlyphLoader(n, a, nl, e, t + o, al)) : i.push(a, jt.glyphLoader(n, a));
  }, i;
}
__name(Cp, "Cp");
function Op(e, t, r, n, i) {
  return i.lowMemory ? Cp(e, t, r, n) : Lp(e, t, r, n);
}
__name(Op, "Op");
var ol = { getPath: il, parse: Op };
var sl;
var xr;
var ll;
var oa;
function ul(e) {
  this.font = e, this.getCommands = function(t) {
    return ol.getPath(t).commands;
  }, this._fpgmState = this._prepState = void 0, this._errorState = 0;
}
__name(ul, "ul");
function Ap(e) {
  return e;
}
__name(Ap, "Ap");
function fl(e) {
  return Math.sign(e) * Math.round(Math.abs(e));
}
__name(fl, "fl");
function Pp(e) {
  return Math.sign(e) * Math.round(Math.abs(e * 2)) / 2;
}
__name(Pp, "Pp");
function Ip(e) {
  return Math.sign(e) * (Math.round(Math.abs(e) + 0.5) - 0.5);
}
__name(Ip, "Ip");
function Rp(e) {
  return Math.sign(e) * Math.ceil(Math.abs(e));
}
__name(Rp, "Rp");
function Fp(e) {
  return Math.sign(e) * Math.floor(Math.abs(e));
}
__name(Fp, "Fp");
var cl = /* @__PURE__ */ __name(function(e) {
  var t = this.srPeriod, r = this.srPhase, n = this.srThreshold, i = 1;
  return e < 0 && (e = -e, i = -1), e += n - r, e = Math.trunc(e / t) * t, e += r, e < 0 ? r * i : e * i;
}, "cl");
var $t = { x: 1, y: 0, axis: "x", distance: /* @__PURE__ */ __name(function(e, t, r, n) {
  return (r ? e.xo : e.x) - (n ? t.xo : t.x);
}, "distance"), interpolate: /* @__PURE__ */ __name(function(e, t, r, n) {
  var i, a, o, l, s, u, f;
  if (!n || n === this) {
    if (i = e.xo - t.xo, a = e.xo - r.xo, s = t.x - t.xo, u = r.x - r.xo, o = Math.abs(i), l = Math.abs(a), f = o + l, f === 0) {
      e.x = e.xo + (s + u) / 2;
      return;
    }
    e.x = e.xo + (s * l + u * o) / f;
    return;
  }
  if (i = n.distance(e, t, true, true), a = n.distance(e, r, true, true), s = n.distance(t, t, false, true), u = n.distance(r, r, false, true), o = Math.abs(i), l = Math.abs(a), f = o + l, f === 0) {
    $t.setRelative(e, e, (s + u) / 2, n, true);
    return;
  }
  $t.setRelative(e, e, (s * l + u * o) / f, n, true);
}, "interpolate"), normalSlope: Number.NEGATIVE_INFINITY, setRelative: /* @__PURE__ */ __name(function(e, t, r, n, i) {
  if (!n || n === this) {
    e.x = (i ? t.xo : t.x) + r;
    return;
  }
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, l = a + r * n.x, s = o + r * n.y;
  e.x = l + (e.y - s) / n.normalSlope;
}, "setRelative"), slope: 0, touch: /* @__PURE__ */ __name(function(e) {
  e.xTouched = true;
}, "touch"), touched: /* @__PURE__ */ __name(function(e) {
  return e.xTouched;
}, "touched"), untouch: /* @__PURE__ */ __name(function(e) {
  e.xTouched = false;
}, "untouch") };
var Yt = { x: 0, y: 1, axis: "y", distance: /* @__PURE__ */ __name(function(e, t, r, n) {
  return (r ? e.yo : e.y) - (n ? t.yo : t.y);
}, "distance"), interpolate: /* @__PURE__ */ __name(function(e, t, r, n) {
  var i, a, o, l, s, u, f;
  if (!n || n === this) {
    if (i = e.yo - t.yo, a = e.yo - r.yo, s = t.y - t.yo, u = r.y - r.yo, o = Math.abs(i), l = Math.abs(a), f = o + l, f === 0) {
      e.y = e.yo + (s + u) / 2;
      return;
    }
    e.y = e.yo + (s * l + u * o) / f;
    return;
  }
  if (i = n.distance(e, t, true, true), a = n.distance(e, r, true, true), s = n.distance(t, t, false, true), u = n.distance(r, r, false, true), o = Math.abs(i), l = Math.abs(a), f = o + l, f === 0) {
    Yt.setRelative(e, e, (s + u) / 2, n, true);
    return;
  }
  Yt.setRelative(e, e, (s * l + u * o) / f, n, true);
}, "interpolate"), normalSlope: 0, setRelative: /* @__PURE__ */ __name(function(e, t, r, n, i) {
  if (!n || n === this) {
    e.y = (i ? t.yo : t.y) + r;
    return;
  }
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, l = a + r * n.x, s = o + r * n.y;
  e.y = s + n.normalSlope * (e.x - l);
}, "setRelative"), slope: Number.POSITIVE_INFINITY, touch: /* @__PURE__ */ __name(function(e) {
  e.yTouched = true;
}, "touch"), touched: /* @__PURE__ */ __name(function(e) {
  return e.yTouched;
}, "touched"), untouch: /* @__PURE__ */ __name(function(e) {
  e.yTouched = false;
}, "untouch") };
Object.freeze($t);
Object.freeze(Yt);
function qr(e, t) {
  this.x = e, this.y = t, this.axis = void 0, this.slope = t / e, this.normalSlope = -e / t, Object.freeze(this);
}
__name(qr, "qr");
qr.prototype.distance = function(e, t, r, n) {
  return this.x * $t.distance(e, t, r, n) + this.y * Yt.distance(e, t, r, n);
};
qr.prototype.interpolate = function(e, t, r, n) {
  var i, a, o, l, s, u, f;
  if (o = n.distance(e, t, true, true), l = n.distance(e, r, true, true), i = n.distance(t, t, false, true), a = n.distance(r, r, false, true), s = Math.abs(o), u = Math.abs(l), f = s + u, f === 0) {
    this.setRelative(e, e, (i + a) / 2, n, true);
    return;
  }
  this.setRelative(e, e, (i * u + a * s) / f, n, true);
};
qr.prototype.setRelative = function(e, t, r, n, i) {
  n = n || this;
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, l = a + r * n.x, s = o + r * n.y, u = n.normalSlope, f = this.slope, c = e.x, h = e.y;
  e.x = (f * c - u * l + s - h) / (f - u), e.y = f * (e.x - c) + h;
};
qr.prototype.touch = function(e) {
  e.xTouched = true, e.yTouched = true;
};
function Xr(e, t) {
  var r = Math.sqrt(e * e + t * t);
  return e /= r, t /= r, e === 1 && t === 0 ? $t : e === 0 && t === 1 ? Yt : new qr(e, t);
}
__name(Xr, "Xr");
function Zt(e, t, r, n) {
  this.x = this.xo = Math.round(e * 64) / 64, this.y = this.yo = Math.round(t * 64) / 64, this.lastPointOfContour = r, this.onCurve = n, this.prevPointOnContour = void 0, this.nextPointOnContour = void 0, this.xTouched = false, this.yTouched = false, Object.preventExtensions(this);
}
__name(Zt, "Zt");
Zt.prototype.nextTouched = function(e) {
  for (var t = this.nextPointOnContour; !e.touched(t) && t !== this; ) t = t.nextPointOnContour;
  return t;
};
Zt.prototype.prevTouched = function(e) {
  for (var t = this.prevPointOnContour; !e.touched(t) && t !== this; ) t = t.prevPointOnContour;
  return t;
};
var jr = Object.freeze(new Zt(0, 0));
var Dp = { cvCutIn: 17 / 16, deltaBase: 9, deltaShift: 0.125, loop: 1, minDis: 1, autoFlip: true };
function lr(e, t) {
  switch (this.env = e, this.stack = [], this.prog = t, e) {
    case "glyf":
      this.zp0 = this.zp1 = this.zp2 = 1, this.rp0 = this.rp1 = this.rp2 = 0;
    case "prep":
      this.fv = this.pv = this.dpv = $t, this.round = fl;
  }
}
__name(lr, "lr");
ul.prototype.exec = function(e, t) {
  if (typeof t != "number") throw new Error("Point size is not a number!");
  if (!(this._errorState > 2)) {
    var r = this.font, n = this._prepState;
    if (!n || n.ppem !== t) {
      var i = this._fpgmState;
      if (!i) {
        lr.prototype = Dp, i = this._fpgmState = new lr("fpgm", r.tables.fpgm), i.funcs = [], i.font = r, exports.DEBUG && (console.log("---EXEC FPGM---"), i.step = -1);
        try {
          xr(i);
        } catch (u) {
          console.log("Hinting error in FPGM:" + u), this._errorState = 3;
          return;
        }
      }
      lr.prototype = i, n = this._prepState = new lr("prep", r.tables.prep), n.ppem = t;
      var a = r.tables.cvt;
      if (a) for (var o = n.cvt = new Array(a.length), l = t / r.unitsPerEm, s = 0; s < a.length; s++) o[s] = a[s] * l;
      else n.cvt = [];
      exports.DEBUG && (console.log("---EXEC PREP---"), n.step = -1);
      try {
        xr(n);
      } catch (u) {
        this._errorState < 2 && console.log("Hinting error in PREP:" + u), this._errorState = 2;
      }
    }
    if (!(this._errorState > 1)) try {
      return ll(e, n);
    } catch (u) {
      this._errorState < 1 && (console.log("Hinting error:" + u), console.log("Note: further hinting errors are silenced")), this._errorState = 1;
      return;
    }
  }
};
ll = /* @__PURE__ */ __name(function(e, t) {
  var r = t.ppem / t.font.unitsPerEm, n = r, i = e.components, a, o, l;
  if (lr.prototype = t, !i) l = new lr("glyf", e.instructions), exports.DEBUG && (console.log("---EXEC GLYPH---"), l.step = -1), oa(e, l, r, n), o = l.gZone;
  else {
    var s = t.font;
    o = [], a = [];
    for (var u = 0; u < i.length; u++) {
      var f = i[u], c = s.glyphs.get(f.glyphIndex);
      l = new lr("glyf", c.instructions), exports.DEBUG && (console.log("---EXEC COMP " + u + "---"), l.step = -1), oa(c, l, r, n);
      for (var h = Math.round(f.dx * r), p = Math.round(f.dy * n), m = l.gZone, v = l.contours, g = 0; g < m.length; g++) {
        var y = m[g];
        y.xTouched = y.yTouched = false, y.xo = y.x = y.x + h, y.yo = y.y = y.y + p;
      }
      var x = o.length;
      o.push.apply(o, m);
      for (var _ = 0; _ < v.length; _++) a.push(v[_] + x);
    }
    e.instructions && !l.inhibitGridFit && (l = new lr("glyf", e.instructions), l.gZone = l.z0 = l.z1 = l.z2 = o, l.contours = a, o.push(new Zt(0, 0), new Zt(Math.round(e.advanceWidth * r), 0)), exports.DEBUG && (console.log("---EXEC COMPOSITE---"), l.step = -1), xr(l), o.length -= 2);
  }
  return o;
}, "ll");
oa = /* @__PURE__ */ __name(function(e, t, r, n) {
  for (var i = e.points || [], a = i.length, o = t.gZone = t.z0 = t.z1 = t.z2 = [], l = t.contours = [], s, u = 0; u < a; u++) s = i[u], o[u] = new Zt(s.x * r, s.y * n, s.lastPointOfContour, s.onCurve);
  for (var f, c, h = 0; h < a; h++) s = o[h], f || (f = s, l.push(h)), s.lastPointOfContour ? (s.nextPointOnContour = f, f.prevPointOnContour = s, f = void 0) : (c = o[h + 1], s.nextPointOnContour = c, c.prevPointOnContour = s);
  if (!t.inhibitGridFit) {
    if (exports.DEBUG) {
      console.log("PROCESSING GLYPH", t.stack);
      for (var p = 0; p < a; p++) console.log(p, o[p].x, o[p].y);
    }
    if (o.push(new Zt(0, 0), new Zt(Math.round(e.advanceWidth * r), 0)), xr(t), o.length -= 2, exports.DEBUG) {
      console.log("FINISHED GLYPH", t.stack);
      for (var m = 0; m < a; m++) console.log(m, o[m].x, o[m].y);
    }
  }
}, "oa");
xr = /* @__PURE__ */ __name(function(e) {
  var t = e.prog;
  if (t) {
    var r = t.length, n;
    for (e.ip = 0; e.ip < r; e.ip++) {
      if (exports.DEBUG && e.step++, n = sl[t[e.ip]], !n) throw new Error("unknown instruction: 0x" + Number(t[e.ip]).toString(16));
      n(e);
    }
  }
}, "xr");
function Pn(e) {
  for (var t = e.tZone = new Array(e.gZone.length), r = 0; r < t.length; r++) t[r] = new Zt(0, 0);
}
__name(Pn, "Pn");
function hl(e, t) {
  var r = e.prog, n = e.ip, i = 1, a;
  do
    if (a = r[++n], a === 88) i++;
    else if (a === 89) i--;
    else if (a === 64) n += r[n + 1] + 1;
    else if (a === 65) n += 2 * r[n + 1] + 1;
    else if (a >= 176 && a <= 183) n += a - 176 + 1;
    else if (a >= 184 && a <= 191) n += (a - 184 + 1) * 2;
    else if (t && i === 1 && a === 27) break;
  while (i > 0);
  e.ip = n;
}
__name(hl, "hl");
function Ts(e, t) {
  exports.DEBUG && console.log(t.step, "SVTCA[" + e.axis + "]"), t.fv = t.pv = t.dpv = e;
}
__name(Ts, "Ts");
function _s(e, t) {
  exports.DEBUG && console.log(t.step, "SPVTCA[" + e.axis + "]"), t.pv = t.dpv = e;
}
__name(_s, "_s");
function Ls(e, t) {
  exports.DEBUG && console.log(t.step, "SFVTCA[" + e.axis + "]"), t.fv = e;
}
__name(Ls, "Ls");
function Cs(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log("SPVTL[" + e + "]", n, i);
  var l, s;
  e ? (l = a.y - o.y, s = o.x - a.x) : (l = o.x - a.x, s = o.y - a.y), t.pv = t.dpv = Xr(l, s);
}
__name(Cs, "Cs");
function Os(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log("SFVTL[" + e + "]", n, i);
  var l, s;
  e ? (l = a.y - o.y, s = o.x - a.x) : (l = o.x - a.x, s = o.y - a.y), t.fv = Xr(l, s);
}
__name(Os, "Os");
function Up(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", r, n), e.pv = e.dpv = Xr(n, r);
}
__name(Up, "Up");
function Np(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", r, n), e.fv = Xr(n, r);
}
__name(Np, "Np");
function Mp(e) {
  var t = e.stack, r = e.pv;
  exports.DEBUG && console.log(e.step, "GPV[]"), t.push(r.x * 16384), t.push(r.y * 16384);
}
__name(Mp, "Mp");
function Wp(e) {
  var t = e.stack, r = e.fv;
  exports.DEBUG && console.log(e.step, "GFV[]"), t.push(r.x * 16384), t.push(r.y * 16384);
}
__name(Wp, "Wp");
function Bp(e) {
  e.fv = e.pv, exports.DEBUG && console.log(e.step, "SFVTPV[]");
}
__name(Bp, "Bp");
function Gp(e) {
  var t = e.stack, r = t.pop(), n = t.pop(), i = t.pop(), a = t.pop(), o = t.pop(), l = e.z0, s = e.z1, u = l[r], f = l[n], c = s[i], h = s[a], p = e.z2[o];
  exports.DEBUG && console.log("ISECT[], ", r, n, i, a, o);
  var m = u.x, v = u.y, g = f.x, y = f.y, x = c.x, _ = c.y, L = h.x, T = h.y, E = (m - g) * (_ - T) - (v - y) * (x - L), R = m * y - v * g, C = x * T - _ * L;
  p.x = (R * (x - L) - C * (m - g)) / E, p.y = (R * (_ - T) - C * (v - y)) / E;
}
__name(Gp, "Gp");
function $p(e) {
  e.rp0 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP0[]", e.rp0);
}
__name($p, "$p");
function jp(e) {
  e.rp1 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP1[]", e.rp1);
}
__name(jp, "jp");
function zp(e) {
  e.rp2 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP2[]", e.rp2);
}
__name(zp, "zp");
function Vp(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP0[]", t), e.zp0 = t, t) {
    case 0:
      e.tZone || Pn(e), e.z0 = e.tZone;
      break;
    case 1:
      e.z0 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Vp, "Vp");
function Hp(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP1[]", t), e.zp1 = t, t) {
    case 0:
      e.tZone || Pn(e), e.z1 = e.tZone;
      break;
    case 1:
      e.z1 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Hp, "Hp");
function qp(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP2[]", t), e.zp2 = t, t) {
    case 0:
      e.tZone || Pn(e), e.z2 = e.tZone;
      break;
    case 1:
      e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(qp, "qp");
function Xp(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZPS[]", t), e.zp0 = e.zp1 = e.zp2 = t, t) {
    case 0:
      e.tZone || Pn(e), e.z0 = e.z1 = e.z2 = e.tZone;
      break;
    case 1:
      e.z0 = e.z1 = e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Xp, "Xp");
function Yp(e) {
  e.loop = e.stack.pop(), exports.DEBUG && console.log(e.step, "SLOOP[]", e.loop);
}
__name(Yp, "Yp");
function Zp(e) {
  exports.DEBUG && console.log(e.step, "RTG[]"), e.round = fl;
}
__name(Zp, "Zp");
function Jp(e) {
  exports.DEBUG && console.log(e.step, "RTHG[]"), e.round = Ip;
}
__name(Jp, "Jp");
function Qp(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SMD[]", t), e.minDis = t / 64;
}
__name(Qp, "Qp");
function Kp(e) {
  exports.DEBUG && console.log(e.step, "ELSE[]"), hl(e, false);
}
__name(Kp, "Kp");
function ed(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "JMPR[]", t), e.ip += t - 1;
}
__name(ed, "ed");
function td(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCVTCI[]", t), e.cvCutIn = t / 64;
}
__name(td, "td");
function rd(e) {
  var t = e.stack;
  exports.DEBUG && console.log(e.step, "DUP[]"), t.push(t[t.length - 1]);
}
__name(rd, "rd");
function ea(e) {
  exports.DEBUG && console.log(e.step, "POP[]"), e.stack.pop();
}
__name(ea, "ea");
function nd(e) {
  exports.DEBUG && console.log(e.step, "CLEAR[]"), e.stack.length = 0;
}
__name(nd, "nd");
function id(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SWAP[]"), t.push(r), t.push(n);
}
__name(id, "id");
function ad(e) {
  var t = e.stack;
  exports.DEBUG && console.log(e.step, "DEPTH[]"), t.push(t.length);
}
__name(ad, "ad");
function od(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LOOPCALL[]", r, n);
  var i = e.ip, a = e.prog;
  e.prog = e.funcs[r];
  for (var o = 0; o < n; o++) xr(e), exports.DEBUG && console.log(++e.step, o + 1 < n ? "next loopcall" : "done loopcall", o);
  e.ip = i, e.prog = a;
}
__name(od, "od");
function sd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "CALL[]", t);
  var r = e.ip, n = e.prog;
  e.prog = e.funcs[t], xr(e), e.ip = r, e.prog = n, exports.DEBUG && console.log(++e.step, "returning from", t);
}
__name(sd, "sd");
function ld(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "CINDEX[]", r), t.push(t[t.length - r]);
}
__name(ld, "ld");
function ud(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "MINDEX[]", r), t.push(t.splice(t.length - r, 1)[0]);
}
__name(ud, "ud");
function fd(e) {
  if (e.env !== "fpgm") throw new Error("FDEF not allowed here");
  var t = e.stack, r = e.prog, n = e.ip, i = t.pop(), a = n;
  for (exports.DEBUG && console.log(e.step, "FDEF[]", i); r[++n] !== 45; ) ;
  e.ip = n, e.funcs[i] = r.slice(a + 1, n);
}
__name(fd, "fd");
function As(e, t) {
  var r = t.stack.pop(), n = t.z0[r], i = t.fv, a = t.pv;
  exports.DEBUG && console.log(t.step, "MDAP[" + e + "]", r);
  var o = a.distance(n, jr);
  e && (o = t.round(o)), i.setRelative(n, jr, o, a), i.touch(n), t.rp0 = t.rp1 = r;
}
__name(As, "As");
function Ps(e, t) {
  var r = t.z2, n = r.length - 2, i, a, o;
  exports.DEBUG && console.log(t.step, "IUP[" + e.axis + "]");
  for (var l = 0; l < n; l++) i = r[l], !e.touched(i) && (a = i.prevTouched(e), a !== i && (o = i.nextTouched(e), a === o && e.setRelative(i, i, e.distance(a, a, false, true), e, true), e.interpolate(i, a, o, e)));
}
__name(Ps, "Ps");
function Is(e, t) {
  for (var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, l = t.loop, s = t.z2; l--; ) {
    var u = r.pop(), f = s[u], c = o.distance(i, i, false, true);
    a.setRelative(f, f, c, o), a.touch(f), exports.DEBUG && console.log(t.step, (t.loop > 1 ? "loop " + (t.loop - l) + ": " : "") + "SHP[" + (e ? "rp1" : "rp2") + "]", u);
  }
  t.loop = 1;
}
__name(Is, "Is");
function Rs(e, t) {
  var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, l = r.pop(), s = t.z2[t.contours[l]], u = s;
  exports.DEBUG && console.log(t.step, "SHC[" + e + "]", l);
  var f = o.distance(i, i, false, true);
  do
    u !== i && a.setRelative(u, u, f, o), u = u.nextPointOnContour;
  while (u !== s);
}
__name(Rs, "Rs");
function Fs(e, t) {
  var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, l = r.pop();
  exports.DEBUG && console.log(t.step, "SHZ[" + e + "]", l);
  var s;
  switch (l) {
    case 0:
      s = t.tZone;
      break;
    case 1:
      s = t.gZone;
      break;
    default:
      throw new Error("Invalid zone");
  }
  for (var u, f = o.distance(i, i, false, true), c = s.length - 2, h = 0; h < c; h++) u = s[h], a.setRelative(u, u, f, o);
}
__name(Fs, "Fs");
function cd(e) {
  for (var t = e.stack, r = e.loop, n = e.fv, i = t.pop() / 64, a = e.z2; r--; ) {
    var o = t.pop(), l = a[o];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - r) + ": " : "") + "SHPIX[]", o, i), n.setRelative(l, l, i), n.touch(l);
  }
  e.loop = 1;
}
__name(cd, "cd");
function hd(e) {
  for (var t = e.stack, r = e.rp1, n = e.rp2, i = e.loop, a = e.z0[r], o = e.z1[n], l = e.fv, s = e.dpv, u = e.z2; i--; ) {
    var f = t.pop(), c = u[f];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - i) + ": " : "") + "IP[]", f, r, "<->", n), l.interpolate(c, a, o, s), l.touch(c);
  }
  e.loop = 1;
}
__name(hd, "hd");
function Ds(e, t) {
  var r = t.stack, n = r.pop() / 64, i = r.pop(), a = t.z1[i], o = t.z0[t.rp0], l = t.fv, s = t.pv;
  l.setRelative(a, o, n, s), l.touch(a), exports.DEBUG && console.log(t.step, "MSIRP[" + e + "]", n, i), t.rp1 = t.rp0, t.rp2 = i, e && (t.rp0 = i);
}
__name(Ds, "Ds");
function pd(e) {
  for (var t = e.stack, r = e.rp0, n = e.z0[r], i = e.loop, a = e.fv, o = e.pv, l = e.z1; i--; ) {
    var s = t.pop(), u = l[s];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - i) + ": " : "") + "ALIGNRP[]", s), a.setRelative(u, n, 0, o), a.touch(u);
  }
  e.loop = 1;
}
__name(pd, "pd");
function dd(e) {
  exports.DEBUG && console.log(e.step, "RTDG[]"), e.round = Pp;
}
__name(dd, "dd");
function Us(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z0[i], o = t.fv, l = t.pv, s = t.cvt[n];
  exports.DEBUG && console.log(t.step, "MIAP[" + e + "]", n, "(", s, ")", i);
  var u = l.distance(a, jr);
  e && (Math.abs(u - s) < t.cvCutIn && (u = s), u = t.round(u)), o.setRelative(a, jr, u, l), t.zp0 === 0 && (a.xo = a.x, a.yo = a.y), o.touch(a), t.rp0 = t.rp1 = i;
}
__name(Us, "Us");
function vd(e) {
  var t = e.prog, r = e.ip, n = e.stack, i = t[++r];
  exports.DEBUG && console.log(e.step, "NPUSHB[]", i);
  for (var a = 0; a < i; a++) n.push(t[++r]);
  e.ip = r;
}
__name(vd, "vd");
function gd(e) {
  var t = e.ip, r = e.prog, n = e.stack, i = r[++t];
  exports.DEBUG && console.log(e.step, "NPUSHW[]", i);
  for (var a = 0; a < i; a++) {
    var o = r[++t] << 8 | r[++t];
    o & 32768 && (o = -((o ^ 65535) + 1)), n.push(o);
  }
  e.ip = t;
}
__name(gd, "gd");
function md(e) {
  var t = e.stack, r = e.store;
  r || (r = e.store = []);
  var n = t.pop(), i = t.pop();
  exports.DEBUG && console.log(e.step, "WS", n, i), r[i] = n;
}
__name(md, "md");
function bd(e) {
  var t = e.stack, r = e.store, n = t.pop();
  exports.DEBUG && console.log(e.step, "RS", n);
  var i = r && r[n] || 0;
  t.push(i);
}
__name(bd, "bd");
function yd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "WCVTP", r, n), e.cvt[n] = r / 64;
}
__name(yd, "yd");
function xd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "RCVT", r), t.push(e.cvt[r] * 64);
}
__name(xd, "xd");
function Ns(e, t) {
  var r = t.stack, n = r.pop(), i = t.z2[n];
  exports.DEBUG && console.log(t.step, "GC[" + e + "]", n), r.push(t.dpv.distance(i, jr, e, false) * 64);
}
__name(Ns, "Ns");
function Ms(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z1[n], o = t.z0[i], l = t.dpv.distance(o, a, e, e);
  exports.DEBUG && console.log(t.step, "MD[" + e + "]", n, i, "->", l), t.stack.push(Math.round(l * 64));
}
__name(Ms, "Ms");
function wd(e) {
  exports.DEBUG && console.log(e.step, "MPPEM[]"), e.stack.push(e.ppem);
}
__name(wd, "wd");
function Sd(e) {
  exports.DEBUG && console.log(e.step, "FLIPON[]"), e.autoFlip = true;
}
__name(Sd, "Sd");
function Ed(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LT[]", r, n), t.push(n < r ? 1 : 0);
}
__name(Ed, "Ed");
function kd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LTEQ[]", r, n), t.push(n <= r ? 1 : 0);
}
__name(kd, "kd");
function Td(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "GT[]", r, n), t.push(n > r ? 1 : 0);
}
__name(Td, "Td");
function _d(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "GTEQ[]", r, n), t.push(n >= r ? 1 : 0);
}
__name(_d, "_d");
function Ld(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "EQ[]", r, n), t.push(r === n ? 1 : 0);
}
__name(Ld, "Ld");
function Cd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "NEQ[]", r, n), t.push(r !== n ? 1 : 0);
}
__name(Cd, "Cd");
function Od(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "ODD[]", r), t.push(Math.trunc(r) % 2 ? 1 : 0);
}
__name(Od, "Od");
function Ad(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "EVEN[]", r), t.push(Math.trunc(r) % 2 ? 0 : 1);
}
__name(Ad, "Ad");
function Pd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "IF[]", t), t || (hl(e, true), exports.DEBUG && console.log(e.step, "EIF[]"));
}
__name(Pd, "Pd");
function Id(e) {
  exports.DEBUG && console.log(e.step, "EIF[]");
}
__name(Id, "Id");
function Rd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "AND[]", r, n), t.push(r && n ? 1 : 0);
}
__name(Rd, "Rd");
function Fd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "OR[]", r, n), t.push(r || n ? 1 : 0);
}
__name(Fd, "Fd");
function Dd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "NOT[]", r), t.push(r ? 0 : 1);
}
__name(Dd, "Dd");
function ta(e, t) {
  var r = t.stack, n = r.pop(), i = t.fv, a = t.pv, o = t.ppem, l = t.deltaBase + (e - 1) * 16, s = t.deltaShift, u = t.z0;
  exports.DEBUG && console.log(t.step, "DELTAP[" + e + "]", n, r);
  for (var f = 0; f < n; f++) {
    var c = r.pop(), h = r.pop(), p = l + ((h & 240) >> 4);
    if (p === o) {
      var m = (h & 15) - 8;
      m >= 0 && m++, exports.DEBUG && console.log(t.step, "DELTAPFIX", c, "by", m * s);
      var v = u[c];
      i.setRelative(v, v, m * s, a);
    }
  }
}
__name(ta, "ta");
function Ud(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "SDB[]", r), e.deltaBase = r;
}
__name(Ud, "Ud");
function Nd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "SDS[]", r), e.deltaShift = Math.pow(0.5, r);
}
__name(Nd, "Nd");
function Md(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "ADD[]", r, n), t.push(n + r);
}
__name(Md, "Md");
function Wd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SUB[]", r, n), t.push(n - r);
}
__name(Wd, "Wd");
function Bd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "DIV[]", r, n), t.push(n * 64 / r);
}
__name(Bd, "Bd");
function Gd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MUL[]", r, n), t.push(n * r / 64);
}
__name(Gd, "Gd");
function $d(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "ABS[]", r), t.push(Math.abs(r));
}
__name($d, "$d");
function jd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "NEG[]", r), t.push(-r);
}
__name(jd, "jd");
function zd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "FLOOR[]", r), t.push(Math.floor(r / 64) * 64);
}
__name(zd, "zd");
function Vd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "CEILING[]", r), t.push(Math.ceil(r / 64) * 64);
}
__name(Vd, "Vd");
function Ln(e, t) {
  var r = t.stack, n = r.pop();
  exports.DEBUG && console.log(t.step, "ROUND[]"), r.push(t.round(n / 64) * 64);
}
__name(Ln, "Ln");
function Hd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "WCVTF[]", r, n), e.cvt[n] = r * e.ppem / e.font.unitsPerEm;
}
__name(Hd, "Hd");
function ra(e, t) {
  var r = t.stack, n = r.pop(), i = t.ppem, a = t.deltaBase + (e - 1) * 16, o = t.deltaShift;
  exports.DEBUG && console.log(t.step, "DELTAC[" + e + "]", n, r);
  for (var l = 0; l < n; l++) {
    var s = r.pop(), u = r.pop(), f = a + ((u & 240) >> 4);
    if (f === i) {
      var c = (u & 15) - 8;
      c >= 0 && c++;
      var h = c * o;
      exports.DEBUG && console.log(t.step, "DELTACFIX", s, "by", h), t.cvt[s] += h;
    }
  }
}
__name(ra, "ra");
function qd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SROUND[]", t), e.round = cl;
  var r;
  switch (t & 192) {
    case 0:
      r = 0.5;
      break;
    case 64:
      r = 1;
      break;
    case 128:
      r = 2;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  switch (e.srPeriod = r, t & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * r;
      break;
    case 32:
      e.srPhase = 0.5 * r;
      break;
    case 48:
      e.srPhase = 0.75 * r;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - 0.5) * r;
}
__name(qd, "qd");
function Xd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "S45ROUND[]", t), e.round = cl;
  var r;
  switch (t & 192) {
    case 0:
      r = Math.sqrt(2) / 2;
      break;
    case 64:
      r = Math.sqrt(2);
      break;
    case 128:
      r = 2 * Math.sqrt(2);
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  switch (e.srPeriod = r, t & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * r;
      break;
    case 32:
      e.srPhase = 0.5 * r;
      break;
    case 48:
      e.srPhase = 0.75 * r;
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - 0.5) * r;
}
__name(Xd, "Xd");
function Yd(e) {
  exports.DEBUG && console.log(e.step, "ROFF[]"), e.round = Ap;
}
__name(Yd, "Yd");
function Zd(e) {
  exports.DEBUG && console.log(e.step, "RUTG[]"), e.round = Rp;
}
__name(Zd, "Zd");
function Jd(e) {
  exports.DEBUG && console.log(e.step, "RDTG[]"), e.round = Fp;
}
__name(Jd, "Jd");
function Qd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANCTRL[]", t);
}
__name(Qd, "Qd");
function Ws(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log(t.step, "SDPVTL[" + e + "]", n, i);
  var l, s;
  e ? (l = a.y - o.y, s = o.x - a.x) : (l = o.x - a.x, s = o.y - a.y), t.dpv = Xr(l, s);
}
__name(Ws, "Ws");
function Kd(e) {
  var t = e.stack, r = t.pop(), n = 0;
  exports.DEBUG && console.log(e.step, "GETINFO[]", r), r & 1 && (n = 35), r & 32 && (n |= 4096), t.push(n);
}
__name(Kd, "Kd");
function e0(e) {
  var t = e.stack, r = t.pop(), n = t.pop(), i = t.pop();
  exports.DEBUG && console.log(e.step, "ROLL[]"), t.push(n), t.push(r), t.push(i);
}
__name(e0, "e0");
function t0(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MAX[]", r, n), t.push(Math.max(n, r));
}
__name(t0, "t0");
function r0(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MIN[]", r, n), t.push(Math.min(n, r));
}
__name(r0, "r0");
function n0(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANTYPE[]", t);
}
__name(n0, "n0");
function i0(e) {
  var t = e.stack.pop(), r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "INSTCTRL[]", t, r), t) {
    case 1:
      e.inhibitGridFit = !!r;
      return;
    case 2:
      e.ignoreCvt = !!r;
      return;
    default:
      throw new Error("invalid INSTCTRL[] selector");
  }
}
__name(i0, "i0");
function ir(e, t) {
  var r = t.stack, n = t.prog, i = t.ip;
  exports.DEBUG && console.log(t.step, "PUSHB[" + e + "]");
  for (var a = 0; a < e; a++) r.push(n[++i]);
  t.ip = i;
}
__name(ir, "ir");
function ar(e, t) {
  var r = t.ip, n = t.prog, i = t.stack;
  exports.DEBUG && console.log(t.ip, "PUSHW[" + e + "]");
  for (var a = 0; a < e; a++) {
    var o = n[++r] << 8 | n[++r];
    o & 32768 && (o = -((o ^ 65535) + 1)), i.push(o);
  }
  t.ip = r;
}
__name(ar, "ar");
function oe(e, t, r, n, i, a) {
  var o = a.stack, l = e && o.pop(), s = o.pop(), u = a.rp0, f = a.z0[u], c = a.z1[s], h = a.minDis, p = a.fv, m = a.dpv, v, g, y, x;
  g = v = m.distance(c, f, true, true), y = g >= 0 ? 1 : -1, g = Math.abs(g), e && (x = a.cvt[l], n && Math.abs(g - x) < a.cvCutIn && (g = x)), r && g < h && (g = h), n && (g = a.round(g)), p.setRelative(c, f, y * g, m), p.touch(c), exports.DEBUG && console.log(a.step, (e ? "MIRP[" : "MDRP[") + (t ? "M" : "m") + (r ? ">" : "_") + (n ? "R" : "_") + (i === 0 ? "Gr" : i === 1 ? "Bl" : i === 2 ? "Wh" : "") + "]", e ? l + "(" + a.cvt[l] + "," + x + ")" : "", s, "(d =", v, "->", y * g, ")"), a.rp1 = a.rp0, a.rp2 = s, t && (a.rp0 = s);
}
__name(oe, "oe");
sl = [Ts.bind(void 0, Yt), Ts.bind(void 0, $t), _s.bind(void 0, Yt), _s.bind(void 0, $t), Ls.bind(void 0, Yt), Ls.bind(void 0, $t), Cs.bind(void 0, 0), Cs.bind(void 0, 1), Os.bind(void 0, 0), Os.bind(void 0, 1), Up, Np, Mp, Wp, Bp, Gp, $p, jp, zp, Vp, Hp, qp, Xp, Yp, Zp, Jp, Qp, Kp, ed, td, void 0, void 0, rd, ea, nd, id, ad, ld, ud, void 0, void 0, void 0, od, sd, fd, void 0, As.bind(void 0, 0), As.bind(void 0, 1), Ps.bind(void 0, Yt), Ps.bind(void 0, $t), Is.bind(void 0, 0), Is.bind(void 0, 1), Rs.bind(void 0, 0), Rs.bind(void 0, 1), Fs.bind(void 0, 0), Fs.bind(void 0, 1), cd, hd, Ds.bind(void 0, 0), Ds.bind(void 0, 1), pd, dd, Us.bind(void 0, 0), Us.bind(void 0, 1), vd, gd, md, bd, yd, xd, Ns.bind(void 0, 0), Ns.bind(void 0, 1), void 0, Ms.bind(void 0, 0), Ms.bind(void 0, 1), wd, void 0, Sd, void 0, void 0, Ed, kd, Td, _d, Ld, Cd, Od, Ad, Pd, Id, Rd, Fd, Dd, ta.bind(void 0, 1), Ud, Nd, Md, Wd, Bd, Gd, $d, jd, zd, Vd, Ln.bind(void 0, 0), Ln.bind(void 0, 1), Ln.bind(void 0, 2), Ln.bind(void 0, 3), void 0, void 0, void 0, void 0, Hd, ta.bind(void 0, 2), ta.bind(void 0, 3), ra.bind(void 0, 1), ra.bind(void 0, 2), ra.bind(void 0, 3), qd, Xd, void 0, void 0, Yd, void 0, Zd, Jd, ea, ea, void 0, void 0, void 0, void 0, void 0, Qd, Ws.bind(void 0, 0), Ws.bind(void 0, 1), Kd, void 0, e0, t0, r0, n0, i0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, ir.bind(void 0, 1), ir.bind(void 0, 2), ir.bind(void 0, 3), ir.bind(void 0, 4), ir.bind(void 0, 5), ir.bind(void 0, 6), ir.bind(void 0, 7), ir.bind(void 0, 8), ar.bind(void 0, 1), ar.bind(void 0, 2), ar.bind(void 0, 3), ar.bind(void 0, 4), ar.bind(void 0, 5), ar.bind(void 0, 6), ar.bind(void 0, 7), ar.bind(void 0, 8), oe.bind(void 0, 0, 0, 0, 0, 0), oe.bind(void 0, 0, 0, 0, 0, 1), oe.bind(void 0, 0, 0, 0, 0, 2), oe.bind(void 0, 0, 0, 0, 0, 3), oe.bind(void 0, 0, 0, 0, 1, 0), oe.bind(void 0, 0, 0, 0, 1, 1), oe.bind(void 0, 0, 0, 0, 1, 2), oe.bind(void 0, 0, 0, 0, 1, 3), oe.bind(void 0, 0, 0, 1, 0, 0), oe.bind(void 0, 0, 0, 1, 0, 1), oe.bind(void 0, 0, 0, 1, 0, 2), oe.bind(void 0, 0, 0, 1, 0, 3), oe.bind(void 0, 0, 0, 1, 1, 0), oe.bind(void 0, 0, 0, 1, 1, 1), oe.bind(void 0, 0, 0, 1, 1, 2), oe.bind(void 0, 0, 0, 1, 1, 3), oe.bind(void 0, 0, 1, 0, 0, 0), oe.bind(void 0, 0, 1, 0, 0, 1), oe.bind(void 0, 0, 1, 0, 0, 2), oe.bind(void 0, 0, 1, 0, 0, 3), oe.bind(void 0, 0, 1, 0, 1, 0), oe.bind(void 0, 0, 1, 0, 1, 1), oe.bind(void 0, 0, 1, 0, 1, 2), oe.bind(void 0, 0, 1, 0, 1, 3), oe.bind(void 0, 0, 1, 1, 0, 0), oe.bind(void 0, 0, 1, 1, 0, 1), oe.bind(void 0, 0, 1, 1, 0, 2), oe.bind(void 0, 0, 1, 1, 0, 3), oe.bind(void 0, 0, 1, 1, 1, 0), oe.bind(void 0, 0, 1, 1, 1, 1), oe.bind(void 0, 0, 1, 1, 1, 2), oe.bind(void 0, 0, 1, 1, 1, 3), oe.bind(void 0, 1, 0, 0, 0, 0), oe.bind(void 0, 1, 0, 0, 0, 1), oe.bind(void 0, 1, 0, 0, 0, 2), oe.bind(void 0, 1, 0, 0, 0, 3), oe.bind(void 0, 1, 0, 0, 1, 0), oe.bind(void 0, 1, 0, 0, 1, 1), oe.bind(void 0, 1, 0, 0, 1, 2), oe.bind(void 0, 1, 0, 0, 1, 3), oe.bind(void 0, 1, 0, 1, 0, 0), oe.bind(void 0, 1, 0, 1, 0, 1), oe.bind(void 0, 1, 0, 1, 0, 2), oe.bind(void 0, 1, 0, 1, 0, 3), oe.bind(void 0, 1, 0, 1, 1, 0), oe.bind(void 0, 1, 0, 1, 1, 1), oe.bind(void 0, 1, 0, 1, 1, 2), oe.bind(void 0, 1, 0, 1, 1, 3), oe.bind(void 0, 1, 1, 0, 0, 0), oe.bind(void 0, 1, 1, 0, 0, 1), oe.bind(void 0, 1, 1, 0, 0, 2), oe.bind(void 0, 1, 1, 0, 0, 3), oe.bind(void 0, 1, 1, 0, 1, 0), oe.bind(void 0, 1, 1, 0, 1, 1), oe.bind(void 0, 1, 1, 0, 1, 2), oe.bind(void 0, 1, 1, 0, 1, 3), oe.bind(void 0, 1, 1, 1, 0, 0), oe.bind(void 0, 1, 1, 1, 0, 1), oe.bind(void 0, 1, 1, 1, 0, 2), oe.bind(void 0, 1, 1, 1, 0, 3), oe.bind(void 0, 1, 1, 1, 1, 0), oe.bind(void 0, 1, 1, 1, 1, 1), oe.bind(void 0, 1, 1, 1, 1, 2), oe.bind(void 0, 1, 1, 1, 1, 3)];
function Ir(e) {
  this.char = e, this.state = {}, this.activeState = null;
}
__name(Ir, "Ir");
function ca(e, t, r) {
  this.contextName = r, this.startIndex = e, this.endOffset = t;
}
__name(ca, "ca");
function a0(e, t, r) {
  this.contextName = e, this.openRange = null, this.ranges = [], this.checkStart = t, this.checkEnd = r;
}
__name(a0, "a0");
function Ct(e, t) {
  this.context = e, this.index = t, this.length = e.length, this.current = e[t], this.backtrack = e.slice(0, t), this.lookahead = e.slice(t + 1);
}
__name(Ct, "Ct");
function In(e) {
  this.eventId = e, this.subscribers = [];
}
__name(In, "In");
function o0(e) {
  var t = this, r = ["start", "end", "next", "newToken", "contextStart", "contextEnd", "insertToken", "removeToken", "removeRange", "replaceToken", "replaceRange", "composeRUD", "updateContextsRanges"];
  r.forEach(function(i) {
    Object.defineProperty(t.events, i, { value: new In(i) });
  }), e && r.forEach(function(i) {
    var a = e[i];
    typeof a == "function" && t.events[i].subscribe(a);
  });
  var n = ["insertToken", "removeToken", "removeRange", "replaceToken", "replaceRange", "composeRUD"];
  n.forEach(function(i) {
    t.events[i].subscribe(t.updateContextsRanges);
  });
}
__name(o0, "o0");
function We(e) {
  this.tokens = [], this.registeredContexts = {}, this.contextCheckers = [], this.events = {}, this.registeredModifiers = [], o0.call(this, e);
}
__name(We, "We");
Ir.prototype.setState = function(e, t) {
  return this.state[e] = t, this.activeState = { key: e, value: this.state[e] }, this.activeState;
};
Ir.prototype.getState = function(e) {
  return this.state[e] || null;
};
We.prototype.inboundIndex = function(e) {
  return e >= 0 && e < this.tokens.length;
};
We.prototype.composeRUD = function(e) {
  var t = this, r = true, n = e.map(function(a) {
    return t[a[0]].apply(t, a.slice(1).concat(r));
  }), i = /* @__PURE__ */ __name(function(a) {
    return typeof a == "object" && a.hasOwnProperty("FAIL");
  }, "i");
  if (n.every(i)) return { FAIL: "composeRUD: one or more operations hasn't completed successfully", report: n.filter(i) };
  this.dispatch("composeRUD", [n.filter(function(a) {
    return !i(a);
  })]);
};
We.prototype.replaceRange = function(e, t, r, n) {
  t = t !== null ? t : this.tokens.length;
  var i = r.every(function(o) {
    return o instanceof Ir;
  });
  if (!isNaN(e) && this.inboundIndex(e) && i) {
    var a = this.tokens.splice.apply(this.tokens, [e, t].concat(r));
    return n || this.dispatch("replaceToken", [e, t, r]), [a, r];
  } else return { FAIL: "replaceRange: invalid tokens or startIndex." };
};
We.prototype.replaceToken = function(e, t, r) {
  if (!isNaN(e) && this.inboundIndex(e) && t instanceof Ir) {
    var n = this.tokens.splice(e, 1, t);
    return r || this.dispatch("replaceToken", [e, t]), [n[0], t];
  } else return { FAIL: "replaceToken: invalid token or index." };
};
We.prototype.removeRange = function(e, t, r) {
  t = isNaN(t) ? this.tokens.length : t;
  var n = this.tokens.splice(e, t);
  return r || this.dispatch("removeRange", [n, e, t]), n;
};
We.prototype.removeToken = function(e, t) {
  if (!isNaN(e) && this.inboundIndex(e)) {
    var r = this.tokens.splice(e, 1);
    return t || this.dispatch("removeToken", [r, e]), r;
  } else return { FAIL: "removeToken: invalid token index." };
};
We.prototype.insertToken = function(e, t, r) {
  var n = e.every(function(i) {
    return i instanceof Ir;
  });
  return n ? (this.tokens.splice.apply(this.tokens, [t, 0].concat(e)), r || this.dispatch("insertToken", [e, t]), e) : { FAIL: "insertToken: invalid token(s)." };
};
We.prototype.registerModifier = function(e, t, r) {
  this.events.newToken.subscribe(function(n, i) {
    var a = [n, i], o = t === null || t.apply(this, a) === true, l = [n, i];
    if (o) {
      var s = r.apply(this, l);
      n.setState(e, s);
    }
  }), this.registeredModifiers.push(e);
};
In.prototype.subscribe = function(e) {
  return typeof e == "function" ? this.subscribers.push(e) - 1 : { FAIL: "invalid '" + this.eventId + "' event handler" };
};
In.prototype.unsubscribe = function(e) {
  this.subscribers.splice(e, 1);
};
Ct.prototype.setCurrentIndex = function(e) {
  this.index = e, this.current = this.context[e], this.backtrack = this.context.slice(0, e), this.lookahead = this.context.slice(e + 1);
};
Ct.prototype.get = function(e) {
  switch (true) {
    case e === 0:
      return this.current;
    case (e < 0 && Math.abs(e) <= this.backtrack.length):
      return this.backtrack.slice(e)[0];
    case (e > 0 && e <= this.lookahead.length):
      return this.lookahead[e - 1];
    default:
      return null;
  }
};
We.prototype.rangeToText = function(e) {
  if (e instanceof ca) return this.getRangeTokens(e).map(function(t) {
    return t.char;
  }).join("");
};
We.prototype.getText = function() {
  return this.tokens.map(function(e) {
    return e.char;
  }).join("");
};
We.prototype.getContext = function(e) {
  var t = this.registeredContexts[e];
  return t || null;
};
We.prototype.on = function(e, t) {
  var r = this.events[e];
  return r ? r.subscribe(t) : null;
};
We.prototype.dispatch = function(e, t) {
  var r = this, n = this.events[e];
  n instanceof In && n.subscribers.forEach(function(i) {
    i.apply(r, t || []);
  });
};
We.prototype.registerContextChecker = function(e, t, r) {
  if (this.getContext(e)) return { FAIL: "context name '" + e + "' is already registered." };
  if (typeof t != "function") return { FAIL: "missing context start check." };
  if (typeof r != "function") return { FAIL: "missing context end check." };
  var n = new a0(e, t, r);
  return this.registeredContexts[e] = n, this.contextCheckers.push(n), n;
};
We.prototype.getRangeTokens = function(e) {
  var t = e.startIndex + e.endOffset;
  return [].concat(this.tokens.slice(e.startIndex, t));
};
We.prototype.getContextRanges = function(e) {
  var t = this.getContext(e);
  return t ? t.ranges : { FAIL: "context checker '" + e + "' is not registered." };
};
We.prototype.resetContextsRanges = function() {
  var e = this.registeredContexts;
  for (var t in e) if (e.hasOwnProperty(t)) {
    var r = e[t];
    r.ranges = [];
  }
};
We.prototype.updateContextsRanges = function() {
  this.resetContextsRanges();
  for (var e = this.tokens.map(function(n) {
    return n.char;
  }), t = 0; t < e.length; t++) {
    var r = new Ct(e, t);
    this.runContextCheck(r);
  }
  this.dispatch("updateContextsRanges", [this.registeredContexts]);
};
We.prototype.setEndOffset = function(e, t) {
  var r = this.getContext(t).openRange.startIndex, n = new ca(r, e, t), i = this.getContext(t).ranges;
  return n.rangeId = t + "." + i.length, i.push(n), this.getContext(t).openRange = null, n;
};
We.prototype.runContextCheck = function(e) {
  var t = this, r = e.index;
  this.contextCheckers.forEach(function(n) {
    var i = n.contextName, a = t.getContext(i).openRange;
    if (!a && n.checkStart(e) && (a = new ca(r, null, i), t.getContext(i).openRange = a, t.dispatch("contextStart", [i, r])), a && n.checkEnd(e)) {
      var o = r - a.startIndex + 1, l = t.setEndOffset(o, i);
      t.dispatch("contextEnd", [i, l]);
    }
  });
};
We.prototype.tokenize = function(e) {
  this.tokens = [], this.resetContextsRanges();
  var t = Array.from(e);
  this.dispatch("start");
  for (var r = 0; r < t.length; r++) {
    var n = t[r], i = new Ct(t, r);
    this.dispatch("next", [i]), this.runContextCheck(i);
    var a = new Ir(n);
    this.tokens.push(a), this.dispatch("newToken", [a, i]);
  }
  return this.dispatch("end", [this.tokens]), this.tokens;
};
function ur(e) {
  return /[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(e);
}
__name(ur, "ur");
function pl(e) {
  return /[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(e);
}
__name(pl, "pl");
function fr(e) {
  return /[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(e);
}
__name(fr, "fr");
function Cn(e) {
  return /[A-z]/.test(e);
}
__name(Cn, "Cn");
function s0(e) {
  return /\s/.test(e);
}
__name(s0, "s0");
function mt(e) {
  this.font = e, this.features = {};
}
__name(mt, "mt");
function br(e) {
  this.id = e.id, this.tag = e.tag, this.substitution = e.substitution;
}
__name(br, "br");
function Yr(e, t) {
  if (!e) return -1;
  switch (t.format) {
    case 1:
      return t.glyphs.indexOf(e);
    case 2:
      for (var r = t.ranges, n = 0; n < r.length; n++) {
        var i = r[n];
        if (e >= i.start && e <= i.end) {
          var a = e - i.start;
          return i.index + a;
        }
      }
      break;
    default:
      return -1;
  }
  return -1;
}
__name(Yr, "Yr");
function l0(e, t) {
  var r = Yr(e, t.coverage);
  return r === -1 ? null : e + t.deltaGlyphId;
}
__name(l0, "l0");
function u0(e, t) {
  var r = Yr(e, t.coverage);
  return r === -1 ? null : t.substitute[r];
}
__name(u0, "u0");
function na(e, t) {
  for (var r = [], n = 0; n < e.length; n++) {
    var i = e[n], a = t.current;
    a = Array.isArray(a) ? a[0] : a;
    var o = Yr(a, i);
    o !== -1 && r.push(o);
  }
  return r.length !== e.length ? -1 : r;
}
__name(na, "na");
function f0(e, t) {
  var r = t.inputCoverage.length + t.lookaheadCoverage.length + t.backtrackCoverage.length;
  if (e.context.length < r) return [];
  var n = na(t.inputCoverage, e);
  if (n === -1) return [];
  var i = t.inputCoverage.length - 1;
  if (e.lookahead.length < t.lookaheadCoverage.length) return [];
  for (var a = e.lookahead.slice(i); a.length && fr(a[0].char); ) a.shift();
  var o = new Ct(a, 0), l = na(t.lookaheadCoverage, o), s = [].concat(e.backtrack);
  for (s.reverse(); s.length && fr(s[0].char); ) s.shift();
  if (s.length < t.backtrackCoverage.length) return [];
  var u = new Ct(s, 0), f = na(t.backtrackCoverage, u), c = n.length === t.inputCoverage.length && l.length === t.lookaheadCoverage.length && f.length === t.backtrackCoverage.length, h = [];
  if (c) for (var p = 0; p < t.lookupRecords.length; p++) for (var m = t.lookupRecords[p], v = m.lookupListIndex, g = this.getLookupByIndex(v), y = 0; y < g.subtables.length; y++) {
    var x = g.subtables[y], _ = this.getLookupMethod(g, x), L = this.getSubstitutionType(g, x);
    if (L === "12") for (var T = 0; T < n.length; T++) {
      var E = e.get(T), R = _(E);
      R && h.push(R);
    }
  }
  return h;
}
__name(f0, "f0");
function c0(e, t) {
  var r = e.current, n = Yr(r, t.coverage);
  if (n === -1) return null;
  for (var i, a = t.ligatureSets[n], o = 0; o < a.length; o++) {
    i = a[o];
    for (var l = 0; l < i.components.length; l++) {
      var s = e.lookahead[l], u = i.components[l];
      if (s !== u) break;
      if (l === i.components.length - 1) return i;
    }
  }
  return null;
}
__name(c0, "c0");
function h0(e, t) {
  var r = Yr(e, t.coverage);
  return r === -1 ? null : t.sequences[r];
}
__name(h0, "h0");
mt.prototype.getDefaultScriptFeaturesIndexes = function() {
  for (var e = this.font.tables.gsub.scripts, t = 0; t < e.length; t++) {
    var r = e[t];
    if (r.tag === "DFLT") return r.script.defaultLangSys.featureIndexes;
  }
  return [];
};
mt.prototype.getScriptFeaturesIndexes = function(e) {
  var t = this.font.tables;
  if (!t.gsub) return [];
  if (!e) return this.getDefaultScriptFeaturesIndexes();
  for (var r = this.font.tables.gsub.scripts, n = 0; n < r.length; n++) {
    var i = r[n];
    if (i.tag === e && i.script.defaultLangSys) return i.script.defaultLangSys.featureIndexes;
    var a = i.langSysRecords;
    if (a) for (var o = 0; o < a.length; o++) {
      var l = a[o];
      if (l.tag === e) {
        var s = l.langSys;
        return s.featureIndexes;
      }
    }
  }
  return this.getDefaultScriptFeaturesIndexes();
};
mt.prototype.mapTagsToFeatures = function(e, t) {
  for (var r = {}, n = 0; n < e.length; n++) {
    var i = e[n].tag, a = e[n].feature;
    r[i] = a;
  }
  this.features[t].tags = r;
};
mt.prototype.getScriptFeatures = function(e) {
  var t = this.features[e];
  if (this.features.hasOwnProperty(e)) return t;
  var r = this.getScriptFeaturesIndexes(e);
  if (!r) return null;
  var n = this.font.tables.gsub;
  return t = r.map(function(i) {
    return n.features[i];
  }), this.features[e] = t, this.mapTagsToFeatures(t, e), t;
};
mt.prototype.getSubstitutionType = function(e, t) {
  var r = e.lookupType.toString(), n = t.substFormat.toString();
  return r + n;
};
mt.prototype.getLookupMethod = function(e, t) {
  var r = this, n = this.getSubstitutionType(e, t);
  switch (n) {
    case "11":
      return function(i) {
        return l0.apply(r, [i, t]);
      };
    case "12":
      return function(i) {
        return u0.apply(r, [i, t]);
      };
    case "63":
      return function(i) {
        return f0.apply(r, [i, t]);
      };
    case "41":
      return function(i) {
        return c0.apply(r, [i, t]);
      };
    case "21":
      return function(i) {
        return h0.apply(r, [i, t]);
      };
    default:
      throw new Error("lookupType: " + e.lookupType + " - substFormat: " + t.substFormat + " is not yet supported");
  }
};
mt.prototype.lookupFeature = function(e) {
  var t = e.contextParams, r = t.index, n = this.getFeature({ tag: e.tag, script: e.script });
  if (!n) return new Error("font '" + this.font.names.fullName.en + "' doesn't support feature '" + e.tag + "' for script '" + e.script + "'.");
  for (var i = this.getFeatureLookups(n), a = [].concat(t.context), o = 0; o < i.length; o++) for (var l = i[o], s = this.getLookupSubtables(l), u = 0; u < s.length; u++) {
    var f = s[u], c = this.getSubstitutionType(l, f), h = this.getLookupMethod(l, f), p = void 0;
    switch (c) {
      case "11":
        p = h(t.current), p && a.splice(r, 1, new br({ id: 11, tag: e.tag, substitution: p }));
        break;
      case "12":
        p = h(t.current), p && a.splice(r, 1, new br({ id: 12, tag: e.tag, substitution: p }));
        break;
      case "63":
        p = h(t), Array.isArray(p) && p.length && a.splice(r, 1, new br({ id: 63, tag: e.tag, substitution: p }));
        break;
      case "41":
        p = h(t), p && a.splice(r, 1, new br({ id: 41, tag: e.tag, substitution: p }));
        break;
      case "21":
        p = h(t.current), p && a.splice(r, 1, new br({ id: 21, tag: e.tag, substitution: p }));
        break;
    }
    t = new Ct(a, r), !(Array.isArray(p) && !p.length) && (p = null);
  }
  return a.length ? a : null;
};
mt.prototype.supports = function(e) {
  if (!e.script) return false;
  this.getScriptFeatures(e.script);
  var t = this.features.hasOwnProperty(e.script);
  if (!e.tag) return t;
  var r = this.features[e.script].some(function(n) {
    return n.tag === e.tag;
  });
  return t && r;
};
mt.prototype.getLookupSubtables = function(e) {
  return e.subtables || null;
};
mt.prototype.getLookupByIndex = function(e) {
  var t = this.font.tables.gsub.lookups;
  return t[e] || null;
};
mt.prototype.getFeatureLookups = function(e) {
  return e.lookupListIndexes.map(this.getLookupByIndex.bind(this));
};
mt.prototype.getFeature = function(t) {
  if (!this.font) return { FAIL: "No font was found" };
  this.features.hasOwnProperty(t.script) || this.getScriptFeatures(t.script);
  var r = this.features[t.script];
  return r ? r.tags[t.tag] ? this.features[t.script].tags[t.tag] : null : { FAIL: "No feature for script " + t.script };
};
function p0(e) {
  var t = e.current, r = e.get(-1);
  return r === null && ur(t) || !ur(r) && ur(t);
}
__name(p0, "p0");
function d0(e) {
  var t = e.get(1);
  return t === null || !ur(t);
}
__name(d0, "d0");
var v0 = { startCheck: p0, endCheck: d0 };
function g0(e) {
  var t = e.current, r = e.get(-1);
  return (ur(t) || fr(t)) && !ur(r);
}
__name(g0, "g0");
function m0(e) {
  var t = e.get(1);
  switch (true) {
    case t === null:
      return true;
    case (!ur(t) && !fr(t)):
      var r = s0(t);
      if (!r) return true;
      if (r) {
        var n = false;
        if (n = e.lookahead.some(function(i) {
          return ur(i) || fr(i);
        }), !n) return true;
      }
      break;
    default:
      return false;
  }
}
__name(m0, "m0");
var b0 = { startCheck: g0, endCheck: m0 };
function y0(e, t, r) {
  t[r].setState(e.tag, e.substitution);
}
__name(y0, "y0");
function x0(e, t, r) {
  t[r].setState(e.tag, e.substitution);
}
__name(x0, "x0");
function w0(e, t, r) {
  e.substitution.forEach(function(n, i) {
    var a = t[r + i];
    a.setState(e.tag, n);
  });
}
__name(w0, "w0");
function S0(e, t, r) {
  var n = t[r];
  n.setState(e.tag, e.substitution.ligGlyph);
  for (var i = e.substitution.components.length, a = 0; a < i; a++) n = t[r + a + 1], n.setState("deleted", true);
}
__name(S0, "S0");
var Bs = { 11: y0, 12: x0, 63: w0, 41: S0 };
function ha(e, t, r) {
  e instanceof br && Bs[e.id] && Bs[e.id](e, t, r);
}
__name(ha, "ha");
function E0(e) {
  for (var t = [].concat(e.backtrack), r = t.length - 1; r >= 0; r--) {
    var n = t[r], i = pl(n), a = fr(n);
    if (!i && !a) return true;
    if (i) return false;
  }
  return false;
}
__name(E0, "E0");
function k0(e) {
  if (pl(e.current)) return false;
  for (var t = 0; t < e.lookahead.length; t++) {
    var r = e.lookahead[t], n = fr(r);
    if (!n) return true;
  }
  return false;
}
__name(k0, "k0");
function T0(e) {
  var t = this, r = "arab", n = this.featuresTags[r], i = this.tokenizer.getRangeTokens(e);
  if (i.length !== 1) {
    var a = new Ct(i.map(function(l) {
      return l.getState("glyphIndex");
    }), 0), o = new Ct(i.map(function(l) {
      return l.char;
    }), 0);
    i.forEach(function(l, s) {
      if (!fr(l.char)) {
        a.setCurrentIndex(s), o.setCurrentIndex(s);
        var u = 0;
        E0(o) && (u |= 1), k0(o) && (u |= 2);
        var f;
        switch (u) {
          case 1:
            f = "fina";
            break;
          case 2:
            f = "init";
            break;
          case 3:
            f = "medi";
            break;
        }
        if (n.indexOf(f) !== -1) {
          var c = t.query.lookupFeature({ tag: f, script: r, contextParams: a });
          if (c instanceof Error) return console.info(c.message);
          c.forEach(function(h, p) {
            h instanceof br && (ha(h, i, p), a.context[p] = h.substitution);
          });
        }
      }
    });
  }
}
__name(T0, "T0");
function Gs(e, t) {
  var r = e.map(function(n) {
    return n.activeState.value;
  });
  return new Ct(r, t || 0);
}
__name(Gs, "Gs");
function _0(e) {
  var t = this, r = "arab", n = this.tokenizer.getRangeTokens(e), i = Gs(n);
  i.context.forEach(function(a, o) {
    i.setCurrentIndex(o);
    var l = t.query.lookupFeature({ tag: "rlig", script: r, contextParams: i });
    l.length && (l.forEach(function(s) {
      return ha(s, n, o);
    }), i = Gs(n));
  });
}
__name(_0, "_0");
function L0(e) {
  var t = e.current, r = e.get(-1);
  return r === null && Cn(t) || !Cn(r) && Cn(t);
}
__name(L0, "L0");
function C0(e) {
  var t = e.get(1);
  return t === null || !Cn(t);
}
__name(C0, "C0");
var O0 = { startCheck: L0, endCheck: C0 };
function $s(e, t) {
  var r = e.map(function(n) {
    return n.activeState.value;
  });
  return new Ct(r, t || 0);
}
__name($s, "$s");
function A0(e) {
  var t = this, r = "latn", n = this.tokenizer.getRangeTokens(e), i = $s(n);
  i.context.forEach(function(a, o) {
    i.setCurrentIndex(o);
    var l = t.query.lookupFeature({ tag: "liga", script: r, contextParams: i });
    l.length && (l.forEach(function(s) {
      return ha(s, n, o);
    }), i = $s(n));
  });
}
__name(A0, "A0");
function Pt(e) {
  this.baseDir = e || "ltr", this.tokenizer = new We(), this.featuresTags = {};
}
__name(Pt, "Pt");
Pt.prototype.setText = function(e) {
  this.text = e;
};
Pt.prototype.contextChecks = { latinWordCheck: O0, arabicWordCheck: v0, arabicSentenceCheck: b0 };
function ia(e) {
  var t = this.contextChecks[e + "Check"];
  return this.tokenizer.registerContextChecker(e, t.startCheck, t.endCheck);
}
__name(ia, "ia");
function P0() {
  return ia.call(this, "latinWord"), ia.call(this, "arabicWord"), ia.call(this, "arabicSentence"), this.tokenizer.tokenize(this.text);
}
__name(P0, "P0");
function I0() {
  var e = this, t = this.tokenizer.getContextRanges("arabicSentence");
  t.forEach(function(r) {
    var n = e.tokenizer.getRangeTokens(r);
    e.tokenizer.replaceRange(r.startIndex, r.endOffset, n.reverse());
  });
}
__name(I0, "I0");
Pt.prototype.registerFeatures = function(e, t) {
  var r = this, n = t.filter(function(i) {
    return r.query.supports({ script: e, tag: i });
  });
  this.featuresTags.hasOwnProperty(e) ? this.featuresTags[e] = this.featuresTags[e].concat(n) : this.featuresTags[e] = n;
};
Pt.prototype.applyFeatures = function(e, t) {
  if (!e) throw new Error("No valid font was provided to apply features");
  this.query || (this.query = new mt(e));
  for (var r = 0; r < t.length; r++) {
    var n = t[r];
    this.query.supports({ script: n.script }) && this.registerFeatures(n.script, n.tags);
  }
};
Pt.prototype.registerModifier = function(e, t, r) {
  this.tokenizer.registerModifier(e, t, r);
};
function pa() {
  if (this.tokenizer.registeredModifiers.indexOf("glyphIndex") === -1) throw new Error("glyphIndex modifier is required to apply arabic presentation features.");
}
__name(pa, "pa");
function R0() {
  var e = this, t = "arab";
  if (this.featuresTags.hasOwnProperty(t)) {
    pa.call(this);
    var r = this.tokenizer.getContextRanges("arabicWord");
    r.forEach(function(n) {
      T0.call(e, n);
    });
  }
}
__name(R0, "R0");
function F0() {
  var e = this, t = "arab";
  if (this.featuresTags.hasOwnProperty(t)) {
    var r = this.featuresTags[t];
    if (r.indexOf("rlig") !== -1) {
      pa.call(this);
      var n = this.tokenizer.getContextRanges("arabicWord");
      n.forEach(function(i) {
        _0.call(e, i);
      });
    }
  }
}
__name(F0, "F0");
function D0() {
  var e = this, t = "latn";
  if (this.featuresTags.hasOwnProperty(t)) {
    var r = this.featuresTags[t];
    if (r.indexOf("liga") !== -1) {
      pa.call(this);
      var n = this.tokenizer.getContextRanges("latinWord");
      n.forEach(function(i) {
        A0.call(e, i);
      });
    }
  }
}
__name(D0, "D0");
Pt.prototype.checkContextReady = function(e) {
  return !!this.tokenizer.getContext(e);
};
Pt.prototype.applyFeaturesToContexts = function() {
  this.checkContextReady("arabicWord") && (R0.call(this), F0.call(this)), this.checkContextReady("latinWord") && D0.call(this), this.checkContextReady("arabicSentence") && I0.call(this);
};
Pt.prototype.processText = function(e) {
  (!this.text || this.text !== e) && (this.setText(e), P0.call(this), this.applyFeaturesToContexts());
};
Pt.prototype.getBidiText = function(e) {
  return this.processText(e), this.tokenizer.getText();
};
Pt.prototype.getTextGlyphs = function(e) {
  this.processText(e);
  for (var t = [], r = 0; r < this.tokenizer.tokens.length; r++) {
    var n = this.tokenizer.tokens[r];
    if (!n.state.deleted) {
      var i = n.activeState.value;
      t.push(Array.isArray(i) ? i[0] : i);
    }
  }
  return t;
};
function ot(e) {
  e = e || {}, e.tables = e.tables || {}, e.empty || (Br(e.familyName, "When creating a new Font object, familyName is required."), Br(e.styleName, "When creating a new Font object, styleName is required."), Br(e.unitsPerEm, "When creating a new Font object, unitsPerEm is required."), Br(e.ascender, "When creating a new Font object, ascender is required."), Br(e.descender <= 0, "When creating a new Font object, negative descender value is required."), this.unitsPerEm = e.unitsPerEm || 1e3, this.ascender = e.ascender, this.descender = e.descender, this.createdTimestamp = e.createdTimestamp, this.tables = Object.assign(e.tables, { os2: Object.assign({ usWeightClass: e.weightClass || this.usWeightClasses.MEDIUM, usWidthClass: e.widthClass || this.usWidthClasses.MEDIUM, fsSelection: e.fsSelection || this.fsSelectionValues.REGULAR }, e.tables.os2) })), this.supported = true, this.glyphs = new jt.GlyphSet(this, e.glyphs || []), this.encoding = new Ks(this), this.position = new Hr(this), this.substitution = new gt(this), this.tables = this.tables || {}, this._push = null, this._hmtxTableData = {}, Object.defineProperty(this, "hinting", { get: /* @__PURE__ */ __name(function() {
    if (this._hinting) return this._hinting;
    if (this.outlinesFormat === "truetype") return this._hinting = new ul(this);
  }, "get") });
}
__name(ot, "ot");
ot.prototype.hasChar = function(e) {
  return this.encoding.charToGlyphIndex(e) !== null;
};
ot.prototype.charToGlyphIndex = function(e) {
  return this.encoding.charToGlyphIndex(e);
};
ot.prototype.charToGlyph = function(e) {
  var t = this.charToGlyphIndex(e), r = this.glyphs.get(t);
  return r || (r = this.glyphs.get(0)), r;
};
ot.prototype.updateFeatures = function(e) {
  return this.defaultRenderOptions.features.map(function(t) {
    return t.script === "latn" ? { script: "latn", tags: t.tags.filter(function(r) {
      return e[r];
    }) } : t;
  });
};
ot.prototype.stringToGlyphs = function(e, t) {
  var r = this, n = new Pt(), i = /* @__PURE__ */ __name(function(c) {
    return r.charToGlyphIndex(c.char);
  }, "i");
  n.registerModifier("glyphIndex", null, i);
  var a = t ? this.updateFeatures(t.features) : this.defaultRenderOptions.features;
  n.applyFeatures(this, a);
  for (var o = n.getTextGlyphs(e), l = o.length, s = new Array(l), u = this.glyphs.get(0), f = 0; f < l; f += 1) s[f] = this.glyphs.get(o[f]) || u;
  return s;
};
ot.prototype.getKerningValue = function(e, t) {
  e = e.index || e, t = t.index || t;
  var r = this.position.defaultKerningTables;
  return r ? this.position.getKerningValue(r, e, t) : this.kerningPairs[e + "," + t] || 0;
};
ot.prototype.defaultRenderOptions = { kerning: true, features: [{ script: "arab", tags: ["init", "medi", "fina", "rlig"] }, { script: "latn", tags: ["liga", "rlig"] }] };
ot.prototype.forEachGlyph = function(e, t, r, n, i, a) {
  t = t !== void 0 ? t : 0, r = r !== void 0 ? r : 0, n = n !== void 0 ? n : 72, i = Object.assign({}, this.defaultRenderOptions, i);
  var o = 1 / this.unitsPerEm * n, l = this.stringToGlyphs(e, i), s;
  if (i.kerning) {
    var u = i.script || this.position.getDefaultScriptName();
    s = this.position.getKerningTables(u, i.language);
  }
  for (var f = 0; f < l.length; f += 1) {
    var c = l[f];
    if (a.call(this, c, t, r, n, i), c.advanceWidth && (t += c.advanceWidth * o), i.kerning && f < l.length - 1) {
      var h = s ? this.position.getKerningValue(s, c.index, l[f + 1].index) : this.getKerningValue(c, l[f + 1]);
      t += h * o;
    }
    i.letterSpacing ? t += i.letterSpacing * n : i.tracking && (t += i.tracking / 1e3 * n);
  }
  return t;
};
ot.prototype.getPath = function(e, t, r, n, i) {
  var a = new at();
  return this.forEachGlyph(e, t, r, n, i, function(o, l, s, u) {
    var f = o.getPath(l, s, u, i, this);
    a.extend(f);
  }), a;
};
ot.prototype.getPaths = function(e, t, r, n, i) {
  var a = [];
  return this.forEachGlyph(e, t, r, n, i, function(o, l, s, u) {
    var f = o.getPath(l, s, u, i, this);
    a.push(f);
  }), a;
};
ot.prototype.getAdvanceWidth = function(e, t, r) {
  return this.forEachGlyph(e, 0, 0, t, r, function() {
  });
};
ot.prototype.fsSelectionValues = { ITALIC: 1, UNDERSCORE: 2, NEGATIVE: 4, OUTLINED: 8, STRIKEOUT: 16, BOLD: 32, REGULAR: 64, USER_TYPO_METRICS: 128, WWS: 256, OBLIQUE: 512 };
ot.prototype.usWidthClasses = { ULTRA_CONDENSED: 1, EXTRA_CONDENSED: 2, CONDENSED: 3, SEMI_CONDENSED: 4, MEDIUM: 5, SEMI_EXPANDED: 6, EXPANDED: 7, EXTRA_EXPANDED: 8, ULTRA_EXPANDED: 9 };
ot.prototype.usWeightClasses = { THIN: 100, EXTRA_LIGHT: 200, LIGHT: 300, NORMAL: 400, MEDIUM: 500, SEMI_BOLD: 600, BOLD: 700, EXTRA_BOLD: 800, BLACK: 900 };
function U0(e, t) {
  t.parseUShort(), e.length = t.parseULong(), e.language = t.parseULong();
  var r;
  e.groupCount = r = t.parseULong(), e.glyphIndexMap = {};
  for (var n = 0; n < r; n += 1) for (var i = t.parseULong(), a = t.parseULong(), o = t.parseULong(), l = i; l <= a; l += 1) e.glyphIndexMap[l] = o, o++;
}
__name(U0, "U0");
function N0(e, t, r, n, i) {
  e.length = t.parseUShort(), e.language = t.parseUShort();
  var a;
  e.segCount = a = t.parseUShort() >> 1, t.skip("uShort", 3), e.glyphIndexMap = {};
  for (var o = new se.Parser(r, n + i + 14), l = new se.Parser(r, n + i + 16 + a * 2), s = new se.Parser(r, n + i + 16 + a * 4), u = new se.Parser(r, n + i + 16 + a * 6), f = n + i + 16 + a * 8, c = 0; c < a - 1; c += 1) for (var h = void 0, p = o.parseUShort(), m = l.parseUShort(), v = s.parseShort(), g = u.parseUShort(), y = m; y <= p; y += 1) g !== 0 ? (f = u.offset + u.relativeOffset - 2, f += g, f += (y - m) * 2, h = se.getUShort(r, f), h !== 0 && (h = h + v & 65535)) : h = y + v & 65535, e.glyphIndexMap[y] = h;
}
__name(N0, "N0");
function M0(e, t) {
  var r = {};
  r.version = se.getUShort(e, t), Ae.argument(r.version === 0, "cmap table version should be 0."), r.numTables = se.getUShort(e, t + 2);
  for (var n = -1, i = r.numTables - 1; i >= 0; i -= 1) {
    var a = se.getUShort(e, t + 4 + i * 8), o = se.getUShort(e, t + 4 + i * 8 + 2);
    if (a === 3 && (o === 0 || o === 1 || o === 10) || a === 0 && (o === 0 || o === 1 || o === 2 || o === 3 || o === 4)) {
      n = se.getULong(e, t + 4 + i * 8 + 4);
      break;
    }
  }
  if (n === -1) throw new Error("No valid cmap sub-tables found.");
  var l = new se.Parser(e, t + n);
  if (r.format = l.parseUShort(), r.format === 12) U0(r, l);
  else if (r.format === 4) N0(r, l, e, t, n);
  else throw new Error("Only format 4 and 12 cmap tables are supported (found format " + r.format + ").");
  return r;
}
__name(M0, "M0");
var W0 = { parse: M0 };
function sa(e) {
  var t;
  return e.length < 1240 ? t = 107 : e.length < 33900 ? t = 1131 : t = 32768, t;
}
__name(sa, "sa");
function sr(e, t, r) {
  var n = [], i = [], a = se.getCard16(e, t), o, l;
  if (a !== 0) {
    var s = se.getByte(e, t + 2);
    o = t + (a + 1) * s + 2;
    for (var u = t + 3, f = 0; f < a + 1; f += 1) n.push(se.getOffset(e, u, s)), u += s;
    l = o + n[a];
  } else l = t + 2;
  for (var c = 0; c < n.length - 1; c += 1) {
    var h = se.getBytes(e, o + n[c], o + n[c + 1]);
    r && (h = r(h)), i.push(h);
  }
  return { objects: i, startOffset: t, endOffset: l };
}
__name(sr, "sr");
function B0(e, t) {
  var r = [], n = se.getCard16(e, t), i, a;
  if (n !== 0) {
    var o = se.getByte(e, t + 2);
    i = t + (n + 1) * o + 2;
    for (var l = t + 3, s = 0; s < n + 1; s += 1) r.push(se.getOffset(e, l, o)), l += o;
    a = i + r[n];
  } else a = t + 2;
  return { offsets: r, startOffset: t, endOffset: a };
}
__name(B0, "B0");
function G0(e, t, r, n, i) {
  var a = se.getCard16(r, n), o = 0;
  if (a !== 0) {
    var l = se.getByte(r, n + 2);
    o = n + (a + 1) * l + 2;
  }
  var s = se.getBytes(r, o + t[e], o + t[e + 1]);
  return i && (s = i(s)), s;
}
__name(G0, "G0");
function $0(e) {
  for (var t = "", r = 15, n = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"]; ; ) {
    var i = e.parseByte(), a = i >> 4, o = i & 15;
    if (a === r || (t += n[a], o === r)) break;
    t += n[o];
  }
  return parseFloat(t);
}
__name($0, "$0");
function j0(e, t) {
  var r, n, i, a;
  if (t === 28) return r = e.parseByte(), n = e.parseByte(), r << 8 | n;
  if (t === 29) return r = e.parseByte(), n = e.parseByte(), i = e.parseByte(), a = e.parseByte(), r << 24 | n << 16 | i << 8 | a;
  if (t === 30) return $0(e);
  if (t >= 32 && t <= 246) return t - 139;
  if (t >= 247 && t <= 250) return r = e.parseByte(), (t - 247) * 256 + r + 108;
  if (t >= 251 && t <= 254) return r = e.parseByte(), -(t - 251) * 256 - r - 108;
  throw new Error("Invalid b0 " + t);
}
__name(j0, "j0");
function z0(e) {
  for (var t = {}, r = 0; r < e.length; r += 1) {
    var n = e[r][0], i = e[r][1], a = void 0;
    if (i.length === 1 ? a = i[0] : a = i, t.hasOwnProperty(n) && !isNaN(t[n])) throw new Error("Object " + t + " already has key " + n);
    t[n] = a;
  }
  return t;
}
__name(z0, "z0");
function dl(e, t, r) {
  t = t !== void 0 ? t : 0;
  var n = new se.Parser(e, t), i = [], a = [];
  for (r = r !== void 0 ? r : e.length; n.relativeOffset < r; ) {
    var o = n.parseByte();
    o <= 21 ? (o === 12 && (o = 1200 + n.parseByte()), i.push([o, a]), a = []) : a.push(j0(n, o));
  }
  return z0(i);
}
__name(dl, "dl");
function $r(e, t) {
  return t <= 390 ? t = up[t] : t = e[t - 391], t;
}
__name($r, "$r");
function vl(e, t, r) {
  for (var n = {}, i, a = 0; a < t.length; a += 1) {
    var o = t[a];
    if (Array.isArray(o.type)) {
      var l = [];
      l.length = o.type.length;
      for (var s = 0; s < o.type.length; s++) i = e[o.op] !== void 0 ? e[o.op][s] : void 0, i === void 0 && (i = o.value !== void 0 && o.value[s] !== void 0 ? o.value[s] : null), o.type[s] === "SID" && (i = $r(r, i)), l[s] = i;
      n[o.name] = l;
    } else i = e[o.op], i === void 0 && (i = o.value !== void 0 ? o.value : null), o.type === "SID" && (i = $r(r, i)), n[o.name] = i;
  }
  return n;
}
__name(vl, "vl");
function V0(e, t) {
  var r = {};
  return r.formatMajor = se.getCard8(e, t), r.formatMinor = se.getCard8(e, t + 1), r.size = se.getCard8(e, t + 2), r.offsetSize = se.getCard8(e, t + 3), r.startOffset = t, r.endOffset = t + 4, r;
}
__name(V0, "V0");
var H0 = [{ name: "version", op: 0, type: "SID" }, { name: "notice", op: 1, type: "SID" }, { name: "copyright", op: 1200, type: "SID" }, { name: "fullName", op: 2, type: "SID" }, { name: "familyName", op: 3, type: "SID" }, { name: "weight", op: 4, type: "SID" }, { name: "isFixedPitch", op: 1201, type: "number", value: 0 }, { name: "italicAngle", op: 1202, type: "number", value: 0 }, { name: "underlinePosition", op: 1203, type: "number", value: -100 }, { name: "underlineThickness", op: 1204, type: "number", value: 50 }, { name: "paintType", op: 1205, type: "number", value: 0 }, { name: "charstringType", op: 1206, type: "number", value: 2 }, { name: "fontMatrix", op: 1207, type: ["real", "real", "real", "real", "real", "real"], value: [1e-3, 0, 0, 1e-3, 0, 0] }, { name: "uniqueId", op: 13, type: "number" }, { name: "fontBBox", op: 5, type: ["number", "number", "number", "number"], value: [0, 0, 0, 0] }, { name: "strokeWidth", op: 1208, type: "number", value: 0 }, { name: "xuid", op: 14, type: [], value: null }, { name: "charset", op: 15, type: "offset", value: 0 }, { name: "encoding", op: 16, type: "offset", value: 0 }, { name: "charStrings", op: 17, type: "offset", value: 0 }, { name: "private", op: 18, type: ["number", "offset"], value: [0, 0] }, { name: "ros", op: 1230, type: ["SID", "SID", "number"] }, { name: "cidFontVersion", op: 1231, type: "number", value: 0 }, { name: "cidFontRevision", op: 1232, type: "number", value: 0 }, { name: "cidFontType", op: 1233, type: "number", value: 0 }, { name: "cidCount", op: 1234, type: "number", value: 8720 }, { name: "uidBase", op: 1235, type: "number" }, { name: "fdArray", op: 1236, type: "offset" }, { name: "fdSelect", op: 1237, type: "offset" }, { name: "fontName", op: 1238, type: "SID" }];
var q0 = [{ name: "subrs", op: 19, type: "offset", value: 0 }, { name: "defaultWidthX", op: 20, type: "number", value: 0 }, { name: "nominalWidthX", op: 21, type: "number", value: 0 }];
function X0(e, t) {
  var r = dl(e, 0, e.byteLength);
  return vl(r, H0, t);
}
__name(X0, "X0");
function gl(e, t, r, n) {
  var i = dl(e, t, r);
  return vl(i, q0, n);
}
__name(gl, "gl");
function js(e, t, r, n) {
  for (var i = [], a = 0; a < r.length; a += 1) {
    var o = new DataView(new Uint8Array(r[a]).buffer), l = X0(o, n);
    l._subrs = [], l._subrsBias = 0, l._defaultWidthX = 0, l._nominalWidthX = 0;
    var s = l.private[0], u = l.private[1];
    if (s !== 0 && u !== 0) {
      var f = gl(e, u + t, s, n);
      if (l._defaultWidthX = f.defaultWidthX, l._nominalWidthX = f.nominalWidthX, f.subrs !== 0) {
        var c = u + f.subrs, h = sr(e, c + t);
        l._subrs = h.objects, l._subrsBias = sa(l._subrs);
      }
      l._privateDict = f;
    }
    i.push(l);
  }
  return i;
}
__name(js, "js");
function Y0(e, t, r, n) {
  var i, a, o = new se.Parser(e, t);
  r -= 1;
  var l = [".notdef"], s = o.parseCard8();
  if (s === 0) for (var u = 0; u < r; u += 1) i = o.parseSID(), l.push($r(n, i));
  else if (s === 1) for (; l.length <= r; ) {
    i = o.parseSID(), a = o.parseCard8();
    for (var f = 0; f <= a; f += 1) l.push($r(n, i)), i += 1;
  }
  else if (s === 2) for (; l.length <= r; ) {
    i = o.parseSID(), a = o.parseCard16();
    for (var c = 0; c <= a; c += 1) l.push($r(n, i)), i += 1;
  }
  else throw new Error("Unknown charset format " + s);
  return l;
}
__name(Y0, "Y0");
function Z0(e, t, r) {
  var n, i = {}, a = new se.Parser(e, t), o = a.parseCard8();
  if (o === 0) for (var l = a.parseCard8(), s = 0; s < l; s += 1) n = a.parseCard8(), i[n] = s;
  else if (o === 1) {
    var u = a.parseCard8();
    n = 1;
    for (var f = 0; f < u; f += 1) for (var c = a.parseCard8(), h = a.parseCard8(), p = c; p <= c + h; p += 1) i[p] = n, n += 1;
  } else throw new Error("Unknown encoding format " + o);
  return new On(i, r);
}
__name(Z0, "Z0");
function zs(e, t, r) {
  var n, i, a, o, l = new at(), s = [], u = 0, f = false, c = false, h = 0, p = 0, m, v, g, y;
  if (e.isCIDFont) {
    var x = e.tables.cff.topDict._fdSelect[t.index], _ = e.tables.cff.topDict._fdArray[x];
    m = _._subrs, v = _._subrsBias, g = _._defaultWidthX, y = _._nominalWidthX;
  } else m = e.tables.cff.topDict._subrs, v = e.tables.cff.topDict._subrsBias, g = e.tables.cff.topDict._defaultWidthX, y = e.tables.cff.topDict._nominalWidthX;
  var L = g;
  function T(C, D) {
    c && l.closePath(), l.moveTo(C, D), c = true;
  }
  __name(T, "T");
  function E() {
    var C;
    C = s.length % 2 !== 0, C && !f && (L = s.shift() + y), u += s.length >> 1, s.length = 0, f = true;
  }
  __name(E, "E");
  function R(C) {
    for (var D, M, H, Q, ee, P, U, O, X, K, ne, ie, V = 0; V < C.length; ) {
      var Y = C[V];
      switch (V += 1, Y) {
        case 1:
          E();
          break;
        case 3:
          E();
          break;
        case 4:
          s.length > 1 && !f && (L = s.shift() + y, f = true), p += s.pop(), T(h, p);
          break;
        case 5:
          for (; s.length > 0; ) h += s.shift(), p += s.shift(), l.lineTo(h, p);
          break;
        case 6:
          for (; s.length > 0 && (h += s.shift(), l.lineTo(h, p), s.length !== 0); ) p += s.shift(), l.lineTo(h, p);
          break;
        case 7:
          for (; s.length > 0 && (p += s.shift(), l.lineTo(h, p), s.length !== 0); ) h += s.shift(), l.lineTo(h, p);
          break;
        case 8:
          for (; s.length > 0; ) n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o + s.shift(), l.curveTo(n, i, a, o, h, p);
          break;
        case 10:
          ee = s.pop() + v, P = m[ee], P && R(P);
          break;
        case 11:
          return;
        case 12:
          switch (Y = C[V], V += 1, Y) {
            case 35:
              n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), U = a + s.shift(), O = o + s.shift(), X = U + s.shift(), K = O + s.shift(), ne = X + s.shift(), ie = K + s.shift(), h = ne + s.shift(), p = ie + s.shift(), s.shift(), l.curveTo(n, i, a, o, U, O), l.curveTo(X, K, ne, ie, h, p);
              break;
            case 34:
              n = h + s.shift(), i = p, a = n + s.shift(), o = i + s.shift(), U = a + s.shift(), O = o, X = U + s.shift(), K = o, ne = X + s.shift(), ie = p, h = ne + s.shift(), l.curveTo(n, i, a, o, U, O), l.curveTo(X, K, ne, ie, h, p);
              break;
            case 36:
              n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), U = a + s.shift(), O = o, X = U + s.shift(), K = o, ne = X + s.shift(), ie = K + s.shift(), h = ne + s.shift(), l.curveTo(n, i, a, o, U, O), l.curveTo(X, K, ne, ie, h, p);
              break;
            case 37:
              n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), U = a + s.shift(), O = o + s.shift(), X = U + s.shift(), K = O + s.shift(), ne = X + s.shift(), ie = K + s.shift(), Math.abs(ne - h) > Math.abs(ie - p) ? h = ne + s.shift() : p = ie + s.shift(), l.curveTo(n, i, a, o, U, O), l.curveTo(X, K, ne, ie, h, p);
              break;
            default:
              console.log("Glyph " + t.index + ": unknown operator 1200" + Y), s.length = 0;
          }
          break;
        case 14:
          s.length > 0 && !f && (L = s.shift() + y, f = true), c && (l.closePath(), c = false);
          break;
        case 18:
          E();
          break;
        case 19:
        case 20:
          E(), V += u + 7 >> 3;
          break;
        case 21:
          s.length > 2 && !f && (L = s.shift() + y, f = true), p += s.pop(), h += s.pop(), T(h, p);
          break;
        case 22:
          s.length > 1 && !f && (L = s.shift() + y, f = true), h += s.pop(), T(h, p);
          break;
        case 23:
          E();
          break;
        case 24:
          for (; s.length > 2; ) n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o + s.shift(), l.curveTo(n, i, a, o, h, p);
          h += s.shift(), p += s.shift(), l.lineTo(h, p);
          break;
        case 25:
          for (; s.length > 6; ) h += s.shift(), p += s.shift(), l.lineTo(h, p);
          n = h + s.shift(), i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o + s.shift(), l.curveTo(n, i, a, o, h, p);
          break;
        case 26:
          for (s.length % 2 && (h += s.shift()); s.length > 0; ) n = h, i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a, p = o + s.shift(), l.curveTo(n, i, a, o, h, p);
          break;
        case 27:
          for (s.length % 2 && (p += s.shift()); s.length > 0; ) n = h + s.shift(), i = p, a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o, l.curveTo(n, i, a, o, h, p);
          break;
        case 28:
          D = C[V], M = C[V + 1], s.push((D << 24 | M << 16) >> 16), V += 2;
          break;
        case 29:
          ee = s.pop() + e.gsubrsBias, P = e.gsubrs[ee], P && R(P);
          break;
        case 30:
          for (; s.length > 0 && (n = h, i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o + (s.length === 1 ? s.shift() : 0), l.curveTo(n, i, a, o, h, p), s.length !== 0); ) n = h + s.shift(), i = p, a = n + s.shift(), o = i + s.shift(), p = o + s.shift(), h = a + (s.length === 1 ? s.shift() : 0), l.curveTo(n, i, a, o, h, p);
          break;
        case 31:
          for (; s.length > 0 && (n = h + s.shift(), i = p, a = n + s.shift(), o = i + s.shift(), p = o + s.shift(), h = a + (s.length === 1 ? s.shift() : 0), l.curveTo(n, i, a, o, h, p), s.length !== 0); ) n = h, i = p + s.shift(), a = n + s.shift(), o = i + s.shift(), h = a + s.shift(), p = o + (s.length === 1 ? s.shift() : 0), l.curveTo(n, i, a, o, h, p);
          break;
        default:
          Y < 32 ? console.log("Glyph " + t.index + ": unknown operator " + Y) : Y < 247 ? s.push(Y - 139) : Y < 251 ? (D = C[V], V += 1, s.push((Y - 247) * 256 + D + 108)) : Y < 255 ? (D = C[V], V += 1, s.push(-(Y - 251) * 256 - D - 108)) : (D = C[V], M = C[V + 1], H = C[V + 2], Q = C[V + 3], V += 4, s.push((D << 24 | M << 16 | H << 8 | Q) / 65536));
      }
    }
  }
  __name(R, "R");
  return R(r), t.advanceWidth = L, l;
}
__name(zs, "zs");
function J0(e, t, r, n) {
  var i = [], a, o = new se.Parser(e, t), l = o.parseCard8();
  if (l === 0) for (var s = 0; s < r; s++) {
    if (a = o.parseCard8(), a >= n) throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + n + ")");
    i.push(a);
  }
  else if (l === 3) {
    var u = o.parseCard16(), f = o.parseCard16();
    if (f !== 0) throw new Error("CFF Table CID Font FDSelect format 3 range has bad initial GID " + f);
    for (var c, h = 0; h < u; h++) {
      if (a = o.parseCard8(), c = o.parseCard16(), a >= n) throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + n + ")");
      if (c > r) throw new Error("CFF Table CID Font FDSelect format 3 range has bad GID " + c);
      for (; f < c; f++) i.push(a);
      f = c;
    }
    if (c !== r) throw new Error("CFF Table CID Font FDSelect format 3 range has bad final GID " + c);
  } else throw new Error("CFF Table CID Font FDSelect table has unsupported format " + l);
  return i;
}
__name(J0, "J0");
function Q0(e, t, r, n) {
  r.tables.cff = {};
  var i = V0(e, t), a = sr(e, i.endOffset, se.bytesToString), o = sr(e, a.endOffset), l = sr(e, o.endOffset, se.bytesToString), s = sr(e, l.endOffset);
  r.gsubrs = s.objects, r.gsubrsBias = sa(r.gsubrs);
  var u = js(e, t, o.objects, l.objects);
  if (u.length !== 1) throw new Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = " + u.length);
  var f = u[0];
  if (r.tables.cff.topDict = f, f._privateDict && (r.defaultWidthX = f._privateDict.defaultWidthX, r.nominalWidthX = f._privateDict.nominalWidthX), f.ros[0] !== void 0 && f.ros[1] !== void 0 && (r.isCIDFont = true), r.isCIDFont) {
    var c = f.fdArray, h = f.fdSelect;
    if (c === 0 || h === 0) throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
    c += t;
    var p = sr(e, c), m = js(e, t, p.objects, l.objects);
    f._fdArray = m, h += t, f._fdSelect = J0(e, h, r.numGlyphs, m.length);
  }
  var v = t + f.private[1], g = gl(e, v, f.private[0], l.objects);
  if (r.defaultWidthX = g.defaultWidthX, r.nominalWidthX = g.nominalWidthX, g.subrs !== 0) {
    var y = v + g.subrs, x = sr(e, y);
    r.subrs = x.objects, r.subrsBias = sa(r.subrs);
  } else r.subrs = [], r.subrsBias = 0;
  var _;
  n.lowMemory ? (_ = B0(e, t + f.charStrings), r.nGlyphs = _.offsets.length) : (_ = sr(e, t + f.charStrings), r.nGlyphs = _.objects.length);
  var L = Y0(e, t + f.charset, r.nGlyphs, l.objects);
  if (f.encoding === 0 ? r.cffEncoding = new On(fp, L) : f.encoding === 1 ? r.cffEncoding = new On(cp, L) : r.cffEncoding = Z0(e, t + f.encoding, L), r.encoding = r.encoding || r.cffEncoding, r.glyphs = new jt.GlyphSet(r), n.lowMemory) r._push = function(R) {
    var C = G0(R, _.offsets, e, t + f.charStrings);
    r.glyphs.push(R, jt.cffGlyphLoader(r, R, zs, C));
  };
  else for (var T = 0; T < r.nGlyphs; T += 1) {
    var E = _.objects[T];
    r.glyphs.push(T, jt.cffGlyphLoader(r, T, zs, E));
  }
}
__name(Q0, "Q0");
var K0 = { parse: Q0 };
function ev(e, t, r) {
  var n = {}, i = new se.Parser(e, t);
  return n.tag = i.parseTag(), n.minValue = i.parseFixed(), n.defaultValue = i.parseFixed(), n.maxValue = i.parseFixed(), i.skip("uShort", 1), n.name = r[i.parseUShort()] || {}, n;
}
__name(ev, "ev");
function tv(e, t, r, n) {
  var i = {}, a = new se.Parser(e, t);
  i.name = n[a.parseUShort()] || {}, a.skip("uShort", 1), i.coordinates = {};
  for (var o = 0; o < r.length; ++o) i.coordinates[r[o].tag] = a.parseFixed();
  return i;
}
__name(tv, "tv");
function rv(e, t, r) {
  var n = new se.Parser(e, t), i = n.parseULong();
  Ae.argument(i === 65536, "Unsupported fvar table version.");
  var a = n.parseOffset16();
  n.skip("uShort", 1);
  for (var o = n.parseUShort(), l = n.parseUShort(), s = n.parseUShort(), u = n.parseUShort(), f = [], c = 0; c < o; c++) f.push(ev(e, t + a + c * l, r));
  for (var h = [], p = t + a + o * l, m = 0; m < s; m++) h.push(tv(e, p + m * u, f, r));
  return { axes: f, instances: h };
}
__name(rv, "rv");
var nv = { parse: rv };
var iv = /* @__PURE__ */ __name(function() {
  return { coverage: this.parsePointer(W.coverage), attachPoints: this.parseList(W.pointer(W.uShortList)) };
}, "iv");
var av = /* @__PURE__ */ __name(function() {
  var e = this.parseUShort();
  if (Ae.argument(e === 1 || e === 2 || e === 3, "Unsupported CaretValue table version."), e === 1) return { coordinate: this.parseShort() };
  if (e === 2) return { pointindex: this.parseShort() };
  if (e === 3) return { coordinate: this.parseShort() };
}, "av");
var ov = /* @__PURE__ */ __name(function() {
  return this.parseList(W.pointer(av));
}, "ov");
var sv = /* @__PURE__ */ __name(function() {
  return { coverage: this.parsePointer(W.coverage), ligGlyphs: this.parseList(W.pointer(ov)) };
}, "sv");
var lv = /* @__PURE__ */ __name(function() {
  return this.parseUShort(), this.parseList(W.pointer(W.coverage));
}, "lv");
function uv(e, t) {
  t = t || 0;
  var r = new W(e, t), n = r.parseVersion(1);
  Ae.argument(n === 1 || n === 1.2 || n === 1.3, "Unsupported GDEF table version.");
  var i = { version: n, classDef: r.parsePointer(W.classDef), attachList: r.parsePointer(iv), ligCaretList: r.parsePointer(sv), markAttachClassDef: r.parsePointer(W.classDef) };
  return n >= 1.2 && (i.markGlyphSets = r.parsePointer(lv)), i;
}
__name(uv, "uv");
var fv = { parse: uv };
var Ot = new Array(10);
Ot[1] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1) return { posFormat: 1, coverage: this.parsePointer(W.coverage), value: this.parseValueRecord() };
  if (r === 2) return { posFormat: 2, coverage: this.parsePointer(W.coverage), values: this.parseValueRecordList() };
  Ae.assert(false, "0x" + t.toString(16) + ": GPOS lookup type 1 format must be 1 or 2.");
};
Ot[2] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  Ae.assert(r === 1 || r === 2, "0x" + t.toString(16) + ": GPOS lookup type 2 format must be 1 or 2.");
  var n = this.parsePointer(W.coverage), i = this.parseUShort(), a = this.parseUShort();
  if (r === 1) return { posFormat: r, coverage: n, valueFormat1: i, valueFormat2: a, pairSets: this.parseList(W.pointer(W.list(function() {
    return { secondGlyph: this.parseUShort(), value1: this.parseValueRecord(i), value2: this.parseValueRecord(a) };
  }))) };
  if (r === 2) {
    var o = this.parsePointer(W.classDef), l = this.parsePointer(W.classDef), s = this.parseUShort(), u = this.parseUShort();
    return { posFormat: r, coverage: n, valueFormat1: i, valueFormat2: a, classDef1: o, classDef2: l, class1Count: s, class2Count: u, classRecords: this.parseList(s, W.list(u, function() {
      return { value1: this.parseValueRecord(i), value2: this.parseValueRecord(a) };
    })) };
  }
};
Ot[3] = function() {
  return { error: "GPOS Lookup 3 not supported" };
};
Ot[4] = function() {
  return { error: "GPOS Lookup 4 not supported" };
};
Ot[5] = function() {
  return { error: "GPOS Lookup 5 not supported" };
};
Ot[6] = function() {
  return { error: "GPOS Lookup 6 not supported" };
};
Ot[7] = function() {
  return { error: "GPOS Lookup 7 not supported" };
};
Ot[8] = function() {
  return { error: "GPOS Lookup 8 not supported" };
};
Ot[9] = function() {
  return { error: "GPOS Lookup 9 not supported" };
};
function cv(e, t) {
  t = t || 0;
  var r = new W(e, t), n = r.parseVersion(1);
  return Ae.argument(n === 1 || n === 1.1, "Unsupported GPOS table version " + n), n === 1 ? { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(Ot) } : { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(Ot), variations: r.parseFeatureVariationsList() };
}
__name(cv, "cv");
var hv = { parse: cv };
var At = new Array(9);
At[1] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1) return { substFormat: 1, coverage: this.parsePointer(W.coverage), deltaGlyphId: this.parseUShort() };
  if (r === 2) return { substFormat: 2, coverage: this.parsePointer(W.coverage), substitute: this.parseOffset16List() };
  Ae.assert(false, "0x" + t.toString(16) + ": lookup type 1 format must be 1 or 2.");
};
At[2] = function() {
  var t = this.parseUShort();
  return Ae.argument(t === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer(W.coverage), sequences: this.parseListOfLists() };
};
At[3] = function() {
  var t = this.parseUShort();
  return Ae.argument(t === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer(W.coverage), alternateSets: this.parseListOfLists() };
};
At[4] = function() {
  var t = this.parseUShort();
  return Ae.argument(t === 1, "GSUB ligature table identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer(W.coverage), ligatureSets: this.parseListOfLists(function() {
    return { ligGlyph: this.parseUShort(), components: this.parseUShortList(this.parseUShort() - 1) };
  }) };
};
var Pr = { sequenceIndex: W.uShort, lookupListIndex: W.uShort };
At[5] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1) return { substFormat: r, coverage: this.parsePointer(W.coverage), ruleSets: this.parseListOfLists(function() {
    var a = this.parseUShort(), o = this.parseUShort();
    return { input: this.parseUShortList(a - 1), lookupRecords: this.parseRecordList(o, Pr) };
  }) };
  if (r === 2) return { substFormat: r, coverage: this.parsePointer(W.coverage), classDef: this.parsePointer(W.classDef), classSets: this.parseListOfLists(function() {
    var a = this.parseUShort(), o = this.parseUShort();
    return { classes: this.parseUShortList(a - 1), lookupRecords: this.parseRecordList(o, Pr) };
  }) };
  if (r === 3) {
    var n = this.parseUShort(), i = this.parseUShort();
    return { substFormat: r, coverages: this.parseList(n, W.pointer(W.coverage)), lookupRecords: this.parseRecordList(i, Pr) };
  }
  Ae.assert(false, "0x" + t.toString(16) + ": lookup type 5 format must be 1, 2 or 3.");
};
At[6] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1) return { substFormat: 1, coverage: this.parsePointer(W.coverage), chainRuleSets: this.parseListOfLists(function() {
    return { backtrack: this.parseUShortList(), input: this.parseUShortList(this.parseShort() - 1), lookahead: this.parseUShortList(), lookupRecords: this.parseRecordList(Pr) };
  }) };
  if (r === 2) return { substFormat: 2, coverage: this.parsePointer(W.coverage), backtrackClassDef: this.parsePointer(W.classDef), inputClassDef: this.parsePointer(W.classDef), lookaheadClassDef: this.parsePointer(W.classDef), chainClassSet: this.parseListOfLists(function() {
    return { backtrack: this.parseUShortList(), input: this.parseUShortList(this.parseShort() - 1), lookahead: this.parseUShortList(), lookupRecords: this.parseRecordList(Pr) };
  }) };
  if (r === 3) return { substFormat: 3, backtrackCoverage: this.parseList(W.pointer(W.coverage)), inputCoverage: this.parseList(W.pointer(W.coverage)), lookaheadCoverage: this.parseList(W.pointer(W.coverage)), lookupRecords: this.parseRecordList(Pr) };
  Ae.assert(false, "0x" + t.toString(16) + ": lookup type 6 format must be 1, 2 or 3.");
};
At[7] = function() {
  var t = this.parseUShort();
  Ae.argument(t === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
  var r = this.parseUShort(), n = new W(this.data, this.offset + this.parseULong());
  return { substFormat: 1, lookupType: r, extension: At[r].call(n) };
};
At[8] = function() {
  var t = this.parseUShort();
  return Ae.argument(t === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer(W.coverage), backtrackCoverage: this.parseList(W.pointer(W.coverage)), lookaheadCoverage: this.parseList(W.pointer(W.coverage)), substitutes: this.parseUShortList() };
};
function pv(e, t) {
  t = t || 0;
  var r = new W(e, t), n = r.parseVersion(1);
  return Ae.argument(n === 1 || n === 1.1, "Unsupported GSUB table version."), n === 1 ? { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(At) } : { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(At), variations: r.parseFeatureVariationsList() };
}
__name(pv, "pv");
var dv = { parse: pv };
function vv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.fontRevision = Math.round(n.parseFixed() * 1e3) / 1e3, r.checkSumAdjustment = n.parseULong(), r.magicNumber = n.parseULong(), Ae.argument(r.magicNumber === 1594834165, "Font header has wrong magic number."), r.flags = n.parseUShort(), r.unitsPerEm = n.parseUShort(), r.created = n.parseLongDateTime(), r.modified = n.parseLongDateTime(), r.xMin = n.parseShort(), r.yMin = n.parseShort(), r.xMax = n.parseShort(), r.yMax = n.parseShort(), r.macStyle = n.parseUShort(), r.lowestRecPPEM = n.parseUShort(), r.fontDirectionHint = n.parseShort(), r.indexToLocFormat = n.parseShort(), r.glyphDataFormat = n.parseShort(), r;
}
__name(vv, "vv");
var gv = { parse: vv };
function mv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.ascender = n.parseShort(), r.descender = n.parseShort(), r.lineGap = n.parseShort(), r.advanceWidthMax = n.parseUShort(), r.minLeftSideBearing = n.parseShort(), r.minRightSideBearing = n.parseShort(), r.xMaxExtent = n.parseShort(), r.caretSlopeRise = n.parseShort(), r.caretSlopeRun = n.parseShort(), r.caretOffset = n.parseShort(), n.relativeOffset += 8, r.metricDataFormat = n.parseShort(), r.numberOfHMetrics = n.parseUShort(), r;
}
__name(mv, "mv");
var bv = { parse: mv };
function yv(e, t, r, n, i) {
  for (var a, o, l = new se.Parser(e, t), s = 0; s < n; s += 1) {
    s < r && (a = l.parseUShort(), o = l.parseShort());
    var u = i.get(s);
    u.advanceWidth = a, u.leftSideBearing = o;
  }
}
__name(yv, "yv");
function xv(e, t, r, n, i) {
  e._hmtxTableData = {};
  for (var a, o, l = new se.Parser(t, r), s = 0; s < i; s += 1) s < n && (a = l.parseUShort(), o = l.parseShort()), e._hmtxTableData[s] = { advanceWidth: a, leftSideBearing: o };
}
__name(xv, "xv");
function wv(e, t, r, n, i, a, o) {
  o.lowMemory ? xv(e, t, r, n, i) : yv(t, r, n, i, a);
}
__name(wv, "wv");
var Sv = { parse: wv };
function Ev(e) {
  var t = {};
  e.skip("uShort");
  var r = e.parseUShort();
  Ae.argument(r === 0, "Unsupported kern sub-table version."), e.skip("uShort", 2);
  var n = e.parseUShort();
  e.skip("uShort", 3);
  for (var i = 0; i < n; i += 1) {
    var a = e.parseUShort(), o = e.parseUShort(), l = e.parseShort();
    t[a + "," + o] = l;
  }
  return t;
}
__name(Ev, "Ev");
function kv(e) {
  var t = {};
  e.skip("uShort");
  var r = e.parseULong();
  r > 1 && console.warn("Only the first kern subtable is supported."), e.skip("uLong");
  var n = e.parseUShort(), i = n & 255;
  if (e.skip("uShort"), i === 0) {
    var a = e.parseUShort();
    e.skip("uShort", 3);
    for (var o = 0; o < a; o += 1) {
      var l = e.parseUShort(), s = e.parseUShort(), u = e.parseShort();
      t[l + "," + s] = u;
    }
  }
  return t;
}
__name(kv, "kv");
function Tv(e, t) {
  var r = new se.Parser(e, t), n = r.parseUShort();
  if (n === 0) return Ev(r);
  if (n === 1) return kv(r);
  throw new Error("Unsupported kern table version (" + n + ").");
}
__name(Tv, "Tv");
var _v = { parse: Tv };
function Lv(e, t) {
  var r = new se.Parser(e, t), n = r.parseULong();
  Ae.argument(n === 1, "Unsupported ltag table version."), r.skip("uLong", 1);
  for (var i = r.parseULong(), a = [], o = 0; o < i; o++) {
    for (var l = "", s = t + r.parseUShort(), u = r.parseUShort(), f = s; f < s + u; ++f) l += String.fromCharCode(e.getInt8(f));
    a.push(l);
  }
  return a;
}
__name(Lv, "Lv");
var Cv = { parse: Lv };
function Ov(e, t, r, n) {
  for (var i = new se.Parser(e, t), a = n ? i.parseUShort : i.parseULong, o = [], l = 0; l < r + 1; l += 1) {
    var s = a.call(i);
    n && (s *= 2), o.push(s);
  }
  return o;
}
__name(Ov, "Ov");
var Av = { parse: Ov };
function Pv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.numGlyphs = n.parseUShort(), r.version === 1 && (r.maxPoints = n.parseUShort(), r.maxContours = n.parseUShort(), r.maxCompositePoints = n.parseUShort(), r.maxCompositeContours = n.parseUShort(), r.maxZones = n.parseUShort(), r.maxTwilightPoints = n.parseUShort(), r.maxStorage = n.parseUShort(), r.maxFunctionDefs = n.parseUShort(), r.maxInstructionDefs = n.parseUShort(), r.maxStackElements = n.parseUShort(), r.maxSizeOfInstructions = n.parseUShort(), r.maxComponentElements = n.parseUShort(), r.maxComponentDepth = n.parseUShort()), r;
}
__name(Pv, "Pv");
var Iv = { parse: Pv };
function Rv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  r.version = n.parseUShort(), r.xAvgCharWidth = n.parseShort(), r.usWeightClass = n.parseUShort(), r.usWidthClass = n.parseUShort(), r.fsType = n.parseUShort(), r.ySubscriptXSize = n.parseShort(), r.ySubscriptYSize = n.parseShort(), r.ySubscriptXOffset = n.parseShort(), r.ySubscriptYOffset = n.parseShort(), r.ySuperscriptXSize = n.parseShort(), r.ySuperscriptYSize = n.parseShort(), r.ySuperscriptXOffset = n.parseShort(), r.ySuperscriptYOffset = n.parseShort(), r.yStrikeoutSize = n.parseShort(), r.yStrikeoutPosition = n.parseShort(), r.sFamilyClass = n.parseShort(), r.panose = [];
  for (var i = 0; i < 10; i++) r.panose[i] = n.parseByte();
  return r.ulUnicodeRange1 = n.parseULong(), r.ulUnicodeRange2 = n.parseULong(), r.ulUnicodeRange3 = n.parseULong(), r.ulUnicodeRange4 = n.parseULong(), r.achVendID = String.fromCharCode(n.parseByte(), n.parseByte(), n.parseByte(), n.parseByte()), r.fsSelection = n.parseUShort(), r.usFirstCharIndex = n.parseUShort(), r.usLastCharIndex = n.parseUShort(), r.sTypoAscender = n.parseShort(), r.sTypoDescender = n.parseShort(), r.sTypoLineGap = n.parseShort(), r.usWinAscent = n.parseUShort(), r.usWinDescent = n.parseUShort(), r.version >= 1 && (r.ulCodePageRange1 = n.parseULong(), r.ulCodePageRange2 = n.parseULong()), r.version >= 2 && (r.sxHeight = n.parseShort(), r.sCapHeight = n.parseShort(), r.usDefaultChar = n.parseUShort(), r.usBreakChar = n.parseUShort(), r.usMaxContent = n.parseUShort()), r;
}
__name(Rv, "Rv");
var Fv = { parse: Rv };
function Dv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  switch (r.version = n.parseVersion(), r.italicAngle = n.parseFixed(), r.underlinePosition = n.parseShort(), r.underlineThickness = n.parseShort(), r.isFixedPitch = n.parseULong(), r.minMemType42 = n.parseULong(), r.maxMemType42 = n.parseULong(), r.minMemType1 = n.parseULong(), r.maxMemType1 = n.parseULong(), r.names = [], r.version) {
    case 1:
      break;
    case 2:
      r.numberOfGlyphs = n.parseUShort(), r.glyphNameIndex = new Array(r.numberOfGlyphs);
      for (var i = 0; i < r.numberOfGlyphs; i++) r.glyphNameIndex[i] = n.parseUShort();
      break;
    case 2.5:
      r.numberOfGlyphs = n.parseUShort(), r.offset = new Array(r.numberOfGlyphs);
      for (var a = 0; a < r.numberOfGlyphs; a++) r.offset[a] = n.parseChar();
      break;
  }
  return r;
}
__name(Dv, "Dv");
var Uv = { parse: Dv };
var Rn = {};
Rn.UTF8 = function(e, t, r) {
  for (var n = [], i = r, a = 0; a < i; a++, t += 1) n[a] = e.getUint8(t);
  return String.fromCharCode.apply(null, n);
};
Rn.UTF16 = function(e, t, r) {
  for (var n = [], i = r / 2, a = 0; a < i; a++, t += 2) n[a] = e.getUint16(t);
  return String.fromCharCode.apply(null, n);
};
var Nv = { "x-mac-croatian": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\u0160\u2122\xB4\xA8\u2260\u017D\xD8\u221E\xB1\u2264\u2265\u2206\xB5\u2202\u2211\u220F\u0161\u222B\xAA\xBA\u03A9\u017E\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u0106\xAB\u010C\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u0110\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\uF8FF\xA9\u2044\u20AC\u2039\u203A\xC6\xBB\u2013\xB7\u201A\u201E\u2030\xC2\u0107\xC1\u010D\xC8\xCD\xCE\xCF\xCC\xD3\xD4\u0111\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u03C0\xCB\u02DA\xB8\xCA\xE6\u02C7", "x-mac-cyrillic": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u2020\xB0\u0490\xA3\xA7\u2022\xB6\u0406\xAE\xA9\u2122\u0402\u0452\u2260\u0403\u0453\u221E\xB1\u2264\u2265\u0456\xB5\u0491\u0408\u0404\u0454\u0407\u0457\u0409\u0459\u040A\u045A\u0458\u0405\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\u040B\u045B\u040C\u045C\u0455\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u201E\u040E\u045E\u040F\u045F\u2116\u0401\u0451\u044F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E", "x-mac-gaelic": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u1E02\xB1\u2264\u2265\u1E03\u010A\u010B\u1E0A\u1E0B\u1E1E\u1E1F\u0120\u0121\u1E40\xE6\xF8\u1E41\u1E56\u1E57\u027C\u0192\u017F\u1E60\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\u1E61\u1E9B\xFF\u0178\u1E6A\u20AC\u2039\u203A\u0176\u0177\u1E6B\xB7\u1EF2\u1EF3\u204A\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\u2663\xD2\xDA\xDB\xD9\u0131\xDD\xFD\u0174\u0175\u1E84\u1E85\u1E80\u1E81\u1E82\u1E83", "x-mac-greek": "\xC4\xB9\xB2\xC9\xB3\xD6\xDC\u0385\xE0\xE2\xE4\u0384\xA8\xE7\xE9\xE8\xEA\xEB\xA3\u2122\xEE\xEF\u2022\xBD\u2030\xF4\xF6\xA6\u20AC\xF9\xFB\xFC\u2020\u0393\u0394\u0398\u039B\u039E\u03A0\xDF\xAE\xA9\u03A3\u03AA\xA7\u2260\xB0\xB7\u0391\xB1\u2264\u2265\xA5\u0392\u0395\u0396\u0397\u0399\u039A\u039C\u03A6\u03AB\u03A8\u03A9\u03AC\u039D\xAC\u039F\u03A1\u2248\u03A4\xAB\xBB\u2026\xA0\u03A5\u03A7\u0386\u0388\u0153\u2013\u2015\u201C\u201D\u2018\u2019\xF7\u0389\u038A\u038C\u038E\u03AD\u03AE\u03AF\u03CC\u038F\u03CD\u03B1\u03B2\u03C8\u03B4\u03B5\u03C6\u03B3\u03B7\u03B9\u03BE\u03BA\u03BB\u03BC\u03BD\u03BF\u03C0\u03CE\u03C1\u03C3\u03C4\u03B8\u03C9\u03C2\u03C7\u03C5\u03B6\u03CA\u03CB\u0390\u03B0\xAD", "x-mac-icelandic": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\xDD\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\xD0\xF0\xDE\xFE\xFD\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-inuit": "\u1403\u1404\u1405\u1406\u140A\u140B\u1431\u1432\u1433\u1434\u1438\u1439\u1449\u144E\u144F\u1450\u1451\u1455\u1456\u1466\u146D\u146E\u146F\u1470\u1472\u1473\u1483\u148B\u148C\u148D\u148E\u1490\u1491\xB0\u14A1\u14A5\u14A6\u2022\xB6\u14A7\xAE\xA9\u2122\u14A8\u14AA\u14AB\u14BB\u14C2\u14C3\u14C4\u14C5\u14C7\u14C8\u14D0\u14EF\u14F0\u14F1\u14F2\u14F4\u14F5\u1505\u14D5\u14D6\u14D7\u14D8\u14DA\u14DB\u14EA\u1528\u1529\u152A\u152B\u152D\u2026\xA0\u152E\u153E\u1555\u1556\u1557\u2013\u2014\u201C\u201D\u2018\u2019\u1558\u1559\u155A\u155D\u1546\u1547\u1548\u1549\u154B\u154C\u1550\u157F\u1580\u1581\u1582\u1583\u1584\u1585\u158F\u1590\u1591\u1592\u1593\u1594\u1595\u1671\u1672\u1673\u1674\u1675\u1676\u1596\u15A0\u15A1\u15A2\u15A3\u15A4\u15A5\u15A6\u157C\u0141\u0142", "x-mac-ce": "\xC4\u0100\u0101\xC9\u0104\xD6\xDC\xE1\u0105\u010C\xE4\u010D\u0106\u0107\xE9\u0179\u017A\u010E\xED\u010F\u0112\u0113\u0116\xF3\u0117\xF4\xF6\xF5\xFA\u011A\u011B\xFC\u2020\xB0\u0118\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\u0119\xA8\u2260\u0123\u012E\u012F\u012A\u2264\u2265\u012B\u0136\u2202\u2211\u0142\u013B\u013C\u013D\u013E\u0139\u013A\u0145\u0146\u0143\xAC\u221A\u0144\u0147\u2206\xAB\xBB\u2026\xA0\u0148\u0150\xD5\u0151\u014C\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\u014D\u0154\u0155\u0158\u2039\u203A\u0159\u0156\u0157\u0160\u201A\u201E\u0161\u015A\u015B\xC1\u0164\u0165\xCD\u017D\u017E\u016A\xD3\xD4\u016B\u016E\xDA\u016F\u0170\u0171\u0172\u0173\xDD\xFD\u0137\u017B\u0141\u017C\u0122\u02C7", macintosh: "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\u2039\u203A\uFB01\uFB02\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-romanian": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\u0102\u0218\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\u0103\u0219\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\u2039\u203A\u021A\u021B\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-turkish": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u011E\u011F\u0130\u0131\u015E\u015F\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\uF8A0\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7" };
Rn.MACSTRING = function(e, t, r, n) {
  var i = Nv[n];
  if (i !== void 0) {
    for (var a = "", o = 0; o < r; o++) {
      var l = e.getUint8(t + o);
      l <= 127 ? a += String.fromCharCode(l) : a += i[l & 127];
    }
    return a;
  }
};
function Mv(e, t) {
  var r = new se.Parser(e, t), n = r.parseULong();
  Ae.argument(n === 1, "Unsupported META table version."), r.parseULong(), r.parseULong();
  for (var i = r.parseULong(), a = {}, o = 0; o < i; o++) {
    var l = r.parseTag(), s = r.parseULong(), u = r.parseULong(), f = Rn.UTF8(e, t + s, u);
    a[l] = f;
  }
  return a;
}
__name(Mv, "Mv");
var Wv = { parse: Mv };
function Vs(e, t) {
  for (var r = [], n = 12, i = 0; i < t; i += 1) {
    var a = se.getTag(e, n), o = se.getULong(e, n + 4), l = se.getULong(e, n + 8), s = se.getULong(e, n + 12);
    r.push({ tag: a, checksum: o, offset: l, length: s, compression: false }), n += 16;
  }
  return r;
}
__name(Vs, "Vs");
function Bv(e, t) {
  for (var r = [], n = 44, i = 0; i < t; i += 1) {
    var a = se.getTag(e, n), o = se.getULong(e, n + 4), l = se.getULong(e, n + 8), s = se.getULong(e, n + 12), u = void 0;
    l < s ? u = "WOFF" : u = false, r.push({ tag: a, offset: o, compression: u, compressedLength: l, length: s }), n += 20;
  }
  return r;
}
__name(Bv, "Bv");
function je(e, t) {
  if (t.compression === "WOFF") {
    var r = new Uint8Array(e.buffer, t.offset + 2, t.compressedLength - 2), n = new Uint8Array(t.length);
    if (op(r, n), n.byteLength !== t.length) throw new Error("Decompression error: " + t.tag + " decompressed length doesn't match recorded length");
    var i = new DataView(n.buffer, 0);
    return { data: i, offset: 0 };
  } else return { data: e, offset: t.offset };
}
__name(je, "je");
function Gv(e, t) {
  t = t ?? {};
  var r, n = new ot({ empty: true }), i = new DataView(e, 0), a, o = [], l = se.getTag(i, 0);
  if (l === "\0\0\0" || l === "true" || l === "typ1") n.outlinesFormat = "truetype", a = se.getUShort(i, 4), o = Vs(i, a);
  else if (l === "OTTO") n.outlinesFormat = "cff", a = se.getUShort(i, 4), o = Vs(i, a);
  else if (l === "wOFF") {
    var s = se.getTag(i, 4);
    if (s === "\0\0\0") n.outlinesFormat = "truetype";
    else if (s === "OTTO") n.outlinesFormat = "cff";
    else throw new Error("Unsupported OpenType flavor " + l);
    a = se.getUShort(i, 12), o = Bv(i, a);
  } else throw new Error("Unsupported OpenType signature " + l);
  for (var u, f, c, h, p, m, v, g, y, x, _, L = 0; L < a; L += 1) {
    var T = o[L], E = void 0;
    switch (T.tag) {
      case "cmap":
        E = je(i, T), n.tables.cmap = W0.parse(E.data, E.offset), n.encoding = new el(n.tables.cmap);
        break;
      case "cvt ":
        E = je(i, T), _ = new se.Parser(E.data, E.offset), n.tables.cvt = _.parseShortList(T.length / 2);
        break;
      case "fvar":
        f = T;
        break;
      case "fpgm":
        E = je(i, T), _ = new se.Parser(E.data, E.offset), n.tables.fpgm = _.parseByteList(T.length);
        break;
      case "head":
        E = je(i, T), n.tables.head = gv.parse(E.data, E.offset), n.unitsPerEm = n.tables.head.unitsPerEm, r = n.tables.head.indexToLocFormat;
        break;
      case "hhea":
        E = je(i, T), n.tables.hhea = bv.parse(E.data, E.offset), n.ascender = n.tables.hhea.ascender, n.descender = n.tables.hhea.descender, n.numberOfHMetrics = n.tables.hhea.numberOfHMetrics;
        break;
      case "hmtx":
        v = T;
        break;
      case "ltag":
        E = je(i, T), ltagTable = Cv.parse(E.data, E.offset);
        break;
      case "maxp":
        E = je(i, T), n.tables.maxp = Iv.parse(E.data, E.offset), n.numGlyphs = n.tables.maxp.numGlyphs;
        break;
      case "OS/2":
        E = je(i, T), n.tables.os2 = Fv.parse(E.data, E.offset);
        break;
      case "post":
        E = je(i, T), n.tables.post = Uv.parse(E.data, E.offset);
        break;
      case "prep":
        E = je(i, T), _ = new se.Parser(E.data, E.offset), n.tables.prep = _.parseByteList(T.length);
        break;
      case "glyf":
        c = T;
        break;
      case "loca":
        y = T;
        break;
      case "CFF ":
        u = T;
        break;
      case "kern":
        g = T;
        break;
      case "GDEF":
        h = T;
        break;
      case "GPOS":
        p = T;
        break;
      case "GSUB":
        m = T;
        break;
      case "meta":
        x = T;
        break;
    }
  }
  if (c && y) {
    var R = r === 0, C = je(i, y), D = Av.parse(C.data, C.offset, n.numGlyphs, R), M = je(i, c);
    n.glyphs = ol.parse(M.data, M.offset, D, n, t);
  } else if (u) {
    var H = je(i, u);
    K0.parse(H.data, H.offset, n, t);
  } else throw new Error("Font doesn't contain TrueType or CFF outlines.");
  var Q = je(i, v);
  if (Sv.parse(n, Q.data, Q.offset, n.numberOfHMetrics, n.numGlyphs, n.glyphs, t), dp(n, t), g) {
    var ee = je(i, g);
    n.kerningPairs = _v.parse(ee.data, ee.offset);
  } else n.kerningPairs = {};
  if (h) {
    var P = je(i, h);
    n.tables.gdef = fv.parse(P.data, P.offset);
  }
  if (p) {
    var U = je(i, p);
    n.tables.gpos = hv.parse(U.data, U.offset), n.position.init();
  }
  if (m) {
    var O = je(i, m);
    n.tables.gsub = dv.parse(O.data, O.offset);
  }
  if (f) {
    var X = je(i, f);
    n.tables.fvar = nv.parse(X.data, X.offset, n.names);
  }
  if (x) {
    var K = je(i, x);
    n.tables.meta = Wv.parse(K.data, K.offset), n.metas = n.tables.meta;
  }
  return n;
}
__name(Gv, "Gv");
function $v() {
}
__name($v, "$v");
function jv() {
}
__name(jv, "jv");
var zv = Object.freeze({ __proto__: null, Font: ot, Glyph: Jt, Path: at, _parse: se, parse: Gv, load: $v, loadSync: jv });
var Fn = zv;
var Vv = Object.create;
var Qn = Object.defineProperty;
var Hv = Object.getOwnPropertyDescriptor;
var qv = Object.getOwnPropertyNames;
var Xv = Object.getPrototypeOf;
var Yv = Object.prototype.hasOwnProperty;
var Ia = /* @__PURE__ */ __name((e, t) => () => (e && (t = e(e = 0)), t), "Ia");
var ue = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "ue");
var Ra = /* @__PURE__ */ __name((e, t) => {
  for (var r in t) Qn(e, r, { get: t[r], enumerable: true });
}, "Ra");
var jl = /* @__PURE__ */ __name((e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function") for (let i of qv(t)) !Yv.call(e, i) && i !== r && Qn(e, i, { get: /* @__PURE__ */ __name(() => t[i], "get"), enumerable: !(n = Hv(t, i)) || n.enumerable });
  return e;
}, "jl");
var Zv = /* @__PURE__ */ __name((e, t, r) => (r = e != null ? Vv(Xv(e)) : {}, jl(t || !e || !e.__esModule ? Qn(r, "default", { value: e, enumerable: true }) : r, e)), "Zv");
var Zn = /* @__PURE__ */ __name((e) => jl(Qn({}, "__esModule", { value: true }), e), "Zn");
var zl = {};
Ra(zl, { getYogaModule: /* @__PURE__ */ __name(() => Jv, "getYogaModule") });
async function Jv() {
  return {};
}
__name(Jv, "Jv");
var Qv = Ia(() => {
});
var Vl = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    if (r = `${r}`, r === "0") return "0";
    if (/^[+-]?(\d+|\d*\.\d+)(e[+-]?\d+)?(%|\w+)?$/.test(r)) return r.replace(/^[+-]?/, (n) => n === "-" ? "" : "-");
    if (r.includes("var(") || r.includes("calc(")) return `calc(${r} * -1)`;
  }
  __name(t, "t");
});
var Kv = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  var t = ["preflight", "container", "accessibility", "pointerEvents", "visibility", "position", "inset", "isolation", "zIndex", "order", "gridColumn", "gridColumnStart", "gridColumnEnd", "gridRow", "gridRowStart", "gridRowEnd", "float", "clear", "margin", "boxSizing", "display", "aspectRatio", "height", "maxHeight", "minHeight", "width", "minWidth", "maxWidth", "flex", "flexShrink", "flexGrow", "flexBasis", "tableLayout", "borderCollapse", "borderSpacing", "transformOrigin", "translate", "rotate", "skew", "scale", "transform", "animation", "cursor", "touchAction", "userSelect", "resize", "scrollSnapType", "scrollSnapAlign", "scrollSnapStop", "scrollMargin", "scrollPadding", "listStylePosition", "listStyleType", "appearance", "columns", "breakBefore", "breakInside", "breakAfter", "gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridTemplateColumns", "gridTemplateRows", "flexDirection", "flexWrap", "placeContent", "placeItems", "alignContent", "alignItems", "justifyContent", "justifyItems", "gap", "space", "divideWidth", "divideStyle", "divideColor", "divideOpacity", "placeSelf", "alignSelf", "justifySelf", "overflow", "overscrollBehavior", "scrollBehavior", "textOverflow", "whitespace", "wordBreak", "borderRadius", "borderWidth", "borderStyle", "borderColor", "borderOpacity", "backgroundColor", "backgroundOpacity", "backgroundImage", "gradientColorStops", "boxDecorationBreak", "backgroundSize", "backgroundAttachment", "backgroundClip", "backgroundPosition", "backgroundRepeat", "backgroundOrigin", "fill", "stroke", "strokeWidth", "objectFit", "objectPosition", "padding", "textAlign", "textIndent", "verticalAlign", "fontFamily", "fontSize", "fontWeight", "textTransform", "fontStyle", "fontVariantNumeric", "lineHeight", "letterSpacing", "textColor", "textOpacity", "textDecoration", "textDecorationColor", "textDecorationStyle", "textDecorationThickness", "textUnderlineOffset", "fontSmoothing", "placeholderColor", "placeholderOpacity", "caretColor", "accentColor", "opacity", "backgroundBlendMode", "mixBlendMode", "boxShadow", "boxShadowColor", "outlineStyle", "outlineWidth", "outlineOffset", "outlineColor", "ringWidth", "ringColor", "ringOpacity", "ringOffsetWidth", "ringOffsetColor", "blur", "brightness", "contrast", "dropShadow", "grayscale", "hueRotate", "invert", "saturate", "sepia", "filter", "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale", "backdropHueRotate", "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia", "backdropFilter", "transitionProperty", "transitionDelay", "transitionDuration", "transitionTimingFunction", "willChange", "content"];
});
var eg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r, n) {
    return r === void 0 ? n : Array.isArray(r) ? r : [...new Set(n.filter((i) => r !== false && r[i] !== false).concat(Object.keys(r).filter((i) => r[i] !== false)))];
  }
  __name(t, "t");
});
var Hl = ue((e, t) => {
  t.exports = { content: [], presets: [], darkMode: "media", theme: { screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" }, colors: /* @__PURE__ */ __name(({ colors: r }) => ({ inherit: r.inherit, current: r.current, transparent: r.transparent, black: r.black, white: r.white, slate: r.slate, gray: r.gray, zinc: r.zinc, neutral: r.neutral, stone: r.stone, red: r.red, orange: r.orange, amber: r.amber, yellow: r.yellow, lime: r.lime, green: r.green, emerald: r.emerald, teal: r.teal, cyan: r.cyan, sky: r.sky, blue: r.blue, indigo: r.indigo, violet: r.violet, purple: r.purple, fuchsia: r.fuchsia, pink: r.pink, rose: r.rose }), "colors"), columns: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", "3xs": "16rem", "2xs": "18rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem" }, spacing: { px: "1px", 0: "0px", 0.5: "0.125rem", 1: "0.25rem", 1.5: "0.375rem", 2: "0.5rem", 2.5: "0.625rem", 3: "0.75rem", 3.5: "0.875rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem", 11: "2.75rem", 12: "3rem", 14: "3.5rem", 16: "4rem", 20: "5rem", 24: "6rem", 28: "7rem", 32: "8rem", 36: "9rem", 40: "10rem", 44: "11rem", 48: "12rem", 52: "13rem", 56: "14rem", 60: "15rem", 64: "16rem", 72: "18rem", 80: "20rem", 96: "24rem" }, animation: { none: "none", spin: "spin 1s linear infinite", ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite", pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", bounce: "bounce 1s infinite" }, aspectRatio: { auto: "auto", square: "1 / 1", video: "16 / 9" }, backdropBlur: /* @__PURE__ */ __name(({ theme: r }) => r("blur"), "backdropBlur"), backdropBrightness: /* @__PURE__ */ __name(({ theme: r }) => r("brightness"), "backdropBrightness"), backdropContrast: /* @__PURE__ */ __name(({ theme: r }) => r("contrast"), "backdropContrast"), backdropGrayscale: /* @__PURE__ */ __name(({ theme: r }) => r("grayscale"), "backdropGrayscale"), backdropHueRotate: /* @__PURE__ */ __name(({ theme: r }) => r("hueRotate"), "backdropHueRotate"), backdropInvert: /* @__PURE__ */ __name(({ theme: r }) => r("invert"), "backdropInvert"), backdropOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("opacity"), "backdropOpacity"), backdropSaturate: /* @__PURE__ */ __name(({ theme: r }) => r("saturate"), "backdropSaturate"), backdropSepia: /* @__PURE__ */ __name(({ theme: r }) => r("sepia"), "backdropSepia"), backgroundColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "backgroundColor"), backgroundImage: { none: "none", "gradient-to-t": "linear-gradient(to top, var(--tw-gradient-stops))", "gradient-to-tr": "linear-gradient(to top right, var(--tw-gradient-stops))", "gradient-to-r": "linear-gradient(to right, var(--tw-gradient-stops))", "gradient-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))", "gradient-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))", "gradient-to-bl": "linear-gradient(to bottom left, var(--tw-gradient-stops))", "gradient-to-l": "linear-gradient(to left, var(--tw-gradient-stops))", "gradient-to-tl": "linear-gradient(to top left, var(--tw-gradient-stops))" }, backgroundOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("opacity"), "backgroundOpacity"), backgroundPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, backgroundSize: { auto: "auto", cover: "cover", contain: "contain" }, blur: { 0: "0", none: "0", sm: "4px", DEFAULT: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "40px", "3xl": "64px" }, brightness: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5", 200: "2" }, borderColor: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("colors"), DEFAULT: r("colors.gray.200", "currentColor") }), "borderColor"), borderOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("opacity"), "borderOpacity"), borderRadius: { none: "0px", sm: "0.125rem", DEFAULT: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" }, borderSpacing: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing") }), "borderSpacing"), borderWidth: { DEFAULT: "1px", 0: "0px", 2: "2px", 4: "4px", 8: "8px" }, boxShadow: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)", inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)", none: "none" }, boxShadowColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "boxShadowColor"), caretColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "caretColor"), accentColor: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("colors"), auto: "auto" }), "accentColor"), contrast: { 0: "0", 50: ".5", 75: ".75", 100: "1", 125: "1.25", 150: "1.5", 200: "2" }, container: {}, content: { none: "none" }, cursor: { auto: "auto", default: "default", pointer: "pointer", wait: "wait", text: "text", move: "move", help: "help", "not-allowed": "not-allowed", none: "none", "context-menu": "context-menu", progress: "progress", cell: "cell", crosshair: "crosshair", "vertical-text": "vertical-text", alias: "alias", copy: "copy", "no-drop": "no-drop", grab: "grab", grabbing: "grabbing", "all-scroll": "all-scroll", "col-resize": "col-resize", "row-resize": "row-resize", "n-resize": "n-resize", "e-resize": "e-resize", "s-resize": "s-resize", "w-resize": "w-resize", "ne-resize": "ne-resize", "nw-resize": "nw-resize", "se-resize": "se-resize", "sw-resize": "sw-resize", "ew-resize": "ew-resize", "ns-resize": "ns-resize", "nesw-resize": "nesw-resize", "nwse-resize": "nwse-resize", "zoom-in": "zoom-in", "zoom-out": "zoom-out" }, divideColor: /* @__PURE__ */ __name(({ theme: r }) => r("borderColor"), "divideColor"), divideOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("borderOpacity"), "divideOpacity"), divideWidth: /* @__PURE__ */ __name(({ theme: r }) => r("borderWidth"), "divideWidth"), dropShadow: { sm: "0 1px 1px rgb(0 0 0 / 0.05)", DEFAULT: ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"], md: ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"], lg: ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"], xl: ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"], "2xl": "0 25px 25px rgb(0 0 0 / 0.15)", none: "0 0 #0000" }, fill: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "fill"), grayscale: { 0: "0", DEFAULT: "100%" }, hueRotate: { 0: "0deg", 15: "15deg", 30: "30deg", 60: "60deg", 90: "90deg", 180: "180deg" }, invert: { 0: "0", DEFAULT: "100%" }, flex: { 1: "1 1 0%", auto: "1 1 auto", initial: "0 1 auto", none: "none" }, flexBasis: /* @__PURE__ */ __name(({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%" }), "flexBasis"), flexGrow: { 0: "0", DEFAULT: "1" }, flexShrink: { 0: "0", DEFAULT: "1" }, fontFamily: { sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", '"Noto Sans"', "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'], serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"], mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", '"Liberation Mono"', '"Courier New"', "monospace"] }, fontSize: { xs: ["0.75rem", { lineHeight: "1rem" }], sm: ["0.875rem", { lineHeight: "1.25rem" }], base: ["1rem", { lineHeight: "1.5rem" }], lg: ["1.125rem", { lineHeight: "1.75rem" }], xl: ["1.25rem", { lineHeight: "1.75rem" }], "2xl": ["1.5rem", { lineHeight: "2rem" }], "3xl": ["1.875rem", { lineHeight: "2.25rem" }], "4xl": ["2.25rem", { lineHeight: "2.5rem" }], "5xl": ["3rem", { lineHeight: "1" }], "6xl": ["3.75rem", { lineHeight: "1" }], "7xl": ["4.5rem", { lineHeight: "1" }], "8xl": ["6rem", { lineHeight: "1" }], "9xl": ["8rem", { lineHeight: "1" }] }, fontWeight: { thin: "100", extralight: "200", light: "300", normal: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800", black: "900" }, gap: /* @__PURE__ */ __name(({ theme: r }) => r("spacing"), "gap"), gradientColorStops: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "gradientColorStops"), gridAutoColumns: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridAutoRows: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridColumn: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-7": "span 7 / span 7", "span-8": "span 8 / span 8", "span-9": "span 9 / span 9", "span-10": "span 10 / span 10", "span-11": "span 11 / span 11", "span-12": "span 12 / span 12", "span-full": "1 / -1" }, gridColumnEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridColumnStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridRow: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-full": "1 / -1" }, gridRowStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7" }, gridRowEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7" }, gridTemplateColumns: { none: "none", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))", 7: "repeat(7, minmax(0, 1fr))", 8: "repeat(8, minmax(0, 1fr))", 9: "repeat(9, minmax(0, 1fr))", 10: "repeat(10, minmax(0, 1fr))", 11: "repeat(11, minmax(0, 1fr))", 12: "repeat(12, minmax(0, 1fr))" }, gridTemplateRows: { none: "none", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))" }, height: /* @__PURE__ */ __name(({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }), "height"), inset: /* @__PURE__ */ __name(({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), "inset"), keyframes: { spin: { to: { transform: "rotate(360deg)" } }, ping: { "75%, 100%": { transform: "scale(2)", opacity: "0" } }, pulse: { "50%": { opacity: ".5" } }, bounce: { "0%, 100%": { transform: "translateY(-25%)", animationTimingFunction: "cubic-bezier(0.8,0,1,1)" }, "50%": { transform: "none", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" } } }, letterSpacing: { tighter: "-0.05em", tight: "-0.025em", normal: "0em", wide: "0.025em", wider: "0.05em", widest: "0.1em" }, lineHeight: { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2", 3: ".75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem" }, listStyleType: { none: "none", disc: "disc", decimal: "decimal" }, margin: /* @__PURE__ */ __name(({ theme: r }) => ({ auto: "auto", ...r("spacing") }), "margin"), maxHeight: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing"), full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }), "maxHeight"), maxWidth: /* @__PURE__ */ __name(({ theme: r, breakpoints: n }) => ({ none: "none", 0: "0rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem", full: "100%", min: "min-content", max: "max-content", fit: "fit-content", prose: "65ch", ...n(r("screens")) }), "maxWidth"), minHeight: { 0: "0px", full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }, minWidth: { 0: "0px", full: "100%", min: "min-content", max: "max-content", fit: "fit-content" }, objectPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, opacity: { 0: "0", 5: "0.05", 10: "0.1", 20: "0.2", 25: "0.25", 30: "0.3", 40: "0.4", 50: "0.5", 60: "0.6", 70: "0.7", 75: "0.75", 80: "0.8", 90: "0.9", 95: "0.95", 100: "1" }, order: { first: "-9999", last: "9999", none: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12" }, padding: /* @__PURE__ */ __name(({ theme: r }) => r("spacing"), "padding"), placeholderColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "placeholderColor"), placeholderOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("opacity"), "placeholderOpacity"), outlineColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "outlineColor"), outlineOffset: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, outlineWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, ringColor: /* @__PURE__ */ __name(({ theme: r }) => ({ DEFAULT: r("colors.blue.500", "#3b82f6"), ...r("colors") }), "ringColor"), ringOffsetColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "ringOffsetColor"), ringOffsetWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, ringOpacity: /* @__PURE__ */ __name(({ theme: r }) => ({ DEFAULT: "0.5", ...r("opacity") }), "ringOpacity"), ringWidth: { DEFAULT: "3px", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, rotate: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg", 45: "45deg", 90: "90deg", 180: "180deg" }, saturate: { 0: "0", 50: ".5", 100: "1", 150: "1.5", 200: "2" }, scale: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5" }, scrollMargin: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing") }), "scrollMargin"), scrollPadding: /* @__PURE__ */ __name(({ theme: r }) => r("spacing"), "scrollPadding"), sepia: { 0: "0", DEFAULT: "100%" }, skew: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg" }, space: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing") }), "space"), stroke: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "stroke"), strokeWidth: { 0: "0", 1: "1", 2: "2" }, textColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "textColor"), textDecorationColor: /* @__PURE__ */ __name(({ theme: r }) => r("colors"), "textDecorationColor"), textDecorationThickness: { auto: "auto", "from-font": "from-font", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, textUnderlineOffset: { auto: "auto", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, textIndent: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing") }), "textIndent"), textOpacity: /* @__PURE__ */ __name(({ theme: r }) => r("opacity"), "textOpacity"), transformOrigin: { center: "center", top: "top", "top-right": "top right", right: "right", "bottom-right": "bottom right", bottom: "bottom", "bottom-left": "bottom left", left: "left", "top-left": "top left" }, transitionDelay: { 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionDuration: { DEFAULT: "150ms", 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionProperty: { none: "none", all: "all", DEFAULT: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter", colors: "color, background-color, border-color, text-decoration-color, fill, stroke", opacity: "opacity", shadow: "box-shadow", transform: "transform" }, transitionTimingFunction: { DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", linear: "linear", in: "cubic-bezier(0.4, 0, 1, 1)", out: "cubic-bezier(0, 0, 0.2, 1)", "in-out": "cubic-bezier(0.4, 0, 0.2, 1)" }, translate: /* @__PURE__ */ __name(({ theme: r }) => ({ ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), "translate"), width: /* @__PURE__ */ __name(({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%", screen: "100vw", min: "min-content", max: "max-content", fit: "fit-content" }), "width"), willChange: { auto: "auto", scroll: "scroll-position", contents: "contents", transform: "transform" }, zIndex: { auto: "auto", 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50" } }, variantOrder: ["first", "last", "odd", "even", "visited", "checked", "empty", "read-only", "group-hover", "group-focus", "focus-within", "hover", "focus", "focus-visible", "active", "disabled"], plugins: [] };
});
var Kn = {};
Ra(Kn, { default: /* @__PURE__ */ __name(() => ql, "default") });
var ql;
var Fa = Ia(() => {
  ql = { info(e, t) {
    console.info(...Array.isArray(e) ? [e] : [t, e]);
  }, warn(e, t) {
    console.warn(...Array.isArray(e) ? [e] : [t, e]);
  }, risk(e, t) {
    console.error(...Array.isArray(e) ? [e] : [t, e]);
  } };
});
var tg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => i, "get") });
  var t = r((Fa(), Zn(Kn)));
  function r(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(r, "r");
  function n({ version: a, from: o, to: l }) {
    t.default.warn(`${o}-color-renamed`, [`As of Tailwind CSS ${a}, \`${o}\` has been renamed to \`${l}\`.`, "Update your configuration file to silence this warning."]);
  }
  __name(n, "n");
  var i = { inherit: "inherit", current: "currentColor", transparent: "transparent", black: "#000", white: "#fff", slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337" }, get lightBlue() {
    return n({ version: "v2.2", from: "lightBlue", to: "sky" }), this.sky;
  }, get warmGray() {
    return n({ version: "v3.0", from: "warmGray", to: "stone" }), this.stone;
  }, get trueGray() {
    return n({ version: "v3.0", from: "trueGray", to: "neutral" }), this.neutral;
  }, get coolGray() {
    return n({ version: "v3.0", from: "coolGray", to: "gray" }), this.gray;
  }, get blueGray() {
    return n({ version: "v3.0", from: "blueGray", to: "slate" }), this.slate;
  } };
});
var rg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "defaults", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r, ...n) {
    for (let o of n) {
      for (let l in o) {
        var i;
        !(r == null || (i = r.hasOwnProperty) === null || i === void 0) && i.call(r, l) || (r[l] = o[l]);
      }
      for (let l of Object.getOwnPropertySymbols(o)) {
        var a;
        !(r == null || (a = r.hasOwnProperty) === null || a === void 0) && a.call(r, l) || (r[l] = o[l]);
      }
    }
    return r;
  }
  __name(t, "t");
});
var ng = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "toPath", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    if (Array.isArray(r)) return r;
    let n = r.split("[").length - 1, i = r.split("]").length - 1;
    if (n !== i) throw new Error(`Path is invalid. Has unbalanced brackets: ${r}`);
    return r.split(/\.(?![^\[]*\])|[\[\]]/g).filter(Boolean);
  }
  __name(t, "t");
});
var ig = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "normalizeConfig", { enumerable: true, get: /* @__PURE__ */ __name(() => i, "get") });
  var t = n((Fa(), Zn(Kn)));
  function r(a) {
    if (typeof WeakMap != "function") return null;
    var o = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new WeakMap();
    return (r = /* @__PURE__ */ __name(function(s) {
      return s ? l : o;
    }, "r"))(a);
  }
  __name(r, "r");
  function n(a, o) {
    if (!o && a && a.__esModule) return a;
    if (a === null || typeof a != "object" && typeof a != "function") return { default: a };
    var l = r(o);
    if (l && l.has(a)) return l.get(a);
    var s = {}, u = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var f in a) if (f !== "default" && Object.prototype.hasOwnProperty.call(a, f)) {
      var c = u ? Object.getOwnPropertyDescriptor(a, f) : null;
      c && (c.get || c.set) ? Object.defineProperty(s, f, c) : s[f] = a[f];
    }
    return s.default = a, l && l.set(a, s), s;
  }
  __name(n, "n");
  function i(a) {
    if ((() => {
      if (a.purge || !a.content || !Array.isArray(a.content) && !(typeof a.content == "object" && a.content !== null)) return false;
      if (Array.isArray(a.content)) return a.content.every((l) => typeof l == "string" ? true : !(typeof l?.raw != "string" || l != null && l.extension && typeof l?.extension != "string"));
      if (typeof a.content == "object" && a.content !== null) {
        if (Object.keys(a.content).some((l) => !["files", "extract", "transform"].includes(l))) return false;
        if (Array.isArray(a.content.files)) {
          if (!a.content.files.every((l) => typeof l == "string" ? true : !(typeof l?.raw != "string" || l != null && l.extension && typeof l?.extension != "string"))) return false;
          if (typeof a.content.extract == "object") {
            for (let l of Object.values(a.content.extract)) if (typeof l != "function") return false;
          } else if (!(a.content.extract === void 0 || typeof a.content.extract == "function")) return false;
          if (typeof a.content.transform == "object") {
            for (let l of Object.values(a.content.transform)) if (typeof l != "function") return false;
          } else if (!(a.content.transform === void 0 || typeof a.content.transform == "function")) return false;
        }
        return true;
      }
      return false;
    })() || t.default.warn("purge-deprecation", ["The `purge`/`content` options have changed in Tailwind CSS v3.0.", "Update your configuration file to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#configure-content-sources"]), a.safelist = (() => {
      var l;
      let { content: s, purge: u, safelist: f } = a;
      return Array.isArray(f) ? f : Array.isArray(s?.safelist) ? s.safelist : Array.isArray(u?.safelist) ? u.safelist : Array.isArray(u == null || (l = u.options) === null || l === void 0 ? void 0 : l.safelist) ? u.options.safelist : [];
    })(), typeof a.prefix == "function") t.default.warn("prefix-function", ["As of Tailwind CSS v3.0, `prefix` cannot be a function.", "Update `prefix` in your configuration to be a string to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#prefix-cannot-be-a-function"]), a.prefix = "";
    else {
      var o;
      a.prefix = (o = a.prefix) !== null && o !== void 0 ? o : "";
    }
    a.content = { files: (() => {
      let { content: l, purge: s } = a;
      return Array.isArray(s) ? s : Array.isArray(s?.content) ? s.content : Array.isArray(l) ? l : Array.isArray(l?.content) ? l.content : Array.isArray(l?.files) ? l.files : [];
    })(), extract: (() => {
      let l = (() => {
        var f, c, h, p, m, v, g, y, x, _;
        return !((f = a.purge) === null || f === void 0) && f.extract ? a.purge.extract : !((c = a.content) === null || c === void 0) && c.extract ? a.content.extract : !((h = a.purge) === null || h === void 0 || (p = h.extract) === null || p === void 0) && p.DEFAULT ? a.purge.extract.DEFAULT : !((m = a.content) === null || m === void 0 || (v = m.extract) === null || v === void 0) && v.DEFAULT ? a.content.extract.DEFAULT : !((g = a.purge) === null || g === void 0 || (y = g.options) === null || y === void 0) && y.extractors ? a.purge.options.extractors : !((x = a.content) === null || x === void 0 || (_ = x.options) === null || _ === void 0) && _.extractors ? a.content.options.extractors : {};
      })(), s = {}, u = (() => {
        var f, c, h, p;
        if (!((f = a.purge) === null || f === void 0 || (c = f.options) === null || c === void 0) && c.defaultExtractor) return a.purge.options.defaultExtractor;
        if (!((h = a.content) === null || h === void 0 || (p = h.options) === null || p === void 0) && p.defaultExtractor) return a.content.options.defaultExtractor;
      })();
      if (u !== void 0 && (s.DEFAULT = u), typeof l == "function") s.DEFAULT = l;
      else if (Array.isArray(l)) for (let { extensions: f, extractor: c } of l ?? []) for (let h of f) s[h] = c;
      else typeof l == "object" && l !== null && Object.assign(s, l);
      return s;
    })(), transform: (() => {
      let l = (() => {
        var u, f, c, h, p, m;
        return !((u = a.purge) === null || u === void 0) && u.transform ? a.purge.transform : !((f = a.content) === null || f === void 0) && f.transform ? a.content.transform : !((c = a.purge) === null || c === void 0 || (h = c.transform) === null || h === void 0) && h.DEFAULT ? a.purge.transform.DEFAULT : !((p = a.content) === null || p === void 0 || (m = p.transform) === null || m === void 0) && m.DEFAULT ? a.content.transform.DEFAULT : {};
      })(), s = {};
      return typeof l == "function" && (s.DEFAULT = l), typeof l == "object" && l !== null && Object.assign(s, l), s;
    })() };
    for (let l of a.content.files) if (typeof l == "string" && /{([^,]*?)}/g.test(l)) {
      t.default.warn("invalid-glob-braces", [`The glob pattern ${(0, t.dim)(l)} in your Tailwind CSS configuration is invalid.`, `Update it to ${(0, t.dim)(l.replace(/{([^,]*?)}/g, "$1"))} to silence this warning.`]);
      break;
    }
    return a;
  }
  __name(i, "i");
});
var ag = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    if (Object.prototype.toString.call(r) !== "[object Object]") return false;
    let n = Object.getPrototypeOf(r);
    return n === null || n === Object.prototype;
  }
  __name(t, "t");
});
var og = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "cloneDeep", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    return Array.isArray(r) ? r.map((n) => t(n)) : typeof r == "object" && r !== null ? Object.fromEntries(Object.entries(r).map(([n, i]) => [n, t(i)])) : r;
  }
  __name(t, "t");
});
var Xl = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = i;
  function r(a) {
    for (var o = a.toLowerCase(), l = "", s = false, u = 0; u < 6 && o[u] !== void 0; u++) {
      var f = o.charCodeAt(u), c = f >= 97 && f <= 102 || f >= 48 && f <= 57;
      if (s = f === 32, !c) break;
      l += o[u];
    }
    if (l.length !== 0) {
      var h = parseInt(l, 16), p = h >= 55296 && h <= 57343;
      return p || h === 0 || h > 1114111 ? ["\uFFFD", l.length + (s ? 1 : 0)] : [String.fromCodePoint(h), l.length + (s ? 1 : 0)];
    }
  }
  __name(r, "r");
  var n = /\\/;
  function i(a) {
    var o = n.test(a);
    if (!o) return a;
    for (var l = "", s = 0; s < a.length; s++) {
      if (a[s] === "\\") {
        var u = r(a.slice(s + 1, s + 7));
        if (u !== void 0) {
          l += u[0], s += u[1];
          continue;
        }
        if (a[s + 1] === "\\") {
          l += "\\", s++;
          continue;
        }
        a.length === s + 1 && (l += a[s]);
        continue;
      }
      l += a[s];
    }
    return l;
  }
  __name(i, "i");
  t.exports = e.default;
});
var sg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = arguments.length, a = new Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++) a[o - 1] = arguments[o];
    for (; a.length > 0; ) {
      var l = a.shift();
      if (!n[l]) return;
      n = n[l];
    }
    return n;
  }
  __name(r, "r");
  t.exports = e.default;
});
var lg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = arguments.length, a = new Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++) a[o - 1] = arguments[o];
    for (; a.length > 0; ) {
      var l = a.shift();
      n[l] || (n[l] = {}), n = n[l];
    }
  }
  __name(r, "r");
  t.exports = e.default;
});
var ug = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = "", a = n.indexOf("/*"), o = 0; a >= 0; ) {
      i = i + n.slice(o, a);
      var l = n.indexOf("*/", a + 2);
      if (l < 0) return i;
      o = l + 2, a = n.indexOf("/*", o);
    }
    return i = i + n.slice(o), i;
  }
  __name(r, "r");
  t.exports = e.default;
});
var ei = ue((e) => {
  "use strict";
  e.__esModule = true, e.stripComments = e.ensureObject = e.getProp = e.unesc = void 0;
  var t = a(Xl());
  e.unesc = t.default;
  var r = a(sg());
  e.getProp = r.default;
  var n = a(lg());
  e.ensureObject = n.default;
  var i = a(ug());
  e.stripComments = i.default;
  function a(o) {
    return o && o.__esModule ? o : { default: o };
  }
  __name(a, "a");
});
var hr = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = ei();
  function n(l, s) {
    for (var u = 0; u < s.length; u++) {
      var f = s[u];
      f.enumerable = f.enumerable || false, f.configurable = true, "value" in f && (f.writable = true), Object.defineProperty(l, f.key, f);
    }
  }
  __name(n, "n");
  function i(l, s, u) {
    return s && n(l.prototype, s), u && n(l, u), l;
  }
  __name(i, "i");
  var a = /* @__PURE__ */ __name(function l(s, u) {
    if (typeof s != "object" || s === null) return s;
    var f = new s.constructor();
    for (var c in s) if (s.hasOwnProperty(c)) {
      var h = s[c], p = typeof h;
      c === "parent" && p === "object" ? u && (f[c] = u) : h instanceof Array ? f[c] = h.map(function(m) {
        return l(m, f);
      }) : f[c] = l(h, f);
    }
    return f;
  }, "l"), o = (function() {
    function l(u) {
      u === void 0 && (u = {}), Object.assign(this, u), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
    }
    __name(l, "l");
    var s = l.prototype;
    return s.remove = function() {
      return this.parent && this.parent.removeChild(this), this.parent = void 0, this;
    }, s.replaceWith = function() {
      if (this.parent) {
        for (var u in arguments) this.parent.insertBefore(this, arguments[u]);
        this.remove();
      }
      return this;
    }, s.next = function() {
      return this.parent.at(this.parent.index(this) + 1);
    }, s.prev = function() {
      return this.parent.at(this.parent.index(this) - 1);
    }, s.clone = function(u) {
      u === void 0 && (u = {});
      var f = a(this);
      for (var c in u) f[c] = u[c];
      return f;
    }, s.appendToPropertyAndEscape = function(u, f, c) {
      this.raws || (this.raws = {});
      var h = this[u], p = this.raws[u];
      this[u] = h + f, p || c !== f ? this.raws[u] = (p || h) + c : delete this.raws[u];
    }, s.setPropertyAndEscape = function(u, f, c) {
      this.raws || (this.raws = {}), this[u] = f, this.raws[u] = c;
    }, s.setPropertyWithoutEscape = function(u, f) {
      this[u] = f, this.raws && delete this.raws[u];
    }, s.isAtPosition = function(u, f) {
      if (this.source && this.source.start && this.source.end) return !(this.source.start.line > u || this.source.end.line < u || this.source.start.line === u && this.source.start.column > f || this.source.end.line === u && this.source.end.column < f);
    }, s.stringifyProperty = function(u) {
      return this.raws && this.raws[u] || this[u];
    }, s.valueToString = function() {
      return String(this.stringifyProperty("value"));
    }, s.toString = function() {
      return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
    }, i(l, [{ key: "rawSpaceBefore", get: /* @__PURE__ */ __name(function() {
      var u = this.raws && this.raws.spaces && this.raws.spaces.before;
      return u === void 0 && (u = this.spaces && this.spaces.before), u || "";
    }, "get"), set: /* @__PURE__ */ __name(function(u) {
      (0, r.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = u;
    }, "set") }, { key: "rawSpaceAfter", get: /* @__PURE__ */ __name(function() {
      var u = this.raws && this.raws.spaces && this.raws.spaces.after;
      return u === void 0 && (u = this.spaces.after), u || "";
    }, "get"), set: /* @__PURE__ */ __name(function(u) {
      (0, r.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = u;
    }, "set") }]), l;
  })();
  e.default = o, t.exports = e.default;
});
var st = ue((e) => {
  "use strict";
  e.__esModule = true, e.UNIVERSAL = e.ATTRIBUTE = e.CLASS = e.COMBINATOR = e.COMMENT = e.ID = e.NESTING = e.PSEUDO = e.ROOT = e.SELECTOR = e.STRING = e.TAG = void 0;
  var t = "tag";
  e.TAG = t;
  var r = "string";
  e.STRING = r;
  var n = "selector";
  e.SELECTOR = n;
  var i = "root";
  e.ROOT = i;
  var a = "pseudo";
  e.PSEUDO = a;
  var o = "nesting";
  e.NESTING = o;
  var l = "id";
  e.ID = l;
  var s = "comment";
  e.COMMENT = s;
  var u = "combinator";
  e.COMBINATOR = u;
  var f = "class";
  e.CLASS = f;
  var c = "attribute";
  e.ATTRIBUTE = c;
  var h = "universal";
  e.UNIVERSAL = h;
});
var Da = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(hr()), n = a(st());
  function i() {
    if (typeof WeakMap != "function") return null;
    var v = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return v;
    }, "i"), v;
  }
  __name(i, "i");
  function a(v) {
    if (v && v.__esModule) return v;
    if (v === null || typeof v != "object" && typeof v != "function") return { default: v };
    var g = i();
    if (g && g.has(v)) return g.get(v);
    var y = {}, x = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var _ in v) if (Object.prototype.hasOwnProperty.call(v, _)) {
      var L = x ? Object.getOwnPropertyDescriptor(v, _) : null;
      L && (L.get || L.set) ? Object.defineProperty(y, _, L) : y[_] = v[_];
    }
    return y.default = v, g && g.set(v, y), y;
  }
  __name(a, "a");
  function o(v) {
    return v && v.__esModule ? v : { default: v };
  }
  __name(o, "o");
  function l(v, g) {
    var y;
    if (typeof Symbol > "u" || v[Symbol.iterator] == null) {
      if (Array.isArray(v) || (y = s(v)) || g && v && typeof v.length == "number") {
        y && (v = y);
        var x = 0;
        return function() {
          return x >= v.length ? { done: true } : { done: false, value: v[x++] };
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    return y = v[Symbol.iterator](), y.next.bind(y);
  }
  __name(l, "l");
  function s(v, g) {
    if (v) {
      if (typeof v == "string") return u(v, g);
      var y = Object.prototype.toString.call(v).slice(8, -1);
      if (y === "Object" && v.constructor && (y = v.constructor.name), y === "Map" || y === "Set") return Array.from(v);
      if (y === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(y)) return u(v, g);
    }
  }
  __name(s, "s");
  function u(v, g) {
    (g == null || g > v.length) && (g = v.length);
    for (var y = 0, x = new Array(g); y < g; y++) x[y] = v[y];
    return x;
  }
  __name(u, "u");
  function f(v, g) {
    for (var y = 0; y < g.length; y++) {
      var x = g[y];
      x.enumerable = x.enumerable || false, x.configurable = true, "value" in x && (x.writable = true), Object.defineProperty(v, x.key, x);
    }
  }
  __name(f, "f");
  function c(v, g, y) {
    return g && f(v.prototype, g), y && f(v, y), v;
  }
  __name(c, "c");
  function h(v, g) {
    v.prototype = Object.create(g.prototype), v.prototype.constructor = v, p(v, g);
  }
  __name(h, "h");
  function p(v, g) {
    return p = Object.setPrototypeOf || function(y, x) {
      return y.__proto__ = x, y;
    }, p(v, g);
  }
  __name(p, "p");
  var m = (function(v) {
    h(g, v);
    function g(x) {
      var _;
      return _ = v.call(this, x) || this, _.nodes || (_.nodes = []), _;
    }
    __name(g, "g");
    var y = g.prototype;
    return y.append = function(x) {
      return x.parent = this, this.nodes.push(x), this;
    }, y.prepend = function(x) {
      return x.parent = this, this.nodes.unshift(x), this;
    }, y.at = function(x) {
      return this.nodes[x];
    }, y.index = function(x) {
      return typeof x == "number" ? x : this.nodes.indexOf(x);
    }, y.removeChild = function(x) {
      x = this.index(x), this.at(x).parent = void 0, this.nodes.splice(x, 1);
      var _;
      for (var L in this.indexes) _ = this.indexes[L], _ >= x && (this.indexes[L] = _ - 1);
      return this;
    }, y.removeAll = function() {
      for (var x = l(this.nodes), _; !(_ = x()).done; ) {
        var L = _.value;
        L.parent = void 0;
      }
      return this.nodes = [], this;
    }, y.empty = function() {
      return this.removeAll();
    }, y.insertAfter = function(x, _) {
      _.parent = this;
      var L = this.index(x);
      this.nodes.splice(L + 1, 0, _), _.parent = this;
      var T;
      for (var E in this.indexes) T = this.indexes[E], L <= T && (this.indexes[E] = T + 1);
      return this;
    }, y.insertBefore = function(x, _) {
      _.parent = this;
      var L = this.index(x);
      this.nodes.splice(L, 0, _), _.parent = this;
      var T;
      for (var E in this.indexes) T = this.indexes[E], T <= L && (this.indexes[E] = T + 1);
      return this;
    }, y._findChildAtPosition = function(x, _) {
      var L = void 0;
      return this.each(function(T) {
        if (T.atPosition) {
          var E = T.atPosition(x, _);
          if (E) return L = E, false;
        } else if (T.isAtPosition(x, _)) return L = T, false;
      }), L;
    }, y.atPosition = function(x, _) {
      if (this.isAtPosition(x, _)) return this._findChildAtPosition(x, _) || this;
    }, y._inferEndPosition = function() {
      this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
    }, y.each = function(x) {
      this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
      var _ = this.lastEach;
      if (this.indexes[_] = 0, !!this.length) {
        for (var L, T; this.indexes[_] < this.length && (L = this.indexes[_], T = x(this.at(L), L), T !== false); ) this.indexes[_] += 1;
        if (delete this.indexes[_], T === false) return false;
      }
    }, y.walk = function(x) {
      return this.each(function(_, L) {
        var T = x(_, L);
        if (T !== false && _.length && (T = _.walk(x)), T === false) return false;
      });
    }, y.walkAttributes = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.ATTRIBUTE) return x.call(_, L);
      });
    }, y.walkClasses = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.CLASS) return x.call(_, L);
      });
    }, y.walkCombinators = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.COMBINATOR) return x.call(_, L);
      });
    }, y.walkComments = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.COMMENT) return x.call(_, L);
      });
    }, y.walkIds = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.ID) return x.call(_, L);
      });
    }, y.walkNesting = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.NESTING) return x.call(_, L);
      });
    }, y.walkPseudos = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.PSEUDO) return x.call(_, L);
      });
    }, y.walkTags = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.TAG) return x.call(_, L);
      });
    }, y.walkUniversals = function(x) {
      var _ = this;
      return this.walk(function(L) {
        if (L.type === n.UNIVERSAL) return x.call(_, L);
      });
    }, y.split = function(x) {
      var _ = this, L = [];
      return this.reduce(function(T, E, R) {
        var C = x.call(_, E);
        return L.push(E), C ? (T.push(L), L = []) : R === _.length - 1 && T.push(L), T;
      }, []);
    }, y.map = function(x) {
      return this.nodes.map(x);
    }, y.reduce = function(x, _) {
      return this.nodes.reduce(x, _);
    }, y.every = function(x) {
      return this.nodes.every(x);
    }, y.some = function(x) {
      return this.nodes.some(x);
    }, y.filter = function(x) {
      return this.nodes.filter(x);
    }, y.sort = function(x) {
      return this.nodes.sort(x);
    }, y.toString = function() {
      return this.map(String).join("");
    }, c(g, [{ key: "first", get: /* @__PURE__ */ __name(function() {
      return this.at(0);
    }, "get") }, { key: "last", get: /* @__PURE__ */ __name(function() {
      return this.at(this.length - 1);
    }, "get") }, { key: "length", get: /* @__PURE__ */ __name(function() {
      return this.nodes.length;
    }, "get") }]), g;
  })(r.default);
  e.default = m, t.exports = e.default;
});
var Yl = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Da()), n = st();
  function i(f) {
    return f && f.__esModule ? f : { default: f };
  }
  __name(i, "i");
  function a(f, c) {
    for (var h = 0; h < c.length; h++) {
      var p = c[h];
      p.enumerable = p.enumerable || false, p.configurable = true, "value" in p && (p.writable = true), Object.defineProperty(f, p.key, p);
    }
  }
  __name(a, "a");
  function o(f, c, h) {
    return c && a(f.prototype, c), h && a(f, h), f;
  }
  __name(o, "o");
  function l(f, c) {
    f.prototype = Object.create(c.prototype), f.prototype.constructor = f, s(f, c);
  }
  __name(l, "l");
  function s(f, c) {
    return s = Object.setPrototypeOf || function(h, p) {
      return h.__proto__ = p, h;
    }, s(f, c);
  }
  __name(s, "s");
  var u = (function(f) {
    l(c, f);
    function c(p) {
      var m;
      return m = f.call(this, p) || this, m.type = n.ROOT, m;
    }
    __name(c, "c");
    var h = c.prototype;
    return h.toString = function() {
      var p = this.reduce(function(m, v) {
        return m.push(String(v)), m;
      }, []).join(",");
      return this.trailingComma ? p + "," : p;
    }, h.error = function(p, m) {
      return this._error ? this._error(p, m) : new Error(p);
    }, o(c, [{ key: "errorGenerator", set: /* @__PURE__ */ __name(function(p) {
      this._error = p;
    }, "set") }]), c;
  })(r.default);
  e.default = u, t.exports = e.default;
});
var Zl = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Da()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.SELECTOR, c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var Ua = ue((e, t) => {
  "use strict";
  var r = {}, n = r.hasOwnProperty, i = /* @__PURE__ */ __name(function(u, f) {
    if (!u) return f;
    var c = {};
    for (var h in f) c[h] = n.call(u, h) ? u[h] : f[h];
    return c;
  }, "i"), a = /[ -,\.\/:-@\[-\^`\{-~]/, o = /[ -,\.\/:-@\[\]\^`\{-~]/, l = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, s = /* @__PURE__ */ __name(function u(f, c) {
    c = i(c, u.options), c.quotes != "single" && c.quotes != "double" && (c.quotes = "single");
    for (var h = c.quotes == "double" ? '"' : "'", p = c.isIdentifier, m = f.charAt(0), v = "", g = 0, y = f.length; g < y; ) {
      var x = f.charAt(g++), _ = x.charCodeAt(), L = void 0;
      if (_ < 32 || _ > 126) {
        if (_ >= 55296 && _ <= 56319 && g < y) {
          var T = f.charCodeAt(g++);
          (T & 64512) == 56320 ? _ = ((_ & 1023) << 10) + (T & 1023) + 65536 : g--;
        }
        L = "\\" + _.toString(16).toUpperCase() + " ";
      } else c.escapeEverything ? a.test(x) ? L = "\\" + x : L = "\\" + _.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(x) ? L = "\\" + _.toString(16).toUpperCase() + " " : x == "\\" || !p && (x == '"' && h == x || x == "'" && h == x) || p && o.test(x) ? L = "\\" + x : L = x;
      v += L;
    }
    return p && (/^-[-\d]/.test(v) ? v = "\\-" + v.slice(1) : /\d/.test(m) && (v = "\\3" + m + " " + v.slice(1))), v = v.replace(l, function(E, R, C) {
      return R && R.length % 2 ? E : (R || "") + C;
    }), !p && c.wrap ? h + v + h : v;
  }, "u");
  s.options = { escapeEverything: false, isIdentifier: false, quotes: "single", wrap: false }, s.version = "3.0.0", t.exports = s;
});
var Jl = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(Ua()), n = ei(), i = o(hr()), a = st();
  function o(h) {
    return h && h.__esModule ? h : { default: h };
  }
  __name(o, "o");
  function l(h, p) {
    for (var m = 0; m < p.length; m++) {
      var v = p[m];
      v.enumerable = v.enumerable || false, v.configurable = true, "value" in v && (v.writable = true), Object.defineProperty(h, v.key, v);
    }
  }
  __name(l, "l");
  function s(h, p, m) {
    return p && l(h.prototype, p), m && l(h, m), h;
  }
  __name(s, "s");
  function u(h, p) {
    h.prototype = Object.create(p.prototype), h.prototype.constructor = h, f(h, p);
  }
  __name(u, "u");
  function f(h, p) {
    return f = Object.setPrototypeOf || function(m, v) {
      return m.__proto__ = v, m;
    }, f(h, p);
  }
  __name(f, "f");
  var c = (function(h) {
    u(p, h);
    function p(v) {
      var g;
      return g = h.call(this, v) || this, g.type = a.CLASS, g._constructed = true, g;
    }
    __name(p, "p");
    var m = p.prototype;
    return m.valueToString = function() {
      return "." + h.prototype.valueToString.call(this);
    }, s(p, [{ key: "value", get: /* @__PURE__ */ __name(function() {
      return this._value;
    }, "get"), set: /* @__PURE__ */ __name(function(v) {
      if (this._constructed) {
        var g = (0, r.default)(v, { isIdentifier: true });
        g !== v ? ((0, n.ensureObject)(this, "raws"), this.raws.value = g) : this.raws && delete this.raws.value;
      }
      this._value = v;
    }, "set") }]), p;
  })(i.default);
  e.default = c, t.exports = e.default;
});
var Ql = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(hr()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.COMMENT, c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var Kl = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(hr()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(c) {
      var h;
      return h = s.call(this, c) || this, h.type = n.ID, h;
    }
    __name(u, "u");
    var f = u.prototype;
    return f.valueToString = function() {
      return "#" + s.prototype.valueToString.call(this);
    }, u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var Na = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = a(Ua()), n = ei(), i = a(hr());
  function a(c) {
    return c && c.__esModule ? c : { default: c };
  }
  __name(a, "a");
  function o(c, h) {
    for (var p = 0; p < h.length; p++) {
      var m = h[p];
      m.enumerable = m.enumerable || false, m.configurable = true, "value" in m && (m.writable = true), Object.defineProperty(c, m.key, m);
    }
  }
  __name(o, "o");
  function l(c, h, p) {
    return h && o(c.prototype, h), p && o(c, p), c;
  }
  __name(l, "l");
  function s(c, h) {
    c.prototype = Object.create(h.prototype), c.prototype.constructor = c, u(c, h);
  }
  __name(s, "s");
  function u(c, h) {
    return u = Object.setPrototypeOf || function(p, m) {
      return p.__proto__ = m, p;
    }, u(c, h);
  }
  __name(u, "u");
  var f = (function(c) {
    s(h, c);
    function h() {
      return c.apply(this, arguments) || this;
    }
    __name(h, "h");
    var p = h.prototype;
    return p.qualifiedName = function(m) {
      return this.namespace ? this.namespaceString + "|" + m : m;
    }, p.valueToString = function() {
      return this.qualifiedName(c.prototype.valueToString.call(this));
    }, l(h, [{ key: "namespace", get: /* @__PURE__ */ __name(function() {
      return this._namespace;
    }, "get"), set: /* @__PURE__ */ __name(function(m) {
      if (m === true || m === "*" || m === "&") {
        this._namespace = m, this.raws && delete this.raws.namespace;
        return;
      }
      var v = (0, r.default)(m, { isIdentifier: true });
      this._namespace = m, v !== m ? ((0, n.ensureObject)(this, "raws"), this.raws.namespace = v) : this.raws && delete this.raws.namespace;
    }, "set") }, { key: "ns", get: /* @__PURE__ */ __name(function() {
      return this._namespace;
    }, "get"), set: /* @__PURE__ */ __name(function(m) {
      this.namespace = m;
    }, "set") }, { key: "namespaceString", get: /* @__PURE__ */ __name(function() {
      if (this.namespace) {
        var m = this.stringifyProperty("namespace");
        return m === true ? "" : m;
      } else return "";
    }, "get") }]), h;
  })(i.default);
  e.default = f, t.exports = e.default;
});
var eu = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Na()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.TAG, c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var tu = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(hr()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.STRING, c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var ru = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Da()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(c) {
      var h;
      return h = s.call(this, c) || this, h.type = n.PSEUDO, h;
    }
    __name(u, "u");
    var f = u.prototype;
    return f.toString = function() {
      var c = this.length ? "(" + this.map(String).join(",") + ")" : "";
      return [this.rawSpaceBefore, this.stringifyProperty("value"), c, this.rawSpaceAfter].join("");
    }, u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var fg = ue((e, t) => {
  t.exports = function(r, n) {
    return function(...i) {
      return console.warn(n), r(...i);
    };
  };
});
var nu = ue((e) => {
  "use strict";
  e.__esModule = true, e.unescapeValue = g, e.default = void 0;
  var t = o(Ua()), r = o(Xl()), n = o(Na()), i = st(), a;
  function o(T) {
    return T && T.__esModule ? T : { default: T };
  }
  __name(o, "o");
  function l(T, E) {
    for (var R = 0; R < E.length; R++) {
      var C = E[R];
      C.enumerable = C.enumerable || false, C.configurable = true, "value" in C && (C.writable = true), Object.defineProperty(T, C.key, C);
    }
  }
  __name(l, "l");
  function s(T, E, R) {
    return E && l(T.prototype, E), R && l(T, R), T;
  }
  __name(s, "s");
  function u(T, E) {
    T.prototype = Object.create(E.prototype), T.prototype.constructor = T, f(T, E);
  }
  __name(u, "u");
  function f(T, E) {
    return f = Object.setPrototypeOf || function(R, C) {
      return R.__proto__ = C, R;
    }, f(T, E);
  }
  __name(f, "f");
  var c = fg(), h = /^('|")([^]*)\1$/, p = c(function() {
  }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), m = c(function() {
  }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), v = c(function() {
  }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
  function g(T) {
    var E = false, R = null, C = T, D = C.match(h);
    return D && (R = D[1], C = D[2]), C = (0, r.default)(C), C !== T && (E = true), { deprecatedUsage: E, unescaped: C, quoteMark: R };
  }
  __name(g, "g");
  function y(T) {
    if (T.quoteMark !== void 0 || T.value === void 0) return T;
    v();
    var E = g(T.value), R = E.quoteMark, C = E.unescaped;
    return T.raws || (T.raws = {}), T.raws.value === void 0 && (T.raws.value = T.value), T.value = C, T.quoteMark = R, T;
  }
  __name(y, "y");
  var x = (function(T) {
    u(E, T);
    function E(C) {
      var D;
      return C === void 0 && (C = {}), D = T.call(this, y(C)) || this, D.type = i.ATTRIBUTE, D.raws = D.raws || {}, Object.defineProperty(D.raws, "unquoted", { get: c(function() {
        return D.value;
      }, "attr.raws.unquoted is deprecated. Call attr.value instead."), set: c(function() {
        return D.value;
      }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.") }), D._constructed = true, D;
    }
    __name(E, "E");
    var R = E.prototype;
    return R.getQuotedValue = function(C) {
      C === void 0 && (C = {});
      var D = this._determineQuoteMark(C), M = _[D], H = (0, t.default)(this._value, M);
      return H;
    }, R._determineQuoteMark = function(C) {
      return C.smart ? this.smartQuoteMark(C) : this.preferredQuoteMark(C);
    }, R.setValue = function(C, D) {
      D === void 0 && (D = {}), this._value = C, this._quoteMark = this._determineQuoteMark(D), this._syncRawValue();
    }, R.smartQuoteMark = function(C) {
      var D = this.value, M = D.replace(/[^']/g, "").length, H = D.replace(/[^"]/g, "").length;
      if (M + H === 0) {
        var Q = (0, t.default)(D, { isIdentifier: true });
        if (Q === D) return E.NO_QUOTE;
        var ee = this.preferredQuoteMark(C);
        if (ee === E.NO_QUOTE) {
          var P = this.quoteMark || C.quoteMark || E.DOUBLE_QUOTE, U = _[P], O = (0, t.default)(D, U);
          if (O.length < Q.length) return P;
        }
        return ee;
      } else return H === M ? this.preferredQuoteMark(C) : H < M ? E.DOUBLE_QUOTE : E.SINGLE_QUOTE;
    }, R.preferredQuoteMark = function(C) {
      var D = C.preferCurrentQuoteMark ? this.quoteMark : C.quoteMark;
      return D === void 0 && (D = C.preferCurrentQuoteMark ? C.quoteMark : this.quoteMark), D === void 0 && (D = E.DOUBLE_QUOTE), D;
    }, R._syncRawValue = function() {
      var C = (0, t.default)(this._value, _[this.quoteMark]);
      C === this._value ? this.raws && delete this.raws.value : this.raws.value = C;
    }, R._handleEscapes = function(C, D) {
      if (this._constructed) {
        var M = (0, t.default)(D, { isIdentifier: true });
        M !== D ? this.raws[C] = M : delete this.raws[C];
      }
    }, R._spacesFor = function(C) {
      var D = { before: "", after: "" }, M = this.spaces[C] || {}, H = this.raws.spaces && this.raws.spaces[C] || {};
      return Object.assign(D, M, H);
    }, R._stringFor = function(C, D, M) {
      D === void 0 && (D = C), M === void 0 && (M = L);
      var H = this._spacesFor(D);
      return M(this.stringifyProperty(C), H);
    }, R.offsetOf = function(C) {
      var D = 1, M = this._spacesFor("attribute");
      if (D += M.before.length, C === "namespace" || C === "ns") return this.namespace ? D : -1;
      if (C === "attributeNS" || (D += this.namespaceString.length, this.namespace && (D += 1), C === "attribute")) return D;
      D += this.stringifyProperty("attribute").length, D += M.after.length;
      var H = this._spacesFor("operator");
      D += H.before.length;
      var Q = this.stringifyProperty("operator");
      if (C === "operator") return Q ? D : -1;
      D += Q.length, D += H.after.length;
      var ee = this._spacesFor("value");
      D += ee.before.length;
      var P = this.stringifyProperty("value");
      if (C === "value") return P ? D : -1;
      D += P.length, D += ee.after.length;
      var U = this._spacesFor("insensitive");
      return D += U.before.length, C === "insensitive" && this.insensitive ? D : -1;
    }, R.toString = function() {
      var C = this, D = [this.rawSpaceBefore, "["];
      return D.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (D.push(this._stringFor("operator")), D.push(this._stringFor("value")), D.push(this._stringFor("insensitiveFlag", "insensitive", function(M, H) {
        return M.length > 0 && !C.quoted && H.before.length === 0 && !(C.spaces.value && C.spaces.value.after) && (H.before = " "), L(M, H);
      }))), D.push("]"), D.push(this.rawSpaceAfter), D.join("");
    }, s(E, [{ key: "quoted", get: /* @__PURE__ */ __name(function() {
      var C = this.quoteMark;
      return C === "'" || C === '"';
    }, "get"), set: /* @__PURE__ */ __name(function(C) {
      m();
    }, "set") }, { key: "quoteMark", get: /* @__PURE__ */ __name(function() {
      return this._quoteMark;
    }, "get"), set: /* @__PURE__ */ __name(function(C) {
      if (!this._constructed) {
        this._quoteMark = C;
        return;
      }
      this._quoteMark !== C && (this._quoteMark = C, this._syncRawValue());
    }, "set") }, { key: "qualifiedAttribute", get: /* @__PURE__ */ __name(function() {
      return this.qualifiedName(this.raws.attribute || this.attribute);
    }, "get") }, { key: "insensitiveFlag", get: /* @__PURE__ */ __name(function() {
      return this.insensitive ? "i" : "";
    }, "get") }, { key: "value", get: /* @__PURE__ */ __name(function() {
      return this._value;
    }, "get"), set: /* @__PURE__ */ __name(function(C) {
      if (this._constructed) {
        var D = g(C), M = D.deprecatedUsage, H = D.unescaped, Q = D.quoteMark;
        if (M && p(), H === this._value && Q === this._quoteMark) return;
        this._value = H, this._quoteMark = Q, this._syncRawValue();
      } else this._value = C;
    }, "set") }, { key: "attribute", get: /* @__PURE__ */ __name(function() {
      return this._attribute;
    }, "get"), set: /* @__PURE__ */ __name(function(C) {
      this._handleEscapes("attribute", C), this._attribute = C;
    }, "set") }]), E;
  })(n.default);
  e.default = x, x.NO_QUOTE = null, x.SINGLE_QUOTE = "'", x.DOUBLE_QUOTE = '"';
  var _ = (a = { "'": { quotes: "single", wrap: true }, '"': { quotes: "double", wrap: true } }, a[null] = { isIdentifier: true }, a);
  function L(T, E) {
    return "" + E.before + T + E.after;
  }
  __name(L, "L");
});
var iu = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Na()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.UNIVERSAL, c.value = "*", c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var au = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(hr()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.COMBINATOR, c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var ou = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(hr()), n = st();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, u) {
    s.prototype = Object.create(u.prototype), s.prototype.constructor = s, o(s, u);
  }
  __name(a, "a");
  function o(s, u) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, u);
  }
  __name(o, "o");
  var l = (function(s) {
    a(u, s);
    function u(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.NESTING, c.value = "&", c;
    }
    __name(u, "u");
    return u;
  })(r.default);
  e.default = l, t.exports = e.default;
});
var cg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    return n.sort(function(i, a) {
      return i - a;
    });
  }
  __name(r, "r");
  t.exports = e.default;
});
var su = ue((e) => {
  "use strict";
  e.__esModule = true, e.combinator = e.word = e.comment = e.str = e.tab = e.newline = e.feed = e.cr = e.backslash = e.bang = e.slash = e.doubleQuote = e.singleQuote = e.space = e.greaterThan = e.pipe = e.equals = e.plus = e.caret = e.tilde = e.dollar = e.closeSquare = e.openSquare = e.closeParenthesis = e.openParenthesis = e.semicolon = e.colon = e.comma = e.at = e.asterisk = e.ampersand = void 0;
  var t = 38;
  e.ampersand = t;
  var r = 42;
  e.asterisk = r;
  var n = 64;
  e.at = n;
  var i = 44;
  e.comma = i;
  var a = 58;
  e.colon = a;
  var o = 59;
  e.semicolon = o;
  var l = 40;
  e.openParenthesis = l;
  var s = 41;
  e.closeParenthesis = s;
  var u = 91;
  e.openSquare = u;
  var f = 93;
  e.closeSquare = f;
  var c = 36;
  e.dollar = c;
  var h = 126;
  e.tilde = h;
  var p = 94;
  e.caret = p;
  var m = 43;
  e.plus = m;
  var v = 61;
  e.equals = v;
  var g = 124;
  e.pipe = g;
  var y = 62;
  e.greaterThan = y;
  var x = 32;
  e.space = x;
  var _ = 39;
  e.singleQuote = _;
  var L = 34;
  e.doubleQuote = L;
  var T = 47;
  e.slash = T;
  var E = 33;
  e.bang = E;
  var R = 92;
  e.backslash = R;
  var C = 13;
  e.cr = C;
  var D = 12;
  e.feed = D;
  var M = 10;
  e.newline = M;
  var H = 9;
  e.tab = H;
  var Q = _;
  e.str = Q;
  var ee = -1;
  e.comment = ee;
  var P = -2;
  e.word = P;
  var U = -3;
  e.combinator = U;
});
var hg = ue((e) => {
  "use strict";
  e.__esModule = true, e.default = m, e.FIELDS = void 0;
  var t = a(su()), r, n;
  function i() {
    if (typeof WeakMap != "function") return null;
    var v = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return v;
    }, "i"), v;
  }
  __name(i, "i");
  function a(v) {
    if (v && v.__esModule) return v;
    if (v === null || typeof v != "object" && typeof v != "function") return { default: v };
    var g = i();
    if (g && g.has(v)) return g.get(v);
    var y = {}, x = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var _ in v) if (Object.prototype.hasOwnProperty.call(v, _)) {
      var L = x ? Object.getOwnPropertyDescriptor(v, _) : null;
      L && (L.get || L.set) ? Object.defineProperty(y, _, L) : y[_] = v[_];
    }
    return y.default = v, g && g.set(v, y), y;
  }
  __name(a, "a");
  var o = (r = {}, r[t.tab] = true, r[t.newline] = true, r[t.cr] = true, r[t.feed] = true, r), l = (n = {}, n[t.space] = true, n[t.tab] = true, n[t.newline] = true, n[t.cr] = true, n[t.feed] = true, n[t.ampersand] = true, n[t.asterisk] = true, n[t.bang] = true, n[t.comma] = true, n[t.colon] = true, n[t.semicolon] = true, n[t.openParenthesis] = true, n[t.closeParenthesis] = true, n[t.openSquare] = true, n[t.closeSquare] = true, n[t.singleQuote] = true, n[t.doubleQuote] = true, n[t.plus] = true, n[t.pipe] = true, n[t.tilde] = true, n[t.greaterThan] = true, n[t.equals] = true, n[t.dollar] = true, n[t.caret] = true, n[t.slash] = true, n), s = {}, u = "0123456789abcdefABCDEF";
  for (f = 0; f < u.length; f++) s[u.charCodeAt(f)] = true;
  var f;
  function c(v, g) {
    var y = g, x;
    do {
      if (x = v.charCodeAt(y), l[x]) return y - 1;
      x === t.backslash ? y = h(v, y) + 1 : y++;
    } while (y < v.length);
    return y - 1;
  }
  __name(c, "c");
  function h(v, g) {
    var y = g, x = v.charCodeAt(y + 1);
    if (!o[x]) if (s[x]) {
      var _ = 0;
      do
        y++, _++, x = v.charCodeAt(y + 1);
      while (s[x] && _ < 6);
      _ < 6 && x === t.space && y++;
    } else y++;
    return y;
  }
  __name(h, "h");
  var p = { TYPE: 0, START_LINE: 1, START_COL: 2, END_LINE: 3, END_COL: 4, START_POS: 5, END_POS: 6 };
  e.FIELDS = p;
  function m(v) {
    var g = [], y = v.css.valueOf(), x = y, _ = x.length, L = -1, T = 1, E = 0, R = 0, C, D, M, H, Q, ee, P, U, O, X, K, ne, ie;
    function V(Y, A) {
      if (v.safe) y += A, O = y.length - 1;
      else throw v.error("Unclosed " + Y, T, E - L, E);
    }
    __name(V, "V");
    for (; E < _; ) {
      switch (C = y.charCodeAt(E), C === t.newline && (L = E, T += 1), C) {
        case t.space:
        case t.tab:
        case t.newline:
        case t.cr:
        case t.feed:
          O = E;
          do
            O += 1, C = y.charCodeAt(O), C === t.newline && (L = O, T += 1);
          while (C === t.space || C === t.newline || C === t.tab || C === t.cr || C === t.feed);
          ie = t.space, H = T, M = O - L - 1, R = O;
          break;
        case t.plus:
        case t.greaterThan:
        case t.tilde:
        case t.pipe:
          O = E;
          do
            O += 1, C = y.charCodeAt(O);
          while (C === t.plus || C === t.greaterThan || C === t.tilde || C === t.pipe);
          ie = t.combinator, H = T, M = E - L, R = O;
          break;
        case t.asterisk:
        case t.ampersand:
        case t.bang:
        case t.comma:
        case t.equals:
        case t.dollar:
        case t.caret:
        case t.openSquare:
        case t.closeSquare:
        case t.colon:
        case t.semicolon:
        case t.openParenthesis:
        case t.closeParenthesis:
          O = E, ie = C, H = T, M = E - L, R = O + 1;
          break;
        case t.singleQuote:
        case t.doubleQuote:
          ne = C === t.singleQuote ? "'" : '"', O = E;
          do
            for (Q = false, O = y.indexOf(ne, O + 1), O === -1 && V("quote", ne), ee = O; y.charCodeAt(ee - 1) === t.backslash; ) ee -= 1, Q = !Q;
          while (Q);
          ie = t.str, H = T, M = E - L, R = O + 1;
          break;
        default:
          C === t.slash && y.charCodeAt(E + 1) === t.asterisk ? (O = y.indexOf("*/", E + 2) + 1, O === 0 && V("comment", "*/"), D = y.slice(E, O + 1), U = D.split(`
`), P = U.length - 1, P > 0 ? (X = T + P, K = O - U[P].length) : (X = T, K = L), ie = t.comment, T = X, H = X, M = O - K) : C === t.slash ? (O = E, ie = C, H = T, M = E - L, R = O + 1) : (O = c(y, E), ie = t.word, H = T, M = O - L), R = O + 1;
          break;
      }
      g.push([ie, T, E - L, H, M, E, R]), K && (L = K, K = null), E = R;
    }
    return g;
  }
  __name(m, "m");
});
var pg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = R(Yl()), n = R(Zl()), i = R(Jl()), a = R(Ql()), o = R(Kl()), l = R(eu()), s = R(tu()), u = R(ru()), f = E(nu()), c = R(iu()), h = R(au()), p = R(ou()), m = R(cg()), v = E(hg()), g = E(su()), y = E(st()), x = ei(), _, L;
  function T() {
    if (typeof WeakMap != "function") return null;
    var V = /* @__PURE__ */ new WeakMap();
    return T = /* @__PURE__ */ __name(function() {
      return V;
    }, "T"), V;
  }
  __name(T, "T");
  function E(V) {
    if (V && V.__esModule) return V;
    if (V === null || typeof V != "object" && typeof V != "function") return { default: V };
    var Y = T();
    if (Y && Y.has(V)) return Y.get(V);
    var A = {}, B = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var ae in V) if (Object.prototype.hasOwnProperty.call(V, ae)) {
      var $ = B ? Object.getOwnPropertyDescriptor(V, ae) : null;
      $ && ($.get || $.set) ? Object.defineProperty(A, ae, $) : A[ae] = V[ae];
    }
    return A.default = V, Y && Y.set(V, A), A;
  }
  __name(E, "E");
  function R(V) {
    return V && V.__esModule ? V : { default: V };
  }
  __name(R, "R");
  function C(V, Y) {
    for (var A = 0; A < Y.length; A++) {
      var B = Y[A];
      B.enumerable = B.enumerable || false, B.configurable = true, "value" in B && (B.writable = true), Object.defineProperty(V, B.key, B);
    }
  }
  __name(C, "C");
  function D(V, Y, A) {
    return Y && C(V.prototype, Y), A && C(V, A), V;
  }
  __name(D, "D");
  var M = (_ = {}, _[g.space] = true, _[g.cr] = true, _[g.feed] = true, _[g.newline] = true, _[g.tab] = true, _), H = Object.assign({}, M, (L = {}, L[g.comment] = true, L));
  function Q(V) {
    return { line: V[v.FIELDS.START_LINE], column: V[v.FIELDS.START_COL] };
  }
  __name(Q, "Q");
  function ee(V) {
    return { line: V[v.FIELDS.END_LINE], column: V[v.FIELDS.END_COL] };
  }
  __name(ee, "ee");
  function P(V, Y, A, B) {
    return { start: { line: V, column: Y }, end: { line: A, column: B } };
  }
  __name(P, "P");
  function U(V) {
    return P(V[v.FIELDS.START_LINE], V[v.FIELDS.START_COL], V[v.FIELDS.END_LINE], V[v.FIELDS.END_COL]);
  }
  __name(U, "U");
  function O(V, Y) {
    if (V) return P(V[v.FIELDS.START_LINE], V[v.FIELDS.START_COL], Y[v.FIELDS.END_LINE], Y[v.FIELDS.END_COL]);
  }
  __name(O, "O");
  function X(V, Y) {
    var A = V[Y];
    if (typeof A == "string") return A.indexOf("\\") !== -1 && ((0, x.ensureObject)(V, "raws"), V[Y] = (0, x.unesc)(A), V.raws[Y] === void 0 && (V.raws[Y] = A)), V;
  }
  __name(X, "X");
  function K(V, Y) {
    for (var A = -1, B = []; (A = V.indexOf(Y, A + 1)) !== -1; ) B.push(A);
    return B;
  }
  __name(K, "K");
  function ne() {
    var V = Array.prototype.concat.apply([], arguments);
    return V.filter(function(Y, A) {
      return A === V.indexOf(Y);
    });
  }
  __name(ne, "ne");
  var ie = (function() {
    function V(A, B) {
      B === void 0 && (B = {}), this.rule = A, this.options = Object.assign({ lossy: false, safe: false }, B), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, v.default)({ css: this.css, error: this._errorGenerator(), safe: this.options.safe });
      var ae = O(this.tokens[0], this.tokens[this.tokens.length - 1]);
      this.root = new r.default({ source: ae }), this.root.errorGenerator = this._errorGenerator();
      var $ = new n.default({ source: { start: { line: 1, column: 1 } } });
      this.root.append($), this.current = $, this.loop();
    }
    __name(V, "V");
    var Y = V.prototype;
    return Y._errorGenerator = function() {
      var A = this;
      return function(B, ae) {
        return typeof A.rule == "string" ? new Error(B) : A.rule.error(B, ae);
      };
    }, Y.attribute = function() {
      var A = [], B = this.currToken;
      for (this.position++; this.position < this.tokens.length && this.currToken[v.FIELDS.TYPE] !== g.closeSquare; ) A.push(this.currToken), this.position++;
      if (this.currToken[v.FIELDS.TYPE] !== g.closeSquare) return this.expected("closing square bracket", this.currToken[v.FIELDS.START_POS]);
      var ae = A.length, $ = { source: P(B[1], B[2], this.currToken[3], this.currToken[4]), sourceIndex: B[v.FIELDS.START_POS] };
      if (ae === 1 && !~[g.word].indexOf(A[0][v.FIELDS.TYPE])) return this.expected("attribute", A[0][v.FIELDS.START_POS]);
      for (var he = 0, fe = "", ge = "", ce = null, we = false; he < ae; ) {
        var Ie = A[he], pe = this.content(Ie), ye = A[he + 1];
        switch (Ie[v.FIELDS.TYPE]) {
          case g.space:
            if (we = true, this.options.lossy) break;
            if (ce) {
              (0, x.ensureObject)($, "spaces", ce);
              var Be = $.spaces[ce].after || "";
              $.spaces[ce].after = Be + pe;
              var et = (0, x.getProp)($, "raws", "spaces", ce, "after") || null;
              et && ($.raws.spaces[ce].after = et + pe);
            } else fe = fe + pe, ge = ge + pe;
            break;
          case g.asterisk:
            if (ye[v.FIELDS.TYPE] === g.equals) $.operator = pe, ce = "operator";
            else if ((!$.namespace || ce === "namespace" && !we) && ye) {
              fe && ((0, x.ensureObject)($, "spaces", "attribute"), $.spaces.attribute.before = fe, fe = ""), ge && ((0, x.ensureObject)($, "raws", "spaces", "attribute"), $.raws.spaces.attribute.before = fe, ge = ""), $.namespace = ($.namespace || "") + pe;
              var Ge = (0, x.getProp)($, "raws", "namespace") || null;
              Ge && ($.raws.namespace += pe), ce = "namespace";
            }
            we = false;
            break;
          case g.dollar:
            if (ce === "value") {
              var Me = (0, x.getProp)($, "raws", "value");
              $.value += "$", Me && ($.raws.value = Me + "$");
              break;
            }
          case g.caret:
            ye[v.FIELDS.TYPE] === g.equals && ($.operator = pe, ce = "operator"), we = false;
            break;
          case g.combinator:
            if (pe === "~" && ye[v.FIELDS.TYPE] === g.equals && ($.operator = pe, ce = "operator"), pe !== "|") {
              we = false;
              break;
            }
            ye[v.FIELDS.TYPE] === g.equals ? ($.operator = pe, ce = "operator") : !$.namespace && !$.attribute && ($.namespace = true), we = false;
            break;
          case g.word:
            if (ye && this.content(ye) === "|" && A[he + 2] && A[he + 2][v.FIELDS.TYPE] !== g.equals && !$.operator && !$.namespace) $.namespace = pe, ce = "namespace";
            else if (!$.attribute || ce === "attribute" && !we) {
              fe && ((0, x.ensureObject)($, "spaces", "attribute"), $.spaces.attribute.before = fe, fe = ""), ge && ((0, x.ensureObject)($, "raws", "spaces", "attribute"), $.raws.spaces.attribute.before = ge, ge = ""), $.attribute = ($.attribute || "") + pe;
              var Xe = (0, x.getProp)($, "raws", "attribute") || null;
              Xe && ($.raws.attribute += pe), ce = "attribute";
            } else if (!$.value && $.value !== "" || ce === "value" && !we) {
              var tt = (0, x.unesc)(pe), rt = (0, x.getProp)($, "raws", "value") || "", nt = $.value || "";
              $.value = nt + tt, $.quoteMark = null, (tt !== pe || rt) && ((0, x.ensureObject)($, "raws"), $.raws.value = (rt || nt) + pe), ce = "value";
            } else {
              var it = pe === "i" || pe === "I";
              ($.value || $.value === "") && ($.quoteMark || we) ? ($.insensitive = it, (!it || pe === "I") && ((0, x.ensureObject)($, "raws"), $.raws.insensitiveFlag = pe), ce = "insensitive", fe && ((0, x.ensureObject)($, "spaces", "insensitive"), $.spaces.insensitive.before = fe, fe = ""), ge && ((0, x.ensureObject)($, "raws", "spaces", "insensitive"), $.raws.spaces.insensitive.before = ge, ge = "")) : ($.value || $.value === "") && (ce = "value", $.value += pe, $.raws.value && ($.raws.value += pe));
            }
            we = false;
            break;
          case g.str:
            if (!$.attribute || !$.operator) return this.error("Expected an attribute followed by an operator preceding the string.", { index: Ie[v.FIELDS.START_POS] });
            var ze = (0, f.unescapeValue)(pe), kt = ze.unescaped, bt = ze.quoteMark;
            $.value = kt, $.quoteMark = bt, ce = "value", (0, x.ensureObject)($, "raws"), $.raws.value = pe, we = false;
            break;
          case g.equals:
            if (!$.attribute) return this.expected("attribute", Ie[v.FIELDS.START_POS], pe);
            if ($.value) return this.error('Unexpected "=" found; an operator was already defined.', { index: Ie[v.FIELDS.START_POS] });
            $.operator = $.operator ? $.operator + pe : pe, ce = "operator", we = false;
            break;
          case g.comment:
            if (ce) if (we || ye && ye[v.FIELDS.TYPE] === g.space || ce === "insensitive") {
              var ut = (0, x.getProp)($, "spaces", ce, "after") || "", ft = (0, x.getProp)($, "raws", "spaces", ce, "after") || ut;
              (0, x.ensureObject)($, "raws", "spaces", ce), $.raws.spaces[ce].after = ft + pe;
            } else {
              var Vt = $[ce] || "", lt = (0, x.getProp)($, "raws", ce) || Vt;
              (0, x.ensureObject)($, "raws"), $.raws[ce] = lt + pe;
            }
            else ge = ge + pe;
            break;
          default:
            return this.error('Unexpected "' + pe + '" found.', { index: Ie[v.FIELDS.START_POS] });
        }
        he++;
      }
      X($, "attribute"), X($, "namespace"), this.newNode(new f.default($)), this.position++;
    }, Y.parseWhitespaceEquivalentTokens = function(A) {
      A < 0 && (A = this.tokens.length);
      var B = this.position, ae = [], $ = "", he = void 0;
      do
        if (M[this.currToken[v.FIELDS.TYPE]]) this.options.lossy || ($ += this.content());
        else if (this.currToken[v.FIELDS.TYPE] === g.comment) {
          var fe = {};
          $ && (fe.before = $, $ = ""), he = new a.default({ value: this.content(), source: U(this.currToken), sourceIndex: this.currToken[v.FIELDS.START_POS], spaces: fe }), ae.push(he);
        }
      while (++this.position < A);
      if ($) {
        if (he) he.spaces.after = $;
        else if (!this.options.lossy) {
          var ge = this.tokens[B], ce = this.tokens[this.position - 1];
          ae.push(new s.default({ value: "", source: P(ge[v.FIELDS.START_LINE], ge[v.FIELDS.START_COL], ce[v.FIELDS.END_LINE], ce[v.FIELDS.END_COL]), sourceIndex: ge[v.FIELDS.START_POS], spaces: { before: $, after: "" } }));
        }
      }
      return ae;
    }, Y.convertWhitespaceNodesToSpace = function(A, B) {
      var ae = this;
      B === void 0 && (B = false);
      var $ = "", he = "";
      A.forEach(function(ge) {
        var ce = ae.lossySpace(ge.spaces.before, B), we = ae.lossySpace(ge.rawSpaceBefore, B);
        $ += ce + ae.lossySpace(ge.spaces.after, B && ce.length === 0), he += ce + ge.value + ae.lossySpace(ge.rawSpaceAfter, B && we.length === 0);
      }), he === $ && (he = void 0);
      var fe = { space: $, rawSpace: he };
      return fe;
    }, Y.isNamedCombinator = function(A) {
      return A === void 0 && (A = this.position), this.tokens[A + 0] && this.tokens[A + 0][v.FIELDS.TYPE] === g.slash && this.tokens[A + 1] && this.tokens[A + 1][v.FIELDS.TYPE] === g.word && this.tokens[A + 2] && this.tokens[A + 2][v.FIELDS.TYPE] === g.slash;
    }, Y.namedCombinator = function() {
      if (this.isNamedCombinator()) {
        var A = this.content(this.tokens[this.position + 1]), B = (0, x.unesc)(A).toLowerCase(), ae = {};
        B !== A && (ae.value = "/" + A + "/");
        var $ = new h.default({ value: "/" + B + "/", source: P(this.currToken[v.FIELDS.START_LINE], this.currToken[v.FIELDS.START_COL], this.tokens[this.position + 2][v.FIELDS.END_LINE], this.tokens[this.position + 2][v.FIELDS.END_COL]), sourceIndex: this.currToken[v.FIELDS.START_POS], raws: ae });
        return this.position = this.position + 3, $;
      } else this.unexpected();
    }, Y.combinator = function() {
      var A = this;
      if (this.content() === "|") return this.namespace();
      var B = this.locateNextMeaningfulToken(this.position);
      if (B < 0 || this.tokens[B][v.FIELDS.TYPE] === g.comma) {
        var ae = this.parseWhitespaceEquivalentTokens(B);
        if (ae.length > 0) {
          var $ = this.current.last;
          if ($) {
            var he = this.convertWhitespaceNodesToSpace(ae), fe = he.space, ge = he.rawSpace;
            ge !== void 0 && ($.rawSpaceAfter += ge), $.spaces.after += fe;
          } else ae.forEach(function(rt) {
            return A.newNode(rt);
          });
        }
        return;
      }
      var ce = this.currToken, we = void 0;
      B > this.position && (we = this.parseWhitespaceEquivalentTokens(B));
      var Ie;
      if (this.isNamedCombinator() ? Ie = this.namedCombinator() : this.currToken[v.FIELDS.TYPE] === g.combinator ? (Ie = new h.default({ value: this.content(), source: U(this.currToken), sourceIndex: this.currToken[v.FIELDS.START_POS] }), this.position++) : M[this.currToken[v.FIELDS.TYPE]] || we || this.unexpected(), Ie) {
        if (we) {
          var pe = this.convertWhitespaceNodesToSpace(we), ye = pe.space, Be = pe.rawSpace;
          Ie.spaces.before = ye, Ie.rawSpaceBefore = Be;
        }
      } else {
        var et = this.convertWhitespaceNodesToSpace(we, true), Ge = et.space, Me = et.rawSpace;
        Me || (Me = Ge);
        var Xe = {}, tt = { spaces: {} };
        Ge.endsWith(" ") && Me.endsWith(" ") ? (Xe.before = Ge.slice(0, Ge.length - 1), tt.spaces.before = Me.slice(0, Me.length - 1)) : Ge.startsWith(" ") && Me.startsWith(" ") ? (Xe.after = Ge.slice(1), tt.spaces.after = Me.slice(1)) : tt.value = Me, Ie = new h.default({ value: " ", source: O(ce, this.tokens[this.position - 1]), sourceIndex: ce[v.FIELDS.START_POS], spaces: Xe, raws: tt });
      }
      return this.currToken && this.currToken[v.FIELDS.TYPE] === g.space && (Ie.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(Ie);
    }, Y.comma = function() {
      if (this.position === this.tokens.length - 1) {
        this.root.trailingComma = true, this.position++;
        return;
      }
      this.current._inferEndPosition();
      var A = new n.default({ source: { start: Q(this.tokens[this.position + 1]) } });
      this.current.parent.append(A), this.current = A, this.position++;
    }, Y.comment = function() {
      var A = this.currToken;
      this.newNode(new a.default({ value: this.content(), source: U(A), sourceIndex: A[v.FIELDS.START_POS] })), this.position++;
    }, Y.error = function(A, B) {
      throw this.root.error(A, B);
    }, Y.missingBackslash = function() {
      return this.error("Expected a backslash preceding the semicolon.", { index: this.currToken[v.FIELDS.START_POS] });
    }, Y.missingParenthesis = function() {
      return this.expected("opening parenthesis", this.currToken[v.FIELDS.START_POS]);
    }, Y.missingSquareBracket = function() {
      return this.expected("opening square bracket", this.currToken[v.FIELDS.START_POS]);
    }, Y.unexpected = function() {
      return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[v.FIELDS.START_POS]);
    }, Y.namespace = function() {
      var A = this.prevToken && this.content(this.prevToken) || true;
      if (this.nextToken[v.FIELDS.TYPE] === g.word) return this.position++, this.word(A);
      if (this.nextToken[v.FIELDS.TYPE] === g.asterisk) return this.position++, this.universal(A);
    }, Y.nesting = function() {
      if (this.nextToken) {
        var A = this.content(this.nextToken);
        if (A === "|") {
          this.position++;
          return;
        }
      }
      var B = this.currToken;
      this.newNode(new p.default({ value: this.content(), source: U(B), sourceIndex: B[v.FIELDS.START_POS] })), this.position++;
    }, Y.parentheses = function() {
      var A = this.current.last, B = 1;
      if (this.position++, A && A.type === y.PSEUDO) {
        var ae = new n.default({ source: { start: Q(this.tokens[this.position - 1]) } }), $ = this.current;
        for (A.append(ae), this.current = ae; this.position < this.tokens.length && B; ) this.currToken[v.FIELDS.TYPE] === g.openParenthesis && B++, this.currToken[v.FIELDS.TYPE] === g.closeParenthesis && B--, B ? this.parse() : (this.current.source.end = ee(this.currToken), this.current.parent.source.end = ee(this.currToken), this.position++);
        this.current = $;
      } else {
        for (var he = this.currToken, fe = "(", ge; this.position < this.tokens.length && B; ) this.currToken[v.FIELDS.TYPE] === g.openParenthesis && B++, this.currToken[v.FIELDS.TYPE] === g.closeParenthesis && B--, ge = this.currToken, fe += this.parseParenthesisToken(this.currToken), this.position++;
        A ? A.appendToPropertyAndEscape("value", fe, fe) : this.newNode(new s.default({ value: fe, source: P(he[v.FIELDS.START_LINE], he[v.FIELDS.START_COL], ge[v.FIELDS.END_LINE], ge[v.FIELDS.END_COL]), sourceIndex: he[v.FIELDS.START_POS] }));
      }
      if (B) return this.expected("closing parenthesis", this.currToken[v.FIELDS.START_POS]);
    }, Y.pseudo = function() {
      for (var A = this, B = "", ae = this.currToken; this.currToken && this.currToken[v.FIELDS.TYPE] === g.colon; ) B += this.content(), this.position++;
      if (!this.currToken) return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
      if (this.currToken[v.FIELDS.TYPE] === g.word) this.splitWord(false, function($, he) {
        B += $, A.newNode(new u.default({ value: B, source: O(ae, A.currToken), sourceIndex: ae[v.FIELDS.START_POS] })), he > 1 && A.nextToken && A.nextToken[v.FIELDS.TYPE] === g.openParenthesis && A.error("Misplaced parenthesis.", { index: A.nextToken[v.FIELDS.START_POS] });
      });
      else return this.expected(["pseudo-class", "pseudo-element"], this.currToken[v.FIELDS.START_POS]);
    }, Y.space = function() {
      var A = this.content();
      this.position === 0 || this.prevToken[v.FIELDS.TYPE] === g.comma || this.prevToken[v.FIELDS.TYPE] === g.openParenthesis || this.current.nodes.every(function(B) {
        return B.type === "comment";
      }) ? (this.spaces = this.optionalSpace(A), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[v.FIELDS.TYPE] === g.comma || this.nextToken[v.FIELDS.TYPE] === g.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(A), this.position++) : this.combinator();
    }, Y.string = function() {
      var A = this.currToken;
      this.newNode(new s.default({ value: this.content(), source: U(A), sourceIndex: A[v.FIELDS.START_POS] })), this.position++;
    }, Y.universal = function(A) {
      var B = this.nextToken;
      if (B && this.content(B) === "|") return this.position++, this.namespace();
      var ae = this.currToken;
      this.newNode(new c.default({ value: this.content(), source: U(ae), sourceIndex: ae[v.FIELDS.START_POS] }), A), this.position++;
    }, Y.splitWord = function(A, B) {
      for (var ae = this, $ = this.nextToken, he = this.content(); $ && ~[g.dollar, g.caret, g.equals, g.word].indexOf($[v.FIELDS.TYPE]); ) {
        this.position++;
        var fe = this.content();
        if (he += fe, fe.lastIndexOf("\\") === fe.length - 1) {
          var ge = this.nextToken;
          ge && ge[v.FIELDS.TYPE] === g.space && (he += this.requiredSpace(this.content(ge)), this.position++);
        }
        $ = this.nextToken;
      }
      var ce = K(he, ".").filter(function(ye) {
        var Be = he[ye - 1] === "\\", et = /^\d+\.\d+%$/.test(he);
        return !Be && !et;
      }), we = K(he, "#").filter(function(ye) {
        return he[ye - 1] !== "\\";
      }), Ie = K(he, "#{");
      Ie.length && (we = we.filter(function(ye) {
        return !~Ie.indexOf(ye);
      }));
      var pe = (0, m.default)(ne([0].concat(ce, we)));
      pe.forEach(function(ye, Be) {
        var et = pe[Be + 1] || he.length, Ge = he.slice(ye, et);
        if (Be === 0 && B) return B.call(ae, Ge, pe.length);
        var Me, Xe = ae.currToken, tt = Xe[v.FIELDS.START_POS] + pe[Be], rt = P(Xe[1], Xe[2] + ye, Xe[3], Xe[2] + (et - 1));
        if (~ce.indexOf(ye)) {
          var nt = { value: Ge.slice(1), source: rt, sourceIndex: tt };
          Me = new i.default(X(nt, "value"));
        } else if (~we.indexOf(ye)) {
          var it = { value: Ge.slice(1), source: rt, sourceIndex: tt };
          Me = new o.default(X(it, "value"));
        } else {
          var ze = { value: Ge, source: rt, sourceIndex: tt };
          X(ze, "value"), Me = new l.default(ze);
        }
        ae.newNode(Me, A), A = null;
      }), this.position++;
    }, Y.word = function(A) {
      var B = this.nextToken;
      return B && this.content(B) === "|" ? (this.position++, this.namespace()) : this.splitWord(A);
    }, Y.loop = function() {
      for (; this.position < this.tokens.length; ) this.parse(true);
      return this.current._inferEndPosition(), this.root;
    }, Y.parse = function(A) {
      switch (this.currToken[v.FIELDS.TYPE]) {
        case g.space:
          this.space();
          break;
        case g.comment:
          this.comment();
          break;
        case g.openParenthesis:
          this.parentheses();
          break;
        case g.closeParenthesis:
          A && this.missingParenthesis();
          break;
        case g.openSquare:
          this.attribute();
          break;
        case g.dollar:
        case g.caret:
        case g.equals:
        case g.word:
          this.word();
          break;
        case g.colon:
          this.pseudo();
          break;
        case g.comma:
          this.comma();
          break;
        case g.asterisk:
          this.universal();
          break;
        case g.ampersand:
          this.nesting();
          break;
        case g.slash:
        case g.combinator:
          this.combinator();
          break;
        case g.str:
          this.string();
          break;
        case g.closeSquare:
          this.missingSquareBracket();
        case g.semicolon:
          this.missingBackslash();
        default:
          this.unexpected();
      }
    }, Y.expected = function(A, B, ae) {
      if (Array.isArray(A)) {
        var $ = A.pop();
        A = A.join(", ") + " or " + $;
      }
      var he = /^[aeiou]/.test(A[0]) ? "an" : "a";
      return ae ? this.error("Expected " + he + " " + A + ', found "' + ae + '" instead.', { index: B }) : this.error("Expected " + he + " " + A + ".", { index: B });
    }, Y.requiredSpace = function(A) {
      return this.options.lossy ? " " : A;
    }, Y.optionalSpace = function(A) {
      return this.options.lossy ? "" : A;
    }, Y.lossySpace = function(A, B) {
      return this.options.lossy ? B ? " " : "" : A;
    }, Y.parseParenthesisToken = function(A) {
      var B = this.content(A);
      return A[v.FIELDS.TYPE] === g.space ? this.requiredSpace(B) : B;
    }, Y.newNode = function(A, B) {
      return B && (/^ +$/.test(B) && (this.options.lossy || (this.spaces = (this.spaces || "") + B), B = true), A.namespace = B, X(A, "namespace")), this.spaces && (A.spaces.before = this.spaces, this.spaces = ""), this.current.append(A);
    }, Y.content = function(A) {
      return A === void 0 && (A = this.currToken), this.css.slice(A[v.FIELDS.START_POS], A[v.FIELDS.END_POS]);
    }, Y.locateNextMeaningfulToken = function(A) {
      A === void 0 && (A = this.position + 1);
      for (var B = A; B < this.tokens.length; ) if (H[this.tokens[B][v.FIELDS.TYPE]]) {
        B++;
        continue;
      } else return B;
      return -1;
    }, D(V, [{ key: "currToken", get: /* @__PURE__ */ __name(function() {
      return this.tokens[this.position];
    }, "get") }, { key: "nextToken", get: /* @__PURE__ */ __name(function() {
      return this.tokens[this.position + 1];
    }, "get") }, { key: "prevToken", get: /* @__PURE__ */ __name(function() {
      return this.tokens[this.position - 1];
    }, "get") }]), V;
  })();
  e.default = ie, t.exports = e.default;
});
var dg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = n(pg());
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  var i = (function() {
    function a(l, s) {
      this.func = l || function() {
      }, this.funcRes = null, this.options = s;
    }
    __name(a, "a");
    var o = a.prototype;
    return o._shouldUpdateSelector = function(l, s) {
      s === void 0 && (s = {});
      var u = Object.assign({}, this.options, s);
      return u.updateSelector === false ? false : typeof l != "string";
    }, o._isLossy = function(l) {
      l === void 0 && (l = {});
      var s = Object.assign({}, this.options, l);
      return s.lossless === false;
    }, o._root = function(l, s) {
      s === void 0 && (s = {});
      var u = new r.default(l, this._parseOptions(s));
      return u.root;
    }, o._parseOptions = function(l) {
      return { lossy: this._isLossy(l) };
    }, o._run = function(l, s) {
      var u = this;
      return s === void 0 && (s = {}), new Promise(function(f, c) {
        try {
          var h = u._root(l, s);
          Promise.resolve(u.func(h)).then(function(p) {
            var m = void 0;
            return u._shouldUpdateSelector(l, s) && (m = h.toString(), l.selector = m), { transform: p, root: h, string: m };
          }).then(f, c);
        } catch (p) {
          c(p);
          return;
        }
      });
    }, o._runSync = function(l, s) {
      s === void 0 && (s = {});
      var u = this._root(l, s), f = this.func(u);
      if (f && typeof f.then == "function") throw new Error("Selector processor returned a promise to a synchronous call.");
      var c = void 0;
      return s.updateSelector && typeof l != "string" && (c = u.toString(), l.selector = c), { transform: f, root: u, string: c };
    }, o.ast = function(l, s) {
      return this._run(l, s).then(function(u) {
        return u.root;
      });
    }, o.astSync = function(l, s) {
      return this._runSync(l, s).root;
    }, o.transform = function(l, s) {
      return this._run(l, s).then(function(u) {
        return u.transform;
      });
    }, o.transformSync = function(l, s) {
      return this._runSync(l, s).transform;
    }, o.process = function(l, s) {
      return this._run(l, s).then(function(u) {
        return u.string || u.root.toString();
      });
    }, o.processSync = function(l, s) {
      var u = this._runSync(l, s);
      return u.string || u.root.toString();
    }, a;
  })();
  e.default = i, t.exports = e.default;
});
var vg = ue((e) => {
  "use strict";
  e.__esModule = true, e.universal = e.tag = e.string = e.selector = e.root = e.pseudo = e.nesting = e.id = e.comment = e.combinator = e.className = e.attribute = void 0;
  var t = p(nu()), r = p(Jl()), n = p(au()), i = p(Ql()), a = p(Kl()), o = p(ou()), l = p(ru()), s = p(Yl()), u = p(Zl()), f = p(tu()), c = p(eu()), h = p(iu());
  function p(M) {
    return M && M.__esModule ? M : { default: M };
  }
  __name(p, "p");
  var m = /* @__PURE__ */ __name(function(M) {
    return new t.default(M);
  }, "m");
  e.attribute = m;
  var v = /* @__PURE__ */ __name(function(M) {
    return new r.default(M);
  }, "v");
  e.className = v;
  var g = /* @__PURE__ */ __name(function(M) {
    return new n.default(M);
  }, "g");
  e.combinator = g;
  var y = /* @__PURE__ */ __name(function(M) {
    return new i.default(M);
  }, "y");
  e.comment = y;
  var x = /* @__PURE__ */ __name(function(M) {
    return new a.default(M);
  }, "x");
  e.id = x;
  var _ = /* @__PURE__ */ __name(function(M) {
    return new o.default(M);
  }, "_");
  e.nesting = _;
  var L = /* @__PURE__ */ __name(function(M) {
    return new l.default(M);
  }, "L");
  e.pseudo = L;
  var T = /* @__PURE__ */ __name(function(M) {
    return new s.default(M);
  }, "T");
  e.root = T;
  var E = /* @__PURE__ */ __name(function(M) {
    return new u.default(M);
  }, "E");
  e.selector = E;
  var R = /* @__PURE__ */ __name(function(M) {
    return new f.default(M);
  }, "R");
  e.string = R;
  var C = /* @__PURE__ */ __name(function(M) {
    return new c.default(M);
  }, "C");
  e.tag = C;
  var D = /* @__PURE__ */ __name(function(M) {
    return new h.default(M);
  }, "D");
  e.universal = D;
});
var gg = ue((e) => {
  "use strict";
  e.__esModule = true, e.isNode = i, e.isPseudoElement = x, e.isPseudoClass = _, e.isContainer = L, e.isNamespace = T, e.isUniversal = e.isTag = e.isString = e.isSelector = e.isRoot = e.isPseudo = e.isNesting = e.isIdentifier = e.isComment = e.isCombinator = e.isClassName = e.isAttribute = void 0;
  var t = st(), r, n = (r = {}, r[t.ATTRIBUTE] = true, r[t.CLASS] = true, r[t.COMBINATOR] = true, r[t.COMMENT] = true, r[t.ID] = true, r[t.NESTING] = true, r[t.PSEUDO] = true, r[t.ROOT] = true, r[t.SELECTOR] = true, r[t.STRING] = true, r[t.TAG] = true, r[t.UNIVERSAL] = true, r);
  function i(E) {
    return typeof E == "object" && n[E.type];
  }
  __name(i, "i");
  function a(E, R) {
    return i(R) && R.type === E;
  }
  __name(a, "a");
  var o = a.bind(null, t.ATTRIBUTE);
  e.isAttribute = o;
  var l = a.bind(null, t.CLASS);
  e.isClassName = l;
  var s = a.bind(null, t.COMBINATOR);
  e.isCombinator = s;
  var u = a.bind(null, t.COMMENT);
  e.isComment = u;
  var f = a.bind(null, t.ID);
  e.isIdentifier = f;
  var c = a.bind(null, t.NESTING);
  e.isNesting = c;
  var h = a.bind(null, t.PSEUDO);
  e.isPseudo = h;
  var p = a.bind(null, t.ROOT);
  e.isRoot = p;
  var m = a.bind(null, t.SELECTOR);
  e.isSelector = m;
  var v = a.bind(null, t.STRING);
  e.isString = v;
  var g = a.bind(null, t.TAG);
  e.isTag = g;
  var y = a.bind(null, t.UNIVERSAL);
  e.isUniversal = y;
  function x(E) {
    return h(E) && E.value && (E.value.startsWith("::") || E.value.toLowerCase() === ":before" || E.value.toLowerCase() === ":after" || E.value.toLowerCase() === ":first-letter" || E.value.toLowerCase() === ":first-line");
  }
  __name(x, "x");
  function _(E) {
    return h(E) && !x(E);
  }
  __name(_, "_");
  function L(E) {
    return !!(i(E) && E.walk);
  }
  __name(L, "L");
  function T(E) {
    return o(E) || g(E);
  }
  __name(T, "T");
});
var mg = ue((e) => {
  "use strict";
  e.__esModule = true;
  var t = st();
  Object.keys(t).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === t[i] || (e[i] = t[i]);
  });
  var r = vg();
  Object.keys(r).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === r[i] || (e[i] = r[i]);
  });
  var n = gg();
  Object.keys(n).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === n[i] || (e[i] = n[i]);
  });
});
var bg = ue((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(dg()), n = a(mg());
  function i() {
    if (typeof WeakMap != "function") return null;
    var u = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return u;
    }, "i"), u;
  }
  __name(i, "i");
  function a(u) {
    if (u && u.__esModule) return u;
    if (u === null || typeof u != "object" && typeof u != "function") return { default: u };
    var f = i();
    if (f && f.has(u)) return f.get(u);
    var c = {}, h = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var p in u) if (Object.prototype.hasOwnProperty.call(u, p)) {
      var m = h ? Object.getOwnPropertyDescriptor(u, p) : null;
      m && (m.get || m.set) ? Object.defineProperty(c, p, m) : c[p] = u[p];
    }
    return c.default = u, f && f.set(u, c), c;
  }
  __name(a, "a");
  function o(u) {
    return u && u.__esModule ? u : { default: u };
  }
  __name(o, "o");
  var l = /* @__PURE__ */ __name(function(u) {
    return new r.default(u);
  }, "l");
  Object.assign(l, n), delete l.__esModule;
  var s = l;
  e.default = s, t.exports = e.default;
});
var yg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    return r.replace(/\\,/g, "\\2c ");
  }
  __name(t, "t");
});
var xg = ue((e, t) => {
  "use strict";
  t.exports = { aliceblue: [240, 248, 255], antiquewhite: [250, 235, 215], aqua: [0, 255, 255], aquamarine: [127, 255, 212], azure: [240, 255, 255], beige: [245, 245, 220], bisque: [255, 228, 196], black: [0, 0, 0], blanchedalmond: [255, 235, 205], blue: [0, 0, 255], blueviolet: [138, 43, 226], brown: [165, 42, 42], burlywood: [222, 184, 135], cadetblue: [95, 158, 160], chartreuse: [127, 255, 0], chocolate: [210, 105, 30], coral: [255, 127, 80], cornflowerblue: [100, 149, 237], cornsilk: [255, 248, 220], crimson: [220, 20, 60], cyan: [0, 255, 255], darkblue: [0, 0, 139], darkcyan: [0, 139, 139], darkgoldenrod: [184, 134, 11], darkgray: [169, 169, 169], darkgreen: [0, 100, 0], darkgrey: [169, 169, 169], darkkhaki: [189, 183, 107], darkmagenta: [139, 0, 139], darkolivegreen: [85, 107, 47], darkorange: [255, 140, 0], darkorchid: [153, 50, 204], darkred: [139, 0, 0], darksalmon: [233, 150, 122], darkseagreen: [143, 188, 143], darkslateblue: [72, 61, 139], darkslategray: [47, 79, 79], darkslategrey: [47, 79, 79], darkturquoise: [0, 206, 209], darkviolet: [148, 0, 211], deeppink: [255, 20, 147], deepskyblue: [0, 191, 255], dimgray: [105, 105, 105], dimgrey: [105, 105, 105], dodgerblue: [30, 144, 255], firebrick: [178, 34, 34], floralwhite: [255, 250, 240], forestgreen: [34, 139, 34], fuchsia: [255, 0, 255], gainsboro: [220, 220, 220], ghostwhite: [248, 248, 255], gold: [255, 215, 0], goldenrod: [218, 165, 32], gray: [128, 128, 128], green: [0, 128, 0], greenyellow: [173, 255, 47], grey: [128, 128, 128], honeydew: [240, 255, 240], hotpink: [255, 105, 180], indianred: [205, 92, 92], indigo: [75, 0, 130], ivory: [255, 255, 240], khaki: [240, 230, 140], lavender: [230, 230, 250], lavenderblush: [255, 240, 245], lawngreen: [124, 252, 0], lemonchiffon: [255, 250, 205], lightblue: [173, 216, 230], lightcoral: [240, 128, 128], lightcyan: [224, 255, 255], lightgoldenrodyellow: [250, 250, 210], lightgray: [211, 211, 211], lightgreen: [144, 238, 144], lightgrey: [211, 211, 211], lightpink: [255, 182, 193], lightsalmon: [255, 160, 122], lightseagreen: [32, 178, 170], lightskyblue: [135, 206, 250], lightslategray: [119, 136, 153], lightslategrey: [119, 136, 153], lightsteelblue: [176, 196, 222], lightyellow: [255, 255, 224], lime: [0, 255, 0], limegreen: [50, 205, 50], linen: [250, 240, 230], magenta: [255, 0, 255], maroon: [128, 0, 0], mediumaquamarine: [102, 205, 170], mediumblue: [0, 0, 205], mediumorchid: [186, 85, 211], mediumpurple: [147, 112, 219], mediumseagreen: [60, 179, 113], mediumslateblue: [123, 104, 238], mediumspringgreen: [0, 250, 154], mediumturquoise: [72, 209, 204], mediumvioletred: [199, 21, 133], midnightblue: [25, 25, 112], mintcream: [245, 255, 250], mistyrose: [255, 228, 225], moccasin: [255, 228, 181], navajowhite: [255, 222, 173], navy: [0, 0, 128], oldlace: [253, 245, 230], olive: [128, 128, 0], olivedrab: [107, 142, 35], orange: [255, 165, 0], orangered: [255, 69, 0], orchid: [218, 112, 214], palegoldenrod: [238, 232, 170], palegreen: [152, 251, 152], paleturquoise: [175, 238, 238], palevioletred: [219, 112, 147], papayawhip: [255, 239, 213], peachpuff: [255, 218, 185], peru: [205, 133, 63], pink: [255, 192, 203], plum: [221, 160, 221], powderblue: [176, 224, 230], purple: [128, 0, 128], rebeccapurple: [102, 51, 153], red: [255, 0, 0], rosybrown: [188, 143, 143], royalblue: [65, 105, 225], saddlebrown: [139, 69, 19], salmon: [250, 128, 114], sandybrown: [244, 164, 96], seagreen: [46, 139, 87], seashell: [255, 245, 238], sienna: [160, 82, 45], silver: [192, 192, 192], skyblue: [135, 206, 235], slateblue: [106, 90, 205], slategray: [112, 128, 144], slategrey: [112, 128, 144], snow: [255, 250, 250], springgreen: [0, 255, 127], steelblue: [70, 130, 180], tan: [210, 180, 140], teal: [0, 128, 128], thistle: [216, 191, 216], tomato: [255, 99, 71], turquoise: [64, 224, 208], violet: [238, 130, 238], wheat: [245, 222, 179], white: [255, 255, 255], whitesmoke: [245, 245, 245], yellow: [255, 255, 0], yellowgreen: [154, 205, 50] };
});
var lu = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(m, v) {
    for (var g in v) Object.defineProperty(m, g, { enumerable: true, get: v[g] });
  }
  __name(t, "t");
  t(e, { parseColor: /* @__PURE__ */ __name(() => h, "parseColor"), formatColor: /* @__PURE__ */ __name(() => p, "formatColor") });
  var r = n(xg());
  function n(m) {
    return m && m.__esModule ? m : { default: m };
  }
  __name(n, "n");
  var i = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i, a = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i, o = /(?:\d+|\d*\.\d+)%?/, l = /(?:\s*,\s*|\s+)/, s = /\s*[,/]\s*/, u = /var\(--(?:[^ )]*?)\)/, f = new RegExp(`^(rgb)a?\\(\\s*(${o.source}|${u.source})(?:${l.source}(${o.source}|${u.source}))?(?:${l.source}(${o.source}|${u.source}))?(?:${s.source}(${o.source}|${u.source}))?\\s*\\)$`), c = new RegExp(`^(hsl)a?\\(\\s*((?:${o.source})(?:deg|rad|grad|turn)?|${u.source})(?:${l.source}(${o.source}|${u.source}))?(?:${l.source}(${o.source}|${u.source}))?(?:${s.source}(${o.source}|${u.source}))?\\s*\\)$`);
  function h(m, { loose: v = false } = {}) {
    var g, y;
    if (typeof m != "string") return null;
    if (m = m.trim(), m === "transparent") return { mode: "rgb", color: ["0", "0", "0"], alpha: "0" };
    if (m in r.default) return { mode: "rgb", color: r.default[m].map((E) => E.toString()) };
    let x = m.replace(a, (E, R, C, D, M) => ["#", R, R, C, C, D, D, M ? M + M : ""].join("")).match(i);
    if (x !== null) return { mode: "rgb", color: [parseInt(x[1], 16), parseInt(x[2], 16), parseInt(x[3], 16)].map((E) => E.toString()), alpha: x[4] ? (parseInt(x[4], 16) / 255).toString() : void 0 };
    var _;
    let L = (_ = m.match(f)) !== null && _ !== void 0 ? _ : m.match(c);
    if (L === null) return null;
    let T = [L[2], L[3], L[4]].filter(Boolean).map((E) => E.toString());
    return !v && T.length !== 3 || T.length < 3 && !T.some((E) => /^var\(.*?\)$/.test(E)) ? null : { mode: L[1], color: T, alpha: (g = L[5]) === null || g === void 0 || (y = g.toString) === null || y === void 0 ? void 0 : y.call(g) };
  }
  __name(h, "h");
  function p({ mode: m, color: v, alpha: g }) {
    let y = g !== void 0;
    return `${m}(${v.join(" ")}${y ? ` / ${g}` : ""})`;
  }
  __name(p, "p");
});
var uu = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(a, o) {
    for (var l in o) Object.defineProperty(a, l, { enumerable: true, get: o[l] });
  }
  __name(t, "t");
  t(e, { withAlphaValue: /* @__PURE__ */ __name(() => n, "withAlphaValue"), default: /* @__PURE__ */ __name(() => i, "default") });
  var r = lu();
  function n(a, o, l) {
    if (typeof a == "function") return a({ opacityValue: o });
    let s = (0, r.parseColor)(a, { loose: true });
    return s === null ? l : (0, r.formatColor)({ ...s, alpha: o });
  }
  __name(n, "n");
  function i({ color: a, property: o, variable: l }) {
    let s = [].concat(o);
    if (typeof a == "function") return { [l]: "1", ...Object.fromEntries(s.map((f) => [f, a({ opacityVariable: l, opacityValue: `var(${l})` })])) };
    let u = (0, r.parseColor)(a);
    return u === null ? Object.fromEntries(s.map((f) => [f, a])) : u.alpha !== void 0 ? Object.fromEntries(s.map((f) => [f, a])) : { [l]: "1", ...Object.fromEntries(s.map((f) => [f, (0, r.formatColor)({ ...u, alpha: `var(${l})` })])) };
  }
  __name(i, "i");
});
var wg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(h, p) {
    for (var m in p) Object.defineProperty(h, m, { enumerable: true, get: p[m] });
  }
  __name(t, "t");
  t(e, { pattern: /* @__PURE__ */ __name(() => a, "pattern"), withoutCapturing: /* @__PURE__ */ __name(() => o, "withoutCapturing"), any: /* @__PURE__ */ __name(() => l, "any"), optional: /* @__PURE__ */ __name(() => s, "optional"), zeroOrMore: /* @__PURE__ */ __name(() => u, "zeroOrMore"), nestedBrackets: /* @__PURE__ */ __name(() => f, "nestedBrackets"), escape: /* @__PURE__ */ __name(() => c, "escape") });
  var r = /[\\^$.*+?()[\]{}|]/g, n = RegExp(r.source);
  function i(h) {
    return h = Array.isArray(h) ? h : [h], h = h.map((p) => p instanceof RegExp ? p.source : p), h.join("");
  }
  __name(i, "i");
  function a(h) {
    return new RegExp(i(h), "g");
  }
  __name(a, "a");
  function o(h) {
    return new RegExp(`(?:${i(h)})`, "g");
  }
  __name(o, "o");
  function l(h) {
    return `(?:${h.map(i).join("|")})`;
  }
  __name(l, "l");
  function s(h) {
    return `(?:${i(h)})?`;
  }
  __name(s, "s");
  function u(h) {
    return `(?:${i(h)})*`;
  }
  __name(u, "u");
  function f(h, p, m = 1) {
    return o([c(h), /[^\s]*/, m === 1 ? `[^${c(h)}${c(p)}s]*` : l([`[^${c(h)}${c(p)}s]*`, f(h, p, m - 1)]), /[^\s]*/, c(p)]);
  }
  __name(f, "f");
  function c(h) {
    return h && n.test(h) ? h.replace(r, "\\$&") : h || "";
  }
  __name(c, "c");
});
var Sg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "splitAtTopLevelOnly", { enumerable: true, get: /* @__PURE__ */ __name(() => i, "get") });
  var t = n(wg());
  function r(a) {
    if (typeof WeakMap != "function") return null;
    var o = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new WeakMap();
    return (r = /* @__PURE__ */ __name(function(s) {
      return s ? l : o;
    }, "r"))(a);
  }
  __name(r, "r");
  function n(a, o) {
    if (!o && a && a.__esModule) return a;
    if (a === null || typeof a != "object" && typeof a != "function") return { default: a };
    var l = r(o);
    if (l && l.has(a)) return l.get(a);
    var s = {}, u = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var f in a) if (f !== "default" && Object.prototype.hasOwnProperty.call(a, f)) {
      var c = u ? Object.getOwnPropertyDescriptor(a, f) : null;
      c && (c.get || c.set) ? Object.defineProperty(s, f, c) : s[f] = a[f];
    }
    return s.default = a, l && l.set(a, s), s;
  }
  __name(n, "n");
  function* i(a, o) {
    let l = new RegExp(`[(){}\\[\\]${t.escape(o)}]`, "g"), s = 0, u = 0, f = false, c = 0, h = 0, p = o.length;
    for (let m of a.matchAll(l)) {
      let v = m[0] === o[c], g = c === p - 1, y = v && g;
      m[0] === "(" && s++, m[0] === ")" && s--, m[0] === "[" && s++, m[0] === "]" && s--, m[0] === "{" && s++, m[0] === "}" && s--, v && s === 0 && (h === 0 && (h = m.index), c++), y && s === 0 && (f = true, yield a.substring(u, h), u = h + p), c === p && (c = 0, h = 0);
    }
    f ? yield a.substring(u) : yield a;
  }
  __name(i, "i");
});
var Eg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(s, u) {
    for (var f in u) Object.defineProperty(s, f, { enumerable: true, get: u[f] });
  }
  __name(t, "t");
  t(e, { parseBoxShadowValue: /* @__PURE__ */ __name(() => o, "parseBoxShadowValue"), formatBoxShadowValue: /* @__PURE__ */ __name(() => l, "formatBoxShadowValue") });
  var r = Sg(), n = /* @__PURE__ */ new Set(["inset", "inherit", "initial", "revert", "unset"]), i = /\ +(?![^(]*\))/g, a = /^-?(\d+|\.\d+)(.*?)$/g;
  function o(s) {
    return Array.from((0, r.splitAtTopLevelOnly)(s, ",")).map((u) => {
      let f = u.trim(), c = { raw: f }, h = f.split(i), p = /* @__PURE__ */ new Set();
      for (let m of h) a.lastIndex = 0, !p.has("KEYWORD") && n.has(m) ? (c.keyword = m, p.add("KEYWORD")) : a.test(m) ? p.has("X") ? p.has("Y") ? p.has("BLUR") ? p.has("SPREAD") || (c.spread = m, p.add("SPREAD")) : (c.blur = m, p.add("BLUR")) : (c.y = m, p.add("Y")) : (c.x = m, p.add("X")) : c.color ? (c.unknown || (c.unknown = []), c.unknown.push(m)) : c.color = m;
      return c.valid = c.x !== void 0 && c.y !== void 0, c;
    });
  }
  __name(o, "o");
  function l(s) {
    return s.map((u) => u.valid ? [u.keyword, u.x, u.y, u.blur, u.spread, u.color].filter(Boolean).join(" ") : u.raw).join(", ");
  }
  __name(l, "l");
});
var kg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(P, U) {
    for (var O in U) Object.defineProperty(P, O, { enumerable: true, get: U[O] });
  }
  __name(t, "t");
  t(e, { normalize: /* @__PURE__ */ __name(() => l, "normalize"), url: /* @__PURE__ */ __name(() => s, "url"), number: /* @__PURE__ */ __name(() => u, "number"), percentage: /* @__PURE__ */ __name(() => f, "percentage"), length: /* @__PURE__ */ __name(() => p, "length"), lineWidth: /* @__PURE__ */ __name(() => v, "lineWidth"), shadow: /* @__PURE__ */ __name(() => g, "shadow"), color: /* @__PURE__ */ __name(() => y, "color"), image: /* @__PURE__ */ __name(() => x, "image"), gradient: /* @__PURE__ */ __name(() => L, "gradient"), position: /* @__PURE__ */ __name(() => E, "position"), familyName: /* @__PURE__ */ __name(() => R, "familyName"), genericName: /* @__PURE__ */ __name(() => D, "genericName"), absoluteSize: /* @__PURE__ */ __name(() => H, "absoluteSize"), relativeSize: /* @__PURE__ */ __name(() => ee, "relativeSize") });
  var r = lu(), n = Eg(), i = ["min", "max", "clamp", "calc"], a = /,(?![^(]*\))/g, o = /_(?![^(]*\))/g;
  function l(P, U = true) {
    return P.includes("url(") ? P.split(/(url\(.*?\))/g).filter(Boolean).map((O) => /^url\(.*?\)$/.test(O) ? O : l(O, false)).join("") : (P = P.replace(/([^\\])_+/g, (O, X) => X + " ".repeat(O.length - 1)).replace(/^_/g, " ").replace(/\\_/g, "_"), U && (P = P.trim()), P = P.replace(/(calc|min|max|clamp)\(.+\)/g, (O) => O.replace(/(-?\d*\.?\d(?!\b-.+[,)](?![^+\-/*])\D)(?:%|[a-z]+)?|\))([+\-/*])/g, "$1 $2 ")), P);
  }
  __name(l, "l");
  function s(P) {
    return P.startsWith("url(");
  }
  __name(s, "s");
  function u(P) {
    return !isNaN(Number(P)) || i.some((U) => new RegExp(`^${U}\\(.+?`).test(P));
  }
  __name(u, "u");
  function f(P) {
    return P.split(o).every((U) => /%$/g.test(U) || i.some((O) => new RegExp(`^${O}\\(.+?%`).test(U)));
  }
  __name(f, "f");
  var c = ["cm", "mm", "Q", "in", "pc", "pt", "px", "em", "ex", "ch", "rem", "lh", "vw", "vh", "vmin", "vmax"], h = `(?:${c.join("|")})`;
  function p(P) {
    return P.split(o).every((U) => U === "0" || new RegExp(`${h}$`).test(U) || i.some((O) => new RegExp(`^${O}\\(.+?${h}`).test(U)));
  }
  __name(p, "p");
  var m = /* @__PURE__ */ new Set(["thin", "medium", "thick"]);
  function v(P) {
    return m.has(P);
  }
  __name(v, "v");
  function g(P) {
    let U = (0, n.parseBoxShadowValue)(l(P));
    for (let O of U) if (!O.valid) return false;
    return true;
  }
  __name(g, "g");
  function y(P) {
    let U = 0;
    return P.split(o).every((O) => (O = l(O), O.startsWith("var(") ? true : (0, r.parseColor)(O, { loose: true }) !== null ? (U++, true) : false)) ? U > 0 : false;
  }
  __name(y, "y");
  function x(P) {
    let U = 0;
    return P.split(a).every((O) => (O = l(O), O.startsWith("var(") ? true : s(O) || L(O) || ["element(", "image(", "cross-fade(", "image-set("].some((X) => O.startsWith(X)) ? (U++, true) : false)) ? U > 0 : false;
  }
  __name(x, "x");
  var _ = /* @__PURE__ */ new Set(["linear-gradient", "radial-gradient", "repeating-linear-gradient", "repeating-radial-gradient", "conic-gradient"]);
  function L(P) {
    P = l(P);
    for (let U of _) if (P.startsWith(`${U}(`)) return true;
    return false;
  }
  __name(L, "L");
  var T = /* @__PURE__ */ new Set(["center", "top", "right", "bottom", "left"]);
  function E(P) {
    let U = 0;
    return P.split(o).every((O) => (O = l(O), O.startsWith("var(") ? true : T.has(O) || p(O) || f(O) ? (U++, true) : false)) ? U > 0 : false;
  }
  __name(E, "E");
  function R(P) {
    let U = 0;
    return P.split(a).every((O) => (O = l(O), O.startsWith("var(") ? true : O.includes(" ") && !/(['"])([^"']+)\1/g.test(O) || /^\d/g.test(O) ? false : (U++, true))) ? U > 0 : false;
  }
  __name(R, "R");
  var C = /* @__PURE__ */ new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"]);
  function D(P) {
    return C.has(P);
  }
  __name(D, "D");
  var M = /* @__PURE__ */ new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "x-large", "xxx-large"]);
  function H(P) {
    return M.has(P);
  }
  __name(H, "H");
  var Q = /* @__PURE__ */ new Set(["larger", "smaller"]);
  function ee(P) {
    return Q.has(P);
  }
  __name(ee, "ee");
});
var Tg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(E, R) {
    for (var C in R) Object.defineProperty(E, C, { enumerable: true, get: R[C] });
  }
  __name(t, "t");
  t(e, { updateAllClasses: /* @__PURE__ */ __name(() => s, "updateAllClasses"), asValue: /* @__PURE__ */ __name(() => c, "asValue"), parseColorFormat: /* @__PURE__ */ __name(() => m, "parseColorFormat"), asColor: /* @__PURE__ */ __name(() => v, "asColor"), asLookupValue: /* @__PURE__ */ __name(() => g, "asLookupValue"), coerceValue: /* @__PURE__ */ __name(() => T, "coerceValue") });
  var r = l(bg()), n = l(yg()), i = uu(), a = kg(), o = l(Vl());
  function l(E) {
    return E && E.__esModule ? E : { default: E };
  }
  __name(l, "l");
  function s(E, R) {
    return (0, r.default)((C) => {
      C.walkClasses((D) => {
        let M = R(D.value);
        D.value = M, D.raws && D.raws.value && (D.raws.value = (0, n.default)(D.raws.value));
      });
    }).processSync(E);
  }
  __name(s, "s");
  function u(E, R) {
    if (!h(E)) return;
    let C = E.slice(1, -1);
    if (R(C)) return (0, a.normalize)(C);
  }
  __name(u, "u");
  function f(E, R = {}, C) {
    let D = R[E];
    if (D !== void 0) return (0, o.default)(D);
    if (h(E)) {
      let M = u(E, C);
      return M === void 0 ? void 0 : (0, o.default)(M);
    }
  }
  __name(f, "f");
  function c(E, R = {}, { validate: C = /* @__PURE__ */ __name(() => true, "C") } = {}) {
    var D;
    let M = (D = R.values) === null || D === void 0 ? void 0 : D[E];
    return M !== void 0 ? M : R.supportsNegativeValues && E.startsWith("-") ? f(E.slice(1), R.values, C) : u(E, C);
  }
  __name(c, "c");
  function h(E) {
    return E.startsWith("[") && E.endsWith("]");
  }
  __name(h, "h");
  function p(E) {
    let R = E.lastIndexOf("/");
    return R === -1 || R === E.length - 1 ? [E] : [E.slice(0, R), E.slice(R + 1)];
  }
  __name(p, "p");
  function m(E) {
    if (typeof E == "string" && E.includes("<alpha-value>")) {
      let R = E;
      return ({ opacityValue: C = 1 }) => R.replace("<alpha-value>", C);
    }
    return E;
  }
  __name(m, "m");
  function v(E, R = {}, { tailwindConfig: C = {} } = {}) {
    var D;
    if (((D = R.values) === null || D === void 0 ? void 0 : D[E]) !== void 0) {
      var M;
      return m((M = R.values) === null || M === void 0 ? void 0 : M[E]);
    }
    let [H, Q] = p(E);
    if (Q !== void 0) {
      var ee, P, U, O;
      let X = (O = (ee = R.values) === null || ee === void 0 ? void 0 : ee[H]) !== null && O !== void 0 ? O : h(H) ? H.slice(1, -1) : void 0;
      return X === void 0 ? void 0 : (X = m(X), h(Q) ? (0, i.withAlphaValue)(X, Q.slice(1, -1)) : ((P = C.theme) === null || P === void 0 || (U = P.opacity) === null || U === void 0 ? void 0 : U[Q]) === void 0 ? void 0 : (0, i.withAlphaValue)(X, C.theme.opacity[Q]));
    }
    return c(E, R, { validate: a.color });
  }
  __name(v, "v");
  function g(E, R = {}) {
    var C;
    return (C = R.values) === null || C === void 0 ? void 0 : C[E];
  }
  __name(g, "g");
  function y(E) {
    return (R, C) => c(R, C, { validate: E });
  }
  __name(y, "y");
  var x = { any: c, color: v, url: y(a.url), image: y(a.image), length: y(a.length), percentage: y(a.percentage), position: y(a.position), lookup: g, "generic-name": y(a.genericName), "family-name": y(a.familyName), number: y(a.number), "line-width": y(a.lineWidth), "absolute-size": y(a.absoluteSize), "relative-size": y(a.relativeSize), shadow: y(a.shadow) }, _ = Object.keys(x);
  function L(E, R) {
    let C = E.indexOf(R);
    return C === -1 ? [void 0, E] : [E.slice(0, C), E.slice(C + 1)];
  }
  __name(L, "L");
  function T(E, R, C, D) {
    if (h(R)) {
      let M = R.slice(1, -1), [H, Q] = L(M, ":");
      if (!/^[\w-_]+$/g.test(H)) Q = M;
      else if (H !== void 0 && !_.includes(H)) return [];
      if (Q.length > 0 && _.includes(H)) return [c(`[${Q}]`, C), H];
    }
    for (let M of [].concat(E)) {
      let H = x[M](R, C, { tailwindConfig: D });
      if (H !== void 0) return [H, M];
    }
    return [];
  }
  __name(T, "T");
});
var _g = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => t, "get") });
  function t(r) {
    return typeof r == "function" ? r({}) : r;
  }
  __name(t, "t");
});
var Lg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => ee, "get") });
  var t = m(Vl()), r = m(Kv()), n = m(eg()), i = m(Hl()), a = m(tg()), o = rg(), l = ng(), s = ig(), u = m(ag()), f = og(), c = Tg(), h = uu(), p = m(_g());
  function m(P) {
    return P && P.__esModule ? P : { default: P };
  }
  __name(m, "m");
  function v(P) {
    return typeof P == "function";
  }
  __name(v, "v");
  function g(P) {
    return typeof P == "object" && P !== null;
  }
  __name(g, "g");
  function y(P, ...U) {
    let O = U.pop();
    for (let X of U) for (let K in X) {
      let ne = O(P[K], X[K]);
      ne === void 0 ? g(P[K]) && g(X[K]) ? P[K] = y(P[K], X[K], O) : P[K] = X[K] : P[K] = ne;
    }
    return P;
  }
  __name(y, "y");
  var x = { colors: a.default, negative(P) {
    return Object.keys(P).filter((U) => P[U] !== "0").reduce((U, O) => {
      let X = (0, t.default)(P[O]);
      return X !== void 0 && (U[`-${O}`] = X), U;
    }, {});
  }, breakpoints(P) {
    return Object.keys(P).filter((U) => typeof P[U] == "string").reduce((U, O) => ({ ...U, [`screen-${O}`]: P[O] }), {});
  } };
  function _(P, ...U) {
    return v(P) ? P(...U) : P;
  }
  __name(_, "_");
  function L(P) {
    return P.reduce((U, { extend: O }) => y(U, O, (X, K) => X === void 0 ? [K] : Array.isArray(X) ? [K, ...X] : [K, X]), {});
  }
  __name(L, "L");
  function T(P) {
    return { ...P.reduce((U, O) => (0, o.defaults)(U, O), {}), extend: L(P) };
  }
  __name(T, "T");
  function E(P, U) {
    if (Array.isArray(P) && g(P[0])) return P.concat(U);
    if (Array.isArray(U) && g(U[0]) && g(P)) return [P, ...U];
    if (Array.isArray(U)) return U;
  }
  __name(E, "E");
  function R({ extend: P, ...U }) {
    return y(U, P, (O, X) => !v(O) && !X.some(v) ? y({}, O, ...X, E) : (K, ne) => y({}, ...[O, ...X].map((ie) => _(ie, K, ne)), E));
  }
  __name(R, "R");
  function* C(P) {
    let U = (0, l.toPath)(P);
    if (U.length === 0 || (yield U, Array.isArray(P))) return;
    let O = /^(.*?)\s*\/\s*([^/]+)$/, X = P.match(O);
    if (X !== null) {
      let [, K, ne] = X, ie = (0, l.toPath)(K);
      ie.alpha = ne, yield ie;
    }
  }
  __name(C, "C");
  function D(P) {
    let U = /* @__PURE__ */ __name((O, X) => {
      for (let K of C(O)) {
        let ne = 0, ie = P;
        for (; ie != null && ne < K.length; ) ie = ie[K[ne++]], ie = v(ie) && (K.alpha === void 0 || ne <= K.length - 1) ? ie(U, x) : ie;
        if (ie !== void 0) {
          if (K.alpha !== void 0) {
            let V = (0, c.parseColorFormat)(ie);
            return (0, h.withAlphaValue)(V, K.alpha, (0, p.default)(V));
          }
          return (0, u.default)(ie) ? (0, f.cloneDeep)(ie) : ie;
        }
      }
      return X;
    }, "U");
    return Object.assign(U, { theme: U, ...x }), Object.keys(P).reduce((O, X) => (O[X] = v(P[X]) ? P[X](U, x) : P[X], O), {});
  }
  __name(D, "D");
  function M(P) {
    let U = [];
    return P.forEach((O) => {
      U = [...U, O];
      var X;
      let K = (X = O?.plugins) !== null && X !== void 0 ? X : [];
      K.length !== 0 && K.forEach((ne) => {
        ne.__isOptionsFunction && (ne = ne());
        var ie;
        U = [...U, ...M([(ie = ne?.config) !== null && ie !== void 0 ? ie : {}])];
      });
    }), U;
  }
  __name(M, "M");
  function H(P) {
    return [...P].reduceRight((U, O) => v(O) ? O({ corePlugins: U }) : (0, n.default)(O, U), r.default);
  }
  __name(H, "H");
  function Q(P) {
    return [...P].reduceRight((U, O) => [...U, ...O], []);
  }
  __name(Q, "Q");
  function ee(P) {
    let U = [...M(P), { prefix: "", important: false, separator: ":", variantOrder: i.default.variantOrder }];
    var O, X;
    return (0, s.normalizeConfig)((0, o.defaults)({ theme: D(R(T(U.map((K) => (O = K?.theme) !== null && O !== void 0 ? O : {})))), corePlugins: H(U.map((K) => K.corePlugins)), plugins: Q(P.map((K) => (X = K?.plugins) !== null && X !== void 0 ? X : [])) }, ...U));
  }
  __name(ee, "ee");
});
var fu = {};
Ra(fu, { default: /* @__PURE__ */ __name(() => cu, "default") });
var cu;
var Cg = Ia(() => {
  cu = { yellow: /* @__PURE__ */ __name((e) => e, "yellow") };
});
var Og = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(c, h) {
    for (var p in h) Object.defineProperty(c, p, { enumerable: true, get: h[p] });
  }
  __name(t, "t");
  t(e, { flagEnabled: /* @__PURE__ */ __name(() => l, "flagEnabled"), issueFlagNotices: /* @__PURE__ */ __name(() => u, "issueFlagNotices"), default: /* @__PURE__ */ __name(() => f, "default") });
  var r = i((Cg(), Zn(fu))), n = i((Fa(), Zn(Kn)));
  function i(c) {
    return c && c.__esModule ? c : { default: c };
  }
  __name(i, "i");
  var a = { optimizeUniversalDefaults: false }, o = { future: ["hoverOnlyWhenSupported", "respectDefaultRingColorOpacity"], experimental: ["optimizeUniversalDefaults", "matchVariant"] };
  function l(c, h) {
    if (o.future.includes(h)) {
      var p, m, v;
      return c.future === "all" || ((v = (m = c == null || (p = c.future) === null || p === void 0 ? void 0 : p[h]) !== null && m !== void 0 ? m : a[h]) !== null && v !== void 0 ? v : false);
    }
    if (o.experimental.includes(h)) {
      var g, y, x;
      return c.experimental === "all" || ((x = (y = c == null || (g = c.experimental) === null || g === void 0 ? void 0 : g[h]) !== null && y !== void 0 ? y : a[h]) !== null && x !== void 0 ? x : false);
    }
    return false;
  }
  __name(l, "l");
  function s(c) {
    if (c.experimental === "all") return o.experimental;
    var h;
    return Object.keys((h = c?.experimental) !== null && h !== void 0 ? h : {}).filter((p) => o.experimental.includes(p) && c.experimental[p]);
  }
  __name(s, "s");
  function u(c) {
    if (process.env.JEST_WORKER_ID === void 0 && s(c).length > 0) {
      let h = s(c).map((p) => r.default.yellow(p)).join(", ");
      n.default.warn("experimental-flags-enabled", [`You have enabled experimental features: ${h}`, "Experimental features in Tailwind CSS are not covered by semver, may introduce breaking changes, and can change at any time."]);
    }
  }
  __name(u, "u");
  var f = o;
});
var Ag = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => i, "get") });
  var t = n(Hl()), r = Og();
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  function i(a) {
    var o;
    let l = ((o = a?.presets) !== null && o !== void 0 ? o : [t.default]).slice().reverse().flatMap((f) => i(typeof f == "function" ? f() : f)), s = { respectDefaultRingColorOpacity: { theme: { ringColor: { DEFAULT: "#3b82f67f" } } } }, u = Object.keys(s).filter((f) => (0, r.flagEnabled)(a, f)).map((f) => s[f]);
    return [a, ...u, ...l];
  }
  __name(i, "i");
});
var Pg = ue((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: /* @__PURE__ */ __name(() => i, "get") });
  var t = n(Lg()), r = n(Ag());
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  function i(...a) {
    let [, ...o] = (0, r.default)(a[0]);
    return (0, t.default)([...a, ...o]);
  }
  __name(i, "i");
});
var Ig = ue((e, t) => {
  var r = Pg();
  t.exports = (r.__esModule ? r : { default: r }).default;
});
var tn;
function hu(e) {
  tn = e;
}
__name(hu, "hu");
var Zr = null;
async function ti() {
  return tn || (Zr ? (await Zr, tn) : (Zr = Promise.resolve().then(() => (Qv(), zl)).then((e) => e.getYogaModule()).then((e) => tn = e), await Zr, Zr = null, tn));
}
__name(ti, "ti");
var an = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "an");
var Rg = an((e, t) => {
  t.exports = ["em", "ex", "ch", "rem", "vh", "vw", "vmin", "vmax", "px", "mm", "cm", "in", "pt", "pc", "mozmm"];
});
var Fg = an((e, t) => {
  t.exports = ["deg", "grad", "rad", "turn"];
});
var Dg = an((e, t) => {
  t.exports = ["dpi", "dpcm", "dppx"];
});
var Ug = an((e, t) => {
  t.exports = ["Hz", "kHz"];
});
var Ng = an((e, t) => {
  t.exports = ["s", "ms"];
});
var Mg = Rg();
var pu = Fg();
var du = Dg();
var vu = Ug();
var gu = Ng();
function Ma(e) {
  if (/\.\D?$/.test(e)) throw new Error("The dot should be followed by a number");
  if (/^[+-]{2}/.test(e)) throw new Error("Only one leading +/- is allowed");
  if (Wg(e) > 1) throw new Error("Only one dot is allowed");
  if (/%$/.test(e)) {
    this.type = "percentage", this.value = da(e), this.unit = "%";
    return;
  }
  var t = Gg(e);
  if (!t) {
    this.type = "number", this.value = da(e);
    return;
  }
  this.type = jg(t), this.value = da(e.substr(0, e.length - t.length)), this.unit = t;
}
__name(Ma, "Ma");
Ma.prototype.valueOf = function() {
  return this.value;
};
Ma.prototype.toString = function() {
  return this.value + (this.unit || "");
};
function on(e) {
  return new Ma(e);
}
__name(on, "on");
function Wg(e) {
  var t = e.match(/\./g);
  return t ? t.length : 0;
}
__name(Wg, "Wg");
function da(e) {
  var t = parseFloat(e);
  if (isNaN(t)) throw new Error("Invalid number: " + e);
  return t;
}
__name(da, "da");
var Bg = [].concat(pu, vu, Mg, du, gu);
function Gg(e) {
  var t = e.match(/\D+$/), r = t && t[0];
  if (r && Bg.indexOf(r) === -1) throw new Error("Invalid unit: " + r);
  return r;
}
__name(Gg, "Gg");
var $g = Object.assign(Dn(pu, "angle"), Dn(vu, "frequency"), Dn(du, "resolution"), Dn(gu, "time"));
function Dn(e, t) {
  return Object.fromEntries(e.map((r) => [r, t]));
}
__name(Dn, "Dn");
function jg(e) {
  return $g[e] || "length";
}
__name(jg, "jg");
function Vn(e) {
  let t = typeof e;
  return !(t === "number" || t === "bigint" || t === "string" || t === "boolean");
}
__name(Vn, "Vn");
function zg(e) {
  return /^class\s/.test(e.toString());
}
__name(zg, "zg");
function Vg(e) {
  return "dangerouslySetInnerHTML" in e;
}
__name(Vg, "Vg");
function Hg(e) {
  let t = typeof e > "u" ? [] : [].concat(e).flat(1 / 0), r = [];
  for (let n = 0; n < t.length; n++) {
    let i = t[n];
    typeof i > "u" || typeof i == "boolean" || i === null || (typeof i == "number" && (i = String(i)), typeof i == "string" && r.length && typeof r[r.length - 1] == "string" ? r[r.length - 1] += i : r.push(i));
  }
  return r;
}
__name(Hg, "Hg");
function Pe(e, t, r, n, i = false) {
  if (typeof e == "number") return e;
  try {
    if (e = e.trim(), /[ /\(,]/.test(e)) return;
    if (e === String(+e)) return +e;
    let a = new on(e);
    if (a.type === "length") switch (a.unit) {
      case "em":
        return a.value * t;
      case "rem":
        return a.value * 16;
      case "vw":
        return ~~(a.value * n._viewportWidth / 100);
      case "vh":
        return ~~(a.value * n._viewportHeight / 100);
      default:
        return a.value;
    }
    else {
      if (a.type === "angle") return mu(e);
      if (a.type === "percentage" && i) return a.value / 100 * r;
    }
  } catch {
  }
}
__name(Pe, "Pe");
function mu(e) {
  let t = new on(e);
  switch (t.unit) {
    case "deg":
      return t.value;
    case "rad":
      return t.value * 180 / Math.PI;
    case "turn":
      return t.value * 360;
    case "grad":
      return 0.9 * t.value;
  }
}
__name(mu, "mu");
function Hn(e, t) {
  return [e[0] * t[0] + e[2] * t[1], e[1] * t[0] + e[3] * t[1], e[0] * t[2] + e[2] * t[3], e[1] * t[2] + e[3] * t[3], e[0] * t[4] + e[2] * t[5] + e[4], e[1] * t[4] + e[3] * t[5] + e[5]];
}
__name(Hn, "Hn");
function It(e, t, r, n) {
  let i = t[e];
  if (typeof i > "u") {
    if (n && typeof e < "u") throw new Error(`Invalid value for CSS property "${n}". Allowed values: ${Object.keys(t).map((a) => `"${a}"`).join(" | ")}. Received: "${e}".`);
    i = r;
  }
  return i;
}
__name(It, "It");
var va;
var ga;
var qg = [32, 160, 4961, 65792, 65793, 4153, 4241, 10].map((e) => String.fromCodePoint(e));
function Ft(e, t, r) {
  if (!va || !ga) {
    if (!(typeof Intl < "u" && "Segmenter" in Intl)) throw new Error("Intl.Segmenter does not exist, please use import a polyfill.");
    va = new Intl.Segmenter(r, { granularity: "word" }), ga = new Intl.Segmenter(r, { granularity: "grapheme" });
  }
  if (t === "grapheme") return [...ga.segment(e)].map((n) => n.segment);
  {
    let n = [...va.segment(e)].map((o) => o.segment), i = [], a = 0;
    for (; a < n.length; ) {
      let o = n[a];
      if (o == "\xA0") {
        let l = a === 0 ? "" : i.pop(), s = a === n.length - 1 ? "" : n[a + 1];
        i.push(l + "\xA0" + s), a += 2;
      } else i.push(o), a++;
    }
    return i;
  }
}
__name(Ft, "Ft");
function le(e, t, r) {
  let n = "";
  for (let [i, a] of Object.entries(t)) typeof a < "u" && (n += ` ${i}="${a}"`);
  return r ? `<${e}${n}>${r}</${e}>` : `<${e}${n}/>`;
}
__name(le, "le");
function Xg(e = 20) {
  let t = /* @__PURE__ */ new Map();
  function r(a, o) {
    if (t.size >= e) {
      let l = t.keys().next().value;
      t.delete(l);
    }
    t.set(a, o);
  }
  __name(r, "r");
  function n(a) {
    if (!t.has(a)) return;
    let o = t.get(a);
    return t.delete(a), t.set(a, o), o;
  }
  __name(n, "n");
  function i() {
    t.clear();
  }
  __name(i, "i");
  return { set: r, get: n, clear: i };
}
__name(Xg, "Xg");
function Wa(e) {
  return e ? e.split(/[, ]/).filter(Boolean).map(Number) : null;
}
__name(Wa, "Wa");
function Yg(e) {
  return Object.prototype.toString.call(e);
}
__name(Yg, "Yg");
function bu(e) {
  return typeof e == "string";
}
__name(bu, "bu");
function Zg(e) {
  return typeof e == "number";
}
__name(Zg, "Zg");
function Jg(e) {
  return Yg(e) === "[object Undefined]";
}
__name(Jg, "Jg");
function Qg(e, t) {
  if (t === "break-all") return { words: Ft(e, "grapheme"), requiredBreaks: [] };
  if (t === "keep-all") return { words: Ft(e, "word"), requiredBreaks: [] };
  let r = new Ti(e), n = 0, i = r.nextBreak(), a = [], o = [false];
  for (; i; ) {
    let l = e.slice(n, i.position);
    a.push(l), i.required ? o.push(true) : o.push(false), n = i.position, i = r.nextBreak();
  }
  return { words: a, requiredBreaks: o };
}
__name(Qg, "Qg");
var Kg = /* @__PURE__ */ __name((e) => e.replaceAll(/([A-Z])/g, (t, r) => `-${r.toLowerCase()}`), "Kg");
function yu(e, t = ",") {
  let r = [], n = 0, i = 0;
  t = new RegExp(t);
  for (let a = 0; a < e.length; a++) e[a] === "(" ? i++ : e[a] === ")" && i--, i === 0 && t.test(e[a]) && (r.push(e.slice(n, a).trim()), n = a + 1);
  return r.push(e.slice(n).trim()), r;
}
__name(yu, "yu");
var e1 = "image/avif";
var t1 = "image/webp";
var ri = "image/apng";
var ni = "image/png";
var ii = "image/jpeg";
var ai = "image/gif";
var Ba = "image/svg+xml";
function xu(e) {
  let t = new DataView(e), r = 4, n = t.byteLength;
  for (; r < n; ) {
    let i = t.getUint16(r, false);
    if (i > n) throw new TypeError("Invalid JPEG");
    let a = t.getUint8(i + 1 + r);
    if (a === 192 || a === 193 || a === 194) return [t.getUint16(i + 7 + r, false), t.getUint16(i + 5 + r, false)];
    r += i + 2;
  }
  throw new TypeError("Invalid JPEG");
}
__name(xu, "xu");
function wu(e) {
  let t = new Uint8Array(e.slice(6, 10));
  return [t[0] | t[1] << 8, t[2] | t[3] << 8];
}
__name(wu, "wu");
function Su(e) {
  let t = new DataView(e);
  return [t.getUint16(18, false), t.getUint16(22, false)];
}
__name(Su, "Su");
var cr = Xg(100);
var qn = /* @__PURE__ */ new Map();
var r1 = [ni, ri, ii, ai, Ba];
function n1(e) {
  let t = "", r = new Uint8Array(e);
  for (let n = 0; n < r.byteLength; n++) t += String.fromCharCode(r[n]);
  return btoa(t);
}
__name(n1, "n1");
function i1(e) {
  let t = atob(e), r = t.length, n = new Uint8Array(r);
  for (let i = 0; i < r; i++) n[i] = t.charCodeAt(i);
  return n.buffer;
}
__name(i1, "i1");
function ml(e, t) {
  let r = t.match(/<svg[^>]*>/)[0], n = r.match(/viewBox=['"](.+)['"]/), i = n ? Wa(n[1]) : null, a = r.match(/width=['"](\d*\.\d+|\d+)['"]/), o = r.match(/height=['"](\d*\.\d+|\d+)['"]/);
  if (!i && (!a || !o)) throw new Error(`Failed to parse SVG from ${e}: missing "viewBox"`);
  let l = i ? [i[2], i[3]] : [+a[1], +o[1]], s = l[0] / l[1];
  return a && o ? [+a[1], +o[1]] : a ? [+a[1], +a[1] / s] : o ? [+o[1] * s, +o[1]] : [l[0], l[1]];
}
__name(ml, "ml");
function bl(e) {
  let t, r = a1(new Uint8Array(e));
  switch (r) {
    case ni:
    case ri:
      t = Su(e);
      break;
    case ai:
      t = wu(e);
      break;
    case ii:
      t = xu(e);
      break;
  }
  if (!r1.includes(r)) throw new Error(`Unsupported image type: ${r || "unknown"}`);
  return [`data:${r};base64,${n1(e)}`, t];
}
__name(bl, "bl");
async function Ga(e) {
  if (!e) throw new Error("Image source is not provided.");
  if (typeof e == "object") {
    let [i, a] = bl(e);
    return [i, ...a];
  }
  if ((e.startsWith('"') && e.endsWith('"') || e.startsWith("'") && e.endsWith("'")) && (e = e.slice(1, -1)), typeof window > "u" && !e.startsWith("http") && !e.startsWith("data:")) throw new Error(`Image source must be an absolute URL: ${e}`);
  if (e.startsWith("data:")) {
    let i;
    try {
      i = /data:(?<imageType>[a-z/+]+)(;[^;=]+=[^;=]+)*?(;(?<encodingType>[^;,]+))?,(?<dataString>.*)/g.exec(e).groups;
    } catch {
      return console.warn("Image data URI resolved without size:" + e), [e];
    }
    let { imageType: a, encodingType: o, dataString: l } = i;
    if (a === Ba) {
      let s = o === "base64" ? atob(l) : decodeURIComponent(l.replace(/ /g, "%20")), u = o === "base64" ? e : `data:image/svg+xml;base64,${btoa(s)}`, f = ml(e, s);
      return cr.set(e, [u, ...f]), [u, ...f];
    } else if (o === "base64") {
      let s, u = i1(l);
      switch (a) {
        case ni:
        case ri:
          s = Su(u);
          break;
        case ai:
          s = wu(u);
          break;
        case ii:
          s = xu(u);
          break;
      }
      return cr.set(e, [e, ...s]), [e, ...s];
    } else return console.warn("Image data URI resolved without size:" + e), cr.set(e, [e]), [e];
  }
  if (!globalThis.fetch) throw new Error("`fetch` is required to be polyfilled to load images.");
  if (qn.has(e)) return qn.get(e);
  let t = cr.get(e);
  if (t) return t;
  let r = e, n = fetch(r).then((i) => {
    let a = i.headers.get("content-type");
    return a === "image/svg+xml" || a === "application/svg+xml" ? i.text() : i.arrayBuffer();
  }).then((i) => {
    if (typeof i == "string") try {
      let l = `data:image/svg+xml;base64,${btoa(i)}`, s = ml(r, i);
      return [l, ...s];
    } catch (l) {
      throw new Error(`Failed to parse SVG image: ${l.message}`);
    }
    let [a, o] = bl(i);
    return [a, ...o];
  }).then((i) => (cr.set(r, i), i)).catch((i) => (console.error(`Can't load image ${r}: ` + i.message), cr.set(r, []), []));
  return qn.set(r, n), n;
}
__name(Ga, "Ga");
function a1(e) {
  return [255, 216, 255].every((t, r) => e[r] === t) ? ii : [137, 80, 78, 71, 13, 10, 26, 10].every((t, r) => e[r] === t) ? o1(e) ? ri : ni : [71, 73, 70, 56].every((t, r) => e[r] === t) ? ai : [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80].every((t, r) => !t || e[r] === t) ? t1 : [60, 63, 120, 109, 108].every((t, r) => e[r] === t) ? Ba : [0, 0, 0, 0, 102, 116, 121, 112, 97, 118, 105, 102].every((t, r) => !t || e[r] === t) ? e1 : null;
}
__name(a1, "a1");
function o1(e) {
  let t = new DataView(e.buffer), r, n, i = 8, a = false;
  for (; !a && r !== "IEND" && i < e.length; ) {
    n = t.getUint32(i);
    let o = e.subarray(i + 4, i + 8);
    r = String.fromCharCode(...o), a = r === "acTL", i += 12 + n;
  }
  return a;
}
__name(o1, "o1");
var Ta = { accentHeight: "accent-height", alignmentBaseline: "alignment-baseline", arabicForm: "arabic-form", baselineShift: "baseline-shift", capHeight: "cap-height", clipPath: "clip-path", clipRule: "clip-rule", colorInterpolation: "color-interpolation", colorInterpolationFilters: "color-interpolation-filters", colorProfile: "color-profile", colorRendering: "color-rendering", dominantBaseline: "dominant-baseline", enableBackground: "enable-background", fillOpacity: "fill-opacity", fillRule: "fill-rule", floodColor: "flood-color", floodOpacity: "flood-opacity", fontFamily: "font-family", fontSize: "font-size", fontSizeAdjust: "font-size-adjust", fontStretch: "font-stretch", fontStyle: "font-style", fontVariant: "font-variant", fontWeight: "font-weight", glyphName: "glyph-name", glyphOrientationHorizontal: "glyph-orientation-horizontal", glyphOrientationVertical: "glyph-orientation-vertical", horizAdvX: "horiz-adv-x", horizOriginX: "horiz-origin-x", href: "href", imageRendering: "image-rendering", letterSpacing: "letter-spacing", lightingColor: "lighting-color", markerEnd: "marker-end", markerMid: "marker-mid", markerStart: "marker-start", overlinePosition: "overline-position", overlineThickness: "overline-thickness", paintOrder: "paint-order", panose1: "panose-1", pointerEvents: "pointer-events", renderingIntent: "rendering-intent", shapeRendering: "shape-rendering", stopColor: "stop-color", stopOpacity: "stop-opacity", strikethroughPosition: "strikethrough-position", strikethroughThickness: "strikethrough-thickness", strokeDasharray: "stroke-dasharray", strokeDashoffset: "stroke-dashoffset", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin", strokeMiterlimit: "stroke-miterlimit", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", textAnchor: "text-anchor", textDecoration: "text-decoration", textRendering: "text-rendering", underlinePosition: "underline-position", underlineThickness: "underline-thickness", unicodeBidi: "unicode-bidi", unicodeRange: "unicode-range", unitsPerEm: "units-per-em", vAlphabetic: "v-alphabetic", vHanging: "v-hanging", vIdeographic: "v-ideographic", vMathematical: "v-mathematical", vectorEffect: "vector-effect", vertAdvY: "vert-adv-y", vertOriginX: "vert-origin-x", vertOriginY: "vert-origin-y", wordSpacing: "word-spacing", writingMode: "writing-mode", xHeight: "x-height", xlinkActuate: "xlink:actuate", xlinkArcrole: "xlink:arcrole", xlinkHref: "xlink:href", xlinkRole: "xlink:role", xlinkShow: "xlink:show", xlinkTitle: "xlink:title", xlinkType: "xlink:type", xmlBase: "xml:base", xmlLang: "xml:lang", xmlSpace: "xml:space", xmlnsXlink: "xmlns:xlink" };
var s1 = /[\r\n%#()<>?[\\\]^`{|}"']/g;
function _a(e, t) {
  if (!e) return "";
  if (Array.isArray(e)) return e.map((u) => _a(u, t)).join("");
  if (typeof e != "object") return String(e);
  let r = e.type;
  if (r === "text") throw new Error("<text> nodes are not currently supported, please convert them to <path>");
  let { children: n, style: i, ...a } = e.props || {}, o = i?.color || t, l = `${Object.entries(a).map(([u, f]) => (typeof f == "string" && f.toLowerCase() === "currentcolor" && (f = o), u === "href" && r === "image" ? ` ${Ta[u] || u}="${cr.get(f)[0]}"` : ` ${Ta[u] || u}="${f}"`)).join("")}`, s = i ? ` style="${Object.entries(i).map(([u, f]) => `${Kg(u)}:${f}`).join(";")}"` : "";
  return `<${r}${l}${s}>${_a(n, o)}</${r}>`;
}
__name(_a, "_a");
async function l1(e) {
  let t = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ __name((n) => {
    if (n && Vn(n)) {
      if (Array.isArray(n)) {
        n.forEach((i) => r(i));
        return;
      } else typeof n == "object" && (n.type === "image" ? t.has(n.props.href) || t.add(n.props.href) : n.type === "img" && (t.has(n.props.src) || t.add(n.props.src)));
      Array.isArray(n.props.children) ? n.props.children.map((i) => r(i)) : r(n.props.children);
    }
  }, "r");
  return r(e), Promise.all(Array.from(t).map((n) => Ga(n)));
}
__name(l1, "l1");
async function u1(e, t) {
  let { viewBox: r, viewbox: n, width: i, height: a, className: o, style: l, children: s, ...u } = e.props || {};
  r ||= n, u.xmlns = "http://www.w3.org/2000/svg";
  let f = l?.color || t, c = Wa(r), h = c ? c[3] / c[2] : null;
  return i = i || h && a ? a / h : null, a = a || h && i ? i * h : null, u.width = i, u.height = a, r && (u.viewBox = r), `data:image/svg+xml;utf8,${`<svg ${Object.entries(u).map(([p, m]) => (typeof m == "string" && m.toLowerCase() === "currentcolor" && (m = f), ` ${Ta[p] || p}="${m}"`)).join("")}>${_a(s, f)}</svg>`.replace(s1, encodeURIComponent)}`;
}
__name(u1, "u1");
var St = "flex";
var f1 = { p: { display: St, marginTop: "1em", marginBottom: "1em" }, div: { display: St }, blockquote: { display: St, marginTop: "1em", marginBottom: "1em", marginLeft: 40, marginRight: 40 }, center: { display: St, textAlign: "center" }, hr: { display: St, marginTop: "0.5em", marginBottom: "0.5em", marginLeft: "auto", marginRight: "auto", borderWidth: 1, borderStyle: "solid" }, h1: { display: St, fontSize: "2em", marginTop: "0.67em", marginBottom: "0.67em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h2: { display: St, fontSize: "1.5em", marginTop: "0.83em", marginBottom: "0.83em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h3: { display: St, fontSize: "1.17em", marginTop: "1em", marginBottom: "1em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h4: { display: St, marginTop: "1.33em", marginBottom: "1.33em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h5: { display: St, fontSize: "0.83em", marginTop: "1.67em", marginBottom: "1.67em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h6: { display: St, fontSize: "0.67em", marginTop: "2.33em", marginBottom: "2.33em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, u: { textDecoration: "underline" }, strong: { fontWeight: "bold" }, b: { fontWeight: "bold" }, i: { fontStyle: "italic" }, em: { fontStyle: "italic" }, code: { fontFamily: "monospace" }, kbd: { fontFamily: "monospace" }, pre: { display: St, fontFamily: "monospace", whiteSpace: "pre", marginTop: "1em", marginBottom: "1em" }, mark: { backgroundColor: "yellow", color: "black" }, big: { fontSize: "larger" }, small: { fontSize: "smaller" }, s: { textDecoration: "line-through" } };
var c1 = /* @__PURE__ */ new Set(["color", "font", "fontFamily", "fontSize", "fontStyle", "fontWeight", "letterSpacing", "lineHeight", "textAlign", "textTransform", "textShadowOffset", "textShadowColor", "textShadowRadius", "WebkitTextStrokeWidth", "WebkitTextStrokeColor", "textDecorationLine", "textDecorationStyle", "textDecorationColor", "whiteSpace", "transform", "wordBreak", "tabSize", "opacity", "filter", "_viewportWidth", "_viewportHeight", "_inheritedClipPathId", "_inheritedMaskId", "_inheritedBackgroundClipTextPath"]);
function h1(e) {
  let t = {};
  for (let r in e) c1.has(r) && (t[r] = e[r]);
  return t;
}
__name(h1, "h1");
function p1(e, t) {
  try {
    let r = new on(e);
    switch (r.unit) {
      case "px":
        return { absolute: r.value };
      case "em":
        return { absolute: r.value * t };
      case "rem":
        return { absolute: r.value * 16 };
      case "%":
        return { relative: r.value };
      default:
        return {};
    }
  } catch {
    return {};
  }
}
__name(p1, "p1");
function ma(e, t, r) {
  switch (e) {
    case "top":
      return { yRelative: 0 };
    case "left":
      return { xRelative: 0 };
    case "right":
      return { xRelative: 100 };
    case "bottom":
      return { yRelative: 100 };
    case "center":
      return {};
    default: {
      let n = p1(e, t);
      return n.absolute ? { [r ? "xAbsolute" : "yAbsolute"]: n.absolute } : n.relative ? { [r ? "xRelative" : "yRelative"]: n.relative } : {};
    }
  }
}
__name(ma, "ma");
function d1(e, t) {
  if (typeof e == "number") return { xAbsolute: e };
  let r;
  try {
    r = (0, _u.default)(e).nodes.filter((n) => n.type === "word").map((n) => n.value);
  } catch {
    return {};
  }
  return r.length === 1 ? ma(r[0], t, true) : r.length === 2 ? ((r[0] === "top" || r[0] === "bottom" || r[1] === "left" || r[1] === "right") && r.reverse(), { ...ma(r[0], t, true), ...ma(r[1], t, false) }) : {};
}
__name(d1, "d1");
function Jr(e, t) {
  let r = (0, Lu.getPropertyName)(`mask-${t}`);
  return e[r] || e[`WebkitM${r.substring(1)}`];
}
__name(Jr, "Jr");
function v1(e) {
  let t = e.maskImage || e.WebkitMaskImage, r = { position: Jr(e, "position") || "0% 0%", size: Jr(e, "size") || "100% 100%", repeat: Jr(e, "repeat") || "repeat", origin: Jr(e, "origin") || "border-box", clip: Jr(e, "origin") || "border-box" };
  return yu(t).filter((n) => n && n !== "none").reverse().map((n) => ({ image: n, ...r }));
}
__name(v1, "v1");
var g1 = /* @__PURE__ */ new Set(["flex", "flexGrow", "flexShrink", "flexBasis", "fontWeight", "lineHeight", "opacity", "scale", "scaleX", "scaleY"]);
var m1 = /* @__PURE__ */ new Set(["lineHeight"]);
function b1(e, t, r, n) {
  return e === "textDecoration" && !r.includes(t.textDecorationColor) && (t.textDecorationColor = n), t;
}
__name(b1, "b1");
function wr(e, t) {
  let r = Number(t);
  return isNaN(r) ? t : g1.has(e) ? m1.has(e) ? r : String(t) : r + "px";
}
__name(wr, "wr");
function y1(e, t, r) {
  if (e === "lineHeight") return { lineHeight: wr(e, t) };
  if (e === "fontFamily") return { fontFamily: t.split(",").map((n) => n.trim().replace(/(^['"])|(['"]$)/g, "").toLocaleLowerCase()) };
  if (e === "borderRadius") {
    if (typeof t != "string" || !t.includes("/")) return;
    let [n, i] = t.split("/"), a = (0, Rt.getStylesForProperty)(e, n, true), o = (0, Rt.getStylesForProperty)(e, i, true);
    for (let l in a) o[l] = wr(e, a[l]) + " " + wr(e, o[l]);
    return o;
  }
  if (/^border(Top|Right|Bottom|Left)?$/.test(e)) {
    let n = (0, Rt.getStylesForProperty)("border", t, true);
    n.borderWidth === 1 && !String(t).includes("1px") && (n.borderWidth = 3), n.borderColor === "black" && !String(t).includes("black") && (n.borderColor = r);
    let i = { Width: wr(e + "Width", n.borderWidth), Style: It(n.borderStyle, { solid: "solid", dashed: "dashed" }, "solid", e + "Style"), Color: n.borderColor }, a = {};
    for (let o of e === "border" ? ["Top", "Right", "Bottom", "Left"] : [e.slice(6)]) for (let l in i) a["border" + o + l] = i[l];
    return a;
  }
  if (e === "boxShadow") {
    if (!t) throw new Error('Invalid `boxShadow` value: "' + t + '".');
    return { [e]: typeof t == "string" ? (0, ku.parse)(t) : t };
  }
  if (e === "transform") {
    if (typeof t != "string") throw new Error("Invalid `transform` value.");
    let n = {}, i = t.replace(/(-?[\d.]+%)/g, (o, l) => {
      let s = ~~(Math.random() * 1e9);
      return n[s] = l, s + "px";
    }), a = (0, Rt.getStylesForProperty)("transform", i, true);
    for (let o of a.transform) for (let l in o) n[o[l]] && (o[l] = n[o[l]]);
    return a;
  }
  if (e === "background") return t = t.toString().trim(), /^(linear-gradient|radial-gradient|url|repeating-linear-gradient)\(/.test(t) ? (0, Rt.getStylesForProperty)("backgroundImage", t, true) : (0, Rt.getStylesForProperty)("background", t, true);
  if (e === "textShadow") {
    t = t.toString().trim();
    let n = {}, i = yu(t);
    for (let a of i) {
      let o = (0, Rt.getStylesForProperty)("textShadow", a, true);
      for (let l in o) n[l] ? n[l].push(o[l]) : n[l] = [o[l]];
    }
    return n;
  }
  if (e === "WebkitTextStroke") {
    t = t.toString().trim();
    let n = t.split(" ");
    if (n.length !== 2) throw new Error("Invalid `WebkitTextStroke` value.");
    return { WebkitTextStrokeWidth: wr(e, n[0]), WebkitTextStrokeColor: wr(e, n[1]) };
  }
}
__name(y1, "y1");
function yl(e) {
  return e === "transform" ? " Only absolute lengths such as `10px` are supported." : "";
}
__name(yl, "yl");
var xl = /rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\.\d]+)\)/;
function Cu(e) {
  if (typeof e == "string" && xl.test(e.trim())) return e.trim().replace(xl, (t, r, n, i, a) => `rgba(${r}, ${n}, ${i}, ${a})`);
  if (typeof e == "object" && e !== null) {
    for (let t in e) e[t] = Cu(e[t]);
    return e;
  }
  return e;
}
__name(Cu, "Cu");
function wl(e, t) {
  let r = {};
  if (e) {
    let i = w1(e.color, t.color);
    r.color = i;
    for (let a in e) {
      if (a.startsWith("_")) {
        r[a] = e[a];
        continue;
      }
      if (a === "color") continue;
      let o = (0, Rt.getPropertyName)(a), l = E1(e[a], i);
      try {
        let s = y1(o, l, i) || b1(o, (0, Rt.getStylesForProperty)(o, wr(o, l), true), l, i);
        Object.assign(r, s);
      } catch (s) {
        throw new Error(s.message + (s.message.includes(l) ? `
  ` + yl(o) : `
  in CSS rule \`${o}: ${l}\`.${yl(o)}`));
      }
    }
  }
  if (r.backgroundImage) {
    let { backgrounds: i } = (0, Eu.parseElementStyle)(r);
    r.backgroundImage = i;
  }
  (r.maskImage || r.WebkitMaskImage) && (r.maskImage = v1(r));
  let n = x1(r.fontSize, t.fontSize);
  typeof r.fontSize < "u" && (r.fontSize = n), r.transformOrigin && (r.transformOrigin = d1(r.transformOrigin, n));
  for (let i in r) {
    let a = r[i];
    if (i === "lineHeight") typeof a == "string" && a !== "normal" && (a = r[i] = Pe(a, n, n, t, true) / n);
    else {
      if (typeof a == "string") {
        let o = Pe(a, n, n, t);
        typeof o < "u" && (r[i] = o), a = r[i];
      }
      if (typeof a == "string" || typeof a == "object") {
        let o = Cu(a);
        o && (r[i] = o), a = r[i];
      }
    }
    if (i === "opacity" && typeof a == "number" && (r.opacity = a * t.opacity), i === "transform") {
      let o = a;
      for (let l of o) {
        let s = Object.keys(l)[0], u = l[s], f = typeof u == "string" ? Pe(u, n, n, t) ?? u : u;
        l[s] = f;
      }
    }
    if (i === "textShadowRadius") {
      let o = a;
      r.textShadowRadius = o.map((l) => Pe(l, n, 0, t, false));
    }
    if (i === "textShadowOffset") {
      let o = a;
      r.textShadowOffset = o.map(({ height: l, width: s }) => ({ height: Pe(l, n, 0, t, false), width: Pe(s, n, 0, t, false) }));
    }
  }
  return r;
}
__name(wl, "wl");
function x1(e, t) {
  if (typeof e == "number") return e;
  try {
    let r = new on(e);
    switch (r.unit) {
      case "em":
        return r.value * t;
      case "rem":
        return r.value * 16;
    }
  } catch {
    return t;
  }
}
__name(x1, "x1");
function Sl(e) {
  if (e.startsWith("hsl")) {
    let t = (0, Tu.default)(e), [r, n, i] = t.values;
    return `hsl(${[r, `${n}%`, `${i}%`].concat(t.alpha === 1 ? [] : [t.alpha]).join(",")})`;
  }
  return e;
}
__name(Sl, "Sl");
function w1(e, t) {
  return e && e.toLowerCase() !== "currentcolor" ? Sl(e) : Sl(t);
}
__name(w1, "w1");
function S1(e, t) {
  return e.replace(/currentcolor/gi, t);
}
__name(S1, "S1");
function E1(e, t) {
  return bu(e) && (e = S1(e, t)), e;
}
__name(E1, "E1");
async function k1(e, t, r, n, i) {
  let a = await ti(), o = { ...r, ...wl(f1[t], r), ...wl(n, r) };
  if (t === "img") {
    let [l, s, u] = await Ga(i.src);
    if (s === void 0 && u === void 0) {
      if (i.width === void 0 || i.height === void 0) throw new Error("Image size cannot be determined. Please provide the width and height of the image.");
      s = parseInt(i.width), u = parseInt(i.height);
    }
    let f = u / s, c = (o.borderLeftWidth || 0) + (o.borderRightWidth || 0) + (o.paddingLeft || 0) + (o.paddingRight || 0), h = (o.borderTopWidth || 0) + (o.borderBottomWidth || 0) + (o.paddingTop || 0) + (o.paddingBottom || 0), p = o.width || i.width, m = o.height || i.height, v = typeof p == "number" && typeof m == "number";
    v && (p -= c, m -= h), p === void 0 && m === void 0 ? (p = "100%", e.setAspectRatio(1 / f)) : p === void 0 ? typeof m == "number" ? p = m / f : e.setAspectRatio(1 / f) : m === void 0 && (typeof p == "number" ? m = p * f : e.setAspectRatio(1 / f)), o.width = v ? p + c : p, o.height = v ? m + h : m, o.__src = l;
  }
  if (t === "svg") {
    let l = i.viewBox || i.viewbox, s = Wa(l), u = s ? s[3] / s[2] : null, { width: f, height: c } = i;
    typeof f > "u" && c ? u == null ? f = 0 : typeof c == "string" && c.endsWith("%") ? f = parseInt(c) / u + "%" : (c = Pe(c, r.fontSize, 1, r), f = c / u) : typeof c > "u" && f ? u == null ? f = 0 : typeof f == "string" && f.endsWith("%") ? c = parseInt(f) * u + "%" : (f = Pe(f, r.fontSize, 1, r), c = f * u) : (typeof f < "u" && (f = Pe(f, r.fontSize, 1, r) || f), typeof c < "u" && (c = Pe(c, r.fontSize, 1, r) || c), f ||= s?.[2], c ||= s?.[3]), !o.width && f && (o.width = f), !o.height && c && (o.height = c);
  }
  return e.setDisplay(It(o.display, { flex: a.DISPLAY_FLEX, block: a.DISPLAY_FLEX, none: a.DISPLAY_NONE, "-webkit-box": a.DISPLAY_FLEX }, a.DISPLAY_FLEX, "display")), e.setAlignContent(It(o.alignContent, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, "space-between": a.ALIGN_SPACE_BETWEEN, "space-around": a.ALIGN_SPACE_AROUND, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_AUTO, "alignContent")), e.setAlignItems(It(o.alignItems, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_STRETCH, "alignItems")), e.setAlignSelf(It(o.alignSelf, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_AUTO, "alignSelf")), e.setJustifyContent(It(o.justifyContent, { center: a.JUSTIFY_CENTER, "flex-start": a.JUSTIFY_FLEX_START, "flex-end": a.JUSTIFY_FLEX_END, "space-between": a.JUSTIFY_SPACE_BETWEEN, "space-around": a.JUSTIFY_SPACE_AROUND }, a.JUSTIFY_FLEX_START, "justifyContent")), e.setFlexDirection(It(o.flexDirection, { row: a.FLEX_DIRECTION_ROW, column: a.FLEX_DIRECTION_COLUMN, "row-reverse": a.FLEX_DIRECTION_ROW_REVERSE, "column-reverse": a.FLEX_DIRECTION_COLUMN_REVERSE }, a.FLEX_DIRECTION_ROW, "flexDirection")), e.setFlexWrap(It(o.flexWrap, { wrap: a.WRAP_WRAP, nowrap: a.WRAP_NO_WRAP, "wrap-reverse": a.WRAP_WRAP_REVERSE }, a.WRAP_NO_WRAP, "flexWrap")), typeof o.gap < "u" && e.setGap(a.GUTTER_ALL, o.gap), typeof o.rowGap < "u" && e.setGap(a.GUTTER_ROW, o.rowGap), typeof o.columnGap < "u" && e.setGap(a.GUTTER_COLUMN, o.columnGap), typeof o.flexBasis < "u" && e.setFlexBasis(o.flexBasis), e.setFlexGrow(typeof o.flexGrow > "u" ? 0 : o.flexGrow), e.setFlexShrink(typeof o.flexShrink > "u" ? 0 : o.flexShrink), typeof o.maxHeight < "u" && e.setMaxHeight(o.maxHeight), typeof o.maxWidth < "u" && e.setMaxWidth(o.maxWidth), typeof o.minHeight < "u" && e.setMinHeight(o.minHeight), typeof o.minWidth < "u" && e.setMinWidth(o.minWidth), e.setOverflow(It(o.overflow, { visible: a.OVERFLOW_VISIBLE, hidden: a.OVERFLOW_HIDDEN }, a.OVERFLOW_VISIBLE, "overflow")), e.setMargin(a.EDGE_TOP, o.marginTop || 0), e.setMargin(a.EDGE_BOTTOM, o.marginBottom || 0), e.setMargin(a.EDGE_LEFT, o.marginLeft || 0), e.setMargin(a.EDGE_RIGHT, o.marginRight || 0), e.setBorder(a.EDGE_TOP, o.borderTopWidth || 0), e.setBorder(a.EDGE_BOTTOM, o.borderBottomWidth || 0), e.setBorder(a.EDGE_LEFT, o.borderLeftWidth || 0), e.setBorder(a.EDGE_RIGHT, o.borderRightWidth || 0), e.setPadding(a.EDGE_TOP, o.paddingTop || 0), e.setPadding(a.EDGE_BOTTOM, o.paddingBottom || 0), e.setPadding(a.EDGE_LEFT, o.paddingLeft || 0), e.setPadding(a.EDGE_RIGHT, o.paddingRight || 0), e.setPositionType(It(o.position, { absolute: a.POSITION_TYPE_ABSOLUTE, relative: a.POSITION_TYPE_RELATIVE }, a.POSITION_TYPE_RELATIVE, "position")), typeof o.top < "u" && e.setPosition(a.EDGE_TOP, o.top), typeof o.bottom < "u" && e.setPosition(a.EDGE_BOTTOM, o.bottom), typeof o.left < "u" && e.setPosition(a.EDGE_LEFT, o.left), typeof o.right < "u" && e.setPosition(a.EDGE_RIGHT, o.right), typeof o.height < "u" ? e.setHeight(o.height) : e.setHeightAuto(), typeof o.width < "u" ? e.setWidth(o.width) : e.setWidthAuto(), [o, h1(o)];
}
__name(k1, "k1");
var El = [1, 0, 0, 1, 0, 0];
function T1(e, t, r) {
  let n = [...El];
  for (let i of e) {
    let a = Object.keys(i)[0], o = i[a];
    if (typeof o == "string") if (a === "translateX") o = parseFloat(o) / 100 * t, i[a] = o;
    else if (a === "translateY") o = parseFloat(o) / 100 * r, i[a] = o;
    else throw new Error(`Invalid transform: "${a}: ${o}".`);
    let l = o, s = [...El];
    switch (a) {
      case "translateX":
        s[4] = l;
        break;
      case "translateY":
        s[5] = l;
        break;
      case "scale":
        s[0] = l, s[3] = l;
        break;
      case "scaleX":
        s[0] = l;
        break;
      case "scaleY":
        s[3] = l;
        break;
      case "rotate": {
        let u = l * Math.PI / 180, f = Math.cos(u), c = Math.sin(u);
        s[0] = f, s[1] = c, s[2] = -c, s[3] = f;
        break;
      }
      case "skewX":
        s[2] = Math.tan(l * Math.PI / 180);
        break;
      case "skewY":
        s[1] = Math.tan(l * Math.PI / 180);
        break;
    }
    n = Hn(s, n);
  }
  e.splice(0, e.length), e.push(...n), e.__resolved = true;
}
__name(T1, "T1");
function Ou({ left: e, top: t, width: r, height: n }, i, a, o) {
  let l;
  i.__resolved || T1(i, r, n);
  let s = i;
  if (a) l = s;
  else {
    let u = o?.xAbsolute ?? (o?.xRelative ?? 50) * r / 100, f = o?.yAbsolute ?? (o?.yRelative ?? 50) * n / 100, c = e + u, h = t + f;
    l = Hn([1, 0, 0, 1, c, h], Hn(s, [1, 0, 0, 1, -c, -h])), s.__parent && (l = Hn(s.__parent, l)), s.splice(0, 6, ...l);
  }
  return `matrix(${l.map((u) => u.toFixed(2)).join(",")})`;
}
__name(Ou, "Ou");
function _1({ left: e, top: t, width: r, height: n, isInheritingTransform: i }, a) {
  let o = "", l = 1;
  return a.transform && (o = Ou({ left: e, top: t, width: r, height: n }, a.transform, i, a.transformOrigin)), a.opacity !== void 0 && (l = +a.opacity), { matrix: o, opacity: l };
}
__name(_1, "_1");
function L1({ id: e, content: t, filter: r, left: n, top: i, width: a, height: o, matrix: l, opacity: s, image: u, clipPathId: f, debug: c, shape: h, decorationShape: p }, m) {
  let v = "";
  if (c && (v = le("rect", { x: n, y: i - o, width: a, height: o, fill: "transparent", stroke: "#575eff", "stroke-width": 1, transform: l || void 0, "clip-path": f ? `url(#${f})` : void 0 })), u) {
    let y = { href: u, x: n, y: i, width: a, height: o, transform: l || void 0, "clip-path": f ? `url(#${f})` : void 0, style: m.filter ? `filter:${m.filter}` : void 0 };
    return [(r ? `${r}<g filter="url(#satori_s-${e})">` : "") + le("image", { ...y, opacity: s !== 1 ? s : void 0 }) + (p || "") + (r ? "</g>" : "") + v, ""];
  }
  let g = { x: n, y: i, width: a, height: o, "font-weight": m.fontWeight, "font-style": m.fontStyle, "font-size": m.fontSize, "font-family": m.fontFamily, "letter-spacing": m.letterSpacing || void 0, transform: l || void 0, "clip-path": f ? `url(#${f})` : void 0, style: m.filter ? `filter:${m.filter}` : void 0, "stroke-width": m.WebkitTextStrokeWidth ? `${m.WebkitTextStrokeWidth}px` : void 0, stroke: m.WebkitTextStrokeWidth ? m.WebkitTextStrokeColor : void 0, "stroke-linejoin": m.WebkitTextStrokeWidth ? "round" : void 0, "paint-order": m.WebkitTextStrokeWidth ? "stroke" : void 0 };
  return [(r ? `${r}<g filter="url(#satori_s-${e})">` : "") + le("text", { ...g, fill: m.color, opacity: s !== 1 ? s : void 0 }, (0, La.default)(t)) + (p || "") + (r ? "</g>" : "") + v, h ? le("text", g, (0, La.default)(t)) : ""];
}
__name(L1, "L1");
function C1(e, t, r) {
  return e.replace(/([MA])([0-9.-]+),([0-9.-]+)/g, function(n, i, a, o) {
    return i + (parseFloat(a) + t) + "," + (parseFloat(o) + r);
  });
}
__name(C1, "C1");
var Un = 1.1;
function O1({ id: e, width: t, height: r }, n) {
  if (!n.shadowColor || !n.shadowOffset || typeof n.shadowRadius > "u") return "";
  let i = n.shadowColor.length, a = "", o = "", l = 0, s = t, u = 0, f = r;
  for (let c = 0; c < i; c++) {
    let h = n.shadowRadius[c] * n.shadowRadius[c] / 4;
    l = Math.min(n.shadowOffset[c].width - h, l), s = Math.max(n.shadowOffset[c].width + h + t, s), u = Math.min(n.shadowOffset[c].height - h, u), f = Math.max(n.shadowOffset[c].height + h + r, f), a += le("feDropShadow", { dx: n.shadowOffset[c].width, dy: n.shadowOffset[c].height, stdDeviation: n.shadowRadius[c] / 2, "flood-color": n.shadowColor[c], "flood-opacity": 1, ...i > 1 ? { in: "SourceGraphic", result: `satori_s-${e}-result-${c}` } : {} }), i > 1 && (o = le("feMergeNode", { in: `satori_s-${e}-result-${c}` }) + o);
  }
  return le("filter", { id: `satori_s-${e}`, x: (l / t * 100 * Un).toFixed(2) + "%", y: (u / r * 100 * Un).toFixed(2) + "%", width: ((s - l) / t * 100 * Un).toFixed(2) + "%", height: ((f - u) / r * 100 * Un).toFixed(2) + "%" }, a + (o ? le("feMerge", {}, o) : ""));
}
__name(O1, "O1");
function A1({ width: e, height: t, shape: r, opacity: n, id: i }, a) {
  if (!a.boxShadow) return null;
  let o = "", l = "";
  for (let s = a.boxShadow.length - 1; s >= 0; s--) {
    let u = "", f = a.boxShadow[s];
    f.spreadRadius && f.inset && (f.spreadRadius = -f.spreadRadius);
    let c = f.blurRadius * f.blurRadius / 4 + (f.spreadRadius || 0), h = Math.min(-c - (f.inset ? f.offsetX : 0), 0), p = Math.max(c + e - (f.inset ? f.offsetX : 0), e), m = Math.min(-c - (f.inset ? f.offsetY : 0), 0), v = Math.max(c + t - (f.inset ? f.offsetY : 0), t), g = `satori_s-${i}-${s}`, y = `satori_ms-${i}-${s}`, x = f.spreadRadius ? r.replace('stroke-width="0"', `stroke-width="${f.spreadRadius * 2}"`) : r;
    u += le("mask", { id: y, maskUnits: "userSpaceOnUse" }, le("rect", { x: 0, y: 0, width: a._viewportWidth || "100%", height: a._viewportHeight || "100%", fill: f.inset ? "#000" : "#fff" }) + x.replace('fill="#fff"', f.inset ? 'fill="#fff"' : 'fill="#000"').replace('stroke="#fff"', ""));
    let _ = x.replace(/d="([^"]+)"/, (L, T) => 'd="' + C1(T, f.offsetX, f.offsetY) + '"').replace(/x="([^"]+)"/, (L, T) => 'x="' + (parseFloat(T) + f.offsetX) + '"').replace(/y="([^"]+)"/, (L, T) => 'y="' + (parseFloat(T) + f.offsetY) + '"');
    f.spreadRadius && f.spreadRadius < 0 && (u += le("mask", { id: y + "-neg", maskUnits: "userSpaceOnUse" }, _.replace('stroke="#fff"', 'stroke="#000"').replace(/stroke-width="[^"]+"/, `stroke-width="${-f.spreadRadius * 2}"`))), f.spreadRadius && f.spreadRadius < 0 && (_ = le("g", { mask: `url(#${y}-neg)` }, _)), u += le("defs", {}, le("filter", { id: g, x: `${h / e * 100}%`, y: `${m / t * 100}%`, width: `${(p - h) / e * 100}%`, height: `${(v - m) / t * 100}%` }, le("feGaussianBlur", { stdDeviation: f.blurRadius / 2, result: "b" }) + le("feFlood", { "flood-color": f.color, in: "SourceGraphic", result: "f" }) + le("feComposite", { in: "f", in2: "b", operator: f.inset ? "out" : "in" }))) + le("g", { mask: `url(#${y})`, filter: `url(#${g})`, opacity: n }, _), f.inset ? l += u : o += u;
  }
  return [o, l];
}
__name(A1, "A1");
function P1({ width: e, left: t, top: r, ascender: n, clipPathId: i, matrix: a }, o) {
  let { textDecorationColor: l, textDecorationStyle: s, textDecorationLine: u, fontSize: f, color: c } = o;
  if (!u || u === "none") return "";
  let h = Math.max(1, f * 0.1), p = u === "line-through" ? r + n * 0.7 : u === "underline" ? r + n * 1.1 : r, m = s === "dashed" ? `${h * 1.2} ${h * 2}` : s === "dotted" ? `0 ${h * 2}` : void 0, v = s === "double" ? le("line", { x1: t, y1: p + h + 1, x2: t + e, y2: p + h + 1, stroke: l || c, "stroke-width": h, "stroke-dasharray": m, "stroke-linecap": s === "dotted" ? "round" : "square", transform: a }) : "";
  return (i ? `<g clip-path="url(#${i})">` : "") + le("line", { x1: t, y1: p, x2: t + e, y2: p, stroke: l || c, "stroke-width": h, "stroke-dasharray": m, "stroke-linecap": s === "dotted" ? "round" : "square", transform: a }) + v + (i ? "</g>" : "");
}
__name(P1, "P1");
function $a(e) {
  return e = e.replace("U+", "0x"), String.fromCodePoint(Number(e));
}
__name($a, "$a");
var nn = $a("U+0020");
var Au = $a("U+0009");
var Xn = $a("U+2026");
function I1(e, t, r) {
  let { fontSize: n, letterSpacing: i } = r, a = /* @__PURE__ */ new Map();
  function o(u) {
    if (a.has(u)) return a.get(u);
    let f = e.measure(u, { fontSize: n, letterSpacing: i });
    return a.set(u, f), f;
  }
  __name(o, "o");
  function l(u) {
    let f = 0;
    for (let c of u) t(c) ? f += n : f += o(c);
    return f;
  }
  __name(l, "l");
  function s(u) {
    return l(Ft(u, "grapheme"));
  }
  __name(s, "s");
  return { measureGrapheme: o, measureGraphemeArray: l, measureText: s };
}
__name(I1, "I1");
function R1(e, t, r) {
  let { textTransform: n, whiteSpace: i, wordBreak: a } = t;
  e = F1(e, n, r);
  let { content: o, shouldCollapseTabsAndSpaces: l, allowSoftWrap: s } = N1(e, i), { words: u, requiredBreaks: f, allowBreakWord: c } = U1(o, a), [h, p] = D1(t, s);
  return { words: u, requiredBreaks: f, allowSoftWrap: s, allowBreakWord: c, processedContent: o, shouldCollapseTabsAndSpaces: l, lineLimit: h, blockEllipsis: p };
}
__name(R1, "R1");
function F1(e, t, r) {
  return t === "uppercase" ? e = e.toLocaleUpperCase(r) : t === "lowercase" ? e = e.toLocaleLowerCase(r) : t === "capitalize" && (e = Ft(e, "word", r).map((n) => Ft(n, "grapheme", r).map((i, a) => a === 0 ? i.toLocaleUpperCase(r) : i).join("")).join("")), e;
}
__name(F1, "F1");
function D1(e, t) {
  let { textOverflow: r, lineClamp: n, WebkitLineClamp: i, WebkitBoxOrient: a, overflow: o, display: l } = e;
  if (l === "block" && n) {
    let [s, u = Xn] = M1(n);
    if (s) return [s, u];
  }
  return r === "ellipsis" && l === "-webkit-box" && a === "vertical" && Zg(i) && i > 0 ? [i, Xn] : r === "ellipsis" && o === "hidden" && !t ? [1, Xn] : [1 / 0];
}
__name(D1, "D1");
function U1(e, t) {
  let r = ["break-all", "break-word"].includes(t), { words: n, requiredBreaks: i } = Qg(e, t);
  return { words: n, requiredBreaks: i, allowBreakWord: r };
}
__name(U1, "U1");
function N1(e, t) {
  let r = ["pre", "pre-wrap", "pre-line"].includes(t), n = ["normal", "nowrap", "pre-line"].includes(t), i = !["pre", "nowrap"].includes(t);
  return r || (e = e.replace(/\n/g, nn)), n && (e = e.replace(/([ ]|\t)+/g, nn).replace(/^[ ]|[ ]$/g, "")), { content: e, shouldCollapseTabsAndSpaces: n, allowSoftWrap: i };
}
__name(N1, "N1");
function M1(e) {
  if (typeof e == "number") return [e];
  let t = /^(\d+)\s*"(.*)"$/, r = /^(\d+)\s*'(.*)'$/, n = t.exec(e), i = r.exec(e);
  if (n) {
    let a = +n[1], o = n[2];
    return [a, o];
  } else if (i) {
    let a = +i[1], o = i[2];
    return [a, o];
  }
  return [];
}
__name(M1, "M1");
var W1 = /* @__PURE__ */ new Set([Au]);
function B1(e) {
  return W1.has(e);
}
__name(B1, "B1");
async function* G1(e, t) {
  let r = await ti(), { parentStyle: n, inheritedStyle: i, parent: a, font: o, id: l, isInheritingTransform: s, debug: u, embedFont: f, graphemeImages: c, locale: h, canLoadAdditionalAssets: p } = t, { textAlign: m, lineHeight: v, textWrap: g, fontSize: y, filter: x, tabSize: _ = 8, letterSpacing: L, _inheritedBackgroundClipTextPath: T, flexShrink: E } = n, { words: R, requiredBreaks: C, allowSoftWrap: D, allowBreakWord: M, processedContent: H, shouldCollapseTabsAndSpaces: Q, lineLimit: ee, blockEllipsis: P } = R1(e, n, h), U = $1(r, m);
  a.insertChild(U, a.getChildCount()), Jg(E) && a.setFlexShrink(1);
  let O = o.getEngine(y, v, n, h), X = p ? Ft(H, "grapheme").filter((ve) => !B1(ve) && !O.has(ve)) : [];
  yield X.map((ve) => ({ word: ve, locale: h })), X.length && (O = o.getEngine(y, v, n, h));
  function K(ve) {
    return !!(c && c[ve]);
  }
  __name(K, "K");
  let { measureGrapheme: ne, measureGraphemeArray: ie, measureText: V } = I1(O, K, { fontSize: y, letterSpacing: L }), Y = bu(_) ? Pe(_, y, 1, n) : ne(nn) * _, A = /* @__PURE__ */ __name((ve, Se) => {
    if (ve.length === 0) return { originWidth: 0, endingSpacesWidth: 0, text: ve };
    let { index: Ue, tabCount: Ee } = j1(ve), Ne = 0;
    if (Ee > 0) {
      let $e = ve.slice(0, Ue), Le = ve.slice(Ue + Ee), Te = V($e), ct = Te + Se;
      Ne = (Y === 0 ? Te : (Math.floor(ct / Y) + Ee) * Y) + V(Le);
    } else Ne = V(ve);
    let ke = ve.trimEnd() === ve ? Ne : V(ve.trimEnd());
    return { originWidth: Ne, endingSpacesWidth: Ne - ke, text: ve };
  }, "A"), B = [], ae = [], $ = [], he = [], fe = [];
  function ge(ve) {
    let Se = 0, Ue = 0, Ee = -1, Ne = 0, ke = 0, $e = 0, Le = 0;
    B = [], $ = [0], he = [], fe = [];
    let Te = 0, ct = 0;
    for (; Te < R.length && Se < ee; ) {
      let me = R[Te], Nt = C[Te], Qe = 0, { originWidth: yt, endingSpacesWidth: rr, text: xt } = A(me, ke);
      me = xt, Qe = yt;
      let Fe = rr;
      Nt && $e === 0 && ($e = O.height(me));
      let Ve = m === "justify", ht = Te && ke + Qe > ve + Fe && D;
      if (M && Qe > ve && (!ke || ht || Nt)) {
        let Tt = Ft(me, "grapheme");
        R.splice(Te, 1, ...Tt), ke > 0 && (B.push(ke - ct), ae.push(Le), Se++, Ne += $e, ke = 0, $e = 0, Le = 0, $.push(1), Ee = -1), ct = Fe;
        continue;
      }
      if (Nt || ht) Q && me === nn && (Qe = 0), B.push(ke - ct), ae.push(Le), Se++, Ne += $e, ke = Qe, $e = Qe ? Math.round(O.height(me)) : 0, Le = Qe ? Math.round(O.baseline(me)) : 0, $.push(1), Ee = -1, Nt || (Ue = Math.max(Ue, ve));
      else {
        ke += Qe;
        let Tt = Math.round(O.height(me));
        Tt > $e && ($e = Tt, Le = Math.round(O.baseline(me))), Ve && $[$.length - 1]++;
      }
      Ve && Ee++, Ue = Math.max(Ue, ke);
      let pr = ke - Qe;
      if (Qe === 0) fe.push({ y: Ne, x: pr, width: 0, line: Se, lineIndex: Ee, isImage: false });
      else {
        let Tt = Ft(me, "word");
        for (let pt = 0; pt < Tt.length; pt++) {
          let dt = Tt[pt], Mt = 0, Wt = false;
          K(dt) ? (Mt = y, Wt = true) : Mt = ne(dt), he.push(dt), fe.push({ y: Ne, x: pr, width: Mt, line: Se, lineIndex: Ee, isImage: Wt }), pr += Mt;
        }
      }
      Te++, ct = Fe;
    }
    return ke && (Se < ee && (Ne += $e), Se++, B.push(ke), ae.push(Le)), { width: Ue, height: Ne };
  }
  __name(ge, "ge");
  let ce = { width: 0, height: 0 };
  U.setMeasureFunc((ve) => {
    let { width: Se, height: Ue } = ge(ve);
    if (g === "balance") {
      let Ne = Se / 2, ke = Se, $e = Se;
      for (; Ne + 1 < ke; ) {
        $e = (Ne + ke) / 2;
        let { height: Te } = ge($e);
        Te > Ue ? Ne = $e : ke = $e;
      }
      ge(ke);
      let Le = Math.ceil(ke);
      return ce = { width: Le, height: Ue }, { width: Le, height: Ue };
    }
    if (g === "pretty" && B[B.length - 1] < Se / 3) {
      let Ne = Se * 0.9, ke = ge(Ne);
      if (ke.height <= Ue * 1.3) return ce = { width: Se, height: ke.height }, { width: Se, height: ke.height };
    }
    let Ee = Math.ceil(Se);
    return ce = { width: Ee, height: Ue }, { width: Ee, height: Ue };
  });
  let [we, Ie] = yield, pe = "", ye = "", Be = i._inheritedClipPathId, et = i._inheritedMaskId, { left: Ge, top: Me, width: Xe, height: tt } = U.getComputedLayout(), rt = a.getComputedWidth() - a.getComputedPadding(r.EDGE_LEFT) - a.getComputedPadding(r.EDGE_RIGHT) - a.getComputedBorder(r.EDGE_LEFT) - a.getComputedBorder(r.EDGE_RIGHT), nt = we + Ge, it = Ie + Me, { matrix: ze, opacity: kt } = _1({ left: Ge, top: Me, width: Xe, height: tt, isInheritingTransform: s }, n), bt = "";
  if (n.textShadowOffset) {
    let { textShadowColor: ve, textShadowOffset: Se, textShadowRadius: Ue } = n;
    bt = O1({ width: ce.width, height: ce.height, id: l }, { shadowColor: ve, shadowOffset: Se, shadowRadius: Ue }), bt = le("defs", {}, bt);
  }
  let ut = "", ft = "", Vt = "", lt = -1, Ut = {}, Ye = null, kr = 0;
  for (let ve = 0; ve < he.length; ve++) {
    let Se = fe[ve], Ue = fe[ve + 1];
    if (!Se) continue;
    let Ee = he[ve], Ne = null, ke = false, $e = c ? c[Ee] : null, Le = Se.y, Te = Se.x, ct = Se.width, me = Se.line;
    if (me === lt) continue;
    let Nt = false;
    if (B.length > 1) {
      let Fe = Xe - B[me];
      if (m === "right" || m === "end") Te += Fe;
      else if (m === "center") Te += Fe / 2;
      else if (m === "justify" && me < B.length - 1) {
        let Ve = $[me], ht = Ve > 1 ? Fe / (Ve - 1) : 0;
        Te += ht * Se.lineIndex, Nt = true;
      }
      Te = Math.round(Te);
    }
    let Qe = ae[me], yt = O.baseline(Ee), rr = O.height(Ee), xt = Qe - yt;
    if (Ut[me] || (Ut[me] = [Te, it + Le + xt, yt, Nt ? Xe : B[me]]), ee !== 1 / 0) {
      let Fe = /* @__PURE__ */ __name(function(pt, dt) {
        let Mt = Ft(dt, "grapheme", h), Wt = "", dr = 0;
        for (let Rr of Mt) {
          let dn = pt + ie([Wt + Rr]);
          if (Wt && dn + ht > rt) break;
          Wt += Rr, dr = dn;
        }
        return { subset: Wt, resolvedWidth: dr };
      }, "Fe"), Ve = P, ht = ne(P);
      ht > rt && (Ve = Xn, ht = ne(Ve));
      let pr = ne(nn), Tt = me < B.length - 1;
      if (me + 1 === ee && (Tt || B[me] > rt)) {
        if (Te + ct + ht + pr > rt) {
          let { subset: pt, resolvedWidth: dt } = Fe(Te, Ee);
          Ee = pt + Ve, lt = me, Ut[me][2] = dt, ke = true;
        } else if (Ue && Ue.line !== me) if (m === "center") {
          let { subset: pt, resolvedWidth: dt } = Fe(Te, Ee);
          Ee = pt + Ve, lt = me, Ut[me][2] = dt, ke = true;
        } else {
          let pt = he[ve + 1], { subset: dt, resolvedWidth: Mt } = Fe(ct + Te, pt);
          Ee = Ee + dt + Ve, lt = me, Ut[me][2] = Mt, ke = true;
        }
      }
    }
    if ($e) Le += 0;
    else if (f) {
      if (!Ee.includes(Au) && !qg.includes(Ee) && he[ve + 1] && Ue && !Ue.isImage && Le === Ue.y && !ke) {
        Ye === null && (kr = Te), Ye = Ye === null ? Ee : Ye + Ee;
        continue;
      }
      let Fe = Ye === null ? Ee : Ye + Ee, Ve = Ye === null ? Te : kr, ht = Se.width + Te - Ve;
      Ne = O.getSVG(Fe.replace(/(\t)+/g, ""), { fontSize: y, left: nt + Ve, top: it + Le + yt + xt, letterSpacing: L }), Ye = null, u && (Vt += le("rect", { x: nt + Ve, y: it + Le + xt, width: ht, height: rr, fill: "transparent", stroke: "#575eff", "stroke-width": 1, transform: ze || void 0, "clip-path": Be ? `url(#${Be})` : void 0 }) + le("line", { x1: nt + Te, x2: nt + Te + Se.width, y1: it + Le + xt + yt, y2: it + Le + xt + yt, stroke: "#14c000", "stroke-width": 1, transform: ze || void 0, "clip-path": Be ? `url(#${Be})` : void 0 }));
    } else Le += yt + xt;
    if (n.textDecorationLine) {
      let Fe = Ut[me];
      Fe && !Fe[4] && (ut += P1({ left: nt + Fe[0], top: Fe[1], width: Fe[3], ascender: Fe[2], clipPathId: Be, matrix: ze }, n), Fe[4] = 1);
    }
    if (Ne !== null) ft += Ne + " ";
    else {
      let [Fe, Ve] = L1({ content: Ee, filter: bt, id: l, left: nt + Te, top: it + Le, width: ct, height: rr, matrix: ze, opacity: kt, image: $e, clipPathId: Be, debug: u, shape: !!T, decorationShape: ut }, n);
      pe += Fe, ye += Ve, ut = "";
    }
    if (ke) break;
  }
  if (ft) {
    let ve = n.color !== "transparent" && kt !== 0 ? `<g ${et ? `mask="url(#${et})"` : ""} ${Be ? `clip-path="url(#${Be})"` : ""}>` + le("path", { fill: n.color, d: ft, transform: ze || void 0, opacity: kt !== 1 ? kt : void 0, style: x ? `filter:${x}` : void 0, "stroke-width": i.WebkitTextStrokeWidth ? `${i.WebkitTextStrokeWidth}px` : void 0, stroke: i.WebkitTextStrokeWidth ? i.WebkitTextStrokeColor : void 0, "stroke-linejoin": i.WebkitTextStrokeWidth ? "round" : void 0, "paint-order": i.WebkitTextStrokeWidth ? "stroke" : void 0 }) + "</g>" : "";
    T && (ye = le("path", { d: ft, transform: ze || void 0 })), pe += (bt ? bt + le("g", { filter: `url(#satori_s-${l})` }, ve + ut) : ve + ut) + Vt;
  }
  return ye && (n._inheritedBackgroundClipTextPath.value += ye), pe;
}
__name(G1, "G1");
function $1(e, t) {
  let r = e.Node.create();
  return r.setAlignItems(e.ALIGN_BASELINE), r.setJustifyContent(It(t, { left: e.JUSTIFY_FLEX_START, right: e.JUSTIFY_FLEX_END, center: e.JUSTIFY_CENTER, justify: e.JUSTIFY_SPACE_BETWEEN, start: e.JUSTIFY_FLEX_START, end: e.JUSTIFY_FLEX_END }, e.JUSTIFY_FLEX_START, "textAlign")), r;
}
__name($1, "$1");
function j1(e) {
  let t = /(\t)+/.exec(e);
  return t ? { index: t.index, tabCount: t[0].length } : { index: null, tabCount: 0 };
}
__name(j1, "j1");
function Iu(e, t, r, n, i) {
  let a = [];
  for (let u of t) {
    let { color: f } = u;
    if (!a.length && (a.push({ offset: 0, color: f }), !u.offset || u.offset.value === "0")) continue;
    let c = typeof u.offset > "u" ? void 0 : u.offset.unit === "%" ? +u.offset.value / 100 : Number(Pe(`${u.offset.value}${u.offset.unit}`, r.fontSize, e, r, true)) / e;
    a.push({ offset: c, color: f });
  }
  a.length || a.push({ offset: 0, color: "transparent" });
  let o = a[a.length - 1];
  o.offset !== 1 && (typeof o.offset > "u" ? o.offset = 1 : n ? a[a.length - 1] = { offset: 1, color: o.color } : a.push({ offset: 1, color: o.color }));
  let l = 0, s = 1;
  for (let u = 0; u < a.length; u++) if (typeof a[u].offset > "u") {
    for (s < u && (s = u); typeof a[s].offset > "u"; ) s++;
    a[u].offset = (a[s].offset - a[l].offset) / (s - l) * (u - l) + a[l].offset;
  } else l = u;
  return i === "mask" ? a.map((u) => {
    let f = (0, Pu.default)(u.color);
    return f ? f.alpha === 0 ? { ...u, color: "rgba(0, 0, 0, 1)" } : { ...u, color: `rgba(255, 255, 255, ${f.alpha})` } : u;
  }) : a;
}
__name(Iu, "Iu");
function z1({ id: e, width: t, height: r, repeatX: n, repeatY: i }, a, o, l, s, u) {
  let f = ms(a), [c, h] = o, p = a.startsWith("repeating"), m, v, g;
  if (f.orientation.type === "directional") m = H1(f.orientation.value), v = Math.sqrt(Math.pow((m.x2 - m.x1) * c, 2) + Math.pow((m.y2 - m.y1) * h, 2));
  else if (f.orientation.type === "angular") {
    let { length: T, ...E } = q1(mu(`${f.orientation.value.value}${f.orientation.value.unit}`) / 180 * Math.PI, c, h);
    v = T, m = E;
  }
  g = p ? X1(f.stops, v, m, s) : m;
  let y = Iu(p ? V1(f.stops, v) : v, f.stops, s, p, u), x = `satori_bi${e}`, _ = `satori_pattern_${e}`, L = le("pattern", { id: _, x: l[0] / t, y: l[1] / r, width: n ? c / t : "1", height: i ? h / r : "1", patternUnits: "objectBoundingBox" }, le("linearGradient", { id: x, ...g, spreadMethod: p ? "repeat" : "pad" }, y.map((T) => le("stop", { offset: (T.offset ?? 0) * 100 + "%", "stop-color": T.color })).join("")) + le("rect", { x: 0, y: 0, width: c, height: h, fill: `url(#${x})` }));
  return [_, L];
}
__name(z1, "z1");
function V1(e, t) {
  let r = e[e.length - 1], { offset: n } = r;
  return n ? n.unit === "%" ? Number(n.value) / 100 * t : Number(n.value) : t;
}
__name(V1, "V1");
function H1(e) {
  let t = 0, r = 0, n = 0, i = 0;
  return e.includes("top") ? r = 1 : e.includes("bottom") && (i = 1), e.includes("left") ? t = 1 : e.includes("right") && (n = 1), !t && !n && !r && !i && (r = 1), { x1: t, y1: r, x2: n, y2: i };
}
__name(H1, "H1");
function q1(e, t, r) {
  let n = Math.pow(r / t, 2);
  e = (e % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  let i, a, o, l, s, u, f, c, h = /* @__PURE__ */ __name((p) => {
    if (p === 0) {
      i = 0, a = r, o = 0, l = 0, s = r;
      return;
    } else if (p === Math.PI / 2) {
      i = 0, a = 0, o = t, l = 0, s = t;
      return;
    }
    if (p > 0 && p < Math.PI / 2) {
      i = (n * t / 2 / Math.tan(p) - r / 2) / (Math.tan(p) + n / Math.tan(p)), a = Math.tan(p) * i + r, o = Math.abs(t / 2 - i) + t / 2, l = r / 2 - Math.abs(a - r / 2), s = Math.sqrt(Math.pow(o - i, 2) + Math.pow(l - a, 2)), f = (t / 2 / Math.tan(p) - r / 2) / (Math.tan(p) + 1 / Math.tan(p)), c = Math.tan(p) * f + r, s = 2 * Math.sqrt(Math.pow(t / 2 - f, 2) + Math.pow(r / 2 - c, 2));
      return;
    } else if (p > Math.PI / 2 && p < Math.PI) {
      i = (r / 2 + n * t / 2 / Math.tan(p)) / (Math.tan(p) + n / Math.tan(p)), a = Math.tan(p) * i, o = Math.abs(t / 2 - i) + t / 2, l = r / 2 + Math.abs(a - r / 2), f = (t / 2 / Math.tan(p) + r / 2) / (Math.tan(p) + 1 / Math.tan(p)), c = Math.tan(p) * f, s = 2 * Math.sqrt(Math.pow(t / 2 - f, 2) + Math.pow(r / 2 - c, 2));
      return;
    } else p >= Math.PI && (h(p - Math.PI), u = i, i = o, o = u, u = a, a = l, l = u);
  }, "h");
  return h(e), { x1: i / t, y1: a / r, x2: o / t, y2: l / r, length: s };
}
__name(q1, "q1");
function X1(e, t, r, n) {
  let { x1: i, x2: a, y1: o, y2: l } = r, s = e[0].offset ? e[0].offset.unit === "%" ? Number(e[0].offset.value) / 100 : Pe(`${e[0].offset.value}${e[0].offset.unit}`, n.fontSize, t, n, true) / t : 0, u = e.at(-1).offset ? e.at(-1).offset.unit === "%" ? Number(e.at(-1).offset.value) / 100 : Pe(`${e.at(-1).offset.value}${e.at(-1).offset.unit}`, n.fontSize, t, n, true) / t : 1, f = (a - i) * s + i, c = (l - o) * s + o, h = (a - i) * u + i, p = (l - o) * u + o;
  return { x1: f, y1: c, x2: h, y2: p };
}
__name(X1, "X1");
function Y1({ id: e, width: t, height: r, repeatX: n, repeatY: i }, a, o, l, s, u) {
  var f;
  let { shape: c, stops: h, position: p, size: m } = bs(a), [v, g] = o, y = v / 2, x = g / 2, _ = Z1(p.x, p.y, v, g, s.fontSize, s);
  y = _.x, x = _.y;
  let L = Iu(t, h, s, false, u), T = `satori_radial_${e}`, E = `satori_pattern_${e}`, R = `satori_mask_${e}`, C = J1(c, m, s.fontSize, { x: y, y: x }, [v, g], s), D = le("pattern", { id: E, x: l[0] / t, y: l[1] / r, width: n ? v / t : "1", height: i ? g / r : "1", patternUnits: "objectBoundingBox" }, le("radialGradient", { id: T }, L.map((M) => le("stop", { offset: M.offset || 0, "stop-color": M.color })).join("")) + le("mask", { id: R }, le("rect", { x: 0, y: 0, width: v, height: g, fill: "#fff" })) + le("rect", { x: 0, y: 0, width: v, height: g, fill: ((f = L.at(-1)) == null ? void 0 : f.color) || "transparent" }) + le(c, { cx: y, cy: x, width: v, height: g, ...C, fill: `url(#${T})`, mask: `url(#${R})` }));
  return [E, D];
}
__name(Y1, "Y1");
function Z1(e, t, r, n, i, a) {
  let o = { x: r / 2, y: n / 2 };
  return e.type === "keyword" ? Object.assign(o, kl(e.value, r, n, "x")) : o.x = Pe(`${e.value.value}${e.value.unit}`, i, r, a, true) || r / 2, t.type === "keyword" ? Object.assign(o, kl(t.value, r, n, "y")) : o.y = Pe(`${t.value.value}${t.value.unit}`, i, n, a, true) || n / 2, o;
}
__name(Z1, "Z1");
function kl(e, t, r, n) {
  switch (e) {
    case "center":
      return { [n]: n === "x" ? t / 2 : r / 2 };
    case "left":
      return { x: 0 };
    case "top":
      return { y: 0 };
    case "right":
      return { x: t };
    case "bottom":
      return { y: r };
  }
}
__name(kl, "kl");
function J1(e, t, r, n, i, a) {
  let [o, l] = i, { x: s, y: u } = n, f = {}, c = 0, h = 0;
  if (Q1(t)) {
    if (t.some((p) => p.value.value.startsWith("-"))) throw new Error("disallow setting negative values to the size of the shape. Check https://w3c.github.io/csswg-drafts/css-images/#valdef-rg-size-length-0");
    return e === "circle" ? { r: Number(Pe(`${t[0].value.value}${t[0].value.unit}`, r, o, a, true)) } : { rx: Number(Pe(`${t[0].value.value}${t[0].value.unit}`, r, o, a, true)), ry: Number(Pe(`${t[1].value.value}${t[1].value.unit}`, r, l, a, true)) };
  }
  switch (t[0].value) {
    case "farthest-corner":
      c = Math.max(Math.abs(o - s), Math.abs(s)), h = Math.max(Math.abs(l - u), Math.abs(u));
      break;
    case "closest-corner":
      c = Math.min(Math.abs(o - s), Math.abs(s)), h = Math.min(Math.abs(l - u), Math.abs(u));
      break;
    case "farthest-side":
      return e === "circle" ? f.r = Math.max(Math.abs(o - s), Math.abs(s), Math.abs(l - u), Math.abs(u)) : (f.rx = Math.max(Math.abs(o - s), Math.abs(s)), f.ry = Math.max(Math.abs(l - u), Math.abs(u))), f;
    case "closest-side":
      return e === "circle" ? f.r = Math.min(Math.abs(o - s), Math.abs(s), Math.abs(l - u), Math.abs(u)) : (f.rx = Math.min(Math.abs(o - s), Math.abs(s)), f.ry = Math.min(Math.abs(l - u), Math.abs(u))), f;
  }
  if (e === "circle") f.r = Math.sqrt(c * c + h * h);
  else {
    let p = h !== 0 ? c / h : 1;
    c === 0 ? (f.rx = 0, f.ry = 0) : (f.ry = Math.sqrt(c * c + h * h * p * p) / p, f.rx = f.ry * p);
  }
  return f;
}
__name(J1, "J1");
function Q1(e) {
  return !e.some((t) => t.type === "keyword");
}
__name(Q1, "Q1");
function K1(e, t) {
  return typeof e == "string" && e.endsWith("%") ? t * parseFloat(e) / 100 : +e;
}
__name(K1, "K1");
function ba(e, { x: t, y: r, defaultX: n, defaultY: i }) {
  return (e ? e.split(" ").map((a) => {
    try {
      let o = new on(a);
      return o.type === "length" || o.type === "number" ? o.value : o.value + o.unit;
    } catch {
      return null;
    }
  }).filter((a) => a !== null) : [n, i]).map((a, o) => K1(a, [t, r][o]));
}
__name(ba, "ba");
async function Ru({ id: e, width: t, height: r, left: n, top: i }, { image: a, size: o, position: l, repeat: s }, u, f) {
  s = s || "repeat", f = f || "background";
  let c = s === "repeat-x" || s === "repeat", h = s === "repeat-y" || s === "repeat", p = ba(o, { x: t, y: r, defaultX: t, defaultY: r }), m = ba(l, { x: t, y: r, defaultX: 0, defaultY: 0 });
  if (a.startsWith("linear-gradient(") || a.startsWith("repeating-linear-gradient(")) return z1({ id: e, width: t, height: r, repeatX: c, repeatY: h }, a, p, m, u, f);
  if (a.startsWith("radial-gradient(")) return Y1({ id: e, width: t, height: r, repeatX: c, repeatY: h }, a, p, m, u, f);
  if (a.startsWith("url(")) {
    let v = ba(o, { x: t, y: r, defaultX: 0, defaultY: 0 }), [g, y, x] = await Ga(a.slice(4, -1)), _ = f === "mask" ? y || v[0] : v[0] || y, L = f === "mask" ? x || v[1] : v[1] || x;
    return [`satori_bi${e}`, le("pattern", { id: `satori_bi${e}`, patternContentUnits: "userSpaceOnUse", patternUnits: "userSpaceOnUse", x: m[0] + n, y: m[1] + i, width: c ? _ : "100%", height: h ? L : "100%" }, le("image", { x: 0, y: 0, width: _, height: L, preserveAspectRatio: "none", href: g }))];
  }
  throw new Error(`Invalid background image: "${a}"`);
}
__name(Ru, "Ru");
function em([e, t]) {
  return Math.round(e * 1e3) === 0 && Math.round(t * 1e3) === 0 ? 0 : Math.round(e * t / Math.sqrt(e * e + t * t) * 1e3) / 1e3;
}
__name(em, "em");
function Nn(e, t, r) {
  return r < e + t && (r / 2 < e && r / 2 < t ? e = t = r / 2 : r / 2 < e ? e = r - t : r / 2 < t && (t = r - e)), [e, t];
}
__name(Nn, "Nn");
function Mn(e) {
  e[0] = e[1] = Math.min(e[0], e[1]);
}
__name(Mn, "Mn");
function Wn(e, t, r, n, i) {
  if (typeof e == "string") {
    let a = e.split(" ").map((l) => l.trim()), o = !a[1] && !a[0].endsWith("%");
    return a[1] = a[1] || a[0], [o, [Math.min(Pe(a[0], n, t, i, true), t), Math.min(Pe(a[1], n, r, i, true), r)]];
  }
  return typeof e == "number" ? [true, [Math.min(e, t), Math.min(e, r)]] : [true, void 0];
}
__name(Wn, "Wn");
var Bn = /* @__PURE__ */ __name((e) => e && e[0] !== 0 && e[1] !== 0, "Bn");
function tm({ id: e, borderRadiusPath: t, borderType: r, left: n, top: i, width: a, height: o }, l) {
  let s = `satori_brc-${e}`;
  return [le("clipPath", { id: s }, le(r, { x: n, y: i, width: a, height: o, d: t || void 0 })), s];
}
__name(tm, "tm");
function Jn({ left: e, top: t, width: r, height: n }, i, a) {
  let { borderTopLeftRadius: o, borderTopRightRadius: l, borderBottomLeftRadius: s, borderBottomRightRadius: u, fontSize: f } = i, c, h, p, m;
  if ([c, o] = Wn(o, r, n, f, i), [h, l] = Wn(l, r, n, f, i), [p, s] = Wn(s, r, n, f, i), [m, u] = Wn(u, r, n, f, i), !a && !Bn(o) && !Bn(l) && !Bn(s) && !Bn(u)) return "";
  o ||= [0, 0], l ||= [0, 0], s ||= [0, 0], u ||= [0, 0], [o[0], l[0]] = Nn(o[0], l[0], r), [s[0], u[0]] = Nn(s[0], u[0], r), [o[1], s[1]] = Nn(o[1], s[1], n), [l[1], u[1]] = Nn(l[1], u[1], n), c && Mn(o), h && Mn(l), p && Mn(s), m && Mn(u);
  let v = [];
  v[0] = [l, l], v[1] = [u, [-u[0], u[1]]], v[2] = [s, [-s[0], -s[1]]], v[3] = [o, [o[0], -o[1]]];
  let g = `h${r - o[0] - l[0]} a${v[0][0]} 0 0 1 ${v[0][1]}`, y = `v${n - l[1] - u[1]} a${v[1][0]} 0 0 1 ${v[1][1]}`, x = `h${u[0] + s[0] - r} a${v[2][0]} 0 0 1 ${v[2][1]}`, _ = `v${s[1] + o[1] - n} a${v[3][0]} 0 0 1 ${v[3][1]}`;
  if (a) {
    let L = /* @__PURE__ */ __name(function(Q) {
      let ee = em([o, l, u, s][Q]);
      return Q === 0 ? [[e + o[0] - ee, t + o[1] - ee], [e + o[0], t]] : Q === 1 ? [[e + r - l[0] + ee, t + l[1] - ee], [e + r, t + l[1]]] : Q === 2 ? [[e + r - u[0] + ee, t + n - u[1] + ee], [e + r - u[0], t + n]] : [[e + s[0] - ee, t + n - s[1] + ee], [e, t + n - s[1]]];
    }, "L"), T = a.indexOf(false);
    if (!a.includes(true)) throw new Error("Invalid `partialSides`.");
    if (T === -1) T = 0;
    else for (; !a[T]; ) T = (T + 1) % 4;
    let E = "", R = L(T), C = `M${R[0]} A${v[(T + 3) % 4][0]} 0 0 1 ${R[1]}`, D = 0;
    for (; D < 4 && a[(T + D) % 4]; D++) E += C + " ", C = [g, y, x, _][(T + D) % 4];
    let M = (T + D) % 4;
    E += C.split(" ")[0];
    let H = L(M);
    return E += ` A${v[(M + 3) % 4][0]} 0 0 1 ${H[0]}`, E;
  }
  return `M${e + o[0]},${t} ${g} ${y} ${x} ${_}`;
}
__name(Jn, "Jn");
function Tl(e, t, r) {
  return r[e + "Width"] === r[t + "Width"] && r[e + "Style"] === r[t + "Style"] && r[e + "Color"] === r[t + "Color"];
}
__name(Tl, "Tl");
function rm({ id: e, currentClipPathId: t, borderPath: r, borderType: n, left: i, top: a, width: o, height: l }, s) {
  if (!(s.borderTopWidth || s.borderRightWidth || s.borderBottomWidth || s.borderLeftWidth)) return null;
  let u = `satori_bc-${e}`;
  return [le("clipPath", { id: u, "clip-path": t ? `url(#${t})` : void 0 }, le(n, { x: i, y: a, width: o, height: l, d: r || void 0 })), u];
}
__name(rm, "rm");
function Fu({ left: e, top: t, width: r, height: n, props: i, asContentMask: a, maskBorderOnly: o }, l) {
  let s = ["borderTop", "borderRight", "borderBottom", "borderLeft"];
  if (!a && !s.some((p) => l[p + "Width"])) return "";
  let u = "", f = 0;
  for (; f > 0 && Tl(s[f], s[(f + 3) % 4], l); ) f = (f + 3) % 4;
  let c = [false, false, false, false], h = [];
  for (let p = 0; p < 4; p++) {
    let m = (f + p) % 4, v = (f + p + 1) % 4, g = s[m], y = s[v];
    if (c[m] = true, h = [l[g + "Width"], l[g + "Style"], l[g + "Color"], g], !Tl(g, y, l)) {
      let x = (h[0] || 0) + (a && !o && l[g.replace("border", "padding")] || 0);
      x && (u += le("path", { width: r, height: n, ...i, fill: "none", stroke: a ? "#000" : h[2], "stroke-width": x * 2, "stroke-dasharray": !a && h[1] === "dashed" ? x * 2 + " " + x : void 0, d: Jn({ left: e, top: t, width: r, height: n }, l, c) })), c = [false, false, false, false];
    }
  }
  if (c.some(Boolean)) {
    let p = (h[0] || 0) + (a && !o && l[h[3].replace("border", "padding")] || 0);
    p && (u += le("path", { width: r, height: n, ...i, fill: "none", stroke: a ? "#000" : h[2], "stroke-width": p * 2, "stroke-dasharray": !a && h[1] === "dashed" ? p * 2 + " " + p : void 0, d: Jn({ left: e, top: t, width: r, height: n }, l, c) }));
  }
  return u;
}
__name(Fu, "Fu");
function nm({ id: e, left: t, top: r, width: n, height: i, matrix: a, borderOnly: o }, l) {
  let s = (l.borderLeftWidth || 0) + (o ? 0 : l.paddingLeft || 0), u = (l.borderTopWidth || 0) + (o ? 0 : l.paddingTop || 0), f = (l.borderRightWidth || 0) + (o ? 0 : l.paddingRight || 0), c = (l.borderBottomWidth || 0) + (o ? 0 : l.paddingBottom || 0), h = { x: t + s, y: r + u, width: n - s - f, height: i - u - c };
  return le("mask", { id: e }, le("rect", { ...h, fill: "#fff", transform: l.overflow === "hidden" && l.transform && a ? a : void 0, mask: l._inheritedMaskId ? `url(#${l._inheritedMaskId})` : void 0 }) + Fu({ left: t, top: r, width: n, height: i, props: { transform: a || void 0 }, asContentMask: true, maskBorderOnly: o }, l));
}
__name(nm, "nm");
var Qr = { circle: /circle\((.+)\)/, ellipse: /ellipse\((.+)\)/, path: /path\((.+)\)/, polygon: /polygon\((.+)\)/, inset: /inset\((.+)\)/ };
function im({ width: e, height: t }, r, n) {
  function i(u) {
    let f = u.match(Qr.circle);
    if (!f) return null;
    let [, c] = f, [h, p = ""] = c.split("at").map((g) => g.trim()), { x: m, y: v } = Ll(p, e, t);
    return { type: "circle", r: Pe(h, n.fontSize, Math.sqrt(Math.pow(e, 2) + Math.pow(t, 2)) / Math.sqrt(2), n, true), cx: Pe(m, n.fontSize, e, n, true), cy: Pe(v, n.fontSize, t, n, true) };
  }
  __name(i, "i");
  function a(u) {
    let f = u.match(Qr.ellipse);
    if (!f) return null;
    let [, c] = f, [h, p = ""] = c.split("at").map((x) => x.trim()), [m, v] = h.split(" "), { x: g, y } = Ll(p, e, t);
    return { type: "ellipse", rx: Pe(m || "50%", n.fontSize, e, n, true), ry: Pe(v || "50%", n.fontSize, t, n, true), cx: Pe(g, n.fontSize, e, n, true), cy: Pe(y, n.fontSize, t, n, true) };
  }
  __name(a, "a");
  function o(u) {
    let f = u.match(Qr.path);
    if (!f) return null;
    let [c, h] = _l(f[1]);
    return { type: "path", d: h, "fill-rule": c };
  }
  __name(o, "o");
  function l(u) {
    let f = u.match(Qr.polygon);
    if (!f) return null;
    let [c, h] = _l(f[1]);
    return { type: "polygon", "fill-rule": c, points: h.split(",").map((p) => p.split(" ").map((m, v) => Pe(m, n.fontSize, v === 0 ? e : t, n, true)).join(" ")).join(",") };
  }
  __name(l, "l");
  function s(u) {
    let f = u.match(Qr.inset);
    if (!f) return null;
    let [c, h] = (f[1].includes("round") ? f[1] : `${f[1].trim()} round 0`).split("round"), p = (0, Ca.getStylesForProperty)("borderRadius", h, true), m = Object.values(p).map((L) => String(L)).map((L, T) => Pe(L, n.fontSize, T === 0 || T === 2 ? t : e, n, true) || 0), v = Object.values((0, Ca.getStylesForProperty)("margin", c, true)).map((L) => String(L)).map((L, T) => Pe(L, n.fontSize, T === 0 || T === 2 ? t : e, n, true) || 0), g = v[3], y = v[0], x = e - (v[1] + v[3]), _ = t - (v[0] + v[2]);
    return m.some((L) => L > 0) ? { type: "path", d: Jn({ left: g, top: y, width: x, height: _ }, { ...r, ...p }) } : { type: "rect", x: g, y, width: x, height: _ };
  }
  __name(s, "s");
  return { parseCircle: i, parseEllipse: a, parsePath: o, parsePolygon: l, parseInset: s };
}
__name(im, "im");
function _l(e) {
  let [, t = "nonzero", r] = e.replace(/('|")/g, "").match(/^(nonzero|evenodd)?,?(.+)/) || [];
  return [t, r];
}
__name(_l, "_l");
function Ll(e, t, r) {
  let n = e.split(" "), i = { x: n[0] || "50%", y: n[1] || "50%" };
  return n.forEach((a) => {
    a === "top" ? i.y = 0 : a === "bottom" ? i.y = r : a === "left" ? i.x = 0 : a === "right" ? i.x = t : a === "center" && (i.x = t / 2, i.y = r / 2);
  }), i;
}
__name(Ll, "Ll");
function ja(e) {
  return `satori_cp-${e}`;
}
__name(ja, "ja");
function am(e) {
  return `url(#${ja(e)})`;
}
__name(am, "am");
function om(e, t, r) {
  if (t.clipPath === "none") return "";
  let n = im(e, t, r), i = t.clipPath, a = { type: "" };
  for (let o of Object.keys(n)) if (a = n[o](i), a) break;
  if (a) {
    let { type: o, ...l } = a;
    return le("clipPath", { id: ja(e.id), "clip-path": e.currentClipPath, transform: `translate(${e.left}, ${e.top})` }, le(o, l));
  }
  return "";
}
__name(om, "om");
function sm({ left: e, top: t, width: r, height: n, path: i, matrix: a, id: o, currentClipPath: l, src: s }, u, f) {
  let c = "", h = u.clipPath && u.clipPath !== "none" ? om({ left: e, top: t, width: r, height: n, path: i, id: o, matrix: a, currentClipPath: l, src: s }, u, f) : "";
  if (u.overflow !== "hidden" && !s) c = "";
  else {
    let m = h ? `satori_ocp-${o}` : ja(o);
    c = le("clipPath", { id: m, "clip-path": l }, le(i ? "path" : "rect", { x: e, y: t, width: r, height: n, d: i || void 0, transform: u.overflow === "hidden" && u.transform && a ? a : void 0 }));
  }
  let p = nm({ id: `satori_om-${o}`, left: e, top: t, width: r, height: n, matrix: a, borderOnly: !s }, u);
  return h + c + p;
}
__name(sm, "sm");
var lm = /* @__PURE__ */ __name((e) => `satori_mi-${e}`, "lm");
async function um(e, t, r) {
  if (!t.maskImage) return ["", ""];
  let { left: n, top: i, width: a, height: o, id: l } = e, s = t.maskImage, u = s.length;
  if (!u) return ["", ""];
  let f = lm(l), c = "";
  for (let h = 0; h < u; h++) {
    let p = s[h], [m, v] = await Ru({ id: `${f}-${h}`, left: n, top: i, width: a, height: o }, p, r, "mask");
    c += v + le("rect", { x: n, y: i, width: a, height: o, fill: `url(#${m})` });
  }
  return c = le("mask", { id: f }, c), [f, c];
}
__name(um, "um");
async function ya({ id: e, left: t, top: r, width: n, height: i, isInheritingTransform: a, src: o, debug: l }, s, u) {
  if (s.display === "none") return "";
  let f = !!o, c = "rect", h = "", p = "", m = [], v = 1, g = "";
  s.backgroundColor && m.push(s.backgroundColor), s.opacity !== void 0 && (v = +s.opacity), s.transform && (h = Ou({ left: t, top: r, width: n, height: i }, s.transform, a, s.transformOrigin));
  let y = "";
  if (s.backgroundImage) {
    let U = [];
    for (let O = 0; O < s.backgroundImage.length; O++) {
      let X = s.backgroundImage[O], K = await Ru({ id: e + "_" + O, width: n, height: i, left: t, top: r }, X, u);
      K && U.unshift(K);
    }
    for (let O of U) m.push(`url(#${O[0]})`), p += O[1], O[2] && (y += O[2]);
  }
  let [x, _] = await um({ id: e, left: t, top: r, width: n, height: i }, s, u);
  p += _;
  let L = x ? `url(#${x})` : s._inheritedMaskId ? `url(#${s._inheritedMaskId})` : void 0, T = Jn({ left: t, top: r, width: n, height: i }, s);
  T && (c = "path");
  let E = s._inheritedClipPathId;
  l && (g = le("rect", { x: t, y: r, width: n, height: i, fill: "transparent", stroke: "#ff5757", "stroke-width": 1, transform: h || void 0, "clip-path": E ? `url(#${E})` : void 0 }));
  let { backgroundClip: R, filter: C } = s, D = R === "text" ? `url(#satori_bct-${e})` : E ? `url(#${E})` : s.clipPath ? am(e) : void 0, M = sm({ left: t, top: r, width: n, height: i, path: T, id: e, matrix: h, currentClipPath: D, src: o }, s, u), H = m.map((U) => le(c, { x: t, y: r, width: n, height: i, fill: U, d: T || void 0, transform: h || void 0, "clip-path": s.transform ? void 0 : D, style: C ? `filter:${C}` : void 0, mask: s.transform ? void 0 : L })).join(""), Q = rm({ id: e, left: t, top: r, width: n, height: i, currentClipPathId: E, borderPath: T, borderType: c }, s), ee;
  if (f) {
    let U = (s.borderLeftWidth || 0) + (s.paddingLeft || 0), O = (s.borderTopWidth || 0) + (s.paddingTop || 0), X = (s.borderRightWidth || 0) + (s.paddingRight || 0), K = (s.borderBottomWidth || 0) + (s.paddingBottom || 0), ne = s.objectFit === "contain" ? "xMidYMid" : s.objectFit === "cover" ? "xMidYMid slice" : "none";
    s.transform && (ee = tm({ id: e, borderRadiusPath: T, borderType: c, left: t, top: r, width: n, height: i }, s)), H += le("image", { x: t + U, y: r + O, width: n - U - X, height: i - O - K, href: o, preserveAspectRatio: ne, transform: h || void 0, style: C ? `filter:${C}` : void 0, "clip-path": s.transform ? ee ? `url(#${ee[1]})` : void 0 : `url(#satori_cp-${e})`, mask: s.transform ? void 0 : x ? `url(#${x})` : `url(#satori_om-${e})` });
  }
  if (Q) {
    p += Q[0];
    let U = Q[1];
    H += Fu({ left: t, top: r, width: n, height: i, props: { transform: h || void 0, "clip-path": `url(#${U})` } }, s);
  }
  let P = A1({ width: n, height: i, id: e, opacity: v, shape: le(c, { x: t, y: r, width: n, height: i, fill: "#fff", stroke: "#fff", "stroke-width": 0, d: T || void 0, transform: h || void 0, "clip-path": D, mask: L }) }, s);
  return (p ? le("defs", {}, p) : "") + (P ? P[0] : "") + (ee ? ee[0] : "") + M + (v !== 1 ? `<g opacity="${v}">` : "") + (s.transform && (D || L) ? `<g${D ? ` clip-path="${D}"` : ""}${L ? ` mask="${L}"` : ""}>` : "") + (y || H) + (s.transform && (D || L) ? "</g>" : "") + (v !== 1 ? "</g>" : "") + (P ? P[1] : "") + g;
}
__name(ya, "ya");
var Du = String.raw;
var Cl = Du`\p{Emoji}(?:\p{EMod}|[\u{E0020}-\u{E007E}]+\u{E007F}|\uFE0F?\u20E3?)`;
var fm = /* @__PURE__ */ __name(() => new RegExp(Du`\p{RI}{2}|(?![#*\d](?!\uFE0F?\u20E3))${Cl}(?:\u200D${Cl})*`, "gu"), "fm");
var cm = new RegExp(fm(), "u");
var Oa = { emoji: cm, symbol: /\p{Symbol}/u, math: /\p{Math}/u };
var Aa = { "ja-JP": /\p{scx=Hira}|\p{scx=Kana}|\p{scx=Han}|[\u3000]|[\uFF00-\uFFEF]/u, "ko-KR": /\p{scx=Hangul}/u, "zh-CN": /\p{scx=Han}/u, "zh-TW": /\p{scx=Han}/u, "zh-HK": /\p{scx=Han}/u, "th-TH": /\p{scx=Thai}/u, "bn-IN": /\p{scx=Bengali}/u, "ar-AR": /\p{scx=Arabic}/u, "ta-IN": /\p{scx=Tamil}/u, "ml-IN": /\p{scx=Malayalam}/u, "he-IL": /\p{scx=Hebrew}/u, "te-IN": /\p{scx=Telugu}/u, devanagari: /\p{scx=Devanagari}/u, kannada: /\p{scx=Kannada}/u };
var za = Object.keys({ ...Aa, ...Oa });
function hm(e) {
  return za.includes(e);
}
__name(hm, "hm");
function pm(e, t) {
  for (let n of Object.keys(Oa)) if (Oa[n].test(e)) return [n];
  let r = Object.keys(Aa).filter((n) => Aa[n].test(e));
  if (r.length === 0) return ["unknown"];
  if (t) {
    let n = r.findIndex((i) => i === t);
    n !== -1 && (r.splice(n, 1), r.unshift(t));
  }
  return r;
}
__name(pm, "pm");
function dm(e) {
  if (e) return za.find((t) => t.toLowerCase().startsWith(e.toLowerCase()));
}
__name(dm, "dm");
async function* Pa(e, t) {
  var r;
  let n = await ti(), { id: i, inheritedStyle: a, parent: o, font: l, debug: s, locale: u, embedFont: f = true, graphemeImages: c, canLoadAdditionalAssets: h, getTwStyles: p } = t;
  if (e === null || typeof e > "u") return yield, yield, "";
  if (!Vn(e) || typeof e.type == "function") {
    let B;
    if (!Vn(e)) B = G1(String(e), t), yield (await B.next()).value;
    else {
      if (zg(e.type)) throw new Error("Class component is not supported.");
      B = Pa(await e.type(e.props), t), yield (await B.next()).value;
    }
    await B.next();
    let ae = yield;
    return (await B.next(ae)).value;
  }
  let { type: m, props: v } = e;
  if (v && Vg(v)) throw new Error("dangerouslySetInnerHTML property is not supported. See documentation for more information https://github.com/vercel/satori#jsx.");
  let { style: g, children: y, tw: x, lang: _ = u } = v || {}, L = dm(_);
  if (x) {
    let B = p(x, g);
    g = Object.assign(B, g);
  }
  let T = n.Node.create();
  o.insertChild(T, o.getChildCount());
  let [E, R] = await k1(T, m, a, g, v), C = E.transform === a.transform;
  if (C || (E.transform.__parent = a.transform), (E.overflow === "hidden" || E.clipPath && E.clipPath !== "none") && (R._inheritedClipPathId = `satori_cp-${i}`, R._inheritedMaskId = `satori_om-${i}`), E.maskImage && (R._inheritedMaskId = `satori_mi-${i}`), E.backgroundClip === "text") {
    let B = { value: "" };
    R._inheritedBackgroundClipTextPath = B, E._inheritedBackgroundClipTextPath = B;
  }
  let D = Hg(y), M = [], H = 0, Q = [];
  for (let B of D) {
    let ae = Pa(B, { id: i + "-" + H++, parentStyle: E, inheritedStyle: R, isInheritingTransform: true, parent: T, font: l, embedFont: f, debug: s, graphemeImages: c, canLoadAdditionalAssets: h, locale: L, getTwStyles: p, onNodeDetected: t.onNodeDetected });
    h ? Q.push(...(await ae.next()).value || []) : await ae.next(), M.push(ae);
  }
  yield Q;
  for (let B of M) await B.next();
  let [ee, P] = yield, { left: U, top: O, width: X, height: K } = T.getComputedLayout();
  U += ee, O += P;
  let ne = "", ie = "", V = "", { children: Y, ...A } = v;
  if ((r = t.onNodeDetected) == null || r.call(t, { left: U, top: O, width: X, height: K, type: m, props: A, key: e.key, textContent: Vn(Y) ? void 0 : Y }), m === "img") {
    let B = E.__src;
    ie = await ya({ id: i, left: U, top: O, width: X, height: K, src: B, isInheritingTransform: C, debug: s }, E, R);
  } else if (m === "svg") {
    let B = E.color, ae = await u1(e, B);
    ie = await ya({ id: i, left: U, top: O, width: X, height: K, src: ae, isInheritingTransform: C, debug: s }, E, R);
  } else {
    let B = g?.display;
    if (m === "div" && y && typeof y != "string" && B !== "flex" && B !== "none") throw new Error('Expected <div> to have explicit "display: flex" or "display: none" if it has more than one child node.');
    ie = await ya({ id: i, left: U, top: O, width: X, height: K, isInheritingTransform: C, debug: s }, E, R);
  }
  for (let B of M) ne += (await B.next([U, O])).value;
  return E._inheritedBackgroundClipTextPath && (V += le("clipPath", { id: `satori_bct-${i}`, "clip-path": E._inheritedClipPathId ? `url(#${E._inheritedClipPathId})` : void 0 }, E._inheritedBackgroundClipTextPath.value)), V + ie + ne;
}
__name(Pa, "Pa");
var Uu = "unknown";
function vm(e, t, [r, n], [i, a]) {
  if (r !== i) return r ? !i || r === e ? -1 : i === e ? 1 : e === 400 && r === 500 || e === 500 && r === 400 ? -1 : e === 400 && i === 500 || e === 500 && i === 400 ? 1 : e < 400 ? r < e && i < e ? i - r : r < e ? -1 : i < e ? 1 : r - i : e < r && e < i ? r - i : e < r ? -1 : e < i ? 1 : i - r : 1;
  if (n !== a) {
    if (n === t) return -1;
    if (a === t) return 1;
  }
  return -1;
}
__name(vm, "vm");
var gm = class {
  static {
    __name(this, "gm");
  }
  defaultFont;
  fonts = /* @__PURE__ */ new Map();
  constructor(e) {
    this.addFonts(e);
  }
  get({ name: e, weight: t, style: r }) {
    if (!this.fonts.has(e)) return null;
    t === "normal" && (t = 400), t === "bold" && (t = 700), typeof t == "string" && (t = Number.parseInt(t, 10));
    let n = [...this.fonts.get(e)], i = n[0];
    for (let a = 1; a < n.length; a++) {
      let [, o, l] = i, [, s, u] = n[a];
      vm(t, r, [o, l], [s, u]) > 0 && (i = n[a]);
    }
    return i[0];
  }
  addFonts(e) {
    for (let t of e) {
      let { name: r, data: n, lang: i } = t;
      if (i && !hm(i)) throw new Error(`Invalid value for props \`lang\`: "${i}". The value must be one of the following: ${za.join(", ")}.`);
      let a = i ?? Uu, o = Fn.parse("buffer" in n ? n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength) : n, { lowMemory: true }), l = o.charToGlyphIndex;
      o.charToGlyphIndex = (u) => {
        let f = l.call(o, u);
        return f === 0 && o._trackBrokenChars && o._trackBrokenChars.push(u), f;
      }, this.defaultFont || (this.defaultFont = o);
      let s = `${r.toLowerCase()}_${a}`;
      this.fonts.has(s) || this.fonts.set(s, []), this.fonts.get(s).push([o, t.weight, t.style]);
    }
  }
  getEngine(e = 16, t = "normal", { fontFamily: r = "sans-serif", fontWeight: n = 400, fontStyle: i = "normal" }, a) {
    if (!this.fonts.size) throw new Error("No fonts are loaded. At least one font is required to calculate the layout.");
    r = (Array.isArray(r) ? r : [r]).map((y) => y.toLowerCase());
    let o = [];
    r.forEach((y) => {
      let x = this.get({ name: y, weight: n, style: i });
      if (x) {
        o.push(x);
        return;
      }
      let _ = this.get({ name: y + "_unknown", weight: n, style: i });
      if (_) {
        o.push(_);
        return;
      }
    });
    let l = Array.from(this.fonts.keys()), s = [], u = [], f = [];
    for (let y of l) if (!r.includes(y)) if (a) {
      let x = mm(y);
      x ? x === a ? s.push(this.get({ name: y, weight: n, style: i })) : u.push(this.get({ name: y, weight: n, style: i })) : f.push(this.get({ name: y, weight: n, style: i }));
    } else f.push(this.get({ name: y, weight: n, style: i }));
    let c = /* @__PURE__ */ new Map(), h = /* @__PURE__ */ __name((y, x = true) => {
      let _ = [...o, ...f, ...s, ...x ? u : []];
      if (typeof y > "u") return x ? _[_.length - 1] : void 0;
      let L = y.charCodeAt(0);
      if (c.has(L)) return c.get(L);
      let T = _.find((E, R) => !!E.charToGlyphIndex(y) || x && R === _.length - 1);
      return T && c.set(L, T), T;
    }, "h"), p = /* @__PURE__ */ __name((y, x = false) => {
      var _, L;
      return ((x ? (L = (_ = y.tables) == null ? void 0 : _.os2) == null ? void 0 : L.sTypoAscender : 0) || y.ascender) / y.unitsPerEm * e;
    }, "p"), m = /* @__PURE__ */ __name((y, x = false) => {
      var _, L;
      return ((x ? (L = (_ = y.tables) == null ? void 0 : _.os2) == null ? void 0 : L.sTypoDescender : 0) || y.descender) / y.unitsPerEm * e;
    }, "m"), v = /* @__PURE__ */ __name((y, x = false) => {
      var _, L;
      if (typeof t == "string" && t === "normal") {
        let T = (x ? (L = (_ = y.tables) == null ? void 0 : _.os2) == null ? void 0 : L.sTypoLineGap : 0) || 0;
        return p(y, x) - m(y, x) + T / y.unitsPerEm * e;
      } else if (typeof t == "number") return e * t;
    }, "v"), g = /* @__PURE__ */ __name((y) => h(y, false), "g");
    return { has: /* @__PURE__ */ __name((y) => {
      if (y === `
`) return true;
      let x = g(y);
      return x ? (x._trackBrokenChars = [], x.stringToGlyphs(y), x._trackBrokenChars.length ? (x._trackBrokenChars = void 0, false) : true) : false;
    }, "has"), baseline: /* @__PURE__ */ __name((y, x = typeof y > "u" ? o[0] : h(y)) => {
      let _ = p(x), L = m(x), T = _ - L;
      return _ + (v(x) - T) / 2;
    }, "baseline"), height: /* @__PURE__ */ __name((y, x = typeof y > "u" ? o[0] : h(y)) => v(x), "height"), measure: /* @__PURE__ */ __name((y, x) => this.measure(h, y, x), "measure"), getSVG: /* @__PURE__ */ __name((y, x) => this.getSVG(h, y, x), "getSVG") };
  }
  patchFontFallbackResolver(e, t) {
    let r = [];
    e._trackBrokenChars = r;
    let n = e.stringToGlyphs;
    return e.stringToGlyphs = (i, ...a) => {
      let o = n.call(e, i, ...a);
      for (let l = 0; l < o.length; l++) if (o[l].unicode === void 0) {
        let s = r.shift(), u = t(s);
        if (u !== e) {
          let f = u.charToGlyph(s), c = e.unitsPerEm / u.unitsPerEm, h = new Fn.Path();
          h.unitsPerEm = e.unitsPerEm, h.commands = f.path.commands.map((m) => {
            let v = { ...m };
            for (let g in v) typeof v[g] == "number" && (v[g] *= c);
            return v;
          });
          let p = new Fn.Glyph({ ...f, advanceWidth: f.advanceWidth * c, xMin: f.xMin * c, xMax: f.xMax * c, yMin: f.yMin * c, yMax: f.yMax * c, path: h });
          o[l] = p;
        }
      }
      return o;
    }, () => {
      e.stringToGlyphs = n, e._trackBrokenChars = void 0;
    };
  }
  measure(e, t, { fontSize: r, letterSpacing: n = 0 }) {
    let i = e(t), a = this.patchFontFallbackResolver(i, e);
    try {
      return i.getAdvanceWidth(t, r, { letterSpacing: n / r });
    } finally {
      a();
    }
  }
  getSVG(e, t, { fontSize: r, top: n, left: i, letterSpacing: a = 0 }) {
    let o = e(t), l = this.patchFontFallbackResolver(o, e);
    try {
      return r === 0 ? "" : o.getPath(t.replace(/\n/g, ""), i, n, r, { letterSpacing: a / r }).toPathData(1);
    } finally {
      l();
    }
  }
};
function mm(e) {
  let t = e.split("_"), r = t[t.length - 1];
  return r === Uu ? void 0 : r;
}
__name(mm, "mm");
function bm({ width: e, height: t, content: r }) {
  return le("svg", { width: e, height: t, viewBox: `0 0 ${e} ${t}`, xmlns: "http://www.w3.org/2000/svg" }, r);
}
__name(bm, "bm");
var ym = Zv(Ig());
var xm = ["ios", "android", "windows", "macos", "web"];
function wm(e) {
  return xm.includes(e);
}
__name(wm, "wm");
var Sm = ["portrait", "landscape"];
function Em(e) {
  return Sm.includes(e);
}
__name(Em, "Em");
var Ol;
(function(e) {
  e.fontSize = "fontSize", e.lineHeight = "lineHeight";
})(Ol || (Ol = {}));
var De;
(function(e) {
  e.rem = "rem", e.em = "em", e.px = "px", e.percent = "%", e.vw = "vw", e.vh = "vh", e.none = "<no-css-unit>";
})(De || (De = {}));
function Al(e) {
  return typeof e == "string";
}
__name(Al, "Al");
function Pl(e) {
  return typeof e == "object";
}
__name(Pl, "Pl");
var xa;
function j(e) {
  return { kind: "complete", style: e };
}
__name(j, "j");
function Et(e, t = {}) {
  let { fractions: r } = t;
  if (r && e.includes("/")) {
    let [a = "", o = ""] = e.split("/", 2), l = Et(a), s = Et(o);
    return !l || !s ? null : [l[0] / s[0], s[1]];
  }
  let n = parseFloat(e);
  if (Number.isNaN(n)) return null;
  let i = e.match(/(([a-z]{2,}|%))$/);
  if (!i) return [n, De.none];
  switch (i?.[1]) {
    case "rem":
      return [n, De.rem];
    case "px":
      return [n, De.px];
    case "em":
      return [n, De.em];
    case "%":
      return [n, De.percent];
    case "vw":
      return [n, De.vw];
    case "vh":
      return [n, De.vh];
    default:
      return null;
  }
}
__name(Et, "Et");
function sn(e, t, r = {}) {
  let n = Sr(t, r);
  return n === null ? null : j({ [e]: n });
}
__name(sn, "sn");
function wa(e, t, r) {
  let n = Sr(t);
  return n !== null && (r[e] = n), r;
}
__name(wa, "wa");
function km(e, t) {
  let r = Sr(t);
  return r === null ? null : { [e]: r };
}
__name(km, "km");
function Sr(e, t = {}) {
  if (e === void 0) return null;
  let r = Et(String(e), t);
  return r ? ln(...r, t) : null;
}
__name(Sr, "Sr");
function ln(e, t, r = {}) {
  let { isNegative: n, device: i } = r;
  switch (t) {
    case De.rem:
      return e * 16 * (n ? -1 : 1);
    case De.px:
      return e * (n ? -1 : 1);
    case De.percent:
      return `${n ? "-" : ""}${e}%`;
    case De.none:
      return e * (n ? -1 : 1);
    case De.vw:
      return i != null && i.windowDimensions ? i.windowDimensions.width * (e / 100) : (Qt("`vw` CSS unit requires configuration with `useDeviceContext()`"), null);
    case De.vh:
      return i != null && i.windowDimensions ? i.windowDimensions.height * (e / 100) : (Qt("`vh` CSS unit requires configuration with `useDeviceContext()`"), null);
    default:
      return null;
  }
}
__name(ln, "ln");
function Il(e) {
  let t = Et(e);
  if (!t) return null;
  let [r, n] = t;
  switch (n) {
    case De.rem:
      return r * 16;
    case De.px:
      return r;
    default:
      return null;
  }
}
__name(Il, "Il");
var Tm = { t: "Top", tr: "TopRight", tl: "TopLeft", b: "Bottom", br: "BottomRight", bl: "BottomLeft", l: "Left", r: "Right", x: "Horizontal", y: "Vertical" };
function Nu(e) {
  return Tm[e ?? ""] || "All";
}
__name(Nu, "Nu");
function Mu(e) {
  let t = "All";
  return [e.replace(/^-(t|b|r|l|tr|tl|br|bl)(-|$)/, (r, n) => (t = Nu(n), "")), t];
}
__name(Mu, "Mu");
function oi(e, t = {}) {
  if (e.includes("/")) {
    let r = Rl(e, { ...t, fractions: true });
    if (r) return r;
  }
  return e[0] === "[" && (e = e.slice(1, -1)), Rl(e, t);
}
__name(oi, "oi");
function Er(e, t, r = {}) {
  let n = oi(t, r);
  return n === null ? null : j({ [e]: n });
}
__name(Er, "Er");
function Rl(e, t = {}) {
  if (e === "px") return 1;
  let r = Et(e, t);
  if (!r) return null;
  let [n, i] = r;
  return t.fractions && (i = De.percent, n *= 100), i === De.none && (n = n / 4, i = De.rem), ln(n, i, t);
}
__name(Rl, "Rl");
function _m(...e) {
  console.warn(...e);
}
__name(_m, "_m");
function Lm(...e) {
}
__name(Lm, "Lm");
var Qt = typeof process > "u" || ((xa = process == null ? void 0 : process.env) === null || xa === void 0 ? void 0 : xa.JEST_WORKER_ID) === void 0 ? _m : Lm;
var Cm = [["aspect-square", j({ aspectRatio: 1 })], ["aspect-video", j({ aspectRatio: 16 / 9 })], ["items-center", j({ alignItems: "center" })], ["items-start", j({ alignItems: "flex-start" })], ["items-end", j({ alignItems: "flex-end" })], ["items-baseline", j({ alignItems: "baseline" })], ["items-stretch", j({ alignItems: "stretch" })], ["justify-start", j({ justifyContent: "flex-start" })], ["justify-end", j({ justifyContent: "flex-end" })], ["justify-center", j({ justifyContent: "center" })], ["justify-between", j({ justifyContent: "space-between" })], ["justify-around", j({ justifyContent: "space-around" })], ["justify-evenly", j({ justifyContent: "space-evenly" })], ["content-start", j({ alignContent: "flex-start" })], ["content-end", j({ alignContent: "flex-end" })], ["content-between", j({ alignContent: "space-between" })], ["content-around", j({ alignContent: "space-around" })], ["content-stretch", j({ alignContent: "stretch" })], ["content-center", j({ alignContent: "center" })], ["self-auto", j({ alignSelf: "auto" })], ["self-start", j({ alignSelf: "flex-start" })], ["self-end", j({ alignSelf: "flex-end" })], ["self-center", j({ alignSelf: "center" })], ["self-stretch", j({ alignSelf: "stretch" })], ["self-baseline", j({ alignSelf: "baseline" })], ["direction-inherit", j({ direction: "inherit" })], ["direction-ltr", j({ direction: "ltr" })], ["direction-rtl", j({ direction: "rtl" })], ["hidden", j({ display: "none" })], ["flex", j({ display: "flex" })], ["flex-row", j({ flexDirection: "row" })], ["flex-row-reverse", j({ flexDirection: "row-reverse" })], ["flex-col", j({ flexDirection: "column" })], ["flex-col-reverse", j({ flexDirection: "column-reverse" })], ["flex-wrap", j({ flexWrap: "wrap" })], ["flex-wrap-reverse", j({ flexWrap: "wrap-reverse" })], ["flex-nowrap", j({ flexWrap: "nowrap" })], ["flex-auto", j({ flexGrow: 1, flexShrink: 1, flexBasis: "auto" })], ["flex-initial", j({ flexGrow: 0, flexShrink: 1, flexBasis: "auto" })], ["flex-none", j({ flexGrow: 0, flexShrink: 0, flexBasis: "auto" })], ["overflow-hidden", j({ overflow: "hidden" })], ["overflow-visible", j({ overflow: "visible" })], ["overflow-scroll", j({ overflow: "scroll" })], ["absolute", j({ position: "absolute" })], ["relative", j({ position: "relative" })], ["italic", j({ fontStyle: "italic" })], ["not-italic", j({ fontStyle: "normal" })], ["oldstyle-nums", Kr("oldstyle-nums")], ["small-caps", Kr("small-caps")], ["lining-nums", Kr("lining-nums")], ["tabular-nums", Kr("tabular-nums")], ["proportional-nums", Kr("proportional-nums")], ["font-thin", j({ fontWeight: "100" })], ["font-100", j({ fontWeight: "100" })], ["font-extralight", j({ fontWeight: "200" })], ["font-200", j({ fontWeight: "200" })], ["font-light", j({ fontWeight: "300" })], ["font-300", j({ fontWeight: "300" })], ["font-normal", j({ fontWeight: "normal" })], ["font-400", j({ fontWeight: "400" })], ["font-medium", j({ fontWeight: "500" })], ["font-500", j({ fontWeight: "500" })], ["font-semibold", j({ fontWeight: "600" })], ["font-600", j({ fontWeight: "600" })], ["font-bold", j({ fontWeight: "bold" })], ["font-700", j({ fontWeight: "700" })], ["font-extrabold", j({ fontWeight: "800" })], ["font-800", j({ fontWeight: "800" })], ["font-black", j({ fontWeight: "900" })], ["font-900", j({ fontWeight: "900" })], ["include-font-padding", j({ includeFontPadding: true })], ["remove-font-padding", j({ includeFontPadding: false })], ["max-w-none", j({ maxWidth: "99999%" })], ["text-left", j({ textAlign: "left" })], ["text-center", j({ textAlign: "center" })], ["text-right", j({ textAlign: "right" })], ["text-justify", j({ textAlign: "justify" })], ["text-auto", j({ textAlign: "auto" })], ["underline", j({ textDecorationLine: "underline" })], ["line-through", j({ textDecorationLine: "line-through" })], ["no-underline", j({ textDecorationLine: "none" })], ["uppercase", j({ textTransform: "uppercase" })], ["lowercase", j({ textTransform: "lowercase" })], ["capitalize", j({ textTransform: "capitalize" })], ["normal-case", j({ textTransform: "none" })], ["w-auto", j({ width: "auto" })], ["h-auto", j({ height: "auto" })], ["shadow-sm", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 1, shadowOpacity: 0.025, elevation: 1 })], ["shadow", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 1, shadowOpacity: 0.075, elevation: 2 })], ["shadow-md", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 3, shadowOpacity: 0.125, elevation: 3 })], ["shadow-lg", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 })], ["shadow-xl", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.19, shadowRadius: 20, elevation: 12 })], ["shadow-2xl", j({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 30, elevation: 16 })], ["shadow-none", j({ shadowOffset: { width: 0, height: 0 }, shadowColor: "#000", shadowRadius: 0, shadowOpacity: 0, elevation: 0 })]];
var Fl = Cm;
function Kr(e) {
  return { kind: "dependent", complete(t) {
    (!t.fontVariant || !Array.isArray(t.fontVariant)) && (t.fontVariant = []), t.fontVariant.push(e);
  } };
}
__name(Kr, "Kr");
var Om = class {
  static {
    __name(this, "Om");
  }
  constructor(e) {
    this.ir = new Map(Fl), this.styles = /* @__PURE__ */ new Map(), this.prefixes = /* @__PURE__ */ new Map(), this.ir = new Map([...Fl, ...e ?? []]);
  }
  getStyle(e) {
    return this.styles.get(e);
  }
  setStyle(e, t) {
    this.styles.set(e, t);
  }
  getIr(e) {
    return this.ir.get(e);
  }
  setIr(e, t) {
    this.ir.set(e, t);
  }
  getPrefixMatch(e) {
    return this.prefixes.get(e);
  }
  setPrefixMatch(e, t) {
    this.prefixes.set(e, t);
  }
};
function Am(e, t, r = {}) {
  let n = t?.[e];
  if (!n) return Er("fontSize", e, r);
  if (typeof n == "string") return sn("fontSize", n);
  let i = {}, [a, o] = n, l = km("fontSize", a);
  if (l && (i = l), typeof o == "string") return j(wa("lineHeight", Dl(o, i), i));
  let { lineHeight: s, letterSpacing: u } = o;
  return s && wa("lineHeight", Dl(s, i), i), u && wa("letterSpacing", u, i), j(i);
}
__name(Am, "Am");
function Dl(e, t) {
  let r = Et(e);
  if (r) {
    let [n, i] = r;
    if ((i === De.none || i === De.em) && typeof t.fontSize == "number") return t.fontSize * n;
  }
  return e;
}
__name(Dl, "Dl");
function Pm(e, t) {
  var r;
  let n = (r = t?.[e]) !== null && r !== void 0 ? r : e.startsWith("[") ? e.slice(1, -1) : e, i = Et(n);
  if (!i) return null;
  let [a, o] = i;
  if (o === De.none) return { kind: "dependent", complete(s) {
    if (typeof s.fontSize != "number") return "relative line-height utilities require that font-size be set";
    s.lineHeight = s.fontSize * a;
  } };
  let l = ln(a, o);
  return l !== null ? j({ lineHeight: l }) : null;
}
__name(Pm, "Pm");
function Im(e, t, r, n, i) {
  let a = "";
  if (n[0] === "[") a = n.slice(1, -1);
  else {
    let u = i?.[n];
    if (u) a = u;
    else {
      let f = oi(n);
      return f && typeof f == "number" ? Ul(f, De.px, t, e) : null;
    }
  }
  if (a === "auto") return Wu(t, e, "auto");
  let o = Et(a);
  if (!o) return null;
  let [l, s] = o;
  return r && (l = -l), Ul(l, s, t, e);
}
__name(Im, "Im");
function Ul(e, t, r, n) {
  let i = ln(e, t);
  return i === null ? null : Wu(r, n, i);
}
__name(Ul, "Ul");
function Wu(e, t, r) {
  switch (e) {
    case "All":
      return { kind: "complete", style: { [`${t}Top`]: r, [`${t}Right`]: r, [`${t}Bottom`]: r, [`${t}Left`]: r } };
    case "Bottom":
    case "Top":
    case "Left":
    case "Right":
      return { kind: "complete", style: { [`${t}${e}`]: r } };
    case "Vertical":
      return { kind: "complete", style: { [`${t}Top`]: r, [`${t}Bottom`]: r } };
    case "Horizontal":
      return { kind: "complete", style: { [`${t}Left`]: r, [`${t}Right`]: r } };
    default:
      return null;
  }
}
__name(Wu, "Wu");
function Rm(e) {
  if (!e) return {};
  let t = Object.entries(e).reduce((i, [a, o]) => {
    let l = [0, 1 / 0, 0], s = typeof o == "string" ? { min: o } : o, u = s.min ? Il(s.min) : 0;
    u === null ? Qt(`invalid screen config value: ${a}->min: ${s.min}`) : l[0] = u;
    let f = s.max ? Il(s.max) : 1 / 0;
    return f === null ? Qt(`invalid screen config value: ${a}->max: ${s.max}`) : l[1] = f, i[a] = l, i;
  }, {}), r = Object.values(t);
  r.sort((i, a) => {
    let [o, l] = i, [s, u] = a;
    return l === 1 / 0 || u === 1 / 0 ? o - s : l - u;
  });
  let n = 0;
  return r.forEach((i) => i[2] = n++), t;
}
__name(Rm, "Rm");
function Fm(e, t) {
  let r = t?.[e];
  if (!r) return null;
  if (typeof r == "string") return j({ fontFamily: r });
  let n = r[0];
  return n ? j({ fontFamily: n }) : null;
}
__name(Fm, "Fm");
function rn(e, t, r) {
  if (!r) return null;
  let n;
  t.includes("/") && ([t = "", n] = t.split("/", 2));
  let i = "";
  if (t.startsWith("[#") || t.startsWith("[rgb") ? i = t.slice(1, -1) : i = Bu(t, r), !i) return null;
  if (n) {
    let a = Number(n);
    if (!Number.isNaN(a)) return i = Nl(i, a / 100), j({ [Yn[e].color]: i });
  }
  return { kind: "dependent", complete(a) {
    let o = Yn[e].opacity, l = a[o];
    typeof l == "number" && (i = Nl(i, l)), a[Yn[e].color] = i;
  } };
}
__name(rn, "rn");
function Gn(e, t) {
  let r = parseInt(t, 10);
  if (Number.isNaN(r)) return null;
  let n = r / 100;
  return { kind: "complete", style: { [Yn[e].opacity]: n } };
}
__name(Gn, "Gn");
function Nl(e, t) {
  return e.startsWith("#") ? e = Um(e) : e.startsWith("rgb(") && (e = e.replace(/^rgb\(/, "rgba(").replace(/\)$/, ", 1)")), e.replace(/, ?\d*\.?(\d+)\)$/, `, ${t})`);
}
__name(Nl, "Nl");
function Dm(e) {
  for (let t in e) t.startsWith("__opacity_") && delete e[t];
}
__name(Dm, "Dm");
var Yn = { bg: { opacity: "__opacity_bg", color: "backgroundColor" }, text: { opacity: "__opacity_text", color: "color" }, border: { opacity: "__opacity_border", color: "borderColor" }, borderTop: { opacity: "__opacity_border", color: "borderTopColor" }, borderBottom: { opacity: "__opacity_border", color: "borderBottomColor" }, borderLeft: { opacity: "__opacity_border", color: "borderLeftColor" }, borderRight: { opacity: "__opacity_border", color: "borderRightColor" }, shadow: { opacity: "__opacity_shadow", color: "shadowColor" }, tint: { opacity: "__opacity_tint", color: "tintColor" } };
function Um(e) {
  let t = e;
  e = e.replace(Nm, (o, l, s, u) => l + l + s + s + u + u);
  let r = Mm.exec(e);
  if (!r) return Qt(`invalid config hex color value: ${t}`), "rgba(0, 0, 0, 1)";
  let n = parseInt(r[1], 16), i = parseInt(r[2], 16), a = parseInt(r[3], 16);
  return `rgba(${n}, ${i}, ${a}, 1)`;
}
__name(Um, "Um");
function Bu(e, t) {
  let r = t[e];
  if (Al(r)) return r;
  if (Pl(r) && Al(r.DEFAULT)) return r.DEFAULT;
  let [n = "", ...i] = e.split("-");
  for (; n !== e; ) {
    let a = t[n];
    if (Pl(a)) return Bu(i.join("-"), a);
    if (i.length === 0) return "";
    n = `${n}-${i.shift()}`;
  }
  return "";
}
__name(Bu, "Bu");
var Nm = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
var Mm = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
function Wm(e, t) {
  let [r, n] = Mu(e);
  if (r.match(/^(-?(\d)+)?$/)) return Bm(r, n, t?.borderWidth);
  if (r = r.replace(/^-/, ""), ["dashed", "solid", "dotted"].includes(r)) return j({ borderStyle: r });
  let i = "border";
  switch (n) {
    case "Bottom":
      i = "borderBottom";
      break;
    case "Top":
      i = "borderTop";
      break;
    case "Left":
      i = "borderLeft";
      break;
    case "Right":
      i = "borderRight";
      break;
  }
  let a = rn(i, r, t?.borderColor);
  if (a) return a;
  let o = `border${n === "All" ? "" : n}Width`;
  r = r.replace(/^-/, "");
  let l = r.slice(1, -1), s = Er(o, l);
  return typeof s?.style[o] != "number" ? null : s;
}
__name(Wm, "Wm");
function Bm(e, t, r) {
  if (!r) return null;
  e = e.replace(/^-/, "");
  let n = r[e === "" ? "DEFAULT" : e];
  if (n === void 0) return null;
  let i = `border${t === "All" ? "" : t}Width`;
  return sn(i, n);
}
__name(Bm, "Bm");
function Gm(e, t) {
  if (!t) return null;
  let [r, n] = Mu(e);
  r = r.replace(/^-/, ""), r === "" && (r = "DEFAULT");
  let i = `border${n === "All" ? "" : n}Radius`, a = t[r];
  if (a) return Ml(sn(i, a));
  let o = Er(i, r);
  return typeof o?.style[i] != "number" ? null : Ml(o);
}
__name(Gm, "Gm");
function Ml(e) {
  if (e?.kind !== "complete") return e;
  let t = e.style.borderTopRadius;
  t !== void 0 && (e.style.borderTopLeftRadius = t, e.style.borderTopRightRadius = t, delete e.style.borderTopRadius);
  let r = e.style.borderBottomRadius;
  r !== void 0 && (e.style.borderBottomLeftRadius = r, e.style.borderBottomRightRadius = r, delete e.style.borderBottomRadius);
  let n = e.style.borderLeftRadius;
  n !== void 0 && (e.style.borderBottomLeftRadius = n, e.style.borderTopLeftRadius = n, delete e.style.borderLeftRadius);
  let i = e.style.borderRightRadius;
  return i !== void 0 && (e.style.borderBottomRightRadius = i, e.style.borderTopRightRadius = i, delete e.style.borderRightRadius), e;
}
__name(Ml, "Ml");
function en(e, t, r, n) {
  let i = null;
  e === "inset" && (t = t.replace(/^(x|y)-/, (l, s) => (i = s === "x" ? "x" : "y", "")));
  let a = n?.[t];
  if (a) {
    let l = Sr(a, { isNegative: r });
    if (l !== null) return Wl(e, i, l);
  }
  let o = oi(t, { isNegative: r });
  return o !== null ? Wl(e, i, o) : null;
}
__name(en, "en");
function Wl(e, t, r) {
  if (e !== "inset") return j({ [e]: r });
  switch (t) {
    case null:
      return j({ top: r, left: r, right: r, bottom: r });
    case "y":
      return j({ top: r, bottom: r });
    case "x":
      return j({ left: r, right: r });
  }
}
__name(Wl, "Wl");
function $n(e, t, r) {
  var n;
  t = t.replace(/^-/, "");
  let i = t === "" ? "DEFAULT" : t, a = Number((n = r?.[i]) !== null && n !== void 0 ? n : t);
  return Number.isNaN(a) ? null : j({ [`flex${e}`]: a });
}
__name($n, "$n");
function $m(e, t) {
  var r, n;
  if (e = t?.[e] || e, ["min-content", "revert", "unset"].includes(e)) return null;
  if (e.match(/^\d+(\.\d+)?$/)) return j({ flexGrow: Number(e), flexBasis: "0%" });
  let i = e.match(/^(\d+)\s+(\d+)$/);
  if (i) return j({ flexGrow: Number(i[1]), flexShrink: Number(i[2]) });
  if (i = e.match(/^(\d+)\s+([^ ]+)$/), i) {
    let a = Sr((r = i[2]) !== null && r !== void 0 ? r : "");
    return a ? j({ flexGrow: Number(i[1]), flexBasis: a }) : null;
  }
  if (i = e.match(/^(\d+)\s+(\d+)\s+(.+)$/), i) {
    let a = Sr((n = i[3]) !== null && n !== void 0 ? n : "");
    return a ? j({ flexGrow: Number(i[1]), flexShrink: Number(i[2]), flexBasis: a }) : null;
  }
  return null;
}
__name($m, "$m");
function Bl(e, t, r = {}, n) {
  let i = n?.[t];
  return i !== void 0 ? sn(e, i, r) : Er(e, t, r);
}
__name(Bl, "Bl");
function jn(e, t, r = {}, n) {
  let i = Sr(n?.[t], r);
  return i ? j({ [e]: i }) : (t === "screen" && (t = e.includes("Width") ? "100vw" : "100vh"), Er(e, t, r));
}
__name(jn, "jn");
function jm(e, t, r) {
  let n = r?.[e];
  if (n) {
    let i = Et(n, { isNegative: t });
    if (!i) return null;
    let [a, o] = i;
    if (o === De.em) return zm(a);
    if (o === De.percent) return Qt("percentage-based letter-spacing configuration currently unsupported, switch to `em`s, or open an issue if you'd like to see support added."), null;
    let l = ln(a, o, { isNegative: t });
    return l !== null ? j({ letterSpacing: l }) : null;
  }
  return Er("letterSpacing", e, { isNegative: t });
}
__name(jm, "jm");
function zm(e) {
  return { kind: "dependent", complete(t) {
    let r = t.fontSize;
    if (typeof r != "number" || Number.isNaN(r)) return "tracking-X relative letter spacing classes require font-size to be set";
    t.letterSpacing = Math.round((e * r + Number.EPSILON) * 100) / 100;
  } };
}
__name(zm, "zm");
function Vm(e, t) {
  let r = t?.[e];
  if (r) {
    let i = Et(String(r));
    if (i) return j({ opacity: i[0] });
  }
  let n = Et(e);
  return n ? j({ opacity: n[0] / 100 }) : null;
}
__name(Vm, "Vm");
function Hm(e) {
  let t = parseInt(e, 10);
  return Number.isNaN(t) ? null : { kind: "complete", style: { shadowOpacity: t / 100 } };
}
__name(Hm, "Hm");
function qm(e) {
  if (e.includes("/")) {
    let [r = "", n = ""] = e.split("/", 2), i = Sa(r), a = Sa(n);
    return i === null || a === null ? null : { kind: "complete", style: { shadowOffset: { width: i, height: a } } };
  }
  let t = Sa(e);
  return t === null ? null : { kind: "complete", style: { shadowOffset: { width: t, height: t } } };
}
__name(qm, "qm");
function Sa(e) {
  let t = oi(e);
  return typeof t == "number" ? t : null;
}
__name(Sa, "Sa");
var Gl = class {
  static {
    __name(this, "Gl");
  }
  constructor(e, t = {}, r, n, i) {
    var a, o, l, s, u, f;
    this.config = t, this.cache = r, this.position = 0, this.isNull = false, this.isNegative = false, this.context = {}, this.context.device = n;
    let c = e.trim().split(":"), h = [];
    c.length === 1 ? this.string = e : (this.string = (a = c.pop()) !== null && a !== void 0 ? a : "", h = c), this.char = this.string[0];
    let p = Rm((o = this.config.theme) === null || o === void 0 ? void 0 : o.screens);
    for (let m of h) if (p[m]) {
      let v = (l = p[m]) === null || l === void 0 ? void 0 : l[2];
      v !== void 0 && (this.order = ((s = this.order) !== null && s !== void 0 ? s : 0) + v);
      let g = (u = n.windowDimensions) === null || u === void 0 ? void 0 : u.width;
      if (g) {
        let [y, x] = (f = p[m]) !== null && f !== void 0 ? f : [0, 0];
        (g <= y || g > x) && (this.isNull = true);
      } else this.isNull = true;
    } else wm(m) ? this.isNull = m !== i : Em(m) ? n.windowDimensions ? (n.windowDimensions.width > n.windowDimensions.height ? "landscape" : "portrait") !== m ? this.isNull = true : this.incrementOrder() : this.isNull = true : m === "retina" ? n.pixelDensity === 2 ? this.incrementOrder() : this.isNull = true : m === "dark" ? n.colorScheme !== "dark" ? this.isNull = true : this.incrementOrder() : this.handlePossibleArbitraryBreakpointPrefix(m) || (this.isNull = true);
  }
  parse() {
    if (this.isNull) return { kind: "null" };
    let e = this.cache.getIr(this.rest);
    if (e) return e;
    this.parseIsNegative();
    let t = this.parseUtility();
    return t ? this.order !== void 0 ? { kind: "ordered", order: this.order, styleIr: t } : t : { kind: "null" };
  }
  parseUtility() {
    var e, t, r, n, i;
    let a = this.config.theme, o = null;
    switch (this.char) {
      case "m":
      case "p": {
        let l = this.peekSlice(1, 3).match(/^(t|b|r|l|x|y)?-/);
        if (l) {
          let s = this.char === "m" ? "margin" : "padding";
          this.advance(((t = (e = l[0]) === null || e === void 0 ? void 0 : e.length) !== null && t !== void 0 ? t : 0) + 1);
          let u = Nu(l[1]), f = Im(s, u, this.isNegative, this.rest, (r = this.config.theme) === null || r === void 0 ? void 0 : r[s]);
          if (f) return f;
        }
      }
    }
    if (this.consumePeeked("h-") && (o = Bl("height", this.rest, this.context, a?.height), o) || this.consumePeeked("w-") && (o = Bl("width", this.rest, this.context, a?.width), o) || this.consumePeeked("min-w-") && (o = jn("minWidth", this.rest, this.context, a?.minWidth), o) || this.consumePeeked("min-h-") && (o = jn("minHeight", this.rest, this.context, a?.minHeight), o) || this.consumePeeked("max-w-") && (o = jn("maxWidth", this.rest, this.context, a?.maxWidth), o) || this.consumePeeked("max-h-") && (o = jn("maxHeight", this.rest, this.context, a?.maxHeight), o) || this.consumePeeked("leading-") && (o = Pm(this.rest, a?.lineHeight), o) || this.consumePeeked("text-") && (o = Am(this.rest, a?.fontSize, this.context), o || (o = rn("text", this.rest, a?.textColor), o) || this.consumePeeked("opacity-") && (o = Gn("text", this.rest), o)) || this.consumePeeked("font-") && (o = Fm(this.rest, a?.fontFamily), o) || this.consumePeeked("aspect-") && (this.consumePeeked("ratio-") && Qt("`aspect-ratio-{ratio}` is deprecated, use `aspect-{ratio}` instead"), o = sn("aspectRatio", this.rest, { fractions: true }), o) || this.consumePeeked("tint-") && (o = rn("tint", this.rest, a?.colors), o) || this.consumePeeked("bg-") && (o = rn("bg", this.rest, a?.backgroundColor), o || this.consumePeeked("opacity-") && (o = Gn("bg", this.rest), o)) || this.consumePeeked("border") && (o = Wm(this.rest, a), o || this.consumePeeked("-opacity-") && (o = Gn("border", this.rest), o)) || this.consumePeeked("rounded") && (o = Gm(this.rest, a?.borderRadius), o) || this.consumePeeked("bottom-") && (o = en("bottom", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("top-") && (o = en("top", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("left-") && (o = en("left", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("right-") && (o = en("right", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("inset-") && (o = en("inset", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("flex-") && (this.consumePeeked("grow") ? o = $n("Grow", this.rest, a?.flexGrow) : this.consumePeeked("shrink") ? o = $n("Shrink", this.rest, a?.flexShrink) : o = $m(this.rest, a?.flex), o) || this.consumePeeked("grow") && (o = $n("Grow", this.rest, a?.flexGrow), o) || this.consumePeeked("shrink") && (o = $n("Shrink", this.rest, a?.flexShrink), o) || this.consumePeeked("shadow-color-opacity-") && (o = Gn("shadow", this.rest), o) || this.consumePeeked("shadow-opacity-") && (o = Hm(this.rest), o) || this.consumePeeked("shadow-offset-") && (o = qm(this.rest), o) || this.consumePeeked("shadow-radius-") && (o = Er("shadowRadius", this.rest), o) || this.consumePeeked("shadow-") && (o = rn("shadow", this.rest, a?.colors), o)) return o;
    if (this.consumePeeked("elevation-")) {
      let l = parseInt(this.rest, 10);
      if (!Number.isNaN(l)) return j({ elevation: l });
    }
    if (this.consumePeeked("opacity-") && (o = Vm(this.rest, a?.opacity), o) || this.consumePeeked("tracking-") && (o = jm(this.rest, this.isNegative, a?.letterSpacing), o)) return o;
    if (this.consumePeeked("z-")) {
      let l = Number((i = (n = a?.zIndex) === null || n === void 0 ? void 0 : n[this.rest]) !== null && i !== void 0 ? i : this.rest);
      if (!Number.isNaN(l)) return j({ zIndex: l });
    }
    return Qt(`\`${this.rest}\` unknown or invalid utility`), null;
  }
  handlePossibleArbitraryBreakpointPrefix(e) {
    var t;
    if (e[0] !== "m") return false;
    let r = e.match(/^(min|max)-(w|h)-\[([^\]]+)\]$/);
    if (!r) return false;
    if (!(!((t = this.context.device) === null || t === void 0) && t.windowDimensions)) return this.isNull = true, true;
    let n = this.context.device.windowDimensions, [, i = "", a = "", o = ""] = r, l = a === "w" ? n.width : n.height, s = Et(o, this.context);
    if (s === null) return this.isNull = true, true;
    let [u, f] = s;
    return f !== "px" && (this.isNull = true), (i === "min" ? l >= u : l <= u) ? this.incrementOrder() : this.isNull = true, true;
  }
  advance(e = 1) {
    this.position += e, this.char = this.string[this.position];
  }
  get rest() {
    return this.peekSlice(0, this.string.length);
  }
  peekSlice(e, t) {
    return this.string.slice(this.position + e, this.position + t);
  }
  consumePeeked(e) {
    return this.peekSlice(0, e.length) === e ? (this.advance(e.length), true) : false;
  }
  parseIsNegative() {
    this.char === "-" && (this.advance(), this.isNegative = true, this.context.isNegative = true);
  }
  incrementOrder() {
    var e;
    this.order = ((e = this.order) !== null && e !== void 0 ? e : 0) + 1;
  }
};
function Xm(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    if (typeof n == "string") t = [...t, ...Ea(n)];
    else if (Array.isArray(n)) t = [...t, ...n.flatMap(Ea)];
    else if (typeof n == "object" && n !== null) for (let [i, a] of Object.entries(n)) typeof a == "boolean" ? t = [...t, ...a ? Ea(i) : []] : r ? r[i] = a : r = { [i]: a };
  }), [t.filter(Boolean).filter(Ym), r];
}
__name(Xm, "Xm");
function Ea(e) {
  return e.trim().split(/\s+/);
}
__name(Ea, "Ea");
function Ym(e, t, r) {
  return r.indexOf(e) === t;
}
__name(Ym, "Ym");
function Zm(e) {
  var t;
  return (t = e?.reduce((r, n) => ({ ...r, ...Jm(n.handler) }), {})) !== null && t !== void 0 ? t : {};
}
__name(Zm, "Zm");
function Jm(e) {
  let t = {};
  return e({ addUtilities: /* @__PURE__ */ __name((r) => {
    t = r;
  }, "addUtilities"), ...Qm }), t;
}
__name(Jm, "Jm");
function zt(e) {
  throw new Error(`tailwindcss plugin function argument object prop "${e}" not implemented`);
}
__name(zt, "zt");
var Qm = { addComponents: zt, addBase: zt, addVariant: zt, e: zt, prefix: zt, theme: zt, variants: zt, config: zt, corePlugins: zt, matchUtilities: zt, postcss: null };
function Km(e, t) {
  let r = (0, ym.default)(eb(e)), n = {}, i = Zm(r.plugins), a = {}, o = Object.entries(i).map(([m, v]) => typeof v == "string" ? (a[m] = v, [m, { kind: "null" }]) : [m, j(v)]).filter(([, m]) => m.kind !== "null");
  function l() {
    return [n.windowDimensions ? `w${n.windowDimensions.width}` : false, n.windowDimensions ? `h${n.windowDimensions.height}` : false, n.fontScale ? `fs${n.fontScale}` : false, n.colorScheme === "dark" ? "dark" : false, n.pixelDensity === 2 ? "retina" : false].filter(Boolean).join("--") || "default";
  }
  __name(l, "l");
  let s = l(), u = {};
  function f() {
    let m = u[s];
    if (m) return m;
    let v = new Om(o);
    return u[s] = v, v;
  }
  __name(f, "f");
  function c(...m) {
    let v = f(), g = {}, y = [], x = [], [_, L] = Xm(m), T = _.join(" "), E = v.getStyle(T);
    if (E) return { ...E, ...L || {} };
    for (let R of _) {
      let C = v.getIr(R);
      if (!C && R in a) {
        let D = c(a[R]);
        v.setIr(R, j(D)), g = { ...g, ...D };
        continue;
      }
      switch (C = new Gl(R, r, v, n, t).parse(), C.kind) {
        case "complete":
          g = { ...g, ...C.style }, v.setIr(R, C);
          break;
        case "dependent":
          y.push(C);
          break;
        case "ordered":
          x.push(C);
          break;
        case "null":
          v.setIr(R, C);
          break;
      }
    }
    if (x.length > 0) {
      x.sort((R, C) => R.order - C.order);
      for (let R of x) switch (R.styleIr.kind) {
        case "complete":
          g = { ...g, ...R.styleIr.style };
          break;
        case "dependent":
          y.push(R.styleIr);
          break;
      }
    }
    if (y.length > 0) {
      for (let R of y) {
        let C = R.complete(g);
        C && Qt(C);
      }
      Dm(g);
    }
    return T !== "" && v.setStyle(T, g), L && (g = { ...g, ...L }), g;
  }
  __name(c, "c");
  function h(m) {
    let v = c(m.split(/\s+/g).map((g) => g.replace(/^(bg|text|border)-/, "")).map((g) => `bg-${g}`).join(" "));
    return typeof v.backgroundColor == "string" ? v.backgroundColor : void 0;
  }
  __name(h, "h");
  let p = /* @__PURE__ */ __name((m, ...v) => {
    let g = "";
    return m.forEach((y, x) => {
      var _;
      g += y + ((_ = v[x]) !== null && _ !== void 0 ? _ : "");
    }), c(g);
  }, "p");
  return p.style = c, p.color = h, p.prefixMatch = (...m) => {
    let v = m.sort().join(":"), g = f(), y = g.getPrefixMatch(v);
    if (y !== void 0) return y;
    let x = new Gl(`${v}:flex`, r, g, n, t).parse().kind !== "null";
    return g.setPrefixMatch(v, x), x;
  }, p.setWindowDimensions = (m) => {
    n.windowDimensions = m, s = l();
  }, p.setFontScale = (m) => {
    n.fontScale = m, s = l();
  }, p.setPixelDensity = (m) => {
    n.pixelDensity = m, s = l();
  }, p.setColorScheme = (m) => {
    n.colorScheme = m, s = l();
  }, p;
}
__name(Km, "Km");
function eb(e) {
  return { ...e, content: ["_no_warnings_please"] };
}
__name(eb, "eb");
var tb = { handler: /* @__PURE__ */ __name(({ addUtilities: e }) => {
  e({ "shadow-sm": { boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }, shadow: { boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" }, "shadow-md": { boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }, "shadow-lg": { boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }, "shadow-xl": { boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }, "shadow-2xl": { boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }, "shadow-inner": { boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" }, "shadow-none": { boxShadow: "0 0 #0000" } });
}, "handler") };
function rb(e) {
  return Km({ ...e, plugins: [...e?.plugins ?? [], tb] }, "web");
}
__name(rb, "rb");
var zn;
function nb({ width: e, height: t, config: r }) {
  return zn || (zn = rb(r)), zn.setWindowDimensions({ width: +e, height: +t }), zn;
}
__name(nb, "nb");
var ka = /* @__PURE__ */ new WeakMap();
async function Gu(e, t) {
  let r = await ti();
  if (!r || !r.Node) throw new Error("Satori is not initialized: expect `yoga` to be loaded, got " + r);
  t.fonts = t.fonts || [];
  let n;
  ka.has(t.fonts) ? n = ka.get(t.fonts) : ka.set(t.fonts, n = new gm(t.fonts));
  let i = "width" in t ? t.width : void 0, a = "height" in t ? t.height : void 0, o = ib(r, t.pointScaleFactor);
  i && o.setWidth(i), a && o.setHeight(a), o.setFlexDirection(r.FLEX_DIRECTION_ROW), o.setFlexWrap(r.WRAP_WRAP), o.setAlignContent(r.ALIGN_AUTO), o.setAlignItems(r.ALIGN_FLEX_START), o.setJustifyContent(r.JUSTIFY_FLEX_START), o.setOverflow(r.OVERFLOW_HIDDEN);
  let l = { ...t.graphemeImages }, s = /* @__PURE__ */ new Set();
  cr.clear(), qn.clear(), await l1(e);
  let u = Pa(e, { id: "id", parentStyle: {}, inheritedStyle: { fontSize: 16, fontWeight: "normal", fontFamily: "serif", fontStyle: "normal", lineHeight: "normal", color: "black", opacity: 1, whiteSpace: "normal", _viewportWidth: i, _viewportHeight: a }, parent: o, font: n, embedFont: t.embedFont, debug: t.debug, graphemeImages: l, canLoadAdditionalAssets: !!t.loadAdditionalAsset, onNodeDetected: t.onNodeDetected, getTwStyles: /* @__PURE__ */ __name((m, v) => {
    let g = { ...nb({ width: i, height: a, config: t.tailwindConfig })([m]) };
    return typeof g.lineHeight == "number" && (g.lineHeight = g.lineHeight / (+g.fontSize || v.fontSize || 16)), g.shadowColor && g.boxShadow && (g.boxShadow = g.boxShadow.replace(/rgba?\([^)]+\)/, g.shadowColor)), g;
  }, "getTwStyles") }), f = (await u.next()).value;
  if (t.loadAdditionalAsset && f.length) {
    let m = ab(f), v = [], g = {};
    await Promise.all(Object.entries(m).flatMap(([y, x]) => x.map((_) => {
      let L = `${y}_${_}`;
      return s.has(L) ? null : (s.add(L), t.loadAdditionalAsset(y, _).then((T) => {
        typeof T == "string" ? g[_] = T : T && (Array.isArray(T) ? v.push(...T) : v.push(T));
      }));
    }))), n.addFonts(v), Object.assign(l, g);
  }
  await u.next(), o.calculateLayout(i, a, r.DIRECTION_LTR);
  let c = (await u.next([0, 0])).value, h = o.getComputedWidth(), p = o.getComputedHeight();
  return o.freeRecursive(), bm({ width: h, height: p, content: c });
}
__name(Gu, "Gu");
function ib(e, t) {
  if (t) {
    let r = e.Config.create();
    return r.setPointScaleFactor(t), e.Node.createWithConfig(r);
  } else return e.Node.create();
}
__name(ib, "ib");
function ab(e) {
  let t = {}, r = {};
  for (let { word: n, locale: i } of e) {
    let a = pm(n, i).join("|");
    r[a] = r[a] || "", r[a] += n;
  }
  return Object.keys(r).forEach((n) => {
    t[n] = t[n] || [], n === "emoji" ? t[n].push(...$l(Ft(r[n], "grapheme"))) : (t[n][0] = t[n][0] || "", t[n][0] += $l(Ft(r[n], "grapheme", n === "unknown" ? void 0 : n)).join(""));
  }), t;
}
__name(ab, "ab");
function $l(e) {
  return Array.from(new Set(e));
}
__name($l, "$l");
var re = {};
var ob = re.ALIGN_AUTO = 0;
var sb = re.ALIGN_FLEX_START = 1;
var lb = re.ALIGN_CENTER = 2;
var ub = re.ALIGN_FLEX_END = 3;
var fb = re.ALIGN_STRETCH = 4;
var cb = re.ALIGN_BASELINE = 5;
var hb = re.ALIGN_SPACE_BETWEEN = 6;
var pb = re.ALIGN_SPACE_AROUND = 7;
var db = re.DIMENSION_WIDTH = 0;
var vb = re.DIMENSION_HEIGHT = 1;
var gb = re.DIRECTION_INHERIT = 0;
var mb = re.DIRECTION_LTR = 1;
var bb = re.DIRECTION_RTL = 2;
var yb = re.DISPLAY_FLEX = 0;
var xb = re.DISPLAY_NONE = 1;
var wb = re.EDGE_LEFT = 0;
var Sb = re.EDGE_TOP = 1;
var Eb = re.EDGE_RIGHT = 2;
var kb = re.EDGE_BOTTOM = 3;
var Tb = re.EDGE_START = 4;
var _b = re.EDGE_END = 5;
var Lb = re.EDGE_HORIZONTAL = 6;
var Cb = re.EDGE_VERTICAL = 7;
var Ob = re.EDGE_ALL = 8;
var Ab = re.EXPERIMENTAL_FEATURE_WEB_FLEX_BASIS = 0;
var Pb = re.EXPERIMENTAL_FEATURE_ABSOLUTE_PERCENTAGE_AGAINST_PADDING_EDGE = 1;
var Ib = re.EXPERIMENTAL_FEATURE_FIX_ABSOLUTE_TRAILING_COLUMN_MARGIN = 2;
var Rb = re.FLEX_DIRECTION_COLUMN = 0;
var Fb = re.FLEX_DIRECTION_COLUMN_REVERSE = 1;
var Db = re.FLEX_DIRECTION_ROW = 2;
var Ub = re.FLEX_DIRECTION_ROW_REVERSE = 3;
var Nb = re.GUTTER_COLUMN = 0;
var Mb = re.GUTTER_ROW = 1;
var Wb = re.GUTTER_ALL = 2;
var Bb = re.JUSTIFY_FLEX_START = 0;
var Gb = re.JUSTIFY_CENTER = 1;
var $b = re.JUSTIFY_FLEX_END = 2;
var jb = re.JUSTIFY_SPACE_BETWEEN = 3;
var zb = re.JUSTIFY_SPACE_AROUND = 4;
var Vb = re.JUSTIFY_SPACE_EVENLY = 5;
var Hb = re.LOG_LEVEL_ERROR = 0;
var qb = re.LOG_LEVEL_WARN = 1;
var Xb = re.LOG_LEVEL_INFO = 2;
var Yb = re.LOG_LEVEL_DEBUG = 3;
var Zb = re.LOG_LEVEL_VERBOSE = 4;
var Jb = re.LOG_LEVEL_FATAL = 5;
var Qb = re.MEASURE_MODE_UNDEFINED = 0;
var Kb = re.MEASURE_MODE_EXACTLY = 1;
var ey = re.MEASURE_MODE_AT_MOST = 2;
var ty = re.NODE_TYPE_DEFAULT = 0;
var ry = re.NODE_TYPE_TEXT = 1;
var ny = re.OVERFLOW_VISIBLE = 0;
var iy = re.OVERFLOW_HIDDEN = 1;
var ay = re.OVERFLOW_SCROLL = 2;
var oy = re.POSITION_TYPE_STATIC = 0;
var sy = re.POSITION_TYPE_RELATIVE = 1;
var ly = re.POSITION_TYPE_ABSOLUTE = 2;
var uy = re.PRINT_OPTIONS_LAYOUT = 1;
var fy = re.PRINT_OPTIONS_STYLE = 2;
var cy = re.PRINT_OPTIONS_CHILDREN = 4;
var hy = re.UNIT_UNDEFINED = 0;
var py = re.UNIT_POINT = 1;
var dy = re.UNIT_PERCENT = 2;
var vy = re.UNIT_AUTO = 3;
var gy = re.WRAP_NO_WRAP = 0;
var my = re.WRAP_WRAP = 1;
var by = re.WRAP_WRAP_REVERSE = 2;
var $u = /* @__PURE__ */ __name((e) => {
  function t(i, a, o) {
    let l = i[a];
    i[a] = function(...s) {
      return o.call(this, l, ...s);
    };
  }
  __name(t, "t");
  for (let i of ["setPosition", "setMargin", "setFlexBasis", "setWidth", "setHeight", "setMinWidth", "setMinHeight", "setMaxWidth", "setMaxHeight", "setPadding"]) {
    let a = { [re.UNIT_POINT]: e.Node.prototype[i], [re.UNIT_PERCENT]: e.Node.prototype[`${i}Percent`], [re.UNIT_AUTO]: e.Node.prototype[`${i}Auto`] };
    t(e.Node.prototype, i, function(o, ...l) {
      let s, u, f = l.pop();
      if (f === "auto") s = re.UNIT_AUTO, u = void 0;
      else if (typeof f == "object") s = f.unit, u = f.valueOf();
      else if (s = typeof f == "string" && f.endsWith("%") ? re.UNIT_PERCENT : re.UNIT_POINT, u = parseFloat(f), !Number.isNaN(f) && Number.isNaN(u)) throw Error(`Invalid value ${f} for ${i}`);
      if (!a[s]) throw Error(`Failed to execute "${i}": Unsupported unit '${f}'`);
      return u !== void 0 ? a[s].call(this, ...l, u) : a[s].call(this, ...l);
    });
  }
  function r(i) {
    return e.MeasureCallback.implement({ measure: /* @__PURE__ */ __name((...a) => {
      let { width: o, height: l } = i(...a);
      return { width: o ?? NaN, height: l ?? NaN };
    }, "measure") });
  }
  __name(r, "r");
  function n(i) {
    return e.DirtiedCallback.implement({ dirtied: i });
  }
  __name(n, "n");
  return t(e.Node.prototype, "setMeasureFunc", function(i, a) {
    return a ? i.call(this, r(a)) : this.unsetMeasureFunc();
  }), t(e.Node.prototype, "setDirtiedFunc", function(i, a) {
    i.call(this, n(a));
  }), t(e.Config.prototype, "free", function() {
    e.Config.destroy(this);
  }), t(e.Node, "create", (i, a) => a ? e.Node.createWithConfig(a) : e.Node.createDefault()), t(e.Node.prototype, "free", function() {
    e.Node.destroy(this);
  }), t(e.Node.prototype, "freeRecursive", function() {
    for (let i = 0, a = this.getChildCount(); i < a; ++i) this.getChild(0).freeRecursive();
    this.free();
  }), t(e.Node.prototype, "calculateLayout", function(i, a = NaN, o = NaN, l = re.DIRECTION_LTR) {
    return i.call(this, a, o, l);
  }), { Config: e.Config, Node: e.Node, ...re };
}, "$u");
var yy = (() => {
  var e = typeof document < "u" && document.currentScript ? document.currentScript.src : void 0;
  return function(t = {}) {
    s || (s = t !== void 0 ? t : {}), s.ready = new Promise(function(S, w) {
      u = S, f = w;
    });
    var r, n, i = Object.assign({}, s), a = "";
    typeof document < "u" && document.currentScript && (a = document.currentScript.src), e && (a = e), a = a.indexOf("blob:") !== 0 ? a.substr(0, a.replace(/[?#].*/, "").lastIndexOf("/") + 1) : "";
    var o = console.log.bind(console), l = console.warn.bind(console);
    Object.assign(s, i), i = null, typeof WebAssembly != "object" && ee("no native wasm support detected");
    var s, u, f, c, h = false;
    function p(S, w, I) {
      I = w + I;
      for (var N = ""; !(w >= I); ) {
        var F = S[w++];
        if (!F) break;
        if (128 & F) {
          var G = 63 & S[w++];
          if ((224 & F) == 192) N += String.fromCharCode((31 & F) << 6 | G);
          else {
            var Z = 63 & S[w++];
            65536 > (F = (240 & F) == 224 ? (15 & F) << 12 | G << 6 | Z : (7 & F) << 18 | G << 12 | Z << 6 | 63 & S[w++]) ? N += String.fromCharCode(F) : (F -= 65536, N += String.fromCharCode(55296 | F >> 10, 56320 | 1023 & F));
          }
        } else N += String.fromCharCode(F);
      }
      return N;
    }
    __name(p, "p");
    function m() {
      var S = c.buffer;
      s.HEAP8 = v = new Int8Array(S), s.HEAP16 = y = new Int16Array(S), s.HEAP32 = _ = new Int32Array(S), s.HEAPU8 = g = new Uint8Array(S), s.HEAPU16 = x = new Uint16Array(S), s.HEAPU32 = L = new Uint32Array(S), s.HEAPF32 = T = new Float32Array(S), s.HEAPF64 = E = new Float64Array(S);
    }
    __name(m, "m");
    var v, g, y, x, _, L, T, E, R, C = [], D = [], M = [], H = 0, Q = null;
    function ee(S) {
      throw l(S = "Aborted(" + S + ")"), h = true, f(S = new WebAssembly.RuntimeError(S + ". Build with -sASSERTIONS for more info.")), S;
    }
    __name(ee, "ee");
    function P() {
      return r.startsWith("data:application/octet-stream;base64,");
    }
    __name(P, "P");
    function U() {
      try {
        throw "both async and sync fetching of the wasm failed";
      } catch (S) {
        ee(S);
      }
    }
    __name(U, "U");
    function O(S) {
      for (; 0 < S.length; ) S.shift()(s);
    }
    __name(O, "O");
    function X(S) {
      if (S === void 0) return "_unknown";
      var w = (S = S.replace(/[^a-zA-Z0-9_]/g, "$")).charCodeAt(0);
      return 48 <= w && 57 >= w ? "_" + S : S;
    }
    __name(X, "X");
    function K(S, w) {
      return S = X(S), function() {
        return w.apply(this, arguments);
      };
    }
    __name(K, "K");
    r = "yoga.wasm", P() || (r = a + r);
    var ne = [{}, { value: void 0 }, { value: null }, { value: true }, { value: false }], ie = [];
    function V(S) {
      var w = Error, I = K(S, function(N) {
        this.name = S, this.message = N, (N = Error(N).stack) !== void 0 && (this.stack = this.toString() + `
` + N.replace(/^Error(:[^\n]*)?\n/, ""));
      });
      return I.prototype = Object.create(w.prototype), I.prototype.constructor = I, I.prototype.toString = function() {
        return this.message === void 0 ? this.name : this.name + ": " + this.message;
      }, I;
    }
    __name(V, "V");
    var Y = void 0;
    function A(S) {
      throw new Y(S);
    }
    __name(A, "A");
    var B = /* @__PURE__ */ __name((S) => (S || A("Cannot use deleted val. handle = " + S), ne[S].value), "B"), ae = /* @__PURE__ */ __name((S) => {
      switch (S) {
        case void 0:
          return 1;
        case null:
          return 2;
        case true:
          return 3;
        case false:
          return 4;
        default:
          var w = ie.length ? ie.pop() : ne.length;
          return ne[w] = { fa: 1, value: S }, w;
      }
    }, "ae"), $ = void 0, he = void 0;
    function fe(S) {
      for (var w = ""; g[S]; ) w += he[g[S++]];
      return w;
    }
    __name(fe, "fe");
    var ge = [];
    function ce() {
      for (; ge.length; ) {
        var S = ge.pop();
        S.L.Z = false, S.delete();
      }
    }
    __name(ce, "ce");
    var we = void 0, Ie = {};
    function pe(S, w) {
      for (w === void 0 && A("ptr should not be undefined"); S.P; ) w = S.aa(w), S = S.P;
      return w;
    }
    __name(pe, "pe");
    var ye = {};
    function Be(S) {
      var w = fe(S = Ja(S));
      return Ht(S), w;
    }
    __name(Be, "Be");
    function et(S, w) {
      var I = ye[S];
      return I === void 0 && A(w + " has unknown type " + Be(S)), I;
    }
    __name(et, "et");
    function Ge() {
    }
    __name(Ge, "Ge");
    var Me = false;
    function Xe(S) {
      --S.count.value, S.count.value === 0 && (S.S ? S.T.V(S.S) : S.O.M.V(S.N));
    }
    __name(Xe, "Xe");
    var tt = {}, rt = void 0;
    function nt(S) {
      throw new rt(S);
    }
    __name(nt, "nt");
    function it(S, w) {
      return w.O && w.N || nt("makeClassHandle requires ptr and ptrType"), !!w.T != !!w.S && nt("Both smartPtrType and smartPtr must be specified"), w.count = { value: 1 }, ze(Object.create(S, { L: { value: w } }));
    }
    __name(it, "it");
    function ze(S) {
      return typeof FinalizationRegistry > "u" ? (ze = /* @__PURE__ */ __name((w) => w, "ze"), S) : (Me = new FinalizationRegistry((w) => {
        Xe(w.L);
      }), ze = /* @__PURE__ */ __name((w) => {
        var I = w.L;
        return I.S && Me.register(w, { L: I }, w), w;
      }, "ze"), Ge = /* @__PURE__ */ __name((w) => {
        Me.unregister(w);
      }, "Ge"), ze(S));
    }
    __name(ze, "ze");
    var kt = {};
    function bt(S) {
      for (; S.length; ) {
        var w = S.pop();
        S.pop()(w);
      }
    }
    __name(bt, "bt");
    function ut(S) {
      return this.fromWireType(_[S >> 2]);
    }
    __name(ut, "ut");
    var ft = {}, Vt = {};
    function lt(S, w, I) {
      function N(z) {
        (z = I(z)).length !== S.length && nt("Mismatched type converter count");
        for (var J = 0; J < S.length; ++J) Ye(S[J], z[J]);
      }
      __name(N, "N");
      S.forEach(function(z) {
        Vt[z] = w;
      });
      var F = Array(w.length), G = [], Z = 0;
      w.forEach((z, J) => {
        ye.hasOwnProperty(z) ? F[J] = ye[z] : (G.push(z), ft.hasOwnProperty(z) || (ft[z] = []), ft[z].push(() => {
          F[J] = ye[z], ++Z === G.length && N(F);
        }));
      }), G.length === 0 && N(F);
    }
    __name(lt, "lt");
    function Ut(S) {
      switch (S) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw TypeError("Unknown type size: " + S);
      }
    }
    __name(Ut, "Ut");
    function Ye(S, w, I = {}) {
      if (!("argPackAdvance" in w)) throw TypeError("registerType registeredInstance requires argPackAdvance");
      var N = w.name;
      if (S || A('type "' + N + '" must have a positive integer typeid pointer'), ye.hasOwnProperty(S)) {
        if (I.ta) return;
        A("Cannot register type '" + N + "' twice");
      }
      ye[S] = w, delete Vt[S], ft.hasOwnProperty(S) && (w = ft[S], delete ft[S], w.forEach((F) => F()));
    }
    __name(Ye, "Ye");
    function kr(S) {
      A(S.L.O.M.name + " instance already deleted");
    }
    __name(kr, "kr");
    function ve() {
    }
    __name(ve, "ve");
    function Se(S, w, I) {
      if (S[w].R === void 0) {
        var N = S[w];
        S[w] = function() {
          return S[w].R.hasOwnProperty(arguments.length) || A("Function '" + I + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + S[w].R + ")!"), S[w].R[arguments.length].apply(this, arguments);
        }, S[w].R = [], S[w].R[N.Y] = N;
      }
    }
    __name(Se, "Se");
    function Ue(S, w, I, N, F, G, Z, z) {
      this.name = S, this.constructor = w, this.W = I, this.V = N, this.P = F, this.oa = G, this.aa = Z, this.ma = z, this.ia = [];
    }
    __name(Ue, "Ue");
    function Ee(S, w, I) {
      for (; w !== I; ) w.aa || A("Expected null or instance of " + I.name + ", got an instance of " + w.name), S = w.aa(S), w = w.P;
      return S;
    }
    __name(Ee, "Ee");
    function Ne(S, w) {
      return w === null ? (this.da && A("null is not a valid " + this.name), 0) : (w.L || A('Cannot pass "' + Fe(w) + '" as a ' + this.name), w.L.N || A("Cannot pass deleted object as a pointer of type " + this.name), Ee(w.L.N, w.L.O.M, this.M));
    }
    __name(Ne, "Ne");
    function ke(S, w) {
      if (w === null) {
        if (this.da && A("null is not a valid " + this.name), this.ca) {
          var I = this.ea();
          return S !== null && S.push(this.V, I), I;
        }
        return 0;
      }
      if (w.L || A('Cannot pass "' + Fe(w) + '" as a ' + this.name), w.L.N || A("Cannot pass deleted object as a pointer of type " + this.name), !this.ba && w.L.O.ba && A("Cannot convert argument of type " + (w.L.T ? w.L.T.name : w.L.O.name) + " to parameter type " + this.name), I = Ee(w.L.N, w.L.O.M, this.M), this.ca) switch (w.L.S === void 0 && A("Passing raw pointer to smart pointer is illegal"), this.Aa) {
        case 0:
          w.L.T === this ? I = w.L.S : A("Cannot convert argument of type " + (w.L.T ? w.L.T.name : w.L.O.name) + " to parameter type " + this.name);
          break;
        case 1:
          I = w.L.S;
          break;
        case 2:
          if (w.L.T === this) I = w.L.S;
          else {
            var N = w.clone();
            I = this.wa(I, ae(function() {
              N.delete();
            })), S !== null && S.push(this.V, I);
          }
          break;
        default:
          A("Unsupporting sharing policy");
      }
      return I;
    }
    __name(ke, "ke");
    function $e(S, w) {
      return w === null ? (this.da && A("null is not a valid " + this.name), 0) : (w.L || A('Cannot pass "' + Fe(w) + '" as a ' + this.name), w.L.N || A("Cannot pass deleted object as a pointer of type " + this.name), w.L.O.ba && A("Cannot convert argument of type " + w.L.O.name + " to parameter type " + this.name), Ee(w.L.N, w.L.O.M, this.M));
    }
    __name($e, "$e");
    function Le(S, w, I, N) {
      this.name = S, this.M = w, this.da = I, this.ba = N, this.ca = false, this.V = this.wa = this.ea = this.ja = this.Aa = this.va = void 0, w.P !== void 0 ? this.toWireType = ke : (this.toWireType = N ? Ne : $e, this.U = null);
    }
    __name(Le, "Le");
    var Te = [];
    function ct(S) {
      var w = Te[S];
      return w || (S >= Te.length && (Te.length = S + 1), Te[S] = w = R.get(S)), w;
    }
    __name(ct, "ct");
    function me(S, w) {
      var I, N, F = (S = fe(S)).includes("j") ? (I = S, N = [], function() {
        if (N.length = 0, Object.assign(N, arguments), I.includes("j")) {
          var G = s["dynCall_" + I];
          G = N && N.length ? G.apply(null, [w].concat(N)) : G.call(null, w);
        } else G = ct(w).apply(null, N);
        return G;
      }) : ct(w);
      return typeof F != "function" && A("unknown function pointer with signature " + S + ": " + w), F;
    }
    __name(me, "me");
    var Nt = void 0;
    function Qe(S, w) {
      var I = [], N = {};
      throw w.forEach(/* @__PURE__ */ __name(function F(G) {
        N[G] || ye[G] || (Vt[G] ? Vt[G].forEach(F) : (I.push(G), N[G] = true));
      }, "F")), new Nt(S + ": " + I.map(Be).join([", "]));
    }
    __name(Qe, "Qe");
    function yt(S, w, I, N, F) {
      var G = w.length;
      2 > G && A("argTypes array size mismatch! Must at least get return value and 'this' types!");
      var Z = w[1] !== null && I !== null, z = false;
      for (I = 1; I < w.length; ++I) if (w[I] !== null && w[I].U === void 0) {
        z = true;
        break;
      }
      var J = w[0].name !== "void", q = G - 2, te = Array(q), be = [], xe = [];
      return function() {
        if (arguments.length !== q && A("function " + S + " called with " + arguments.length + " arguments, expected " + q + " args!"), xe.length = 0, be.length = Z ? 2 : 1, be[0] = F, Z) {
          var Re = w[1].toWireType(xe, this);
          be[1] = Re;
        }
        for (var Ce = 0; Ce < q; ++Ce) te[Ce] = w[Ce + 2].toWireType(xe, arguments[Ce]), be.push(te[Ce]);
        if (Ce = N.apply(null, be), z) bt(xe);
        else for (var He = Z ? 1 : 2; He < w.length; He++) {
          var Tr = He === 1 ? Re : te[He - 2];
          w[He].U !== null && w[He].U(Tr);
        }
        return J ? w[0].fromWireType(Ce) : void 0;
      };
    }
    __name(yt, "yt");
    function rr(S, w) {
      for (var I = [], N = 0; N < S; N++) I.push(L[w + 4 * N >> 2]);
      return I;
    }
    __name(rr, "rr");
    function xt(S) {
      4 < S && --ne[S].fa == 0 && (ne[S] = void 0, ie.push(S));
    }
    __name(xt, "xt");
    function Fe(S) {
      if (S === null) return "null";
      var w = typeof S;
      return w === "object" || w === "array" || w === "function" ? S.toString() : "" + S;
    }
    __name(Fe, "Fe");
    function Ve(S, w) {
      for (var I = "", N = 0; !(N >= w / 2); ++N) {
        var F = y[S + 2 * N >> 1];
        if (F == 0) break;
        I += String.fromCharCode(F);
      }
      return I;
    }
    __name(Ve, "Ve");
    function ht(S, w, I) {
      if (I === void 0 && (I = 2147483647), 2 > I) return 0;
      I -= 2;
      var N = w;
      I = I < 2 * S.length ? I / 2 : S.length;
      for (var F = 0; F < I; ++F) y[w >> 1] = S.charCodeAt(F), w += 2;
      return y[w >> 1] = 0, w - N;
    }
    __name(ht, "ht");
    function pr(S) {
      return 2 * S.length;
    }
    __name(pr, "pr");
    function Tt(S, w) {
      for (var I = 0, N = ""; !(I >= w / 4); ) {
        var F = _[S + 4 * I >> 2];
        if (F == 0) break;
        ++I, 65536 <= F ? (F -= 65536, N += String.fromCharCode(55296 | F >> 10, 56320 | 1023 & F)) : N += String.fromCharCode(F);
      }
      return N;
    }
    __name(Tt, "Tt");
    function pt(S, w, I) {
      if (I === void 0 && (I = 2147483647), 4 > I) return 0;
      var N = w;
      I = N + I - 4;
      for (var F = 0; F < S.length; ++F) {
        var G = S.charCodeAt(F);
        if (55296 <= G && 57343 >= G && (G = 65536 + ((1023 & G) << 10) | 1023 & S.charCodeAt(++F)), _[w >> 2] = G, (w += 4) + 4 > I) break;
      }
      return _[w >> 2] = 0, w - N;
    }
    __name(pt, "pt");
    function dt(S) {
      for (var w = 0, I = 0; I < S.length; ++I) {
        var N = S.charCodeAt(I);
        55296 <= N && 57343 >= N && ++I, w += 4;
      }
      return w;
    }
    __name(dt, "dt");
    var Mt = {};
    function Wt(S) {
      var w = Mt[S];
      return w === void 0 ? fe(S) : w;
    }
    __name(Wt, "Wt");
    var dr = [], Rr = [], dn = [null, [], []];
    Y = s.BindingError = V("BindingError"), s.count_emval_handles = function() {
      for (var S = 0, w = 5; w < ne.length; ++w) ne[w] !== void 0 && ++S;
      return S;
    }, s.get_first_emval = function() {
      for (var S = 5; S < ne.length; ++S) if (ne[S] !== void 0) return ne[S];
      return null;
    }, $ = s.PureVirtualError = V("PureVirtualError");
    for (var Za = Array(256), vn = 0; 256 > vn; ++vn) Za[vn] = String.fromCharCode(vn);
    he = Za, s.getInheritedInstanceCount = function() {
      return Object.keys(Ie).length;
    }, s.getLiveInheritedInstances = function() {
      var S, w = [];
      for (S in Ie) Ie.hasOwnProperty(S) && w.push(Ie[S]);
      return w;
    }, s.flushPendingDeletes = ce, s.setDelayFunction = function(S) {
      we = S, ge.length && we && we(ce);
    }, rt = s.InternalError = V("InternalError"), ve.prototype.isAliasOf = function(S) {
      if (!(this instanceof ve && S instanceof ve)) return false;
      var w = this.L.O.M, I = this.L.N, N = S.L.O.M;
      for (S = S.L.N; w.P; ) I = w.aa(I), w = w.P;
      for (; N.P; ) S = N.aa(S), N = N.P;
      return w === N && I === S;
    }, ve.prototype.clone = function() {
      if (this.L.N || kr(this), this.L.$) return this.L.count.value += 1, this;
      var S = ze, w = Object, I = w.create, N = Object.getPrototypeOf(this), F = this.L;
      return S = S(I.call(w, N, { L: { value: { count: F.count, Z: F.Z, $: F.$, N: F.N, O: F.O, S: F.S, T: F.T } } })), S.L.count.value += 1, S.L.Z = false, S;
    }, ve.prototype.delete = function() {
      this.L.N || kr(this), this.L.Z && !this.L.$ && A("Object already scheduled for deletion"), Ge(this), Xe(this.L), this.L.$ || (this.L.S = void 0, this.L.N = void 0);
    }, ve.prototype.isDeleted = function() {
      return !this.L.N;
    }, ve.prototype.deleteLater = function() {
      return this.L.N || kr(this), this.L.Z && !this.L.$ && A("Object already scheduled for deletion"), ge.push(this), ge.length === 1 && we && we(ce), this.L.Z = true, this;
    }, Le.prototype.pa = function(S) {
      return this.ja && (S = this.ja(S)), S;
    }, Le.prototype.ga = function(S) {
      this.V && this.V(S);
    }, Le.prototype.argPackAdvance = 8, Le.prototype.readValueFromPointer = ut, Le.prototype.deleteObject = function(S) {
      S !== null && S.delete();
    }, Le.prototype.fromWireType = function(S) {
      function w() {
        return this.ca ? it(this.M.W, { O: this.va, N, T: this, S }) : it(this.M.W, { O: this, N: S });
      }
      __name(w, "w");
      var I, N = this.pa(S);
      if (!N) return this.ga(S), null;
      var F = Ie[pe(this.M, N)];
      if (F !== void 0) return F.L.count.value === 0 ? (F.L.N = N, F.L.S = S, F.clone()) : (F = F.clone(), this.ga(S), F);
      if (!(F = tt[F = this.M.oa(N)])) return w.call(this);
      F = this.ba ? F.ka : F.pointerType;
      var G = (/* @__PURE__ */ __name(function Z(z, J, q) {
        return J === q ? z : q.P === void 0 || (z = Z(z, J, q.P)) === null ? null : q.ma(z);
      }, "Z"))(N, this.M, F.M);
      return G === null ? w.call(this) : this.ca ? it(F.M.W, { O: F, N: G, T: this, S }) : it(F.M.W, { O: F, N: G });
    }, Nt = s.UnboundTypeError = V("UnboundTypeError");
    var nf = { q: /* @__PURE__ */ __name(function(S, w, I) {
      S = fe(S), w = et(w, "wrapper"), I = B(I);
      var N = [].slice, F = w.M, G = F.W, Z = F.P.W, z = F.P.constructor;
      for (var J in S = K(S, function() {
        F.P.ia.forEach(function(q) {
          if (this[q] === Z[q]) throw new $("Pure virtual function " + q + " must be implemented in JavaScript");
        }.bind(this)), Object.defineProperty(this, "__parent", { value: G }), this.__construct.apply(this, N.call(arguments));
      }), G.__construct = function() {
        this === G && A("Pass correct 'this' to __construct");
        var q = z.implement.apply(void 0, [this].concat(N.call(arguments)));
        Ge(q);
        var te = q.L;
        q.notifyOnDestruction(), te.$ = true, Object.defineProperties(this, { L: { value: te } }), ze(this), q = pe(F, q = te.N), Ie.hasOwnProperty(q) ? A("Tried to register registered instance: " + q) : Ie[q] = this;
      }, G.__destruct = function() {
        this === G && A("Pass correct 'this' to __destruct"), Ge(this);
        var q = this.L.N;
        q = pe(F, q), Ie.hasOwnProperty(q) ? delete Ie[q] : A("Tried to unregister unregistered instance: " + q);
      }, S.prototype = Object.create(G), I) S.prototype[J] = I[J];
      return ae(S);
    }, "q"), l: /* @__PURE__ */ __name(function(S) {
      var w = kt[S];
      delete kt[S];
      var I = w.ea, N = w.V, F = w.ha;
      lt([S], F.map((G) => G.sa).concat(F.map((G) => G.ya)), (G) => {
        var Z = {};
        return F.forEach((z, J) => {
          var q = G[J], te = z.qa, be = z.ra, xe = G[J + F.length], Re = z.xa, Ce = z.za;
          Z[z.na] = { read: /* @__PURE__ */ __name((He) => q.fromWireType(te(be, He)), "read"), write: /* @__PURE__ */ __name((He, Tr) => {
            var vr = [];
            Re(Ce, He, xe.toWireType(vr, Tr)), bt(vr);
          }, "write") };
        }), [{ name: w.name, fromWireType: /* @__PURE__ */ __name(function(z) {
          var J, q = {};
          for (J in Z) q[J] = Z[J].read(z);
          return N(z), q;
        }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(z, J) {
          for (var q in Z) if (!(q in J)) throw TypeError('Missing field:  "' + q + '"');
          var te = I();
          for (q in Z) Z[q].write(te, J[q]);
          return z !== null && z.push(N, te), te;
        }, "toWireType"), argPackAdvance: 8, readValueFromPointer: ut, U: N }];
      });
    }, "l"), v: /* @__PURE__ */ __name(function() {
    }, "v"), B: /* @__PURE__ */ __name(function(S, w, I, N, F) {
      var G = Ut(I);
      Ye(S, { name: w = fe(w), fromWireType: /* @__PURE__ */ __name(function(Z) {
        return !!Z;
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(Z, z) {
        return z ? N : F;
      }, "toWireType"), argPackAdvance: 8, readValueFromPointer: /* @__PURE__ */ __name(function(Z) {
        if (I === 1) var z = v;
        else if (I === 2) z = y;
        else if (I === 4) z = _;
        else throw TypeError("Unknown boolean type size: " + w);
        return this.fromWireType(z[Z >> G]);
      }, "readValueFromPointer"), U: null });
    }, "B"), h: /* @__PURE__ */ __name(function(S, w, I, N, F, G, Z, z, J, q, te, be, xe) {
      te = fe(te), G = me(F, G), z && (z = me(Z, z)), q && (q = me(J, q)), xe = me(be, xe);
      var Re, Ce = X(te);
      Re = /* @__PURE__ */ __name(function() {
        Qe("Cannot construct " + te + " due to unbound types", [N]);
      }, "Re"), s.hasOwnProperty(Ce) ? (A("Cannot register public name '" + Ce + "' twice"), Se(s, Ce, Ce), s.hasOwnProperty(void 0) && A("Cannot register multiple overloads of a function with the same number of arguments (undefined)!"), s[Ce].R[void 0] = Re) : s[Ce] = Re, lt([S, w, I], N ? [N] : [], function(He) {
        if (He = He[0], N) var Tr, vr = He.M, Fr = vr.W;
        else Fr = ve.prototype;
        He = K(Ce, function() {
          if (Object.getPrototypeOf(this) !== pi) throw new Y("Use 'new' to construct " + te);
          if (_r.X === void 0) throw new Y(te + " has no accessible constructor");
          var eo = _r.X[arguments.length];
          if (eo === void 0) throw new Y("Tried to invoke ctor of " + te + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(_r.X).toString() + ") parameters instead!");
          return eo.apply(this, arguments);
        });
        var pi = Object.create(Fr, { constructor: { value: He } });
        He.prototype = pi;
        var _r = new Ue(te, He, pi, xe, vr, G, z, q);
        vr = new Le(te, _r, true, false), Fr = new Le(te + "*", _r, false, false);
        var Ka = new Le(te + " const*", _r, false, true);
        return tt[S] = { pointerType: Fr, ka: Ka }, Tr = He, s.hasOwnProperty(Ce) || nt("Replacing nonexistant public symbol"), s[Ce] = Tr, s[Ce].Y = void 0, [vr, Fr, Ka];
      });
    }, "h"), d: /* @__PURE__ */ __name(function(S, w, I, N, F, G, Z) {
      var z = rr(I, N);
      w = fe(w), G = me(F, G), lt([], [S], function(J) {
        function q() {
          Qe("Cannot call " + te + " due to unbound types", z);
        }
        __name(q, "q");
        var te = (J = J[0]).name + "." + w;
        w.startsWith("@@") && (w = Symbol[w.substring(2)]);
        var be = J.M.constructor;
        return be[w] === void 0 ? (q.Y = I - 1, be[w] = q) : (Se(be, w, te), be[w].R[I - 1] = q), lt([], z, function(xe) {
          return xe = yt(te, [xe[0], null].concat(xe.slice(1)), null, G, Z), be[w].R === void 0 ? (xe.Y = I - 1, be[w] = xe) : be[w].R[I - 1] = xe, [];
        }), [];
      });
    }, "d"), p: /* @__PURE__ */ __name(function(S, w, I, N, F, G) {
      0 < w || ee();
      var Z = rr(w, I);
      F = me(N, F), lt([], [S], function(z) {
        var J = "constructor " + (z = z[0]).name;
        if (z.M.X === void 0 && (z.M.X = []), z.M.X[w - 1] !== void 0) throw new Y("Cannot register multiple constructors with identical number of parameters (" + (w - 1) + ") for class '" + z.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        return z.M.X[w - 1] = () => {
          Qe("Cannot construct " + z.name + " due to unbound types", Z);
        }, lt([], Z, function(q) {
          return q.splice(1, 0, null), z.M.X[w - 1] = yt(J, q, null, F, G), [];
        }), [];
      });
    }, "p"), a: /* @__PURE__ */ __name(function(S, w, I, N, F, G, Z, z) {
      var J = rr(I, N);
      w = fe(w), G = me(F, G), lt([], [S], function(q) {
        function te() {
          Qe("Cannot call " + be + " due to unbound types", J);
        }
        __name(te, "te");
        var be = (q = q[0]).name + "." + w;
        w.startsWith("@@") && (w = Symbol[w.substring(2)]), z && q.M.ia.push(w);
        var xe = q.M.W, Re = xe[w];
        return Re === void 0 || Re.R === void 0 && Re.className !== q.name && Re.Y === I - 2 ? (te.Y = I - 2, te.className = q.name, xe[w] = te) : (Se(xe, w, be), xe[w].R[I - 2] = te), lt([], J, function(Ce) {
          return Ce = yt(be, Ce, q, G, Z), xe[w].R === void 0 ? (Ce.Y = I - 2, xe[w] = Ce) : xe[w].R[I - 2] = Ce, [];
        }), [];
      });
    }, "a"), A: /* @__PURE__ */ __name(function(S, w) {
      Ye(S, { name: w = fe(w), fromWireType: /* @__PURE__ */ __name(function(I) {
        var N = B(I);
        return xt(I), N;
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(I, N) {
        return ae(N);
      }, "toWireType"), argPackAdvance: 8, readValueFromPointer: ut, U: null });
    }, "A"), n: /* @__PURE__ */ __name(function(S, w, I) {
      I = Ut(I), Ye(S, { name: w = fe(w), fromWireType: /* @__PURE__ */ __name(function(N) {
        return N;
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(N, F) {
        return F;
      }, "toWireType"), argPackAdvance: 8, readValueFromPointer: (function(N, F) {
        switch (F) {
          case 2:
            return function(G) {
              return this.fromWireType(T[G >> 2]);
            };
          case 3:
            return function(G) {
              return this.fromWireType(E[G >> 3]);
            };
          default:
            throw TypeError("Unknown float type: " + N);
        }
      })(w, I), U: null });
    }, "n"), e: /* @__PURE__ */ __name(function(S, w, I, N, F) {
      w = fe(w), F === -1 && (F = 4294967295), F = Ut(I);
      var G = /* @__PURE__ */ __name((z) => z, "G");
      if (N === 0) {
        var Z = 32 - 8 * I;
        G = /* @__PURE__ */ __name((z) => z << Z >>> Z, "G");
      }
      I = w.includes("unsigned") ? function(z, J) {
        return J >>> 0;
      } : function(z, J) {
        return J;
      }, Ye(S, { name: w, fromWireType: G, toWireType: I, argPackAdvance: 8, readValueFromPointer: (function(z, J, q) {
        switch (J) {
          case 0:
            return q ? function(te) {
              return v[te];
            } : function(te) {
              return g[te];
            };
          case 1:
            return q ? function(te) {
              return y[te >> 1];
            } : function(te) {
              return x[te >> 1];
            };
          case 2:
            return q ? function(te) {
              return _[te >> 2];
            } : function(te) {
              return L[te >> 2];
            };
          default:
            throw TypeError("Unknown integer type: " + z);
        }
      })(w, F, N !== 0), U: null });
    }, "e"), b: /* @__PURE__ */ __name(function(S, w, I) {
      function N(G) {
        G >>= 2;
        var Z = L;
        return new F(Z.buffer, Z[G + 1], Z[G]);
      }
      __name(N, "N");
      var F = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][w];
      Ye(S, { name: I = fe(I), fromWireType: N, argPackAdvance: 8, readValueFromPointer: N }, { ta: true });
    }, "b"), o: /* @__PURE__ */ __name(function(S, w) {
      var I = (w = fe(w)) === "std::string";
      Ye(S, { name: w, fromWireType: /* @__PURE__ */ __name(function(N) {
        var F = L[N >> 2], G = N + 4;
        if (I) for (var Z = G, z = 0; z <= F; ++z) {
          var J = G + z;
          if (z == F || g[J] == 0) {
            if (Z = Z ? p(g, Z, J - Z) : "", q === void 0) var q = Z;
            else q += "\0" + Z;
            Z = J + 1;
          }
        }
        else {
          for (z = 0, q = Array(F); z < F; ++z) q[z] = String.fromCharCode(g[G + z]);
          q = q.join("");
        }
        return Ht(N), q;
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(N, F) {
        F instanceof ArrayBuffer && (F = new Uint8Array(F));
        var G, Z = typeof F == "string";
        if (Z || F instanceof Uint8Array || F instanceof Uint8ClampedArray || F instanceof Int8Array || A("Cannot pass non-string to std::string"), I && Z) {
          var z = 0;
          for (G = 0; G < F.length; ++G) {
            var J = F.charCodeAt(G);
            127 >= J ? z++ : 2047 >= J ? z += 2 : 55296 <= J && 57343 >= J ? (z += 4, ++G) : z += 3;
          }
          G = z;
        } else G = F.length;
        if (J = (z = hi(4 + G + 1)) + 4, L[z >> 2] = G, I && Z) {
          if (Z = J, J = G + 1, G = g, 0 < J) {
            J = Z + J - 1;
            for (var q = 0; q < F.length; ++q) {
              var te = F.charCodeAt(q);
              if (55296 <= te && 57343 >= te && (te = 65536 + ((1023 & te) << 10) | 1023 & F.charCodeAt(++q)), 127 >= te) {
                if (Z >= J) break;
                G[Z++] = te;
              } else {
                if (2047 >= te) {
                  if (Z + 1 >= J) break;
                  G[Z++] = 192 | te >> 6;
                } else {
                  if (65535 >= te) {
                    if (Z + 2 >= J) break;
                    G[Z++] = 224 | te >> 12;
                  } else {
                    if (Z + 3 >= J) break;
                    G[Z++] = 240 | te >> 18, G[Z++] = 128 | te >> 12 & 63;
                  }
                  G[Z++] = 128 | te >> 6 & 63;
                }
                G[Z++] = 128 | 63 & te;
              }
            }
            G[Z] = 0;
          }
        } else if (Z) for (Z = 0; Z < G; ++Z) 255 < (q = F.charCodeAt(Z)) && (Ht(J), A("String has UTF-16 code units that do not fit in 8 bits")), g[J + Z] = q;
        else for (Z = 0; Z < G; ++Z) g[J + Z] = F[Z];
        return N !== null && N.push(Ht, z), z;
      }, "toWireType"), argPackAdvance: 8, readValueFromPointer: ut, U: /* @__PURE__ */ __name(function(N) {
        Ht(N);
      }, "U") });
    }, "o"), k: /* @__PURE__ */ __name(function(S, w, I) {
      if (I = fe(I), w === 2) var N = Ve, F = ht, G = pr, Z = /* @__PURE__ */ __name(() => x, "Z"), z = 1;
      else w === 4 && (N = Tt, F = pt, G = dt, Z = /* @__PURE__ */ __name(() => L, "Z"), z = 2);
      Ye(S, { name: I, fromWireType: /* @__PURE__ */ __name(function(J) {
        for (var q, te = L[J >> 2], be = Z(), xe = J + 4, Re = 0; Re <= te; ++Re) {
          var Ce = J + 4 + Re * w;
          (Re == te || be[Ce >> z] == 0) && (xe = N(xe, Ce - xe), q === void 0 ? q = xe : q += "\0" + xe, xe = Ce + w);
        }
        return Ht(J), q;
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function(J, q) {
        typeof q != "string" && A("Cannot pass non-string to C++ string type " + I);
        var te = G(q), be = hi(4 + te + w);
        return L[be >> 2] = te >> z, F(q, be + 4, te + w), J !== null && J.push(Ht, be), be;
      }, "toWireType"), argPackAdvance: 8, readValueFromPointer: ut, U: /* @__PURE__ */ __name(function(J) {
        Ht(J);
      }, "U") });
    }, "k"), m: /* @__PURE__ */ __name(function(S, w, I, N, F, G) {
      kt[S] = { name: fe(w), ea: me(I, N), V: me(F, G), ha: [] };
    }, "m"), c: /* @__PURE__ */ __name(function(S, w, I, N, F, G, Z, z, J, q) {
      kt[S].ha.push({ na: fe(w), sa: I, qa: me(N, F), ra: G, ya: Z, xa: me(z, J), za: q });
    }, "c"), C: /* @__PURE__ */ __name(function(S, w) {
      Ye(S, { ua: true, name: w = fe(w), argPackAdvance: 0, fromWireType: /* @__PURE__ */ __name(function() {
      }, "fromWireType"), toWireType: /* @__PURE__ */ __name(function() {
      }, "toWireType") });
    }, "C"), t: /* @__PURE__ */ __name(function(S, w, I, N, F) {
      S = dr[S], w = B(w), I = Wt(I);
      var G = [];
      return L[N >> 2] = ae(G), S(w, I, G, F);
    }, "t"), j: /* @__PURE__ */ __name(function(S, w, I, N) {
      S = dr[S], S(w = B(w), I = Wt(I), null, N);
    }, "j"), f: xt, g: /* @__PURE__ */ __name(function(S, w) {
      var I, N, F = (function(J, q) {
        for (var te = Array(J), be = 0; be < J; ++be) te[be] = et(L[q + 4 * be >> 2], "parameter " + be);
        return te;
      })(S, w), G = F[0], Z = Rr[w = G.name + "_$" + F.slice(1).map(function(J) {
        return J.name;
      }).join("_") + "$"];
      if (Z !== void 0) return Z;
      var z = Array(S - 1);
      return I = /* @__PURE__ */ __name((J, q, te, be) => {
        for (var xe = 0, Re = 0; Re < S - 1; ++Re) z[Re] = F[Re + 1].readValueFromPointer(be + xe), xe += F[Re + 1].argPackAdvance;
        for (Re = 0, J = J[q].apply(J, z); Re < S - 1; ++Re) F[Re + 1].la && F[Re + 1].la(z[Re]);
        if (!G.ua) return G.toWireType(te, J);
      }, "I"), N = dr.length, dr.push(I), Z = N, Rr[w] = Z;
    }, "g"), r: /* @__PURE__ */ __name(function(S) {
      4 < S && (ne[S].fa += 1);
    }, "r"), s: /* @__PURE__ */ __name(function(S) {
      bt(B(S)), xt(S);
    }, "s"), i: /* @__PURE__ */ __name(function() {
      ee("");
    }, "i"), x: /* @__PURE__ */ __name(function(S, w, I) {
      g.copyWithin(S, w, w + I);
    }, "x"), w: /* @__PURE__ */ __name(function(S) {
      var w = g.length;
      if (2147483648 < (S >>>= 0)) return false;
      for (var I = 1; 4 >= I; I *= 2) {
        var N = w * (1 + 0.2 / I);
        N = Math.min(N, S + 100663296);
        var F = Math, G = F.min;
        N = Math.max(S, N), N += (65536 - N % 65536) % 65536;
        e: {
          var Z = c.buffer;
          try {
            c.grow(G.call(F, 2147483648, N) - Z.byteLength + 65535 >>> 16), m();
            var z = 1;
            break e;
          } catch {
          }
          z = void 0;
        }
        if (z) return true;
      }
      return false;
    }, "w"), z: /* @__PURE__ */ __name(function() {
      return 52;
    }, "z"), u: /* @__PURE__ */ __name(function() {
      return 70;
    }, "u"), y: /* @__PURE__ */ __name(function(S, w, I, N) {
      for (var F = 0, G = 0; G < I; G++) {
        var Z = L[w >> 2], z = L[w + 4 >> 2];
        w += 8;
        for (var J = 0; J < z; J++) {
          var q = g[Z + J], te = dn[S];
          q === 0 || q === 10 ? ((S === 1 ? o : l)(p(te, 0)), te.length = 0) : te.push(q);
        }
        F += z;
      }
      return L[N >> 2] = F, 0;
    }, "y") };
    (function() {
      function S(F) {
        s.asm = F.exports, c = s.asm.D, m(), R = s.asm.I, D.unshift(s.asm.E), --H == 0 && Q && (F = Q, Q = null, F());
      }
      __name(S, "S");
      function w(F) {
        S(F.instance);
      }
      __name(w, "w");
      function I(F) {
        return (typeof fetch == "function" ? fetch(r, { credentials: "same-origin" }).then(function(G) {
          if (!G.ok) throw "failed to load wasm binary file at '" + r + "'";
          return G.arrayBuffer();
        }).catch(function() {
          return U();
        }) : Promise.resolve().then(function() {
          return U();
        })).then(function(G) {
          return WebAssembly.instantiate(G, N);
        }).then(function(G) {
          return G;
        }).then(F, function(G) {
          l("failed to asynchronously prepare wasm: " + G), ee(G);
        });
      }
      __name(I, "I");
      var N = { a: nf };
      if (H++, s.instantiateWasm) try {
        return s.instantiateWasm(N, S);
      } catch (F) {
        l("Module.instantiateWasm callback failed with error: " + F), f(F);
      }
      (typeof WebAssembly.instantiateStreaming != "function" || P() || typeof fetch != "function" ? I(w) : fetch(r, { credentials: "same-origin" }).then(function(F) {
        return WebAssembly.instantiateStreaming(F, N).then(w, function(G) {
          return l("wasm streaming compile failed: " + G), l("falling back to ArrayBuffer instantiation"), I(w);
        });
      })).catch(f);
    })();
    var Ja = s.___getTypeName = function() {
      return (Ja = s.___getTypeName = s.asm.F).apply(null, arguments);
    };
    function hi() {
      return (hi = s.asm.H).apply(null, arguments);
    }
    __name(hi, "hi");
    function Ht() {
      return (Ht = s.asm.J).apply(null, arguments);
    }
    __name(Ht, "Ht");
    function Qa() {
      0 < H || (O(C), 0 < H || n || (n = true, s.calledRun = true, h || (O(D), u(s), O(M))));
    }
    __name(Qa, "Qa");
    return s.__embind_initialize_bindings = function() {
      return (s.__embind_initialize_bindings = s.asm.G).apply(null, arguments);
    }, s.dynCall_jiji = function() {
      return (s.dynCall_jiji = s.asm.K).apply(null, arguments);
    }, Q = /* @__PURE__ */ __name(function S() {
      n || Qa(), n || (Q = S);
    }, "S"), Qa(), t.ready;
  };
})();
async function ju(e) {
  let t = await yy({ instantiateWasm(r, n) {
    WebAssembly.instantiate(e, r).then((i) => {
      i instanceof WebAssembly.Instance ? n(i) : n(i.instance);
    });
  } });
  return $u(t);
}
__name(ju, "ju");
var de;
var er = new Array(128).fill(void 0);
er.push(void 0, null, true, false);
var cn = er.length;
function Kt(e) {
  cn === er.length && er.push(er.length + 1);
  let t = cn;
  return cn = er[t], er[t] = e, t;
}
__name(Kt, "Kt");
function Dt(e) {
  return er[e];
}
__name(Dt, "Dt");
function xy(e) {
  e < 132 || (er[e] = cn, cn = e);
}
__name(xy, "xy");
function tr(e) {
  let t = Dt(e);
  return xy(e), t;
}
__name(tr, "tr");
var hn = 0;
var un = null;
function si() {
  return (un === null || un.byteLength === 0) && (un = new Uint8Array(de.memory.buffer)), un;
}
__name(si, "si");
var li = new TextEncoder("utf-8");
var wy = typeof li.encodeInto == "function" ? function(e, t) {
  return li.encodeInto(e, t);
} : function(e, t) {
  let r = li.encode(e);
  return t.set(r), { read: e.length, written: r.length };
};
function Va(e, t, r) {
  if (r === void 0) {
    let l = li.encode(e), s = t(l.length);
    return si().subarray(s, s + l.length).set(l), hn = l.length, s;
  }
  let n = e.length, i = t(n), a = si(), o = 0;
  for (; o < n; o++) {
    let l = e.charCodeAt(o);
    if (l > 127) break;
    a[i + o] = l;
  }
  if (o !== n) {
    o !== 0 && (e = e.slice(o)), i = r(i, n, n = o + e.length * 3);
    let l = si().subarray(i + o, i + n), s = wy(e, l);
    o += s.written;
  }
  return hn = o, i;
}
__name(Va, "Va");
function zu(e) {
  return e == null;
}
__name(zu, "zu");
var fn = null;
function Je() {
  return (fn === null || fn.byteLength === 0) && (fn = new Int32Array(de.memory.buffer)), fn;
}
__name(Je, "Je");
var Vu = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
Vu.decode();
function ui(e, t) {
  return Vu.decode(si().subarray(e, e + t));
}
__name(ui, "ui");
function Sy(e, t) {
  if (!(e instanceof t)) throw new Error(`expected instance of ${t.name}`);
  return e.ptr;
}
__name(Sy, "Sy");
var fi = class {
  static {
    __name(this, "fi");
  }
  static __wrap(e) {
    let t = Object.create(fi.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_bbox_free(e);
  }
  get x() {
    return de.__wbg_get_bbox_x(this.ptr);
  }
  set x(e) {
    de.__wbg_set_bbox_x(this.ptr, e);
  }
  get y() {
    return de.__wbg_get_bbox_y(this.ptr);
  }
  set y(e) {
    de.__wbg_set_bbox_y(this.ptr, e);
  }
  get width() {
    return de.__wbg_get_bbox_width(this.ptr);
  }
  set width(e) {
    de.__wbg_set_bbox_width(this.ptr, e);
  }
  get height() {
    return de.__wbg_get_bbox_height(this.ptr);
  }
  set height(e) {
    de.__wbg_set_bbox_height(this.ptr, e);
  }
};
var Hu = class {
  static {
    __name(this, "Hu");
  }
  static __wrap(e) {
    let t = Object.create(Hu.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_renderedimage_free(e);
  }
  get width() {
    return de.renderedimage_width(this.ptr) >>> 0;
  }
  get height() {
    return de.renderedimage_height(this.ptr) >>> 0;
  }
  asPng() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.renderedimage_asPng(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r) throw tr(t);
      return tr(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get pixels() {
    let e = de.renderedimage_pixels(this.ptr);
    return tr(e);
  }
};
var Ha = class {
  static {
    __name(this, "Ha");
  }
  static __wrap(e) {
    let t = Object.create(Ha.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_resvg_free(e);
  }
  constructor(e, t) {
    try {
      let l = de.__wbindgen_add_to_stack_pointer(-16);
      var r = zu(t) ? 0 : Va(t, de.__wbindgen_malloc, de.__wbindgen_realloc), n = hn;
      de.resvg_new(l, Kt(e), r, n);
      var i = Je()[l / 4 + 0], a = Je()[l / 4 + 1], o = Je()[l / 4 + 2];
      if (o) throw tr(a);
      return Ha.__wrap(i);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get width() {
    return de.resvg_width(this.ptr);
  }
  get height() {
    return de.resvg_height(this.ptr);
  }
  render() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_render(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r) throw tr(t);
      return Hu.__wrap(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  toString() {
    try {
      let r = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_toString(r, this.ptr);
      var e = Je()[r / 4 + 0], t = Je()[r / 4 + 1];
      return ui(e, t);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16), de.__wbindgen_free(e, t);
    }
  }
  innerBBox() {
    let e = de.resvg_innerBBox(this.ptr);
    return e === 0 ? void 0 : fi.__wrap(e);
  }
  getBBox() {
    let e = de.resvg_getBBox(this.ptr);
    return e === 0 ? void 0 : fi.__wrap(e);
  }
  cropByBBox(e) {
    Sy(e, fi), de.resvg_cropByBBox(this.ptr, e.ptr);
  }
  imagesToResolve() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_imagesToResolve(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r) throw tr(t);
      return tr(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  resolveImage(e, t) {
    try {
      let i = de.__wbindgen_add_to_stack_pointer(-16), a = Va(e, de.__wbindgen_malloc, de.__wbindgen_realloc), o = hn;
      de.resvg_resolveImage(i, this.ptr, a, o, Kt(t));
      var r = Je()[i / 4 + 0], n = Je()[i / 4 + 1];
      if (n) throw tr(r);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
};
async function Ey(e, t) {
  if (typeof Response == "function" && e instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function") try {
      return await WebAssembly.instantiateStreaming(e, t);
    } catch (n) {
      if (e.headers.get("Content-Type") != "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", n);
      else throw n;
    }
    let r = await e.arrayBuffer();
    return await WebAssembly.instantiate(r, t);
  } else {
    let r = await WebAssembly.instantiate(e, t);
    return r instanceof WebAssembly.Instance ? { instance: r, module: e } : r;
  }
}
__name(Ey, "Ey");
function ky() {
  let e = {};
  return e.wbg = {}, e.wbg.__wbg_new_15d3966e9981a196 = function(t, r) {
    let n = new Error(ui(t, r));
    return Kt(n);
  }, e.wbg.__wbindgen_memory = function() {
    let t = de.memory;
    return Kt(t);
  }, e.wbg.__wbg_buffer_cf65c07de34b9a08 = function(t) {
    let r = Dt(t).buffer;
    return Kt(r);
  }, e.wbg.__wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5 = function(t, r, n) {
    let i = new Uint8Array(Dt(t), r >>> 0, n >>> 0);
    return Kt(i);
  }, e.wbg.__wbindgen_object_drop_ref = function(t) {
    tr(t);
  }, e.wbg.__wbg_new_537b7341ce90bb31 = function(t) {
    let r = new Uint8Array(Dt(t));
    return Kt(r);
  }, e.wbg.__wbg_instanceof_Uint8Array_01cebe79ca606cca = function(t) {
    let r;
    try {
      r = Dt(t) instanceof Uint8Array;
    } catch {
      r = false;
    }
    return r;
  }, e.wbg.__wbindgen_string_get = function(t, r) {
    let n = Dt(r), i = typeof n == "string" ? n : void 0;
    var a = zu(i) ? 0 : Va(i, de.__wbindgen_malloc, de.__wbindgen_realloc), o = hn;
    Je()[t / 4 + 1] = o, Je()[t / 4 + 0] = a;
  }, e.wbg.__wbg_new_b525de17f44a8943 = function() {
    let t = new Array();
    return Kt(t);
  }, e.wbg.__wbindgen_string_new = function(t, r) {
    let n = ui(t, r);
    return Kt(n);
  }, e.wbg.__wbg_push_49c286f04dd3bf59 = function(t, r) {
    return Dt(t).push(Dt(r));
  }, e.wbg.__wbg_length_27a2afe8ab42b09f = function(t) {
    return Dt(t).length;
  }, e.wbg.__wbg_set_17499e8aa4003ebd = function(t, r, n) {
    Dt(t).set(Dt(r), n >>> 0);
  }, e.wbg.__wbindgen_throw = function(t, r) {
    throw new Error(ui(t, r));
  }, e;
}
__name(ky, "ky");
function Ty(e, t) {
  return de = e.exports, qu.__wbindgen_wasm_module = t, fn = null, un = null, de;
}
__name(Ty, "Ty");
async function qu(e) {
  typeof e > "u" && (e = new URL("index_bg.wasm", void 0));
  let t = ky();
  (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
  let { instance: r, module: n } = await Ey(await e, t);
  return Ty(r, n);
}
__name(qu, "qu");
var _y = qu;
var qa = false;
var Xu = /* @__PURE__ */ __name(async (e) => {
  if (qa) throw new Error("Already initialized. The `initWasm()` function can be used only once.");
  await _y(await e), qa = true;
}, "Xu");
var Yu = class extends Ha {
  static {
    __name(this, "Yu");
  }
  constructor(e, t) {
    if (!qa) throw new Error("Wasm has not been initialized. Call `initWasm()` function.");
    super(e, JSON.stringify(t));
  }
};
var Zu = Py;
var Ly = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/;
var Cy = /^[a-z\u00E0-\u00FCA-Z\u00C0-\u00DC][\d|a-z\u00E0-\u00FCA-Z\u00C0-\u00DC]*$/;
var Oy = /([A-Z\u00C0-\u00DC]{4,})/g;
var Ay = /^[A-Z\u00C0-\u00DC]+$/;
function Py(e) {
  for (var t = e.split(Ly), r = t.length, n = new Array(r), i = 0; i < r; i++) {
    var a = t[i];
    if (a !== "") {
      var o = Cy.test(a) && !Ay.test(a);
      o && (a = a.replace(Oy, function(s, u, f) {
        return Iy(s, a.length - f - s.length == 0);
      }));
      var l = a[0];
      l = i > 0 ? l.toUpperCase() : l.toLowerCase(), n[i] = l + (o ? a.slice(1) : a.slice(1).toLowerCase());
    }
  }
  return n.join("");
}
__name(Py, "Py");
function Iy(e, t) {
  var r = e.split(""), n = r.shift().toUpperCase(), i = t ? r.pop().toLowerCase() : r.pop();
  return n + r.join("").toLowerCase() + i;
}
__name(Iy, "Iy");
var pn = /* @__PURE__ */ __name((e) => e.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\f/g, "\\f").replace(/"/g, '\\"'), "pn");
var Ju = /* @__PURE__ */ __name((e) => {
  let t = "", r = e.getAttribute("style");
  if (r) {
    let a = r.replace(/\n/g, "").replace(/\s\s+/g, " ").split(/;(?![^(]*\))/).reduce((o, l) => {
      let [s, u] = l.split(/:(.+)/);
      return s && u && (o += `"${Zu(s.trim())}": "${pn(u.trim())}",`), o;
    }, "");
    a.endsWith(",") && (a = a.slice(0, -1)), a && (t += `"style":{${a}},`);
  }
  let n = e.getAttribute("src");
  if (n) {
    let i = e.getAttribute("width"), a = e.getAttribute("height");
    i && a ? t += `"src":"${pn(n)}", "width":"${i}", "height":"${a}",` : (console.warn("Image missing width or height attribute as required by Satori"), t += `"src":"${pn(n)}",`);
  }
  return t;
}, "Ju");
var ci = /* @__PURE__ */ __name((e) => e.endsWith(",") ? e.slice(0, -1) : e, "ci");
async function Qu(e) {
  let t = "";
  await new HTMLRewriter().on("*", { element(n) {
    let i = Ju(n);
    t += `{"type":"${n.tagName}", "props":{${i}"children": [`;
    try {
      n.onEndTag(() => {
        t = ci(t), t += "]}},";
      });
    } catch {
      t = ci(t), t += "]}},";
    }
  }, text(n) {
    if (n.text) {
      let i = pn(n.text);
      i && (t += `"${i}",`);
    }
  } }).transform(new Response(`<div style="display: flex; flex-direction: column;">${e}</div>`)).text(), t = ci(t);
  try {
    return JSON.parse(t);
  } catch (n) {
    return console.error(n), null;
  }
}
__name(Qu, "Qu");
async function Xa({ family: e, weight: t, text: r }) {
  let n = { family: `${encodeURIComponent(e)}${t ? `:wght@${t}` : ""}` };
  r ? n.text = r : n.subset = "latin";
  let i = `https://fonts.googleapis.com/css2?${Object.keys(n).map((f) => `${f}=${n[f]}`).join("&")}`, a = caches.default, o = i, l = await a.match(o);
  l || (l = await fetch(`${i}`, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1" } }), l = new Response(l.body, l), l.headers.append("Cache-Control", "s-maxage=3600"), await a.put(o, l.clone()));
  let u = (await l.text()).match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!u) throw new Error("Could not find font URL");
  return fetch(u).then((f) => f.arrayBuffer());
}
__name(Xa, "Xa");
var Ku = /* @__PURE__ */ new Map();
var Ry = "\u200D";
var Fy = /\uFE0F/g;
function Dy(e) {
  return Uy(e.indexOf(Ry) < 0 ? e.replace(Fy, "") : e);
}
__name(Dy, "Dy");
function Uy(e) {
  for (var t = [], r = 0, n = 0, i = 0; i < e.length; ) r = e.charCodeAt(i++), n ? (t.push((65536 + (n - 55296 << 10) + (r - 56320)).toString(16)), n = 0) : 55296 <= r && r <= 56319 ? n = r : t.push(r.toString(16));
  return t.join("-");
}
__name(Uy, "Uy");
var ef = { twemoji: /* @__PURE__ */ __name((e) => "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/" + e.toLowerCase() + ".svg", "twemoji"), openmoji: "https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/", blobmoji: "https://cdn.jsdelivr.net/npm/@svgmoji/blob@2.0.0/svg/", noto: "https://cdn.jsdelivr.net/gh/svgmoji/svgmoji/packages/svgmoji__noto/svg/", fluent: /* @__PURE__ */ __name((e) => "https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/" + e.toLowerCase() + "_color.svg", "fluent"), fluentFlat: /* @__PURE__ */ __name((e) => "https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/" + e.toLowerCase() + "_flat.svg", "fluentFlat") };
function Ny(e, t) {
  (!t || !ef[t]) && (t = "twemoji");
  let r = ef[t];
  return fetch(typeof r == "function" ? r(e) : `${r}${e.toUpperCase()}.svg`);
}
__name(Ny, "Ny");
var tf = /* @__PURE__ */ __name(({ emoji: e }) => {
  let t = /* @__PURE__ */ __name(async (r, n) => {
    if (r === "emoji") return "data:image/svg+xml;base64," + btoa(await (await Ny(Dy(n), e)).text());
  }, "t");
  return async (...r) => {
    let n = JSON.stringify(r), i = Ku.get(n);
    if (i) return i;
    let a = await t(...r);
    return Ku.set(n, a), a;
  };
}, "tf");
var By = /* @__PURE__ */ __name(async () => {
  try {
    console.log("init RESVG"), await Xu(Wy), console.log("init RESVG");
  } catch (e) {
    if (console.log(e), e instanceof Error && e.message.includes("Already initialized")) return;
    throw e;
  }
}, "By");
var Gy = /* @__PURE__ */ __name(async () => {
  try {
    let e = await ju(My);
    hu(e);
  } catch (e) {
    throw e;
  }
}, "Gy");
var rf = /* @__PURE__ */ __name(async ({ element: e, options: t }) => {
  await Promise.allSettled([By(), Gy()]);
  let r = typeof e == "string" ? await Qu(e) : e, n = t.width, i = t.height, a = { width: 1200, height: 630 };
  n && i ? a = { width: n, height: i } : n ? a = { width: n } : i && (a = { height: i });
  let o = await Gu(r, { ...a, fonts: t?.fonts?.length ? t.fonts : [{ name: "Bitter", data: await Xa({ family: "Bitter", weight: 600 }), weight: 500, style: "normal" }], loadAdditionalAsset: t.emoji ? tf({ emoji: t.emoji }) : void 0 });
  return (t?.format || "png") === "svg" ? o : new Yu(o, { fitTo: "width" in a ? { mode: "width", value: a.width } : { mode: "height", value: a.height } }).render().asPng();
}, "rf");
var Ya = class extends Response {
  static {
    __name(this, "Ya");
  }
  constructor(t, r) {
    if (super(), r.format === "svg") return (async () => {
      let n = await rf({ element: t, options: r });
      return new Response(n, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": r.debug ? "no-cache, no-store" : "public, immutable, no-transform, max-age=31536000", ...r.headers }, status: r.status || 200, statusText: r.statusText });
    })();
    {
      let n = new ReadableStream({ async start(i) {
        let a = await rf({ element: t, options: r });
        i.enqueue(a), i.close();
      } });
      return new Response(n, { headers: { "Content-Type": "image/png", "Cache-Control": r.debug ? "no-cache, no-store" : "public, immutable, no-transform, max-age=31536000", ...r.headers }, status: r.status || 200, statusText: r.statusText });
    }
  }
};

// api/og-image.js
function isValidId2(id2) {
  return typeof id2 === "string" && /^[a-zA-Z0-9_\-\.\:\+ ]{1,80}$/.test(id2);
}
__name(isValidId2, "isValidId");
function fallbackImage(title = "My Exam Companion", subtitle = "Practice past exam questions for FREE") {
  const html = `
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #302b63; background-image: linear-gradient(135deg, #0f0c29, #24243e); color: white; align-items: center; justify-content: center; font-family: sans-serif; padding: 60px;">
      <div style="display: flex; font-size: 28px; font-weight: 900; color: #a78bfa; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">MY EXAM COMPANION</div>
      <div style="display: flex; font-size: 52px; font-weight: 800; color: white; text-align: center; line-height: 1.2; max-width: 900px; margin-bottom: 32px;">${title}</div>
      <div style="display: flex; font-size: 26px; color: #94a3b8; text-align: center; max-width: 700px;">${subtitle}</div>
      <div style="display: flex; margin-top: 48px; background-color: #7c3aed; padding: 16px 40px; border-radius: 9999px; font-size: 22px; font-weight: 600; color: white;">Tap to view answer</div>
    </div>
  `;
  return new Ya(html, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=3600" }
  });
}
__name(fallbackImage, "fallbackImage");
async function onRequest6({ request, env }) {
  const { searchParams } = new URL(request.url);
  const qId = searchParams.get("id") || searchParams.get("q");
  const examId = searchParams.get("exam_id") || "nigeria/jamb";
  const subject = searchParams.get("subject") || "general";
  const year = searchParams.get("year") || "2023";
  if (!isValidId2(qId)) {
    return fallbackImage();
  }
  const country = examId.split("/")[0].toLowerCase();
  const countryCodeMap = { nigeria: "ng", ghana: "gh", us: "us", usa: "us", "united states": "us" };
  const cc = countryCodeMap[country] || "ng";
  let dataBase = `${cc}/exams/university_entrance/${examId.split("/").pop()}`;
  try {
    const configObj = await env.QUESTIONS_BUCKET.get(`configs/${cc}.json`);
    if (configObj) {
      const config = await configObj.json();
      const mod = config.dashboard_modules.find((m) => m.id === examId);
      if (mod && mod.data_source) {
        dataBase = mod.data_source.replace(/\/index\.json$/, "");
      }
    }
  } catch (e) {
  }
  let debugLog = `DB:${dataBase} | Subj:${subject} | Y:${year}`;
  let dataArray = null;
  const types = ["cbt", "objective", "theory", "general"];
  for (const type of types) {
    const r2Path = `${dataBase}/${subject}/${type}/${year}.json`;
    try {
      const object = await env.QUESTIONS_BUCKET.get(r2Path);
      if (object) {
        dataArray = await object.json();
        debugLog += ` | Found:${type}`;
        break;
      }
    } catch (e) {
      debugLog += ` | Err:${e.message}`;
    }
  }
  if (!dataArray) {
    return fallbackImage("DataArray Null", debugLog);
  }
  let actualId = qId;
  if (qId.includes("_")) {
    actualId = qId.split("_").pop();
  }
  let data = null;
  if (Array.isArray(dataArray)) {
    data = dataArray.find(
      (q) => String(q.id) === qId || String(q.id) === actualId || String(q.question_id) === qId || String(q.question_id) === actualId
    );
  } else {
    data = dataArray[qId] || dataArray[actualId] || Object.values(dataArray).find(
      (q) => String(q.id) === qId || String(q.id) === actualId || String(q.question_id) === qId || String(q.question_id) === actualId
    );
  }
  if (!data) {
    let keys = Object.keys(dataArray).slice(0, 3).join(",");
    return fallbackImage("Data Null", `qId:${qId} | actual:${actualId} | type:${typeof dataArray} | keys:${keys}`);
  }
  const countryName = country.charAt(0).toUpperCase() + country.slice(1);
  const FLAG_HTML = {
    ng: `<div style="display: flex; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 16px; height: 32px; background-color: #008751;"></div>
           <div style="display: flex; width: 16px; height: 32px; background-color: #ffffff;"></div>
           <div style="display: flex; width: 16px; height: 32px; background-color: #008751;"></div>
         </div>`,
    gh: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 11px; background-color: #CE1126;"></div>
           <div style="display: flex; width: 48px; height: 11px; background-color: #FCD116;"></div>
           <div style="display: flex; width: 48px; height: 10px; background-color: #006B3F;"></div>
         </div>`,
    us: `<div style="display: flex; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 18px; height: 32px; background-color: #3C3B6E;"></div>
           <div style="display: flex; flex-direction: column; width: 30px; height: 32px;">
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #ffffff;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #ffffff;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 7px; background-color: #ffffff;"></div>
           </div>
         </div>`,
    ke: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 11px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 11px; background-color: #BB0000;"></div>
           <div style="display: flex; width: 48px; height: 10px; background-color: #006600;"></div>
         </div>`,
    ug: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 6px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #FCDC04;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #D90000;"></div>
           <div style="display: flex; width: 48px; height: 6px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #FCDC04;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #D90000;"></div>
         </div>`
  };
  const flagHtml = FLAG_HTML[cc] || `<div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 32px; background-color: #e2e8f0; border-radius: 4px; margin-right: 12px; font-size: 14px; font-weight: 800; color: #64748b;">${cc.toUpperCase()}</div>`;
  const displaySubject = cleanText(data.subject || subject || "Exam");
  const primaryColor = "#2563eb";
  const accentBg = "#eff6ff";
  const qText = cleanText(data.question || data.question_text || "Can you solve this question?");
  const qTrunc = qText.substring(0, 120) + (qText.length > 120 ? "..." : "");
  const examBody = cleanText(data.examBody || examId.split("/").pop().toUpperCase());
  const topicText = cleanText(data.topic || "Review Question").substring(0, 50);
  const yearDisplay = data.exam_year || year || "2025";
  const hooks = [
    "Can you solve this?",
    "Test your knowledge!",
    "Do you know the answer?",
    "Challenge accepted?",
    "Think you can get it right?",
    "How well do you know this?",
    "Put your brain to the test!",
    "Are you exam-ready?"
  ];
  const hookIdx = (qId || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % hooks.length;
  const hookText = hooks[hookIdx];
  const html = `
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #cbd5e1; font-family: sans-serif; padding: 40px 50px;">
      
      <!-- 1. Top Navigation Pill -->
      <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; background-color: #e2e8f0; border: 2px solid #ffffff; border-radius: 9999px; padding: 12px 24px; margin-bottom: 24px;">
        <div style="display: flex; flex-direction: row; align-items: center;">
          ${flagHtml}
          <div style="display: flex; color: #334155; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
            ${countryName.toUpperCase()} <span style="color: #64748b; margin-left: 8px;">\u2022 ${examBody} \u2022 ${displaySubject.toUpperCase()}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: row; align-items: center;">
          <div style="display: flex; background-color: #cbd5e1; color: #334155; font-size: 20px; font-weight: 700; padding: 6px 16px; border-radius: 9999px; margin-right: 12px; border: 1px solid #94a3b8;">${yearDisplay}</div>
          <div style="display: flex; background-color: #ffffff; color: #0f172a; font-size: 20px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid #e2e8f0;">FREE</div>
        </div>
      </div>

      <!-- 2. Main Question Card -->
      <div style="display: flex; flex-direction: column; flex: 1; background-color: #e2e8f0; border: 2px solid #ffffff; border-radius: 24px; padding: 36px 48px;">
        
        <!-- Question text -->
        <div style="display: flex; font-size: 36px; font-weight: 600; color: #0f172a; line-height: 1.4; margin-bottom: 32px;">
          ${qTrunc}
        </div>

        <!-- Options 2x2 grid -->
        <div style="display: flex; flex-wrap: wrap; margin-bottom: auto;">
          ${(data.options || []).slice(0, 4).map((opt, i) => {
    const text = typeof opt === "string" ? opt : opt.text || opt.tag || "";
    const colors = ["#2563eb", "#a855f7", "#0d9488", "#ea580c"];
    const bgs = ["#eff6ff", "#faf5ff", "#f0fdfa", "#fff7ed"];
    const borders = ["#bfdbfe", "#e9d5ff", "#ccfbf1", "#fed7aa"];
    return `<div style="display: flex; align-items: center; width: 48%; background-color: #ffffff; border-radius: 16px; padding: 14px 20px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 2px solid ${borders[i]}; border-radius: 12px; margin-right: 18px; background-color: ${bgs[i]}; color: ${colors[i]}; font-weight: 700; font-size: 22px;">
                          ${String.fromCharCode(65 + i)}
                        </div>
                        <span style="flex: 1; line-height: 1.3; font-weight: 500; font-size: 24px; color: #0f172a;">${cleanText(text).substring(0, 38)}${cleanText(text).length > 38 ? "..." : ""}</span>
                      </div>`;
  }).join("")}
        </div>

        <!-- 3. Footer Area -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px;">
          <div style="display: flex; align-items: center;">
            <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #ffffff; border-radius: 10px; margin-right: 12px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <div style="display: flex; font-size: 22px; font-weight: 800; color: #1e293b;">My Exam Companion</div>
            <div style="display: flex; margin-left: 16px; font-size: 18px; color: #475569; font-weight: 500;">Join 10K+ students practicing for FREE</div>
          </div>
          <!-- CTA button -->
          <div style="display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; background-color: #2563eb; padding: 14px 32px; border-radius: 9999px; font-weight: 700;">
            Tap to reveal answer
          </div>
        </div>

      </div>
    </div>
  `;
  try {
    return new Ya(html, {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (err) {
    return fallbackImage("Can You Solve This?", cleanText(data.question || "").substring(0, 80));
  }
}
__name(onRequest6, "onRequest");
function cleanText(htmlStr) {
  if (!htmlStr) return "";
  let text = String(htmlStr).replace(/<[^>]*>?/gm, "");
  const entities = {
    "&nbsp;": " ",
    "&cent;": "\xA2",
    "&pound;": "\xA3",
    "&yen;": "\xA5",
    "&euro;": "\u20AC",
    "&copy;": "\xA9",
    "&reg;": "\xAE",
    "&middot;": "\xB7",
    "&deg;": "\xB0",
    "&plusmn;": "\xB1",
    "&alpha;": "\u03B1",
    "&beta;": "\u03B2",
    "&gamma;": "\u03B3",
    "&theta;": "\u03B8",
    "&Omega;": "\u03A9",
    "&pi;": "\u03C0",
    "&Sigma;": "\u03A3",
    "&mu;": "\u03BC",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&ndash;": "\u2013",
    "&mdash;": "\u2014"
  };
  text = text.replace(/&[#a-zA-Z0-9]+;/g, (match2) => entities[match2] || match2);
  text = text.replace(/\\\(/g, "").replace(/\\\)/g, "").replace(/\\\[/g, "").replace(/\\\]/g, "").replace(/\$\$/g, "").replace(/\$([^$]+)\$/g, "$1").replace(/\^2/g, "\xB2").replace(/\^3/g, "\xB3");
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(cleanText, "cleanText");

// api/r2.js
async function onRequest7(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new Response(`Failed to fetch from R2: ${res.status}`, { status: res.status });
    }
    const body = await res.text();
    const contentType = res.headers.get("content-type") || "text/html;charset=UTF-8";
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(`Error fetching from R2: ${err.message}`, { status: 500 });
  }
}
__name(onRequest7, "onRequest");

// api/share.js
async function onRequest8(context) {
  const url = new URL(context.request.url);
  const examId = url.searchParams.get("exam_id") || "nigeria/jamb";
  const subject = url.searchParams.get("subject") || "general";
  const qId = url.searchParams.get("q") || "1";
  const mode = url.searchParams.get("mode") || "poll";
  const year = url.searchParams.get("year") || "2023";
  const examParts = examId.split("/");
  const examBody = examParts[examParts.length - 1].toUpperCase();
  const subjectDisplay = subject.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const title = `${examBody} ${subjectDisplay} Question | My Exam Companion`;
  const description = `Can you solve this ${examBody} ${subjectDisplay} question? Join the discussion and cast your vote on My Exam Companion!`;
  const destinationUrl = new URL("/modules/study/classroom/classroom_discussion.html", url.origin);
  destinationUrl.searchParams.set("exam_id", examId);
  destinationUrl.searchParams.set("subject", subject);
  destinationUrl.searchParams.set("year", year);
  destinationUrl.searchParams.set("q", qId);
  destinationUrl.searchParams.set("mode", mode);
  const imageUrl = new URL("/api/og-image", url.origin);
  imageUrl.searchParams.set("exam_id", examId);
  imageUrl.searchParams.set("subject", subject);
  imageUrl.searchParams.set("year", year);
  imageUrl.searchParams.set("q", qId);
  imageUrl.searchParams.set("id", qId);
  const userName = url.searchParams.get("user_name");
  const userAvatar = url.searchParams.get("user_avatar");
  if (userName) imageUrl.searchParams.set("user_name", userName);
  if (userAvatar) imageUrl.searchParams.set("user_avatar", userAvatar);
  const cacheBuster = url.searchParams.get("_t") || url.searchParams.get("v");
  if (cacheBuster) {
    imageUrl.searchParams.set("_t", cacheBuster);
  }
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url.toString()}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl.toString()}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:alt" content="My Exam Companion Question Preview">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url.toString()}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl.toString()}">
  
  <!-- Redirect immediately for actual users using JavaScript (Facebook scraper doesn't run JS) -->
  <script>
    window.location.replace("${destinationUrl.toString()}");
  <\/script>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
  <p>Redirecting you to the question on My Exam Companion...</p>
  <p><a href="${destinationUrl.toString()}">Click here if you are not redirected automatically.</a></p>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
      // Allow scrapers to cache for 1 hour
    }
  });
}
__name(onRequest8, "onRequest");

// brochure/[[path]].js
async function onRequest9(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = context.params.path || [];
  const country = path[0] || "ng";
  const slugSegment = path[1] || "";
  const idMatch = slugSegment.match(/-?(\d+)$/);
  const institutionId = idMatch ? idMatch[1] : slugSegment;
  const isInstitutionPage = !!institutionId;
  const COUNTRY_NAMES = {
    ng: "Nigeria",
    gh: "Ghana",
    us: "United States",
    uk: "United Kingdom"
  };
  const countryName = COUNTRY_NAMES[country] || country.toUpperCase();
  const targetAsset = isInstitutionPage ? "/modules/study/brochure/course" : "/modules/study/brochure/brochure";
  const assetUrl = new URL(targetAsset, url.origin);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  const R2_BASE = "https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev";
  let title = "";
  let description = "";
  let canonicalUrl = "";
  let ssrHtml = "";
  let schemas = [];
  if (!isInstitutionPage) {
    title = `${countryName} Universities & Polytechnics Brochure \u2014 Courses & Requirements | My Exam Companion`;
    description = `Browse all ${countryName} universities, polytechnics, and colleges of education. Find available courses, UTME subject combinations, and O'Level requirements for free.`;
    canonicalUrl = `https://myexamcompanion.pages.dev/brochure/${country}`;
    if (isBot) {
      try {
        const r2Res = await fetch(`${R2_BASE}/${country}/brochure/institutions.json`);
        if (r2Res.ok) {
          const institutions = await r2Res.json();
          const top = Array.isArray(institutions) ? institutions.slice(0, 30) : [];
          let listHtml = `<article class="pre-rendered-content"><h1>${title}</h1><ul>`;
          const listItems = [];
          top.forEach((inst, idx) => {
            const name = inst.school_name || "Unknown Institution";
            const state = inst.state ? `, ${inst.state} State` : "";
            const type = inst.program_type || "";
            const instUrl = `https://myexamcompanion.pages.dev/brochure/${country}/${inst.id}`;
            listHtml += `<li><a href="${instUrl}">${name}${state} (${type})</a></li>`;
            listItems.push({
              "@type": "ListItem",
              "position": idx + 1,
              "name": name,
              "url": instUrl
            });
          });
          listHtml += `</ul></article>`;
          ssrHtml = listHtml;
          schemas.push({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": title,
            "description": description,
            "numberOfItems": top.length,
            "itemListElement": listItems
          });
        }
      } catch (err) {
        console.error("[Brochure Edge] Institution list fetch error:", err);
      }
    }
  } else {
    const instNameFormatted = institutionId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${instNameFormatted} \u2014 Courses, Requirements & Subject Combinations | My Exam Companion`;
    description = `Find all available courses at ${instNameFormatted} in ${countryName}. View UTME subject combinations, O'Level requirements, and direct entry requirements for free.`;
    canonicalUrl = `https://myexamcompanion.pages.dev/brochure/${country}/${slugSegment}`;
    if (isBot) {
      try {
        const r2Res = await fetch(`${R2_BASE}/${country}/brochure/institutions/${institutionId}.json`);
        if (r2Res.ok) {
          const data = await r2Res.json();
          const instInfo = data.institution || {};
          const courses = data.programmes || [];
          const realName = instInfo.school_name || instNameFormatted;
          title = `${realName} \u2014 Courses, Requirements & Subject Combinations | My Exam Companion`;
          description = `Find all available courses at ${realName} in ${countryName}. View UTME subject combinations, O'Level requirements, and direct entry requirements for free.`;
          let courseHtml = `<article class="pre-rendered-content"><h1>${title}</h1>`;
          courseHtml += `<p>${realName} offers ${courses.length} accredited programmes.</p><ul>`;
          const schemaOffers = [];
          courses.slice(0, 30).forEach((course) => {
            const cName = course.course_name || "";
            const utme = course.utme_requirements || "";
            courseHtml += `<li><strong>${cName}</strong>${utme ? " \u2014 UTME: " + utme : ""}</li>`;
            schemaOffers.push({
              "@type": "EducationalOccupationalProgram",
              "name": cName,
              "provider": { "@type": "EducationalOrganization", "name": realName }
            });
          });
          courseHtml += `</ul></article>`;
          ssrHtml = courseHtml;
          schemas.push({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": realName,
            "url": canonicalUrl,
            "description": description,
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": `${realName} Courses`,
              "numberOfItems": courses.length,
              "itemListElement": schemaOffers
            }
          });
        }
      } catch (err) {
        console.error("[Brochure Edge] Institution course fetch error:", err);
      }
    }
  }
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": `${countryName} Brochure`, "item": `https://myexamcompanion.pages.dev/brochure/${country}` },
      ...isInstitutionPage ? [{ "@type": "ListItem", "position": 3, "name": institutionId, "item": canonicalUrl }] : []
    ]
  });
  const image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  const ssrSnapshot = ssrHtml;
  const clientParams = isInstitutionPage ? `{ country: "${country}", institution_id: "${institutionId}" }` : `{ country: "${country}" }`;
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
      element.append(`<script>window.MEC_BROCHURE_PARAMS = ${clientParams};<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (ssrSnapshot) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${ssrSnapshot}</noscript>`, { html: true });
      }
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest9, "onRequest");

// study/[[path]].js
async function onRequest10(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = context.params.path || [];
  if (path.length < 2) {
    return Response.redirect(url.origin + "/", 302);
  }
  const country = path[0];
  const exam = path[1];
  const examId = `${country}/${exam}`;
  const subject = path[2] || "";
  const year = path[3] || "";
  const isDiscussionPage = path[path.length - 1] === "discussion";
  if (isDiscussionPage) {
    const dSubject = path[2] || "";
    const dQKey = path[3] || "";
    const _dYearRaw = url.searchParams.get("year") || "";
    const dYear = _dYearRaw || (dQKey.match(/^(\d{4})_/) ? dQKey.match(/^(\d{4})_/)[1] : "");
    const dType = url.searchParams.get("type") || "objective";
    const dLocked = url.searchParams.get("locked_answer") || "";
    const dMode = url.searchParams.get("mode") || "";
    let dSubjectFmt = dSubject.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const dExamFmt = exam.toUpperCase();
    let title2 = `${dExamFmt} ${dSubjectFmt} \u2014 Explanation | My Exam Companion`;
    let description2 = `View the official answer and step-by-step explanation for this ${dExamFmt} ${dSubjectFmt} past question.`;
    let image2 = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title2)}`;
    const canonicalUrl2 = `https://myexamcompanion.pages.dev/study/${examId}/${dSubject}/${dQKey}/discussion`;
    let schemas2 = [];
    let questionHtml = "";
    const userAgent2 = request.headers.get("User-Agent") || "";
    const isBot2 = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent2);
    if (dQKey && env.QUESTIONS_BUCKET) {
      try {
        const obj = await env.QUESTIONS_BUCKET.get(`questions/${dQKey}.json`);
        if (obj) {
          const data = await obj.json();
          const qText = (data.question || "").replace(/<[^>]*>/g, "").trim();
          const correctOpt = (data.options || []).find((o) => o.is_correct);
          const ansText = correctOpt ? (correctOpt.text || "").replace(/<[^>]*>/g, "").trim() : "";
          const expText = (data.explanation || "").replace(/<[^>]*>/g, "").trim();
          const qTopic = Array.isArray(data.topic) ? data.topic[0] : data.topic || "";
          title2 = `${dExamFmt} ${dSubjectFmt}${dYear ? " " + dYear : ""}${qTopic ? " \u2014 " + qTopic : ""} | My Exam Companion`;
          description2 = qText ? `${qText.substring(0, 120)}... \u2014 Answer & Explanation on My Exam Companion` : description2;
          image2 = `https://myexamcompanion.pages.dev/api/og-image?id=${encodeURIComponent(dQKey)}`;
          schemas2.push({
            "@context": "https://schema.org",
            "@type": "QAPage",
            "name": title2,
            "description": description2,
            "mainEntity": {
              "@type": "Question",
              "name": qText.substring(0, 200),
              "text": qText,
              ...ansText ? { "acceptedAnswer": { "@type": "Answer", "text": `${ansText}. ${expText}`.trim() } } : {}
            }
          });
          if (isBot2) {
            const optionsHtml = (data.options || []).map((o) => {
              const tag = (o.tag || "").toUpperCase();
              const txt = (o.text || "").replace(/<[^>]*>/g, "");
              return `<li${o.is_correct ? ' style="font-weight:bold"' : ""}>${tag}. ${txt}</li>`;
            }).join("");
            questionHtml = `<article itemscope itemtype="https://schema.org/Question"><h1 itemprop="name">${title2}</h1><p itemprop="text">${qText}</p>${optionsHtml ? `<ul>${optionsHtml}</ul>` : ""}<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"><strong>Correct Answer:</strong><p itemprop="text">${ansText}</p>${expText ? `<strong>Explanation:</strong><p>${expText}</p>` : ""}</div></article>`;
          }
        }
      } catch (err) {
        console.error("Discussion Edge SSR R2 fetch failed:", err);
      }
    }
    schemas2.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
        { "@type": "ListItem", "position": 2, "name": dExamFmt, "item": `https://myexamcompanion.pages.dev/study/${examId}` },
        { "@type": "ListItem", "position": 3, "name": dSubjectFmt, "item": `https://myexamcompanion.pages.dev/study/${examId}/${dSubject}` },
        { "@type": "ListItem", "position": 4, "name": "Discussion", "item": canonicalUrl2 }
      ]
    });
    const assetResp = await env.ASSETS.fetch(new Request(new URL("/modules/study/classroom/classroom_discussion", request.url).toString(), { headers: request.headers }));
    class DDiscHeadInjector {
      static {
        __name(this, "DDiscHeadInjector");
      }
      element(element) {
        element.prepend(`<base href="/">
`, { html: true });
        element.append(`<title>${title2}</title>
`, { html: true });
        element.append(`<meta name="description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<link rel="canonical" href="${canonicalUrl2}">
`, { html: true });
        element.append(`<meta property="og:title" content="${title2}">
`, { html: true });
        element.append(`<meta property="og:description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<meta property="og:image" content="${image2}">
`, { html: true });
        element.append(`<meta property="og:url" content="${canonicalUrl2}">
`, { html: true });
        element.append(`<meta property="og:type" content="article">
`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
        element.append(`<meta name="twitter:title" content="${title2}">
`, { html: true });
        element.append(`<meta name="twitter:description" content="${description2.replace(/"/g, "&quot;")}">
`, { html: true });
        element.append(`<meta name="twitter:image" content="${image2}">
`, { html: true });
        element.append(`<script type="application/ld+json">
${JSON.stringify(schemas2)}
<\/script>
`, { html: true });
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
<\/script>
`, { html: true });
      }
    }
    class DDiscBodyInjector {
      static {
        __name(this, "DDiscBodyInjector");
      }
      element(element) {
        if (questionHtml) {
          element.prepend(`<noscript>${questionHtml}</noscript>`, { html: true });
        }
      }
    }
    class TagRemover2 {
      static {
        __name(this, "TagRemover");
      }
      element(element) {
        element.remove();
      }
    }
    return new HTMLRewriter().on("title", new TagRemover2()).on('meta[name="description"]', new TagRemover2()).on('meta[property^="og:"]', new TagRemover2()).on('meta[name^="twitter:"]', new TagRemover2()).on('link[rel="canonical"]', new TagRemover2()).on("head", new DDiscHeadInjector()).on("body", new DDiscBodyInjector()).transform(assetResp);
  }
  const isSubjectPage = path.length === 2;
  const targetAsset = isSubjectPage ? "/modules/study/classroom/classroom_subject" : "/modules/study/classroom/classroom_questions";
  const assetUrl = new URL(targetAsset, request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), { headers: request.headers }));
  if (isSubjectPage) {
    class SubjectInjector {
      static {
        __name(this, "SubjectInjector");
      }
      element(element) {
        element.prepend(`<base href="/">
`, { html: true });
        element.append(`<script>window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}" };<\/script>
`, { html: true });
      }
    }
    return new HTMLRewriter().on("head", new SubjectInjector()).transform(response);
  }
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|twitterbot|linkedinbot|perplexitybot|claudebot|applebot/i.test(userAgent);
  const examFormatted = exam.toUpperCase();
  let subjectFormatted = subject.replace(/_/g, " ");
  subjectFormatted = subjectFormatted.replace(/\b\w/g, (c) => c.toUpperCase());
  const yearText = year ? ` ${year}` : "";
  let title = `${examFormatted} ${subjectFormatted}${yearText} Past Questions & Answers | My Exam Companion`;
  let description = `Practice free CBT exam past questions for ${examFormatted} ${subjectFormatted}${yearText} online. Includes official answer keys, step-by-step explanations, and CBT timer.`;
  let image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  let canonicalUrl = `https://myexamcompanion.pages.dev/study/${examId}/${subject}${year ? "/" + year : ""}`;
  let questionsHtml = "";
  let schemas = [];
  if (isBot && env.QUESTIONS_BUCKET) {
    try {
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
              const qText = (q.question || "").replace(/<[^>]*>/g, "");
              const ansObj = q.options ? q.options.find((o) => o.is_correct) : null;
              const ansText = ansObj ? (ansObj.text || "").replace(/<[^>]*>/g, "") : "See explanation";
              const expText = (q.explanation || "").replace(/<[^>]*>/g, "");
              htmlBuilder += `
                <section>
                  <h2>Question ${qNum}</h2>
                  <p>${qText}</p>
                  <p><strong>Correct Answer:</strong> ${ansText}</p>
                  ${expText ? `<p><strong>Explanation:</strong> ${expText}</p>` : ""}
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
      console.error("Edge SSR R2 fetch failed:", err);
    }
  }
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
      { "@type": "ListItem", "position": 2, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}` },
      { "@type": "ListItem", "position": 3, "name": subjectFormatted, "item": `https://myexamcompanion.pages.dev/study/${examId}/${subject}` },
      ...year ? [{ "@type": "ListItem", "position": 4, "name": year, "item": canonicalUrl }] : []
    ]
  });
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
      const simulatedSearch = new URLSearchParams();
      if (subject) simulatedSearch.set("subject", subject);
      if (year) simulatedSearch.set("year", year);
      const searchStr = simulatedSearch.toString();
      element.append(`<script>
window.MEC_CLEAN_URL_PARAMS = { exam_id: "${examId}", subject: "${subject}", year: "${year}" };
// Inject year/type into the URL so raw URLSearchParams(window.location.search) reads them
if (${!!year} && !window.location.search.includes('year=')) {
  history.replaceState(null, '', window.location.pathname + '?${searchStr}');
}
<\/script>
`, { html: true });
    }
  }
  class BodyInjector {
    static {
      __name(this, "BodyInjector");
    }
    element(element) {
      if (questionsHtml) {
        element.prepend(`<noscript id="edge-ssr-snapshot">${questionsHtml}</noscript>`, { html: true });
      }
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).on("body", new BodyInjector()).transform(response);
}
__name(onRequest10, "onRequest");

// syllabus/[[path]].js
async function onRequest11(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = context.params.path || [];
  if (path.length === 0) {
    return Response.redirect(url.origin + "/syllabus/ng/jamb", 302);
  }
  if (path.length < 2) {
    return Response.redirect(url.origin + "/syllabus/ng/jamb", 302);
  }
  const country = path[0].toLowerCase();
  const exam = path[1].toLowerCase();
  const subject = path[2] ? path[2].toLowerCase() : "";
  const COUNTRY_NAMES = {
    ng: "Nigeria",
    us: "United States",
    gh: "Ghana",
    uk: "United Kingdom",
    ke: "Kenya",
    za: "South Africa"
  };
  const countryName = COUNTRY_NAMES[country] || country.toUpperCase();
  const examFormatted = exam.toUpperCase();
  const subjectFormatted = subject ? subject.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
  const canonicalUrl = subject ? `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}/${subject}` : `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}`;
  const title = subject ? `${examFormatted} ${subjectFormatted} Syllabus ${(/* @__PURE__ */ new Date()).getFullYear()} | My Exam Companion` : `${examFormatted} Syllabus ${(/* @__PURE__ */ new Date()).getFullYear()} \u2014 All Subjects | My Exam Companion`;
  const description = subject ? `Download and study the complete ${examFormatted} ${subjectFormatted} syllabus. View all topics, objectives, and recommended textbooks for ${countryName} students.` : `Browse the complete ${examFormatted} syllabus for all subjects. Detailed topics, learning objectives, and study guides for ${countryName} students preparing for ${examFormatted}.`;
  const image = `https://myexamcompanion.pages.dev/api/og-image?title=${encodeURIComponent(title)}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://myexamcompanion.pages.dev/" },
        { "@type": "ListItem", "position": 2, "name": "Syllabus", "item": "https://myexamcompanion.pages.dev/syllabus" },
        { "@type": "ListItem", "position": 3, "name": examFormatted, "item": `https://myexamcompanion.pages.dev/syllabus/${country}/${exam}` },
        ...subject ? [{ "@type": "ListItem", "position": 4, "name": subjectFormatted, "item": canonicalUrl }] : []
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
  const assetResp = await env.ASSETS.fetch(
    new Request(new URL("/modules/study/syllabus/syllabus", request.url).toString(), { headers: request.headers })
  );
  class HeadInjector {
    static {
      __name(this, "HeadInjector");
    }
    element(element) {
      element.prepend(`<base href="/">
`, { html: true });
      element.append(`<title>${title}</title>
`, { html: true });
      element.append(`<meta name="description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<link rel="canonical" href="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:title" content="${title}">
`, { html: true });
      element.append(`<meta property="og:description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<meta property="og:image" content="${image}">
`, { html: true });
      element.append(`<meta property="og:url" content="${canonicalUrl}">
`, { html: true });
      element.append(`<meta property="og:type" content="website">
`, { html: true });
      element.append(`<meta name="twitter:card" content="summary_large_image">
`, { html: true });
      element.append(`<meta name="twitter:title" content="${title}">
`, { html: true });
      element.append(`<meta name="twitter:description" content="${description.replace(/"/g, "&quot;")}">
`, { html: true });
      element.append(`<meta name="twitter:image" content="${image}">
`, { html: true });
      element.append(`<script type="application/ld+json">
${JSON.stringify(schemas)}
<\/script>
`, { html: true });
      element.append(`<script>
window.MEC_SYLLABUS_PARAMS = {
  country: "${country}",
  exam:    "${exam}",
  subject: "${subject}"
};
<\/script>
`, { html: true });
    }
  }
  class TagRemover {
    static {
      __name(this, "TagRemover");
    }
    element(element) {
      element.remove();
    }
  }
  return new HTMLRewriter().on("title", new TagRemover()).on('meta[name="description"]', new TagRemover()).on('meta[property^="og:"]', new TagRemover()).on('meta[name^="twitter:"]', new TagRemover()).on('link[rel="canonical"]', new TagRemover()).on("head", new HeadInjector()).transform(assetResp);
}
__name(onRequest11, "onRequest");

// _middleware.js
async function onRequest12(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  if (url.hostname.endsWith(".pages.dev")) {
    return Response.redirect("https://myexamcompanion.com" + path + url.search, 301);
  }
  if (url.hostname === "www.myexamcompanion.com") {
    return Response.redirect("https://myexamcompanion.com" + path + url.search, 301);
  }
  const blogMatch = path.match(/^\/([a-z]{2})\/blog\/([\w-]+)\/([\w-]+)$/);
  if (blogMatch) {
    const country = blogMatch[1];
    const category = blogMatch[2];
    const slug = blogMatch[3];
    let response = await context.env.ASSETS.fetch(
      new Request(new URL("/modules/blog/content", context.request.url).toString(), context.request)
    );
    const r2Url = `https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/${country}/blog/${category}/${slug}.json`;
    let postData = null;
    try {
      const r2Res = await fetch(r2Url);
      if (r2Res.ok) postData = await r2Res.json();
    } catch (e) {
    }
    if (postData) {
      const title = `${postData.title} | My Exam Companion`;
      const description = postData.description || postData.intro || postData.title || "";
      const image = postData.thumbnail_url || "https://www.myexamcompanion.com/favicon.ico";
      const canonicalUrl = `https://myexamcompanion.com/${country}/blog/${category}/${slug}`;
      const updatedTime = postData.updated_at || postData.date || "";
      let rawHtml = postData.content || "";
      const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      rawHtml = bodyMatch ? bodyMatch[1] : rawHtml;
      const headers = new Headers(response.headers);
      if (updatedTime) headers.set("Last-Modified", new Date(updatedTime).toUTCString());
      headers.set("X-Robots-Tag", "index, follow");
      response = new Response(response.body, { status: response.status, headers });
      const rewriter = new HTMLRewriter().on("title", { element(el2) {
        el2.setInnerContent(title);
      } }).on('link[rel="canonical"]', { element(el2) {
        el2.setAttribute("href", canonicalUrl);
      } }).on('meta[name="description"]', { element(el2) {
        el2.setAttribute("content", description);
      } }).on('meta[name="robots"]', { element(el2) {
        el2.setAttribute("content", "index, follow");
      } }).on('meta[property="og:title"]', { element(el2) {
        el2.setAttribute("content", postData.title);
      } }).on('meta[property="og:description"]', { element(el2) {
        el2.setAttribute("content", description);
      } }).on('meta[property="og:image"]', { element(el2) {
        el2.setAttribute("content", image);
      } }).on('meta[property="og:url"]', { element(el2) {
        el2.setAttribute("content", canonicalUrl);
      } }).on('meta[property="og:updated_time"]', { element(el2) {
        el2.setAttribute("content", updatedTime);
      } }).on("#articleTitle", { element(el2) {
        el2.setInnerContent(postData.title);
      } }).on("#articleBodyContainer", { element(el2) {
        el2.setInnerContent(rawHtml, { html: true });
      } }).on("#loadingState", { element(el2) {
        el2.setAttribute("style", "display: none;");
      } }).on("#articleShell", { element(el2) {
        el2.setAttribute("style", "display: block;");
      } });
      return rewriter.transform(response);
    }
  }
  const exactRoutes = {
    "/": "/modules/",
    "/ng": "/modules/",
    "/ng/": "/modules/",
    "/gh": "/modules/",
    "/gh/": "/modules/",
    "/us": "/modules/",
    "/us/": "/modules/",
    "/ng/study/past-questions": "/modules/study/study_past_questions/study_subject",
    "/ng/study/novel": "/modules/study/novel/novel",
    "/ng/study/syllabus": "/modules/study/syllabus/syllabus",
    "/ng/study/brochure": "/modules/study/brochure/brochure",
    "/ng/study/videos": "/modules/study/topic_video/topic_video",
    "/ng/study/scholarships": "/modules/study/scholarship/list_of_scholarship",
    "/gh/study/past-questions": "/modules/study/study_past_questions/study_subject",
    "/gh/study/videos": "/modules/study/topic_video/topic_video",
    "/us/study/past-questions": "/modules/study/study_past_questions/study_subject",
    "/ng/test": "/modules/cbt_test/core/setup",
    "/ng/test/result": "/modules/cbt_test/core/result",
    "/ng/test/analysis": "/modules/cbt_test/core/deep_analysis",
    "/ng/test/jamb-mock": "/modules/cbt_test/jamb_mock_exam/mock_date_and_point",
    "/ng/test/live-arena": "/modules/cbt_test/live_quiz_arena/exam_body",
    "/ng/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
    "/ng/test/secondary": "/modules/cbt_test/secondary_school/all_classes",
    "/ng/test/post-utme": "/modules/cbt_test/core/university_exam_post_utme",
    "/ng/test/university": "/modules/cbt_test/university_exam/university_exam",
    "/ng/test/instruction": "/modules/cbt_test/core/instruction",
    "/ng/test/premium": "/modules/cbt_test/core/setup_premium",
    "/gh/test": "/modules/cbt_test/core/setup",
    "/gh/test/premium": "/modules/cbt_test/core/setup_premium",
    "/gh/test/result": "/modules/cbt_test/core/result",
    "/gh/test/instruction": "/modules/cbt_test/core/instruction",
    "/gh/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
    "/us/test": "/modules/cbt_test/core/setup",
    "/us/test/premium": "/modules/cbt_test/core/setup_premium",
    "/us/test/result": "/modules/cbt_test/core/result",
    "/us/test/instruction": "/modules/cbt_test/core/instruction",
    "/us/test/live-arena/instruction": "/modules/cbt_test/live_quiz_arena/instruction",
    "/ng/blog": "/modules/blog/categories",
    "/ng/blog/": "/modules/blog/categories",
    "/ng/blog/study-tips": "/modules/blog/categories",
    "/ng/blog/exam-updates": "/modules/blog/categories",
    "/ng/blog/guide": "/modules/blog/categories",
    "/ng/blog/scholarships": "/modules/blog/categories",
    "/ng/blog/school-news": "/modules/blog/categories",
    "/gh/blog": "/modules/blog/categories",
    "/gh/blog/": "/modules/blog/categories",
    "/gh/blog/study-tips": "/modules/blog/categories",
    "/gh/blog/exam-updates": "/modules/blog/categories",
    "/gh/blog/guide": "/modules/blog/categories",
    "/gh/blog/scholarships": "/modules/blog/categories",
    "/gh/blog/school-news": "/modules/blog/categories",
    "/us/blog": "/modules/blog/categories",
    "/us/blog/": "/modules/blog/categories",
    "/us/blog/study-tips": "/modules/blog/categories",
    "/us/blog/exam-updates": "/modules/blog/categories",
    "/us/blog/guide": "/modules/blog/categories",
    "/us/blog/scholarships": "/modules/blog/categories",
    "/us/blog/school-news": "/modules/blog/categories",
    "/ng/rank": "/modules/rank/rank",
    "/ng/earnings": "/modules/earnings/earnings",
    "/ng/task": "/modules/task/task",
    "/ng/referral": "/modules/referrals/referrals",
    "/ng/ai-tutor": "/modules/cbt_test/core/ai_plan",
    "/ng/pricing": "/modules/pricing/pricing",
    "/ng/chat": "/modules/chat/admin_list",
    "/ng/history": "/modules/history/history",
    "/gh/rank": "/modules/rank/rank",
    "/gh/ai-tutor": "/modules/cbt_test/core/ai_plan",
    "/gh/pricing": "/modules/pricing/pricing",
    "/us/rank": "/modules/rank/rank",
    "/us/ai-tutor": "/modules/cbt_test/core/ai_plan",
    "/us/pricing": "/modules/pricing/pricing",
    "/top-up": "/modules/top_up/wallet_dashboard",
    "/top-up/add": "/modules/top_up/amount_entry",
    "/top-up/checkout": "/modules/top_up/paystack_inline_checkout",
    "/login": "/modules/auth/login",
    "/signup": "/modules/auth/sign_up",
    "/verify": "/modules/auth/otp",
    "/onboarding": "/modules/auth/fill_form",
    "/editor": "/modules/editor_program/dashboard",
    "/editor/": "/modules/editor_program/dashboard",
    "/ng/publisher/onboarding": "/modules/publisher_program/onboarding/onboarding_screen",
    "/ng/publisher/dashboard": "/modules/publisher_program/dashboard/dashboard",
    "/ng/publisher/bio": "/modules/publisher_program/profile/bio",
    "/ng/publisher/identity": "/modules/publisher_program/profile/identity",
    "/ng/publisher/account": "/modules/publisher_program/profile/account",
    "/ng/publisher/create-post": "/modules/publisher_program/dashboard/article/create_post",
    "/ng/publisher/post-review": "/modules/publisher_program/dashboard/article/post_review",
    "/ng/publisher/preview": "/modules/publisher_program/dashboard/article/preview",
    "/gh/publisher/onboarding": "/modules/publisher_program/onboarding/onboarding_screen",
    "/gh/publisher/dashboard": "/modules/publisher_program/dashboard/dashboard",
    "/gh/publisher/bio": "/modules/publisher_program/profile/bio",
    "/gh/publisher/identity": "/modules/publisher_program/profile/identity",
    "/gh/publisher/account": "/modules/publisher_program/profile/account",
    "/gh/publisher/create-post": "/modules/publisher_program/dashboard/article/create_post",
    "/gh/publisher/post-review": "/modules/publisher_program/dashboard/article/post_review",
    "/gh/publisher/preview": "/modules/publisher_program/dashboard/article/preview",
    "/us/publisher/onboarding": "/modules/publisher_program/onboarding/onboarding_screen",
    "/us/publisher/dashboard": "/modules/publisher_program/dashboard/dashboard",
    "/us/publisher/bio": "/modules/publisher_program/profile/bio",
    "/us/publisher/identity": "/modules/publisher_program/profile/identity",
    "/us/publisher/account": "/modules/publisher_program/profile/account",
    "/us/publisher/create-post": "/modules/publisher_program/dashboard/article/create_post",
    "/us/publisher/post-review": "/modules/publisher_program/dashboard/article/post_review",
    "/us/publisher/preview": "/modules/publisher_program/dashboard/article/preview",
    "/ng/landing/jamb": "/modules/landing/nigeria-jamb",
    "/ng/landing/waec": "/modules/landing/nigeria-waec",
    "/ng/landing/neco": "/modules/landing/nigeria-neco",
    "/ng/landing/uniben-post-utme": "/modules/landing/nigeria-uniben-post-utme",
    "/ng/landing/southern-delta-university": "/modules/landing/nigeria-southern-delta-university",
    "/gh/landing/waec": "/modules/landing/ghana-waec",
    "/us/landing/sat": "/modules/landing/usa-sat",
    "/ng/about-us": "/modules/footer/about_us",
    "/ng/contact-us": "/modules/footer/contact_us",
    "/ng/privacy-policy": "/modules/footer/privacy_policy",
    "/ng/terms-of-service": "/modules/footer/terms_of_service",
    "/ng/disclaimer": "/modules/footer/disclaimer",
    "/gh/about-us": "/modules/footer/about_us",
    "/gh/contact-us": "/modules/footer/contact_us",
    "/gh/privacy-policy": "/modules/footer/privacy_policy",
    "/gh/terms-of-service": "/modules/footer/terms_of_service",
    "/gh/disclaimer": "/modules/footer/disclaimer",
    "/us/about-us": "/modules/footer/about_us",
    "/us/contact-us": "/modules/footer/contact_us",
    "/us/privacy-policy": "/modules/footer/privacy_policy",
    "/us/terms-of-service": "/modules/footer/terms_of_service",
    "/us/disclaimer": "/modules/footer/disclaimer"
  };
  const prefixRoutes = {
    "/ng/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
    "/gh/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
    "/us/study/past-questions/": "/modules/study/study_past_questions/study_explanation",
    "/ng/test/": "/modules/cbt_test/core/cbt_player",
    "/gh/test/": "/modules/cbt_test/core/cbt_player",
    "/us/test/": "/modules/cbt_test/core/cbt_player",
    "/ng/blog/study-tips/": "/modules/blog/content",
    "/ng/blog/exam-updates/": "/modules/blog/content",
    "/ng/blog/guide/": "/modules/blog/content",
    "/ng/blog/scholarships/": "/modules/blog/content",
    "/ng/blog/school-news/": "/modules/blog/content",
    "/ng/blog/": "/modules/blog/categories",
    "/gh/blog/study-tips/": "/modules/blog/content",
    "/gh/blog/exam-updates/": "/modules/blog/content",
    "/gh/blog/guide/": "/modules/blog/content",
    "/gh/blog/scholarships/": "/modules/blog/content",
    "/gh/blog/school-news/": "/modules/blog/content",
    "/gh/blog/": "/modules/blog/categories",
    "/us/blog/study-tips/": "/modules/blog/content",
    "/us/blog/exam-updates/": "/modules/blog/content",
    "/us/blog/guide/": "/modules/blog/content",
    "/us/blog/scholarships/": "/modules/blog/content",
    "/us/blog/school-news/": "/modules/blog/content",
    "/us/blog/": "/modules/blog/categories"
  };
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
__name(onRequest12, "onRequest");

// ../.wrangler/tmp/pages-Bdu7FM/functionsRoutes-0.8205535501252197.mjs
var routes = [
  {
    routePath: "/modules/study/classroom/classroom_discussion.html",
    mountPath: "/modules/study/classroom",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/modules/study/classroom/classroom_questions.html",
    mountPath: "/modules/study/classroom",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/:country*/study/brochure/:slug*",
    mountPath: "/:country*/study/brochure",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/:country*/study/classroom/:path*",
    mountPath: "/:country*/study/classroom",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/:country*/blog/:path*",
    mountPath: "/:country*/blog",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/poll",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/poll",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/og-image",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/r2",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/share",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/brochure/:path*",
    mountPath: "/brochure",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/study/:path*",
    mountPath: "/study",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/syllabus/:path*",
    mountPath: "/syllabus",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest12],
    modules: []
  }
];

// ../../../Users/Ojehomon Ohiozoeje/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j2 = i + 1;
      while (j2 < str.length) {
        var code = str.charCodeAt(j2);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j2++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j2;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j2 = i + 1;
      if (str[j2] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j2));
      }
      while (j2 < str.length) {
        if (str[j2] === "\\") {
          pattern += str[j2++] + str[j2++];
          continue;
        }
        if (str[j2] === ")") {
          count--;
          if (count === 0) {
            j2++;
            break;
          }
        } else if (str[j2] === "(") {
          count++;
          if (str[j2 + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j2));
          }
        }
        pattern += str[j2++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j2;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a2 = options.prefixes, prefixes = _a2 === void 0 ? "./" : _a2, _b2 = options.delimiter, delimiter = _b2 === void 0 ? "/#?" : _b2;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a3 = tokens[i], nextType = _a3.type, index = _a3.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re2 = pathToRegexp(str, keys, options);
  return regexpToFunction(re2, keys, options);
}
__name(match, "match");
function regexpToFunction(re2, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.decode, decode = _a2 === void 0 ? function(x) {
    return x;
  } : _a2;
  return function(pathname) {
    var m = re2.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.strict, strict = _a2 === void 0 ? false : _a2, _b2 = options.start, start = _b2 === void 0 ? true : _b2, _c = options.end, end = _c === void 0 ? true : _c, _d2 = options.encode, encode = _d2 === void 0 ? function(x) {
    return x;
  } : _d2, _e2 = options.delimiter, delimiter = _e2 === void 0 ? "/#?" : _e2, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../Users/Ojehomon Ohiozoeje/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
/*! Bundled license information:

workers-og/dist/index.js:
  (*! Bundled license information:
  
  css-background-parser/index.js:
    (*!
     * https://github.com/gilmoreorless/css-background-parser
     * Copyright © 2015 Gilmore Davidson under the MIT license: http://gilmoreorless.mit-license.org/
     *)
  
  parse-css-color/dist/index.umd.js:
    (**
    	 * parse-css-color
    	 * @version v0.2.1
    	 * @link http://github.com/noeldelgado/parse-css-color/
    	 * @license MIT
    	 *)
  
  escape-html/index.js:
    (*!
     * escape-html
     * Copyright(c) 2012-2013 TJ Holowaychuk
     * Copyright(c) 2015 Andreas Lubbe
     * Copyright(c) 2015 Tiancheng "Timothy" Gu
     * MIT Licensed
     *)
  *)
*/
