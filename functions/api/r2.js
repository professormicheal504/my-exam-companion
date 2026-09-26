export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    
    if (!res.ok) {
      return new Response(`Failed to fetch from R2: ${res.status}`, { status: res.status });
    }

    const body = await res.text();
    const contentType = res.headers.get('content-type') || 'text/html;charset=UTF-8';
    
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(`Error fetching from R2: ${err.message}`, { status: 500 });
  }
}
