const fs = require('fs');
const path = require('path');

const SITEMAPS_DIR = path.resolve(__dirname, '..', 'public', 'sitemaps');

const COUNTRY_PREFIX = { ng: 'nigeria', gh: 'ghana' };

function buildXml(entries) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const loc of entries) {
    xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }
  xml += `</urlset>\n`;
  return xml;
}

function splitCountry(country) {
  const prefix = COUNTRY_PREFIX[country];
  if (!prefix) throw new Error(`Unknown country code: ${country}`);
  
  const countryDir = path.join(SITEMAPS_DIR, country);
  if (!fs.existsSync(countryDir)) {
    fs.mkdirSync(countryDir, { recursive: true });
  }

  const src = path.join(SITEMAPS_DIR, `${country}.xml`);

  let locs = [];
  if (fs.existsSync(src)) {
    const xml = fs.readFileSync(src, 'utf8');
    const locRe = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = locRe.exec(xml)) !== null) locs.push(m[1]);
    console.log(`  read ${locs.length} locs from monolithic ${path.basename(src)}`);
  } else {
    const allFiles = fs.readdirSync(countryDir).filter(f => f.endsWith('.xml'));
    for (const f of allFiles) {
      const xml = fs.readFileSync(path.join(countryDir, f), 'utf8');
      const locRe = /<loc>([^<]+)<\/loc>/g;
      let m;
      while ((m = locRe.exec(xml)) !== null) locs.push(m[1]);
    }
    console.log(`  read ${locs.length} locs from ${allFiles.length} existing chunks`);
    for (const f of allFiles) {
      fs.unlinkSync(path.join(countryDir, f));
    }
  }

  if (locs.length === 0) {
    console.log(`  nothing to split for ${country}`);
    return [];
  }

  const groups = new Map();
  for (const loc of locs) {
    const u = new URL(loc);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'study' || parts[1] !== prefix) continue;
    const exam = parts[2] || 'home';
    if (!groups.has(exam)) groups.set(exam, []);
    groups.get(exam).push(loc);
  }

  const written = [];
  for (const [exam, entries] of groups) {
    if (Buffer.byteLength(entries.join('\n'), 'utf8') > 100_000) {
      const subGroups = new Map();
      for (const loc of entries) {
        const u = new URL(loc);
        const parts = u.pathname.split('/').filter(Boolean);
        const sub = parts[3] || 'home';
        if (!subGroups.has(sub)) subGroups.set(sub, []);
        subGroups.get(sub).push(loc);
      }
      for (const [sub, subEntries] of subGroups) {
        const file = `${exam}-${sub}.xml`;
        const xml = buildXml(subEntries);
        fs.writeFileSync(path.join(countryDir, file), xml, 'utf8');
        written.push({ file, urls: subEntries.length, bytes: Buffer.byteLength(xml, 'utf8') });
        console.log(`  ✅ ${file} — ${subEntries.length} URLs, ${written[written.length - 1].bytes} bytes`);
      }
    } else {
      const file = `${exam}.xml`;
      const xml = buildXml(entries);
      fs.writeFileSync(path.join(countryDir, file), xml, 'utf8');
      written.push({ file, urls: entries.length, bytes: Buffer.byteLength(xml, 'utf8') });
      console.log(`  ✅ ${file} — ${entries.length} URLs, ${written[written.length - 1].bytes} bytes`);
    }
  }

  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
    console.log(`  🗑️  Removed ${path.basename(src)}`);
  }

  return written;
}

function main() {
  console.log('Splitting NG sitemap...');
  splitCountry('ng');
  console.log('Splitting GH sitemap...');
  splitCountry('gh');
}

if (require.main === module) {
  main();
}

module.exports = { main };
