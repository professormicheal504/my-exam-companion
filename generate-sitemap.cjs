const fs = require('fs');
const https = require('https');
const path = require('path');

const DOMAIN = 'https://www.myexamcompanion.com';
const R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
const COUNTRIES = ['ng', 'gh', 'us'];

const PUBLIC_DIR = path.join(__dirname, 'public');
const SITEMAPS_DIR = path.join(PUBLIC_DIR, 'sitemaps');
if (!fs.existsSync(SITEMAPS_DIR)) {
  fs.mkdirSync(SITEMAPS_DIR, { recursive: true });
}

const LASTMOD = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Byte threshold before an exam's test sitemap is split per-subject
// (keeps every child comfortably under the 50MB / 50k-URL limits and the
// 250KB sanity cap enforced by e2e/sitemap.spec.ts)
const SPLIT_THRESHOLD_BYTES = 90000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            resolve(null);
          } else {
            resolve(JSON.parse(body));
          }
        } catch (e) {
          console.error('Error parsing JSON from ' + url + ':', e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

function esc(loc) {
  return loc.replace(/&/g, '&amp;');
}

function buildUrlset(entries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of entries) {
    xml += '  <url>\n    <loc>' + esc(u.loc) + '</loc>\n    <lastmod>' + (u.lastmod || LASTMOD) + '</lastmod>\n    <changefreq>' + u.freq + '</changefreq>\n    <priority>' + u.priority + '</priority>\n  </url>\n';
  }
  xml += '</urlset>';
  return xml;
}

function writeSitemap(relPath, entries) {
  const abs = path.join(SITEMAPS_DIR, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const xml = buildUrlset(entries);
  fs.writeFileSync(abs, xml, 'utf8');
  const bytes = Buffer.byteLength(xml, 'utf8');
  const rel = relPath.split(path.sep).join('/');
  console.log('  OK sitemaps/' + rel + ' - ' + entries.length + ' URLs, ' + bytes + ' bytes');
  return bytes;
}

// Remove stale generated sitemaps for a country so the master index never
// references orphaned files from previous runs.
function cleanCountryDir(cc) {
  const dir = path.join(SITEMAPS_DIR, cc);
  if (!fs.existsSync(dir)) return;
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.xml')) fs.unlinkSync(p);
    }
  };
  walk(dir);
}

// Remove legacy monolithic files at the sitemaps root (ng.xml, gh.xml, us.xml)
function cleanLegacyRootFiles() {
  for (const cc of COUNTRIES) {
    const p = path.join(SITEMAPS_DIR, cc + '.xml');
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('  Removed legacy sitemaps/' + cc + '.xml');
    }
  }
}

async function generateGlobalSitemap() {
  console.log('Starting Global Sitemap Generation...');
  console.log('lastmod for this run: ' + LASTMOD + '\n');

  // ---- Global static sitemap ----
  const staticEntries = [
    { loc: DOMAIN + '/',                   freq: 'daily',   priority: '1.0' },
    { loc: DOMAIN + '/ng',                 freq: 'daily',   priority: '1.0' },
    { loc: DOMAIN + '/gh',                 freq: 'daily',   priority: '0.9' },
    { loc: DOMAIN + '/us',                 freq: 'daily',   priority: '0.9' },
    { loc: DOMAIN + '/ng/test',            freq: 'daily',   priority: '0.9' },
    { loc: DOMAIN + '/ng/study/classroom', freq: 'weekly',  priority: '0.9' },
    { loc: DOMAIN + '/ng/study/brochure',  freq: 'weekly',  priority: '0.8' },
    { loc: DOMAIN + '/ng/pricing',         freq: 'monthly', priority: '0.7' },
    { loc: DOMAIN + '/ng/blog',            freq: 'weekly',  priority: '0.7' },
  ];
  writeSitemap('static.xml', staticEntries);

  cleanLegacyRootFiles();

  for (const cc of COUNTRIES) {
    const configUrl = R2_BASE + '/configs/' + cc + '.json';
    console.log('\nFetching config for country: ' + cc + ' -> ' + configUrl);

    const config = await fetchJson(configUrl);
    if (!config || !config.dashboard_modules) {
      console.log('Skipping ' + cc + ': No dashboard modules found.');
      continue;
    }

    cleanCountryDir(cc);

    // ---- {cc}/home.xml ----
    const homeEntries = [
      { loc: DOMAIN + '/' + cc, freq: 'daily', priority: '1.0' },
    ];

    // ---- {cc}/study.xml : classroom hub URLs ----
    const studyEntries = [
      { loc: DOMAIN + '/' + cc + '/study/classroom', freq: 'weekly', priority: '0.9' },
    ];
    // ---- {cc}/test/{exam}.xml : year-level classroom URLs ----
    const testGroups = new Map();

    for (const module of config.dashboard_modules) {
      if (!module.data_source || module.type === 'link') continue;

      const examId   = module.id;
      const examSlug = examId.split('/').pop();
      const indexUrl = R2_BASE + '/' + module.data_source;

      console.log('  Fetching Exam Index: ' + examId + ' -> ' + indexUrl);
      const indexData = await fetchJson(indexUrl);

      if (indexData && indexData.subjects) {
        // Classroom exam hub: /[cc]/study/classroom/[exam]
        studyEntries.push({ loc: DOMAIN + '/' + cc + '/study/classroom/' + examSlug, freq: 'weekly', priority: '0.8' });

        const subjectGroups = new Map();

        indexData.subjects.forEach(subject => {
          const sid = subject.id;
          // Classroom subject page: /[cc]/study/classroom/[exam]/[subject]
          studyEntries.push({ loc: DOMAIN + '/' + cc + '/study/classroom/' + examSlug + '/' + sid, freq: 'weekly', priority: '0.8' });

          const yearEntries = [];
          if (subject.years) {
            subject.years.forEach(year => {
              yearEntries.push({
                loc: DOMAIN + '/' + cc + '/study/classroom/' + examSlug + '/' + sid + '/' + year,
                freq: 'monthly',
                priority: '0.7',
              });
            });
          }
          if (yearEntries.length > 0) subjectGroups.set(sid, yearEntries);
        });

        if (subjectGroups.size > 0) testGroups.set(examSlug, subjectGroups);
      }
    }

    if (homeEntries.length > 0) writeSitemap(path.join(cc, 'home.xml'), homeEntries);
    if (studyEntries.length > 0) writeSitemap(path.join(cc, 'study.xml'), studyEntries);

    for (const [examSlug, subjectGroups] of testGroups) {
      const allEntries = [];
      for (const [, entries] of subjectGroups) allEntries.push(...entries);
      const approxBytes = Buffer.byteLength(allEntries.map(e => e.loc).join('\n'), 'utf8');

      if (approxBytes <= SPLIT_THRESHOLD_BYTES) {
        writeSitemap(path.join(cc, 'test', examSlug + '.xml'), allEntries);
      } else {
        console.log('  -> ' + examSlug + ' is large (' + approxBytes + ' bytes), splitting per subject');
        for (const [sid, entries] of subjectGroups) {
          writeSitemap(path.join(cc, 'test', examSlug + '-' + sid + '.xml'), entries);
        }
      }
    }
  }

  // ---- Rebuild master index (public/sitemap.xml) ----
  try {
    const buildIndex = require('./scripts/build_sitemap_index.cjs');
    if (typeof buildIndex.main === 'function') buildIndex.main();
  } catch (e) {
    console.warn('build_sitemap_index.cjs failed:', e.message);
  }

  console.log('\nSitemap generation complete. Submit ' + DOMAIN + '/sitemap.xml in Google Search Console.');
}

generateGlobalSitemap().catch(console.error);