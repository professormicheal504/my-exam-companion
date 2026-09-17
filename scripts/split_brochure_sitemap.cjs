// Split the existing public/sitemap-brochure-ng.xml into 5 alphabet-chunked files
// so each one stays small enough for Google to fetch in <1s.
//
// Run: node scripts/split_brochure_sitemap.cjs
//
// Reads:  public/sitemap-brochure-ng.xml
// Writes: public/sitemap-brochure-ng-a.xml .. public/sitemap-brochure-ng-e.xml
//         (deletes the old monolithic file)
//         and rewrites public/sitemap.xml index accordingly.

const fs = require('fs');
const path = require('path');

const PUBLIC = path.resolve(__dirname, '..', 'public');
const SRC_FILE = path.join(PUBLIC, 'sitemap-brochure-ng.xml');
const DOMAIN = 'https://www.myexamcompanion.com';

if (!fs.existsSync(SRC_FILE)) {
  console.error(`Source not found: ${SRC_FILE}`);
  process.exit(1);
}

const xml = fs.readFileSync(SRC_FILE, 'utf8');

// Extract every <loc>...</loc> block we can. We split on the country-home URL too,
// so each chunk has its own top-level entry pointing to /brochure/ng.
const locRe = /<loc>([^<]+)<\/loc>/g;
const locs = [];
let m;
while ((m = locRe.exec(xml)) !== null) locs.push(m[1]);

// Bucket: 5 letter groups
const BUCKETS = [
  { label: 'a', range: ['a', 'f'] },
  { label: 'b', range: ['f', 'l'] },
  { label: 'c', range: ['l', 'r'] },
  { label: 'd', range: ['r', 'w'] },
  { label: 'e', range: ['w', 'z'] + 1 } // last bucket catches w..z + leftovers
];

// Simpler & safer: split 1,623 entries round-robin into 5 buckets by first-letter bin
const letterBucket = (ch) => {
  const c = ch.toLowerCase();
  if (c < 'f') return 'a';
  if (c < 'l') return 'b';
  if (c < 'r') return 'c';
  if (c < 'w') return 'd';
  return 'e';
};

const buckets = { a: [], b: [], c: [], d: [], e: [] };

for (const loc of locs) {
  // loc like https://myexamcompanion.pages.dev/brochure/ng/<slug>-<id>
  const u = new URL(loc);
  const parts = u.pathname.split('/').filter(Boolean); // ['brochure','ng', slug]
  const slug = parts[2] || '';
  if (parts[0] !== 'brochure' || parts[1] !== 'ng') {
    // Country-home entry goes into bucket 'a' (or every chunk — we'll put it in 'a' only)
    buckets.a.push(loc);
    continue;
  }
  const firstChar = slug[0] || 'a';
  buckets[letterBucket(firstChar)].push(loc);
}

// Build sitemap chunks
const chunkFiles = [];
for (const key of Object.keys(buckets)) {
  const entries = buckets[key];
  if (entries.length === 0) continue;
  let chunkXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  // Always include the country home in chunk 'a' so it has at least the home page.
  if (key === 'a' && !entries.includes(`${DOMAIN}/brochure/ng`)) {
    chunkXml += `  <url>\n    <loc>${DOMAIN}/brochure/ng</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }
  for (const loc of entries) {
    if (loc === `${DOMAIN}/brochure/ng`) continue; // already added above
    chunkXml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  chunkXml += `</urlset>\n`;

  const outPath = path.join(PUBLIC, `sitemap-brochure-ng-${key}.xml`);
  fs.writeFileSync(outPath, chunkXml, 'utf8');
  chunkFiles.push({ key, file: `sitemap-brochure-ng-${key}.xml`, urls: entries.length + (key === 'a' ? 1 : 0) - 1, bytes: Buffer.byteLength(chunkXml, 'utf8') });
  console.log(`  ✅ ${path.basename(outPath)} — ${chunkFiles[chunkFiles.length - 1].urls} URLs, ${chunkFiles[chunkFiles.length - 1].bytes} bytes`);
}

// Remove the old monolithic file
fs.unlinkSync(SRC_FILE);
console.log(`  🗑️  Removed ${path.basename(SRC_FILE)}`);

// Rewrite public/sitemap.xml index
const indexPath = path.join(PUBLIC, 'sitemap.xml');
let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
const referenced = [
  'sitemap-static.xml',
  'sitemap-ng.xml',
  'sitemap-gh.xml',
  'sitemap-us.xml',
  ...chunkFiles.map(c => c.file)
];
for (const file of referenced) {
  indexXml += `  <sitemap>\n    <loc>${DOMAIN}/${file}</loc>\n  </sitemap>\n`;
}
indexXml += `</sitemapindex>\n`;
fs.writeFileSync(indexPath, indexXml, 'utf8');
console.log(`  ✅ ${path.basename(indexPath)} updated with ${referenced.length} child sitemaps`);

console.log('\nDone.');
