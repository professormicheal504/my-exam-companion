export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  if (url.searchParams.get('mode') === 'poll') {
    const examId = url.searchParams.get('exam_id') || 'Exam';
    const subject = url.searchParams.get('subject') || 'Subject';
    const year = url.searchParams.get('year') || '';
    const id = url.searchParams.get('id') || url.searchParams.get('q');

    // fetch the real HTML page
    const response = await next();
    
    // Format the subject and exam nicely
    let subjectFormatted = subject.replace(/_/g, ' ');
    subjectFormatted = subjectFormatted.replace(/\b\w/g, c => c.toUpperCase());
    const examFormatted = examId.split('/').pop().toUpperCase();
    
    let title = `${examFormatted} ${subjectFormatted} — Poll`;
    let description = `Vote your answer and see live results`;
    let image = `https://myexamcompanion.pages.dev/assets/social-poll-preview.png`; // Fallback image if needed
    let ogUrl = `https://myexamcompanion.pages.dev/modules/study/classroom/classroom_discussion.html?mode=poll&exam_id=${examId}&subject=${subject}&year=${year}&q=${id}`;

    if (id && env.QUESTIONS_BUCKET) {
      try {
        const obj = await env.QUESTIONS_BUCKET.get(`questions/${id}.json`);
        if (obj) {
          const data = await obj.json();
          const qExamBody = data.examBody || examFormatted;
          const qSubject = data.subject || subjectFormatted;
          const qTopic = data.topic || 'Review Question';
          
          title = `${qExamBody} ${qSubject} — ${qTopic}`;
          image = `https://myexamcompanion.pages.dev/api/og-image?id=${id}`;
        }
      } catch (err) {
        console.error('Error fetching question from R2:', err);
      }
    }
    
    class TagRemover {
      element(element) {
        element.remove();
      }
    }

    class HeadInjector {
      element(element) {
        element.append(`<title>${title}</title>\n`, { html: true });
        element.append(`<meta property="og:title" content="${title}">\n`, { html: true });
        element.append(`<meta property="og:description" content="${description}">\n`, { html: true });
        element.append(`<meta property="og:image" content="${image}">\n`, { html: true });
        element.append(`<meta property="og:image:width" content="1200">\n`, { html: true });
        element.append(`<meta property="og:image:height" content="630">\n`, { html: true });
        element.append(`<meta property="og:url" content="${ogUrl}">\n`, { html: true });
        element.append(`<meta property="og:type" content="website">\n`, { html: true });
        element.append(`<meta name="twitter:card" content="summary_large_image">\n`, { html: true });
        element.append(`<meta name="twitter:title" content="${title}">\n`, { html: true });
        element.append(`<meta name="twitter:description" content="${description}">\n`, { html: true });
        element.append(`<meta name="twitter:image" content="${image}">\n`, { html: true });
      }
    }
    
    return new HTMLRewriter()
      .on('meta[property^="og:"]', new TagRemover())
      .on('meta[name^="twitter:"]', new TagRemover())
      .on('title', new TagRemover())
      .on('head', new HeadInjector())
      .transform(response);
  }
  
  return next();
}
