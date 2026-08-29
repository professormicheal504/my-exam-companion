import { ImageResponse } from "workers-og";

function isValidId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_\-\.\:\+ ]{1,80}$/.test(id);
}

// Satori-compatible branded fallback image (no external fetches, no unsupported CSS)
function fallbackImage(title = "My Exam Companion", subtitle = "Practice past exam questions for FREE") {
  const html = `
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #302b63; background-image: linear-gradient(135deg, #0f0c29, #24243e); color: white; align-items: center; justify-content: center; font-family: sans-serif; padding: 60px;">
      <div style="display: flex; font-size: 28px; font-weight: 900; color: #a78bfa; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">MY EXAM COMPANION</div>
      <div style="display: flex; font-size: 52px; font-weight: 800; color: white; text-align: center; line-height: 1.2; max-width: 900px; margin-bottom: 32px;">${title}</div>
      <div style="display: flex; font-size: 26px; color: #94a3b8; text-align: center; max-width: 700px;">${subtitle}</div>
      <div style="display: flex; margin-top: 48px; background-color: #7c3aed; padding: 16px 40px; border-radius: 9999px; font-size: 22px; font-weight: 600; color: white;">Tap to view answer</div>
    </div>
  `;
  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}

export async function onRequest({ request, env }) {
  const { searchParams } = new URL(request.url);
  const qId = searchParams.get("id") || searchParams.get("q");
  const examId = searchParams.get("exam_id") || "nigeria/jamb";
  const subject = searchParams.get("subject") || "general";
  const year = searchParams.get("year") || "2023";

  if (!isValidId(qId)) {
    return fallbackImage();
  }

  // Determine DATA_BASE
  const country = examId.split('/')[0].toLowerCase();
  const countryCodeMap = { nigeria: 'ng', ghana: 'gh', us: 'us', usa: 'us', 'united states': 'us' };
  const cc = countryCodeMap[country] || 'ng';

  let dataBase = `${cc}/exams/university_entrance/${examId.split('/').pop()}`;
  try {
    const configObj = await env.QUESTIONS_BUCKET.get(`configs/${cc}.json`);
    if (configObj) {
      const config = await configObj.json();
      const mod = config.dashboard_modules.find(m => m.id === examId);
      if (mod && mod.data_source) {
        dataBase = mod.data_source.replace(/\/index\.json$/, '');
      }
    }
  } catch (e) { }

  let debugLog = `DB:${dataBase} | Subj:${subject} | Y:${year}`;
  let dataArray = null;
  const types = ['cbt', 'objective', 'theory', 'general'];
  for (const type of types) {
    const r2Path = `${dataBase}/${subject}/${type}/${year}.json`;
    try {
      const object = await env.QUESTIONS_BUCKET.get(r2Path);
      if (object) {
        dataArray = await object.json();
        debugLog += ` | Found:${type}`;
        break;
      }
    } catch (e) {
      debugLog += ` | Err:${e.message}`;
    }
  }

  if (!dataArray) {
    return fallbackImage("DataArray Null", debugLog);
  }

  // Find the question — try multiple ID formats
  let actualId = qId;
  if (qId.includes('_')) {
    actualId = qId.split('_').pop();
  }

  let data = null;
  if (Array.isArray(dataArray)) {
    data = dataArray.find(q =>
      String(q.id) === qId ||
      String(q.id) === actualId ||
      String(q.question_id) === qId ||
      String(q.question_id) === actualId
    );
  } else {
    data = dataArray[qId] || dataArray[actualId] ||
      Object.values(dataArray).find(q =>
        String(q.id) === qId ||
        String(q.id) === actualId ||
        String(q.question_id) === qId ||
        String(q.question_id) === actualId
      );
  }

  if (!data) {
    let keys = Object.keys(dataArray).slice(0, 3).join(',');
    return fallbackImage("Data Null", `qId:${qId} | actual:${actualId} | type:${typeof dataArray} | keys:${keys}`);
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  // CSS-drawn country flags (Satori can't render emoji flags)
  const FLAG_HTML = {
    ng: `<div style="display: flex; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 16px; height: 32px; background-color: #008751;"></div>
           <div style="display: flex; width: 16px; height: 32px; background-color: #ffffff;"></div>
           <div style="display: flex; width: 16px; height: 32px; background-color: #008751;"></div>
         </div>`,
    gh: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 11px; background-color: #CE1126;"></div>
           <div style="display: flex; width: 48px; height: 11px; background-color: #FCD116;"></div>
           <div style="display: flex; width: 48px; height: 10px; background-color: #006B3F;"></div>
         </div>`,
    us: `<div style="display: flex; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 18px; height: 32px; background-color: #3C3B6E;"></div>
           <div style="display: flex; flex-direction: column; width: 30px; height: 32px;">
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #ffffff;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #ffffff;"></div>
             <div style="display: flex; width: 30px; height: 5px; background-color: #B22234;"></div>
             <div style="display: flex; width: 30px; height: 7px; background-color: #ffffff;"></div>
           </div>
         </div>`,
    ke: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 11px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 11px; background-color: #BB0000;"></div>
           <div style="display: flex; width: 48px; height: 10px; background-color: #006600;"></div>
         </div>`,
    ug: `<div style="display: flex; flex-direction: column; width: 48px; height: 32px; border-radius: 4px; overflow: hidden; margin-right: 12px; border: 1px solid #e2e8f0;">
           <div style="display: flex; width: 48px; height: 6px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #FCDC04;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #D90000;"></div>
           <div style="display: flex; width: 48px; height: 6px; background-color: #000000;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #FCDC04;"></div>
           <div style="display: flex; width: 48px; height: 5px; background-color: #D90000;"></div>
         </div>`,
  };
  const flagHtml = FLAG_HTML[cc] || `<div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 32px; background-color: #e2e8f0; border-radius: 4px; margin-right: 12px; font-size: 14px; font-weight: 800; color: #64748b;">${cc.toUpperCase()}</div>`;

  const displaySubject = cleanText(data.subject || subject || 'Exam');

  // Uniform blue accent — matches the website theme (--primary: #2563eb)
  const primaryColor = '#2563eb';
  const accentBg = '#eff6ff';

  const qText = cleanText(data.question || data.question_text || 'Can you solve this question?');
  const qTrunc = qText.substring(0, 120) + (qText.length > 120 ? '...' : '');
  const examBody = cleanText(data.examBody || examId.split('/').pop().toUpperCase());
  const topicText = cleanText(data.topic || 'Review Question').substring(0, 50);
  const yearDisplay = data.exam_year || year || '2025';

  // Catchy hook phrases — rotates based on question ID hash
  const hooks = [
    'Can you solve this?',
    'Test your knowledge!',
    'Do you know the answer?',
    'Challenge accepted?',
    'Think you can get it right?',
    'How well do you know this?',
    'Put your brain to the test!',
    'Are you exam-ready?',
  ];
  const hookIdx = (qId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % hooks.length;
  const hookText = hooks[hookIdx];

  // NOTE: Satori does NOT support: text-shadow, box-shadow, emojis, multiple background-image gradients.
  // Solid Hex "Faux-Glass" Theme - 100% Satori Safe
  const html = `
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #cbd5e1; font-family: sans-serif; padding: 40px 50px;">
      
      <!-- 1. Top Navigation Pill -->
      <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; background-color: #e2e8f0; border: 2px solid #ffffff; border-radius: 9999px; padding: 12px 24px; margin-bottom: 24px;">
        <div style="display: flex; flex-direction: row; align-items: center;">
          ${flagHtml}
          <div style="display: flex; color: #334155; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
            ${countryName.toUpperCase()} <span style="color: #64748b; margin-left: 8px;">\u2022 ${examBody} \u2022 ${displaySubject.toUpperCase()}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: row; align-items: center;">
          <div style="display: flex; background-color: #cbd5e1; color: #334155; font-size: 20px; font-weight: 700; padding: 6px 16px; border-radius: 9999px; margin-right: 12px; border: 1px solid #94a3b8;">${yearDisplay}</div>
          <div style="display: flex; background-color: #ffffff; color: #0f172a; font-size: 20px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid #e2e8f0;">FREE</div>
        </div>
      </div>

      <!-- 2. Main Question Card -->
      <div style="display: flex; flex-direction: column; flex: 1; background-color: #e2e8f0; border: 2px solid #ffffff; border-radius: 24px; padding: 36px 48px;">
        
        <!-- Question text -->
        <div style="display: flex; font-size: 36px; font-weight: 600; color: #0f172a; line-height: 1.4; margin-bottom: 32px;">
          ${qTrunc}
        </div>

        <!-- Options 2x2 grid -->
        <div style="display: flex; flex-wrap: wrap; margin-bottom: auto;">
          ${(data.options || [])
            .slice(0, 4)
            .map((opt, i) => {
              const text = typeof opt === 'string' ? opt : (opt.text || opt.tag || '');
              const colors = ['#2563eb', '#a855f7', '#0d9488', '#ea580c'];
              const bgs = ['#eff6ff', '#faf5ff', '#f0fdfa', '#fff7ed'];
              const borders = ['#bfdbfe', '#e9d5ff', '#ccfbf1', '#fed7aa'];
              return `<div style="display: flex; align-items: center; width: 48%; background-color: #ffffff; border-radius: 16px; padding: 14px 20px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 2px solid ${borders[i]}; border-radius: 12px; margin-right: 18px; background-color: ${bgs[i]}; color: ${colors[i]}; font-weight: 700; font-size: 22px;">
                          ${String.fromCharCode(65 + i)}
                        </div>
                        <span style="flex: 1; line-height: 1.3; font-weight: 500; font-size: 24px; color: #0f172a;">${cleanText(text).substring(0, 38)}${cleanText(text).length > 38 ? '...' : ''}</span>
                      </div>`;
            }).join("")}
        </div>

        <!-- 3. Footer Area -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px;">
          <div style="display: flex; align-items: center;">
            <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #ffffff; border-radius: 10px; margin-right: 12px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <div style="display: flex; font-size: 22px; font-weight: 800; color: #1e293b;">My Exam Companion</div>
            <div style="display: flex; margin-left: 16px; font-size: 18px; color: #475569; font-weight: 500;">Join 10K+ students practicing for FREE</div>
          </div>
          <!-- CTA button -->
          <div style="display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; background-color: #2563eb; padding: 14px 32px; border-radius: 9999px; font-weight: 700;">
            Tap to reveal answer
          </div>
        </div>

      </div>
    </div>
  `;

  try {
    return new ImageResponse(html, {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    // If Satori crashes for any reason, return the simple fallback
    return fallbackImage("Can You Solve This?", cleanText(data.question || '').substring(0, 80));
  }
}

function cleanText(htmlStr) {
  if (!htmlStr) return '';
  // 1. Strip all HTML tags
  let text = String(htmlStr).replace(/<[^>]*>?/gm, '');

  // 2. Decode HTML entities
  const entities = {
    '&nbsp;': ' ', '&cent;': '¢', '&pound;': '£', '&yen;': '¥', '&euro;': '€',
    '&copy;': '©', '&reg;': '®', '&middot;': '·', '&deg;': '°', '&plusmn;': '±',
    '&alpha;': 'α', '&beta;': 'β', '&gamma;': 'γ', '&theta;': 'θ', '&Omega;': 'Ω',
    '&pi;': 'π', '&Sigma;': 'Σ', '&mu;': 'μ', '&amp;': '&', '&lt;': '<',
    '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&ndash;': '–', '&mdash;': '—'
  };

  text = text.replace(/&[#a-zA-Z0-9]+;/g, match => entities[match] || match);

  // Clean up MathJax/AsciiMath formatting
  text = text.replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$([^$]+)\$/g, '$1') // Strip inline math $...$
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³');

  // 3. Escape for Satori HTML
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
