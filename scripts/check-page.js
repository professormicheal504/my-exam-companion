const http = require('http');
const https = require('https');

const URLs = [
  'http://localhost:5000/ng',
  'http://localhost:5000/gh',
  'http://localhost:5000/ng/study/classroom',
  'http://localhost:5000/ng/study/classroom/jamb/mathematics',
  'http://localhost:5000/ng/test/jamb/mathematics/2023/play',
  'http://localhost:5000/login',
  'http://localhost:5000/modules/auth/login.html'
];

async function checkURL(url, hops = 0) {
  if (hops > 2) {
    console.error(`❌ [FAIL] ${url} exceeded max hops (${hops})`);
    return;
  }
  
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) {
            const parsed = new URL(url);
            nextUrl = parsed.origin + nextUrl;
        }
        console.log(`⚠️  [${res.statusCode}] ${url} -> ${nextUrl}`);
        resolve(checkURL(nextUrl, hops + 1));
      } else {
        const icon = res.statusCode === 200 ? '✅' : '❌';
        console.log(`${icon} [${res.statusCode}] ${url}`);
        resolve();
      }
    }).on('error', (e) => {
      console.error(`❌ [ERROR] ${url}: ${e.message}`);
      resolve();
    });
  });
}

(async () => {
  console.log('Testing Local Dev Server URLs...');
  for (const u of URLs) {
    await checkURL(u);
  }
  console.log('Done.');
})();
