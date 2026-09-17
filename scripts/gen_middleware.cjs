const fs = require('fs');
const text = fs.readFileSync('public/_redirects', 'utf8');

const exactRoutes = {};
const prefixRoutes = {};

for (const line of text.split('\n')) {
  if (line.trim().startsWith('#') || !line.trim()) continue;
  const parts = line.trim().split(/\s+/);
  if (parts.length === 3 && parts[2] === '200') {
    if (parts[1].startsWith('/modules/')) {
      const src = parts[0];
      const dest = parts[1].replace(/\.html$/, '');
      
      // Skip routes that have their own custom functions
      if (src.includes('/study/classroom')) continue;

      if (src.endsWith('/*')) {
        prefixRoutes[src.replace('/*', '/')] = dest;
      } else {
        exactRoutes[src] = dest;
      }
    }
  }
}

const middlewareCode = `export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Redirect *.pages.dev traffic to the canonical domain to prevent duplicate content
  if (url.hostname.endsWith('.pages.dev')) {
    const canonical = 'https://myexamcompanion.com' + path + url.search;
    return Response.redirect(canonical, 301);
  }

  const exactRoutes = ${JSON.stringify(exactRoutes, null, 2)};
  const prefixRoutes = ${JSON.stringify(prefixRoutes, null, 2)};

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
`;

fs.writeFileSync('functions/_middleware.js', middlewareCode);
console.log('functions/_middleware.js generated successfully.');
