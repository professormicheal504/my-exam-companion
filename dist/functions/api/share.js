export async function onRequest(context) {
  const url = new URL(context.request.url);
  const examId = url.searchParams.get('exam_id') || 'nigeria/jamb';
  const subject = url.searchParams.get('subject') || 'general';
  const qId = url.searchParams.get('q') || '1';
  const mode = url.searchParams.get('mode') || 'poll';
  const year = url.searchParams.get('year') || '2023';
  
  // Clean up strings for display
  const examParts = examId.split('/');
  const examBody = examParts[examParts.length - 1].toUpperCase();
  const subjectDisplay = subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const title = `${examBody} ${subjectDisplay} Question | My Exam Companion`;
  const description = `Can you solve this ${examBody} ${subjectDisplay} question? Join the discussion and cast your vote on My Exam Companion!`;
  
  // The actual destination URL
  const destinationUrl = new URL('/modules/study/classroom/classroom_discussion.html', url.origin);
  destinationUrl.searchParams.set('exam_id', examId);
  destinationUrl.searchParams.set('subject', subject);
  destinationUrl.searchParams.set('year', year);
  destinationUrl.searchParams.set('q', qId);
  destinationUrl.searchParams.set('mode', mode);

  const imageUrl = new URL('/api/og-image', url.origin);
  imageUrl.searchParams.set('exam_id', examId);
  imageUrl.searchParams.set('subject', subject);
  imageUrl.searchParams.set('year', year);
  imageUrl.searchParams.set('q', qId);
  imageUrl.searchParams.set('id', qId);

  // Forward social proof data (Shared by avatar/name)
  const userName = url.searchParams.get('user_name');
  const userAvatar = url.searchParams.get('user_avatar');
  if (userName) imageUrl.searchParams.set('user_name', userName);
  if (userAvatar) imageUrl.searchParams.set('user_avatar', userAvatar);

  // Forward cache buster to force Facebook to scrape the new image
  const cacheBuster = url.searchParams.get('_t') || url.searchParams.get('v');
  if (cacheBuster) {
    imageUrl.searchParams.set('_t', cacheBuster);
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
  </script>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
  <p>Redirecting you to the question on My Exam Companion...</p>
  <p><a href="${destinationUrl.toString()}">Click here if you are not redirected automatically.</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Allow scrapers to cache for 1 hour
    },
  });
}
