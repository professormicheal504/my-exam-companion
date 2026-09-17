const fs = require('fs');
const path = require('path');
const SITEMAPS_DIR = path.resolve(__dirname, '../public/sitemaps/brochure');

function toSlug(name, id) {
  const slugName = (name || 'institution')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${slugName}-${id}`;
}

function letterBucket(slug) {
  const c = (slug[0] || 'a').toLowerCase();
  if (c < 'f') return 'a';
  if (c < 'l') return 'b';
  if (c < 'r') return 'c';
  if (c < 'w') return 'd';
  return 'e';
}

function buildUrlsetXml(entries, homeUrl) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  if (homeUrl) {
    xml += `  <url>\n    <loc>${homeUrl}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }
  for (const loc of entries) {
    xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  xml += `</urlset>\n`;
  return xml;
}

async function generate() {
  const R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
  const DOMAIN = 'https://www.myexamcompanion.com';
  const countries = [{ code: 'ng' }, { code: 'gh' }];

  for (const { code } of countries) {
    try {
      const res = await fetch(`${R2_BASE}/${code}/brochure/institutions.json`);
      if (!res.ok) { console.log(`Skip ${code}: ${res.status}`); continue; }
      const institutions = await res.json();

      const allUrls = institutions
        .filter(inst => inst.id)
        .map(inst => `${DOMAIN}/${code}/study/brochure/${toSlug(inst.school_name, inst.id)}`);

      const countryDir = path.join(SITEMAPS_DIR, code);
      if (!fs.existsSync(countryDir)) {
        fs.mkdirSync(countryDir, { recursive: true });
      }

      if (code === 'ng' && allUrls.length > 500) {
        const buckets = { a: [], b: [], c: [], d: [], e: [] };
        for (const url of allUrls) {
          const slug = url.split('/').pop();
          buckets[letterBucket(slug)].push(url);
        }
        for (const key of Object.keys(buckets)) {
          if (buckets[key].length === 0) continue;
          const file = `${key}.xml`;
          const xml = buildUrlsetXml(buckets[key], key === 'a' ? `${DOMAIN}/${code}/study/brochure` : null);
          fs.writeFileSync(path.join(countryDir, file), xml, 'utf8');
          console.log(`Generated brochure/${code}/${file} — ${buckets[key].length} institutions`);
        }
      } else {
        const file = `all.xml`;
        const xml = buildUrlsetXml(allUrls, `${DOMAIN}/${code}/study/brochure`);
        fs.writeFileSync(path.join(countryDir, file), xml, 'utf8');
        console.log(`Generated brochure/${code}/${file} — ${allUrls.length} institutions`);
      }
    } catch (e) { console.error(e.message); }
  }
}
generate();
