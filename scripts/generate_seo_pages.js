import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CONFIGS_DIR = path.join(__dirname, '../new_staging_area/configs');
const OUTPUT_DIR = path.join(__dirname, '../public/modules/landing');
const TEMPLATE_PATH = path.join(__dirname, 'seo_template.html');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const templateStr = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

async function generateSeoArticle(examName, category) {
  if (!GEMINI_API_KEY) {
    console.warn(`[WARNING] No GEMINI_API_KEY. Generating placeholder for ${examName}.`);
    return `
      <section class="section">
        <h2><span class="icon">📋</span> About ${examName}</h2>
        <p>This is placeholder content for ${examName}. Run with GEMINI_API_KEY to generate the full AI-written article.</p>
      </section>`;
  }

  const prompt = `
You are a senior educational content writer for an African/Nigerian exam prep platform.
Write a highly SEO-optimized, unique 450–550 word article about the "${examName}" examination.
The article must be 100% original, informative, and factually accurate. Avoid generic filler.

Format your response as RAW HTML only (no markdown, no code fences). Use this exact structure:

<section class="section">
  <h2><span class="icon">📋</span> What is ${examName}?</h2>
  <p>[2–3 sentences: what the exam is, who conducts it, who takes it, and its significance for students]</p>
  <p>[1–2 sentences: specific history or standing of this exam in its country/region]</p>
</section>

<section class="section">
  <h2><span class="icon">📚</span> Exam Format & Subject Structure</h2>
  <p>[Overview sentence]</p>
  <ul>
    <li><strong>Format:</strong> [CBT / Paper-based etc.]</li>
    <li><strong>Duration:</strong> [time]</li>
    <li><strong>Number of Questions:</strong> [number]</li>
    <li><strong>Subjects Tested:</strong> [list subjects]</li>
    <li><strong>Scoring:</strong> [how scores are calculated]</li>
  </ul>
</section>

<section class="section">
  <h2><span class="icon">🎯</span> Scoring & Pass Mark</h2>
  <p>[Specific pass marks, cut-off scores, or admission requirements for this exam. Be specific to ${examName}.]</p>
</section>

<section class="section">
  <h2><span class="icon">🏆</span> Expert Tips to Pass ${examName}</h2>
  <ol>
    <li>[Tip 1 — specific to this exam]</li>
    <li>[Tip 2]</li>
    <li>[Tip 3]</li>
    <li>[Tip 4]</li>
    <li>[Tip 5]</li>
  </ol>
</section>

<section class="section">
  <h2><span class="icon">❓</span> Frequently Asked Questions</h2>
  <p><strong>Q: When is ${examName} conducted?</strong><br>[specific answer]</p>
  <p><strong>Q: How do I register for ${examName}?</strong><br>[specific answer]</p>
  <p><strong>Q: Can I use past questions to prepare for ${examName}?</strong><br>[Yes, and why it helps — 2 sentences]</p>
</section>`;

  console.log(`  → Calling Gemini API for "${examName}"...`);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 4096 }
        })
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    let html = data.candidates[0].content.parts[0].text;
    // Strip any accidental markdown code fences
    html = html.replace(/```html/gi, '').replace(/```/g, '').trim();
    // Inject mid-page ad after the 2nd </section> so it appears naturally mid-article
    const AD_MID = `\n<div class="ad-slot" id="ad-mid"><span>Advertisement</span></div>\n`;
    let count = 0;
    html = html.replace(/<\/section>/g, (match) => {
      count++;
      return count === 2 ? '</section>' + AD_MID : match;
    });
    return html;
  } catch (err) {
    console.error(`  ✗ Error for ${examName}:`, err.message);
    return `<section class="section"><p>Content temporarily unavailable for ${examName}.</p></section>`;
  }
}

async function run() {
  const files = fs.readdirSync(CONFIGS_DIR).filter(f => f.endsWith('.json') && f !== 'global_countries.json');
  let totalGenerated = 0;

  for (const file of files) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, file), 'utf-8'));
    } catch { continue; }

    if (!config.dashboard_modules) continue;

    for (const mod of config.dashboard_modules) {
      const slug = mod.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const outputPath = path.join(OUTPUT_DIR, `${slug}.html`);

      // Skip if already generated (use --force flag to regenerate)
      if (fs.existsSync(outputPath) && !process.argv.includes('--force')) {
        console.log(`  ↷ Skipping ${slug}.html (already exists, use --force to regenerate)`);
        continue;
      }

      console.log(`\n📄 Generating: ${mod.display_name}`);

      const articleHtml = await generateSeoArticle(mod.display_name, mod.category);

      const isPremium = mod.renderer === 'cbt_premium_engine';
      const setupFile = isPremium ? 'setup_premium.html' : 'setup.html';
      const cbtParams = new URLSearchParams({ exam_id: mod.id });
      if (mod.data_source) cbtParams.set('data_source', mod.data_source);
      if (mod.logo) cbtParams.set('logo', mod.logo);
      const cbtLink = `/modules/cbt_test/core/${setupFile}?${cbtParams.toString()}`;

      const finalHtml = templateStr
        .replace(/\{\{META_TITLE\}\}/g, `${mod.display_name} 2024/2025 — Past Questions, CBT Practice & Study Guide`)
        .replace(/\{\{META_DESCRIPTION\}\}/g, `Prepare for ${mod.display_name} with real past questions. Free CBT simulator, full exam guide, and expert tips to pass on your first attempt.`)
        .replace(/\{\{META_KEYWORDS\}\}/g, `${mod.display_name}, ${mod.display_name} past questions, ${mod.display_name} CBT practice, ${(mod.exam_body || '').replace(/_/g, ' ')}`)
        .replace(/\{\{SLUG\}\}/g, slug)
        .replace(/\{\{EXAM_NAME\}\}/g, mod.display_name)
        .replace(/\{\{EXAM_BADGE\}\}/g, `${mod.icon || '📝'} ${(mod.category || '').replace(/_/g, ' ').toUpperCase()}`)
        .replace(/\{\{HERO_TITLE\}\}/g, `${mod.display_name} 2024/2025<br><span>Past Questions &amp; Study Guide</span>`)
        .replace(/\{\{HERO_SUBTITLE\}\}/g, `Everything you need to pass ${mod.display_name} in one sitting — past questions, exam tips, and a free CBT simulator.`)
        .replace(/\{\{CBT_LINK\}\}/g, cbtLink)
        .replace(/\{\{ARTICLE_HTML\}\}/g, articleHtml);

      fs.writeFileSync(outputPath, finalHtml);
      console.log(`  ✅ Saved → ${slug}.html`);
      totalGenerated++;

      // Rate-limit: 3 seconds between Gemini API calls
      if (GEMINI_API_KEY && totalGenerated < 99) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.log(`\n🎉 Done! Generated ${totalGenerated} SEO landing pages in public/modules/landing/`);
  if (totalGenerated > 0) {
    console.log('   → Run "npm run deploy" to push them live.');
  }
}

run();
