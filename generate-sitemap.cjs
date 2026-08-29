const fs = require('fs');
const https = require('https');

const DOMAIN = 'https://myexamcompanion.pages.dev';
const R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

// The active countries we want to fetch configs for
const COUNTRIES = ['ng', 'gh', 'us'];

// Helper to fetch JSON via HTTPS
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            resolve(null); // Ignore 404s safely
          } else {
            resolve(JSON.parse(body));
          }
        } catch (e) {
          console.error(`Error parsing JSON from ${url}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => reject(e));
  });
}

async function generateGlobalSitemap() {
  console.log('Starting Global Sitemap Generation...');
  const sitemapFiles = []; // e.g., 'sitemap-ng.xml'

  // Always generate a static routes sitemap
  let staticXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const staticRoutes = ['/', '/index.html', '/modules/index.html'];
  staticRoutes.forEach(route => {
    staticXml += `  <url>\n    <loc>${DOMAIN}${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  });
  staticXml += `</urlset>`;
  fs.writeFileSync('public/sitemap-static.xml', staticXml);
  sitemapFiles.push('sitemap-static.xml');

  // Process each country
  for (const country of COUNTRIES) {
    const configUrl = `${R2_BASE}/configs/${country}.json`;
    console.log(`\nFetching config for country: ${country} -> ${configUrl}`);
    
    const config = await fetchJson(configUrl);
    if (!config || !config.dashboard_modules) {
      console.log(`Skipping ${country}: No dashboard modules found.`);
      continue;
    }

    let countryUrls = [];

    // Process each exam in this country
    for (const module of config.dashboard_modules) {
      if (!module.data_source || module.type === 'link') continue;
      
      const examId = module.id; // e.g. "nigeria/jamb"
      const indexUrl = `${R2_BASE}/${module.data_source}`;
      
      console.log(`  Fetching Exam Index: ${examId} -> ${indexUrl}`);
      const indexData = await fetchJson(indexUrl);
      
      if (indexData && indexData.subjects) {
        // Add the exam selection home
        countryUrls.push({
          loc: `${DOMAIN}/study/${examId}`,
          priority: '0.9',
          freq: 'weekly'
        });

        // Add every subject and year
        indexData.subjects.forEach(subject => {
          // Subject home (All Years)
          countryUrls.push({
            loc: `${DOMAIN}/study/${examId}/${encodeURIComponent(subject.id)}`,
            priority: '0.8',
            freq: 'weekly'
          });

          // Specific Years
          if (subject.years) {
            subject.years.forEach(year => {
              countryUrls.push({
                loc: `${DOMAIN}/study/${examId}/${encodeURIComponent(subject.id)}/${year}`,
                priority: '0.7',
                freq: 'monthly'
              });
            });
          }
        });
      }
    }

    // Generate Sitemap for this country if it has URLs
    if (countryUrls.length > 0) {
      const sitemapName = `sitemap-${country}.xml`;
      let countryXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      countryUrls.forEach(u => {
        // XML requires & to be escaped as &amp; in loc tags (this is correct XML, not a bug)
        // Browsers/Google will correctly decode &amp; back to & when following the link
        const cleanLoc = u.loc.replace(/&/g, '&amp;');
        countryXml += `  <url>\n    <loc>${cleanLoc}</loc>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
      });
      countryXml += `</urlset>`;
      
      fs.writeFileSync(`public/${sitemapName}`, countryXml);
      sitemapFiles.push(sitemapName);
      console.log(`✅ Generated ${sitemapName} with ${countryUrls.length} URLs.`);
    }
  }

  // Generate Master Sitemap Index
  console.log(`\nGenerating Master Sitemap Index (sitemap.xml)...`);
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapFiles.forEach(file => {
    indexXml += `  <sitemap>\n    <loc>${DOMAIN}/${file}</loc>\n  </sitemap>\n`;
  });
  indexXml += `</sitemapindex>`;
  
  fs.writeFileSync('public/sitemap.xml', indexXml);
  console.log('🎉 Global Sitemap generation complete!');
}

generateGlobalSitemap().catch(console.error);
