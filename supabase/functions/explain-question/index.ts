// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  function errorResponse(msg: string, status = 400) {
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON body.');

    const { repoPath, questionId, questionText, options, correctAnswer, isGridIn } = body;

    if (!questionText || typeof questionText !== 'string' || questionText.trim() === '') {
      return errorResponse('questionText is required.');
    }

    const mistralKey = Deno.env.get("MISTRAL_API_KEY");
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_REPO");

    if (!mistralKey) {
      return errorResponse('Server configuration missing MISTRAL_API_KEY.', 500);
    }

    // ── 1. Generate explanation with Mistral small ────────────────────────────
    let optionsText = "";
    if (isGridIn) {
      optionsText = "This is a fill-in-the-blank (Grid-In) question.";
    } else if (Array.isArray(options) && options.length > 0) {
      optionsText = options.map((opt: string, i: number) => `${['A','B','C','D','E'][i] ?? i}. ${opt}`).join("\n");
    }

    const prompt = `Question: ${questionText}\n\nOptions:\n${optionsText}\n\nCorrect Answer: ${correctAnswer}`;

    const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: "You are a helpful, expert tutor. Briefly and clearly explain why the correct answer is correct for the given question. Do not include introductory filler. Output ONLY the raw explanation text. You may use <b> and <i> for emphasis. Do not output markdown."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      })
    });

    if (!mistralRes.ok) {
      const errTxt = await mistralRes.text();
      console.error("Mistral error:", errTxt);
      return errorResponse(`Mistral API error: ${mistralRes.status}`);
    }

    const mistralData = await mistralRes.json();

    if (!mistralData.choices || mistralData.choices.length === 0) {
      return errorResponse('Mistral returned no completion choices.');
    }

    const rawExplanation = (mistralData.choices[0].message?.content ?? '').trim();
    if (!rawExplanation) {
      return errorResponse('Mistral returned an empty explanation.');
    }

    // Sanitize — re-allow only <b> and <i> tags
    const safeExplanation = rawExplanation
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/&lt;(\/?(b|i))&gt;/gi, '<$1>');

    const explanation = `<p>${safeExplanation}</p><span class="ai-generated-tag">✨ AI Generated Explanation</span>`;

    // ── 2. Save to GitHub as a small per-question JSON file ──────────────────
    // Path: database/ai_explanations/<repoPath>/<questionId>.json
    // This keeps the exam JSON on R2 intact, and uses jsDelivr as a free CDN cache.
    const hasRepoPath = repoPath && typeof repoPath === 'string' && repoPath.trim() !== '';

    if (!hasRepoPath || !githubToken || !githubRepo) {
      return new Response(JSON.stringify({ explanation, savedToGithub: false, reason: "Missing GitHub credentials or repoPath" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build the file path in the github repo
    const cleanRepoPath = repoPath.trim().replace(/^\//, '').replace(/\.json$/, '');
    const savePath = `database/ai_explanations/${cleanRepoPath}/${questionId}.json`;
    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${encodeURIComponent(savePath).replace(/%2F/g, '/')}`;

    // Check if file already exists (to get sha for update)
    let existingSha: string | null = null;
    try {
      const existRes = await fetch(githubApiUrl, {
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "MyExamCompanion/1.0"
        }
      });
      if (existRes.ok) {
        const existData = await existRes.json();
        existingSha = existData.sha;
      }
    } catch(_) { /* file doesn't exist yet, that's fine */ }

    // The small JSON we store for this question's explanation
    const explanationPayload = JSON.stringify({ explanation, questionId, generatedAt: new Date().toISOString() }, null, 2);
    const encodedContent = utf8ToBase64(explanationPayload);

    const putBody: Record<string, unknown> = {
      message: `feat(ai): explanation for question ${questionId} in ${cleanRepoPath} [bot]`,
      content: encodedContent,
      committer: { name: "MEC AI Bot", email: "bot@myexamcompanion.app" }
    };
    if (existingSha) putBody.sha = existingSha;

    const updateRes = await fetch(githubApiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "MyExamCompanion/1.0"
      },
      body: JSON.stringify(putBody)
    });

    if (!updateRes.ok) {
      const errTxt = await updateRes.text();
      console.error("GitHub commit failed:", updateRes.status, errTxt);
      // Return the full error body so the frontend can log it
      return new Response(JSON.stringify({ 
        explanation, 
        savedToGithub: false, 
        githubError: `Commit failed: ${updateRes.status}`,
        githubErrorBody: errTxt,
        attemptedPath: savePath,
        repo: githubRepo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ explanation, savedToGithub: true, savedPath: savePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Edge function error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
