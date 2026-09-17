const fs = require('fs');
const path = require('path');

const PUBLIC = path.resolve(__dirname, '../public');
const SITEMAPS_DIR = path.join(PUBLIC, 'sitemaps');
const DOMAIN = 'https://www.myexamcompanion.com';

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.xml')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function main() {
  console.log('Building sitemap.xml index...');
  
  const allSitemaps = walkDir(SITEMAPS_DIR).sort();
  
  let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (const filePath of allSitemaps) {
    // Convert absolute path to URL path relative to public/
    // e.g., C:/.../public/sitemaps/ng/jamb.xml -> sitemaps/ng/jamb.xml
    const relativePath = path.relative(PUBLIC, filePath).replace(/\\/g, '/');
    indexXml += `  <sitemap>\n    <loc>${DOMAIN}/${relativePath}</loc>\n  </sitemap>\n`;
  }
  
  indexXml += `</sitemapindex>\n`;
  
  const indexPath = path.join(PUBLIC, 'sitemap.xml');
  fs.writeFileSync(indexPath, indexXml, 'utf8');
  
  console.log(`✅ ${path.basename(indexPath)} updated with ${allSitemaps.length} child sitemaps`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
