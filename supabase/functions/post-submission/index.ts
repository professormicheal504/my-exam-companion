import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Configuration for GitHub
// Ensure these are set in the Supabase Edge Function environment variables
// GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { title, content, topics, thumbnail_url } = await req.json()

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Missing title or content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header. You must be logged in to publish.')
    }
    const token = authHeader.replace('Bearer ', '')

    // Get the user from the authorization header
    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`)
    }

    // 1. Wrap content in a premium HTML boilerplate
    // This premium design features the requested aesthetic quotes
    const htmlBoilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; background: #fff; }
        .article-container { max-width: 740px; margin: 0 auto; padding: 40px 24px; }
        .article-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 5vw, 48px); font-weight: 800; line-height: 1.1; margin-bottom: 24px; color: #111; }
        .article-hero { width: 100%; border-radius: 12px; overflow: hidden; margin-bottom: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .article-hero img { width: 100%; display: block; object-fit: cover; max-height: 600px; }
        .article-body { font-size: 19px; }
        .article-body p { margin-bottom: 24px; }
        
        /* Premium Quotation Styling */
        .article-body blockquote {
            position: relative;
            margin: 48px 0;
            padding: 40px 32px;
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-style: italic;
            font-weight: 700;
            line-height: 1.4;
            color: #111;
            background: linear-gradient(to bottom, #fcfcfc, #f5f7fa);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 #fff;
            border: 1px solid #eaeaea;
        }
        .article-body blockquote::before {
            content: '\\201C';
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 80px;
            line-height: 1;
            color: #2563eb;
            font-family: 'Playfair Display', serif;
            background: #fff;
            padding: 0 10px;
            border-radius: 50%;
        }
        
        .article-body h1, .article-body h2 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; margin: 48px 0 24px; color: #111; }
        .article-body img { max-width: 100%; border-radius: 8px; margin: 32px 0; }
        @media (max-width: 600px) {
            .article-body blockquote { padding: 32px 20px; font-size: 22px; }
            .article-body blockquote::before { font-size: 60px; top: -15px; }
        }
    </style>
</head>
<body>
    <div class="article-container">
        <h1 class="article-title">${escapeHtml(title)}</h1>
        ${thumbnail_url ? `<div class="article-hero"><img src="${escapeHtml(thumbnail_url)}" alt="Hero Image"></div>` : ''}
        <div class="article-body">
            ${content}
        </div>
    </div>
</body>
</html>`

    const githubOwner = Deno.env.get('PUBLISHER_GITHUB_OWNER')
    const githubRepo = Deno.env.get('PUBLISHER_GITHUB_REPO')
    const githubToken = Deno.env.get('PUBLISHER_GITHUB_TOKEN')

    let githubUrl = null

    // 2. Commit to GitHub (if environment variables are configured)
    if (githubOwner && githubRepo && githubToken) {
      const fileName = `articles/${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
      const apiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${fileName}`
      
      const contentEncoded = btoa(unescape(encodeURIComponent(htmlBoilerplate)))

      const githubRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function'
        },
        body: JSON.stringify({
          message: `Add article: ${title}`,
          content: contentEncoded
        })
      })

      if (!githubRes.ok) {
        const err = await githubRes.text()
        console.error('GitHub API error:', err)
        throw new Error(`GitHub API error: ${err}`)
      }

      // jsDelivr format: https://cdn.jsdelivr.net/gh/user/repo/path/to/file
      githubUrl = `https://cdn.jsdelivr.net/gh/${githubOwner}/${githubRepo}/${fileName}`
    }

    // 3. Insert into Supabase
    const { data: insertData, error: insertError } = await supabaseClient
      .from('publisher_posts')
      .insert({
        title,
        topics: topics || [],
        thumbnail_url,
        github_url: githubUrl,
        publisher_id: user?.id,
        status: 'pending' // Initially pending
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Supabase Insert error: ${insertError.message || JSON.stringify(insertError)}`)
    }

    return new Response(JSON.stringify({ success: true, post: insertData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
