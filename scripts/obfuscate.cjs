/**
 * My Exam Companion - Obfuscation Build Script
 * Run: node scripts/obfuscate.cjs
 * Output: dist/ (deploy this to Cloudflare Pages instead of public/)
 *
 * Incremental builds: only files newer than their dist/ counterpart are
 * re-processed. Pass --force to wipe dist/ and do a full rebuild.
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify: minifyHTML } = require('html-minifier-terser');
const CleanCSS = require('clean-css');

const SRC  = path.resolve(__dirname, '../public');
const DIST = path.resolve(__dirname, '../dist');
const CACHE_FILE = path.resolve(__dirname, '../.build-cache.json');

const FORCE = process.argv.includes('--force');

// ─── ALL global function names called from HTML onclick/onchange/etc ───────
// These MUST NOT be renamed or the app will break.
const RESERVED_NAMES = [
  "applyFormat","applyTopicFilter","back","buyCredit","clearReplyParent",
  "closeAuthAlert","closeModal","closePopup","closeRequestModal","closeResult",
  "closeReactionPopout","closeThumbModal","closeViewer","completeTask",
  "confirmAccount","confirmLock","copyCode","copyDiscussionLink",
  "deleteQuestions","downloadTemplate","downloadNovelWithAd","execCmd","filterByTopic",
  "filterCourses","filterSubjects","filterTopics","filterUniversities",
  "finishOnboarding","goCreate","goToLogin","goToPage","goToPreview",
  "handleCountryFilterChange","handleDecision","handleGoogleLogin",
  "handleGoogleSignUp","handleImageFile","handleKey","handleLogin",
  "handleNext","handleProceed","handleResetPassword","handleSaveProfile",
  "handleSendOTP","handleSheetOverlayClick","handleSignUp","handleThumbnail",
  "handleTopicKey","handleVerify","joinExam","joinLive","loadHistory",
  "loadLeaderboard","loadQuestions","lockAnswer","navigate","onCategoryChange",
  "onDeleteModeToggle","onExamBodyChange","openCreate","openForgotPassword",
  "openPopup","openRequestModal","openReview","openThumbModal","openTopicModal",
  "previewImage","proceedToExam","processPayment","removeTag","resetUpload",
  "reviewExam","saveDraft","searchFriend","selectChip","selectMode","sendChat",
  "setFilter","setMode","setPrompt","setReplyParent","shareArticle",
  "shareAsPoll","shareDiscussionNative","shareFacebook","shareNative",
  "shareTwitter","shareWhatsApp","showLoginForm","simSetCredits","simSetDay",
  "skipWithAd","spinWheel","spinWithAd","startExam","startMockExam",
  "startReview","startRound","submitArticle","submitPollVote","submitReaction",
  "submitRequest","switchTab","syncContrib","syncToStaging","tapOption",
  "toggleBtn","toggleCommentReaction","toggleFaculty","toggleNotify",
  "toggleSubjPanel","toggleTopicDropdown","updateDepartments","updateDropdowns",
  "updatePathPreview","updateStates",
  // Common browser globals (never rename these)
  "window","document","console","localStorage","sessionStorage","fetch",
  "setTimeout","setInterval","clearTimeout","clearInterval","Promise",
  "JSON","Math","Date","Array","Object","String","Number","Boolean",
  "MathJax","MECSupabase","supabase"
];

// ─── Obfuscator config ─────────────────────────────────────────────────────
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,       // Keep false — can break async/await
  deadCodeInjection: false,           // Keep false — adds bloat
  debugProtection: false,             // Freezes debugger in DevTools
  debugProtectionInterval: 0,         // Re-triggers every 4s
  disableConsoleOutput: true,         // Silences console.log in production
  identifierNamesGenerator: 'hexadecimal', // Renames vars to _0x1a2b etc
  renameGlobals: false,               // IMPORTANT: don't rename window-level globals
  reservedNames: RESERVED_NAMES,      // Whitelist: these names are NEVER renamed
  rotateStringArray: true,
  selfDefending: true,                // Breaks if code is reformatted
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],    // Encodes all string literals
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  transformObjectKeys: false,         // Keep false — can break obj key lookups
  unicodeEscapeSequence: false,
  target: 'browser',
};

// ─── CSS Minifier ──────────────────────────────────────────────────────────
const cssMinifier = new CleanCSS({ level: 2 });

// ─── HTML Minifier options ─────────────────────────────────────────────────
const HTML_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyCSS: false, // We handle CSS ourselves
  minifyJS: false,  // We handle JS ourselves
};

// ─── Incremental build cache ───────────────────────────────────────────────
// Maps source file path → last processed mtime (ms).
// On the next run we compare the current mtime; if it hasn't changed we skip.
let _cache = {};

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      _cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {
    _cache = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache, null, 2), 'utf8');
  } catch (e) { /* non-fatal */ }
}

/**
 * Returns true if the source file needs (re-)processing:
 *  - dist output does not exist yet, OR
 *  - source mtime is newer than the recorded mtime (meaning it changed)
 */
function needsUpdate(srcPath, distPath) {
  if (!fs.existsSync(distPath)) return true;
  const srcMtime = fs.statSync(srcPath).mtimeMs;
  const cached   = _cache[srcPath];
  return !cached || srcMtime > cached;
}

function markDone(srcPath) {
  _cache[srcPath] = fs.statSync(srcPath).mtimeMs;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function obfuscateJS(code, filePath) {
  try {
    const obfuscated = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS);
    return obfuscated.getObfuscatedCode();
  } catch (e) {
    console.error(`Failed to obfuscate ${filePath}:`, e.message);
    return code; // Fallback to raw code if obfuscation fails so we don't break the build
  }
}

function minifyCSS(code) {
  try {
    return cssMinifier.minify(code).styles || code;
  } catch (e) {
    return code;
  }
}

// ─── Process an HTML file ──────────────────────────────────────────────────
async function processHTML(filePath, outPath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Obfuscate inline <script> blocks (skip defer/src/module/MathJax/anti-flash)
  content = content.replace(
    /<script(\s[^>]*)?>[\s\S]*?<\/script>/gi,
    (match, attrs) => {
      attrs = attrs || '';
      // Skip external scripts (have src=), module scripts, json-ld schemas, and the tiny anti-flash snippet
      if (/src\s*=/i.test(attrs)) return match;
      if (/type\s*=\s*["']module["']/i.test(attrs)) return match;
      if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) return match;

      const inner = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      if (!inner || inner.length < 50) return match; // skip tiny/empty blocks

      const obfuscated = obfuscateJS(inner, filePath);
      return `<script${attrs}>${obfuscated}</script>`;
    }
  );

  // 2. Minify inline <style> blocks
  content = content.replace(
    /<style(\s[^>]*)?>[\s\S]*?<\/style>/gi,
    (match, attrs) => {
      attrs = attrs || '';
      const inner = match.replace(/<style[^>]*>/i, '').replace(/<\/style>/i, '').trim();
      if (!inner) return match;
      const minified = minifyCSS(inner);
      return `<style${attrs}>${minified}</style>`;
    }
  );

  // 3. Minify HTML structure
  try {
    content = await minifyHTML(content, HTML_OPTIONS);
  } catch (e) {
    // If HTML minification fails, keep the current content
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
}

// ─── Process a standalone .js file ────────────────────────────────────────
function processJS(filePath, outPath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const obfuscated = obfuscateJS(content, filePath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, obfuscated, 'utf8');
}

// ─── Directories to skip obfuscation (copy as-is) ──────────────────────────
const SKIP_OBFUSCATION = [
  'editor_program',
  'publisher_program',
];

function shouldSkipObfuscation(filePath) {
  return SKIP_OBFUSCATION.some(dir => filePath.includes(path.sep + dir + path.sep));
}

// ─── Recursively walk and process ─────────────────────────────────────────
let _processed = 0;
let _skipped   = 0;

async function walk(srcDir, distDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath  = path.join(srcDir, entry.name);
    const distPath = path.join(distDir, entry.name);

    if (entry.isDirectory()) {
      await walk(srcPath, distPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    const skipObfuscate = shouldSkipObfuscation(srcPath);

    if (ext === '.html') {
      if (!needsUpdate(srcPath, distPath)) { _skipped++; continue; }
      if (skipObfuscate) {
        process.stdout.write(`  HTML* ${path.relative(SRC, srcPath)} (no obfuscation)\n`);
        // Just minify HTML, don't obfuscate JS
        let content = fs.readFileSync(srcPath, 'utf8');
        try {
          content = await minifyHTML(content, HTML_OPTIONS);
        } catch (e) {}
        fs.mkdirSync(path.dirname(distPath), { recursive: true });
        fs.writeFileSync(distPath, content, 'utf8');
      } else {
        process.stdout.write(`  HTML  ${path.relative(SRC, srcPath)}\n`);
        await processHTML(srcPath, distPath);
      }
      markDone(srcPath);
      _processed++;
    } else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      if (!needsUpdate(srcPath, distPath)) { _skipped++; continue; }
      if (skipObfuscate) {
        process.stdout.write(`  JS*   ${path.relative(SRC, srcPath)} (no obfuscation)\n`);
        // Just copy as-is
        fs.mkdirSync(path.dirname(distPath), { recursive: true });
        fs.copyFileSync(srcPath, distPath);
      } else {
        process.stdout.write(`  JS    ${path.relative(SRC, srcPath)}\n`);
        processJS(srcPath, distPath);
      }
      markDone(srcPath);
      _processed++;
    } else {
      // Copy everything else unchanged (JSON, images, CSS files, fonts, etc.)
      if (!needsUpdate(srcPath, distPath)) { _skipped++; continue; }
      fs.mkdirSync(path.dirname(distPath), { recursive: true });
      fs.copyFileSync(srcPath, distPath);
      markDone(srcPath);
      _processed++;
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
(async () => {
  const start = Date.now();
  console.log('\n🔒  My Exam Companion — Build & Obfuscate\n');

  if (FORCE) {
    console.log('  ⚡ --force flag detected: wiping dist/ for a full rebuild.\n');
    if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });
  } else {
    // Incremental: keep existing dist/, only touch changed files
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    loadCache();
    console.log('  ⚡ Incremental build — only NEW or CHANGED files will be processed.\n');
    console.log('     (Run  npm run build -- --force  to rebuild everything)\n');
  }

  await walk(SRC, DIST);

  // -- Copy Cloudflare Pages Functions into dist/functions/ --
  // wrangler looks for functions/ INSIDE the deploy directory, not in the project root.
  const FUNCTIONS_SRC  = path.resolve(__dirname, '../functions');
  const FUNCTIONS_DIST = path.resolve(DIST, 'functions');
  if (fs.existsSync(FUNCTIONS_SRC)) {
    console.log('\n📦  Copying functions/ -> dist/functions/');
    function copyFunctions(src, dest) {
      fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath  = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyFunctions(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
          console.log(`  FUNC  ${path.relative(FUNCTIONS_SRC, srcPath)}`);
        }
      }
    }
    copyFunctions(FUNCTIONS_SRC, FUNCTIONS_DIST);
  }

  // -- Generate All Sitemaps --
  console.log('\n🗺️   Generating Sitemaps...');
  try {
    const { execSync } = require('child_process');
    
    console.log('\n  1. Generating country/exam sitemaps (and splitting them)...');
    execSync('node generate-sitemap.cjs', { stdio: 'inherit' });
    
    console.log('\n  2. Generating brochure sitemaps...');
    execSync('node scripts/generate_brochure_sitemap.cjs', { stdio: 'inherit' });
    
    console.log('\n  3. Building master sitemap index...');
    execSync('node scripts/build_sitemap_index.cjs', { stdio: 'inherit' });

    // Copy public/sitemaps/ directory to dist/sitemaps/
    const sitemapsSrc  = path.join(SRC, 'sitemaps');
    const sitemapsDist = path.join(DIST, 'sitemaps');
    if (fs.existsSync(sitemapsSrc)) {
      function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
          const s = path.join(src, entry.name);
          const d = path.join(dest, entry.name);
          if (entry.isDirectory()) copyDir(s, d);
          else fs.copyFileSync(s, d);
        }
      }
      copyDir(sitemapsSrc, sitemapsDist);
      console.log(`\n  ✅ Copied sitemaps/ directory to dist/`);
    }

    // Also copy the generated sitemap.xml index to dist/
    if (fs.existsSync(path.join(SRC, 'sitemap.xml'))) {
      fs.copyFileSync(path.join(SRC, 'sitemap.xml'), path.join(DIST, 'sitemap.xml'));
      console.log(`  ✅ Copied sitemap.xml index to dist/`);
    }

  } catch (err) {
    console.error('  ❌  Failed to generate sitemaps:', err.message);
  }

  // Save the updated cache for next run
  saveCache();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅  Done! (${_processed} file(s) processed, ${_skipped} skipped)  (${elapsed}s)\n`);
  console.log('   Deploy with:  npx wrangler pages deploy dist/ --project-name=myexamcompanion\n');

})();
