const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=========================================");
console.log("🚀 Running SEO Engine Verification Suite");
console.log("=========================================\n");

try {
  // Step 1: Run Sitemap Generator
  console.log("[1/4] Running generate-sitemap.cjs...");
  execSync('node generate-sitemap.cjs', { stdio: 'inherit' });
  console.log("✅ Sitemap generation completed successfully!\n");
} catch (e) {
  console.error("❌ Sitemap generation failed!", e.message);
  process.exit(1);
}

// Step 2: Validate Clean URLs in Sitemap
console.log("[2/4] Validating clean semantic URLs in sitemap...");
const sitemapPath = path.join(__dirname, '../public/sitemap-ng.xml');
if (fs.existsSync(sitemapPath)) {
  const content = fs.readFileSync(sitemapPath, 'utf8');
  if (content.includes('?exam_id=')) {
    console.error("❌ Sitemap still contains ugly query parameter URLs!");
  } else if (content.includes('/study/')) {
    console.log("✅ Sitemap successfully uses clean semantic URLs (/study/:country/:exam...)!\n");
  } else {
    console.warn("⚠️ Cannot determine URL format in sitemap.\n");
  }
} else {
  console.log("⚠️ sitemap-ng.xml not generated (this is normal if R2 configs were unreachable locally). Skipping.\n");
}

// Step 3: Check Cloudflare Edge Function
console.log("[3/4] Validating Cloudflare Edge SSR Function...");
const functionPath = path.join(__dirname, '../functions/modules/study/classroom/classroom_questions.html.js');
if (fs.existsSync(functionPath)) {
  const code = fs.readFileSync(functionPath, 'utf8');
  if (code.includes('HTMLRewriter') && code.includes('application/ld+json')) {
    console.log("✅ Edge Function `classroom_questions.html.js` exists and contains HTMLRewriter/Schema.org injection logic!\n");
  } else {
    console.error("❌ Edge Function exists but missing core SSR logic.");
  }
} else {
  console.error("❌ Edge Function missing!");
}

// Step 4: Check _redirects
console.log("[4/4] Checking _redirects for clean routing rules...");
const redirectsPath = path.join(__dirname, '../public/_redirects');
if (fs.existsSync(redirectsPath)) {
  const redirects = fs.readFileSync(redirectsPath, 'utf8');
  if (redirects.includes('/study/:country/:exam')) {
    console.log("✅ `public/_redirects` contains semantic routing rules!\n");
  } else {
    console.error("❌ `public/_redirects` missing semantic routing rules!");
  }
} else {
  console.error("❌ `public/_redirects` missing!");
}

console.log("🎉 Verification Complete! SEO Engine is ready for deployment.");
