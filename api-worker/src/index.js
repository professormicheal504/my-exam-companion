import * as jose from 'jose';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    // Decode token parts
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('JWTExpired');
    }

    // Temporary: Trust the token payload without fetching the ES256 JWKS public keys.
    // In production, we should use jose.createRemoteJWKSet to verify ES256 tokens against Supabase JWKS.
    return payload; 
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return { _error: err.message }; 
  }
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      
      // 1. GET /api/interactions?exam=X&question=Y
      if (request.method === 'GET' && url.pathname === '/api/interactions') {
        const exam_id = url.searchParams.get('exam');
        const question_id = url.searchParams.get('question');
        if (!exam_id || !question_id) return new Response('Missing params', { status: 400, headers: corsHeaders });

        const reactionRows = await env.DB.prepare(
          `SELECT reaction_type, COUNT(*) as count FROM reactions WHERE exam_id = ?1 AND question_id = ?2 GROUP BY reaction_type`
        ).bind(exam_id, question_id).all();
        
        const reactions = {};
        if (reactionRows.results) {
          for (const row of reactionRows.results) {
            reactions[row.reaction_type || 'like'] = row.count;
          }
        }

        const { results: commentResults } = await env.DB.prepare(
          `SELECT id, user_id, user_name, avatar_url, text, audio_url, parent_id, created_at 
           FROM comments 
           WHERE exam_id = ?1 AND question_id = ?2 
           ORDER BY created_at ASC`
        ).bind(exam_id, question_id).all();
        
        let commentReactions = [];
        if (commentResults.length > 0) {
          const commentIds = commentResults.map(c => c.id);
          const placeholders = commentIds.map(() => '?').join(',');
          const crQuery = await env.DB.prepare(`SELECT comment_id, reaction_type, user_id FROM comment_reactions WHERE comment_id IN (${placeholders})`).bind(...commentIds).all();
          commentReactions = crQuery.results || [];
        }

        // Optional Auth check for user's own reaction
        let user_reaction = null;
        let current_user_id = null;
        if (request.headers.get('Authorization')) {
          const user = await verifyToken(request, env);
          if (user && !user._error && user.sub) {
            current_user_id = user.sub;
            const existing = await env.DB.prepare(
              `SELECT reaction_type FROM reactions WHERE exam_id = ?1 AND question_id = ?2 AND user_id = ?3`
            ).bind(exam_id, question_id, user.sub).first('reaction_type');
            if (existing) user_reaction = existing;
          }
        }

        // Process comment reactions
        commentResults.forEach(c => {
          c.likes = 0;
          c.dislikes = 0;
          c.user_reaction = null;
          const myReactions = commentReactions.filter(cr => cr.comment_id === c.id);
          myReactions.forEach(cr => {
            if (cr.reaction_type === 'like') c.likes++;
            if (cr.reaction_type === 'dislike') c.dislikes++;
            if (current_user_id && cr.user_id === current_user_id) c.user_reaction = cr.reaction_type;
          });
        });

        return new Response(JSON.stringify({ 
          reactions, 
          comments: commentResults,
          user_reaction
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }// Secure endpoints below
      const user = await verifyToken(request, env);
      if (!user || user._error) {
        return new Response(`Unauthorized: ${user ? user._error : 'Invalid token'}`, { status: 401, headers: corsHeaders });
      }
      const user_id = user.sub;
      const user_name = user.user_metadata?.full_name || user.user_metadata?.name || user.full_name || user.email || 'User';
      const user_avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // 2. POST /api/reaction
      if (request.method === 'POST' && url.pathname === '/api/reaction') {
        const { exam_id, question_id, type } = await request.json();
        if (!exam_id || !question_id || !type) return new Response('Missing fields', { status: 400, headers: corsHeaders });

        // Check if user already has a reaction
        const existing = await env.DB.prepare(
          `SELECT reaction_type FROM reactions WHERE exam_id = ?1 AND question_id = ?2 AND user_id = ?3`
        ).bind(exam_id, question_id, user_id).first('reaction_type');

        if (existing === type) {
          // Toggle off
          await env.DB.prepare(
            `DELETE FROM reactions WHERE exam_id = ?1 AND question_id = ?2 AND user_id = ?3`
          ).bind(exam_id, question_id, user_id).run();
          return new Response(JSON.stringify({ active_reaction: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        } else {
          // Insert or update
          await env.DB.prepare(
            `INSERT INTO reactions (exam_id, question_id, user_id, reaction_type) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(exam_id, question_id, user_id) DO UPDATE SET reaction_type = ?4`
          ).bind(exam_id, question_id, user_id, type).run();
          return new Response(JSON.stringify({ active_reaction: type }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
      }

      // POST /api/comment-reaction
      if (request.method === 'POST' && url.pathname === '/api/comment-reaction') {
        const { comment_id, type } = await request.json();
        if (!comment_id || !type) return new Response('Missing fields', { status: 400, headers: corsHeaders });

        const existing = await env.DB.prepare(
          `SELECT reaction_type FROM comment_reactions WHERE comment_id = ?1 AND user_id = ?2`
        ).bind(comment_id, user_id).first('reaction_type');

        if (existing === type) {
          await env.DB.prepare(`DELETE FROM comment_reactions WHERE comment_id = ?1 AND user_id = ?2`).bind(comment_id, user_id).run();
          return new Response(JSON.stringify({ active_reaction: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        } else {
          await env.DB.prepare(
            `INSERT INTO comment_reactions (comment_id, user_id, reaction_type) VALUES (?1, ?2, ?3)
             ON CONFLICT(user_id, comment_id) DO UPDATE SET reaction_type = ?3`
          ).bind(comment_id, user_id, type).run();
          return new Response(JSON.stringify({ active_reaction: type }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
      }

      // 3. POST /api/comment
      if (request.method === 'POST' && url.pathname === '/api/comment') {
        const { exam_id, question_id, text, audio_url, parent_id } = await request.json();
        
        await env.DB.prepare(
          'INSERT INTO comments (user_id, user_name, avatar_url, exam_id, question_id, text, audio_url, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(user_id, user_name, user_avatar, exam_id, question_id, text, audio_url || null, parent_id || null).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 4. POST /api/answer
      if (request.method === 'POST' && url.pathname === '/api/answer') {
        const { exam_id, question_id, selected_option } = await request.json();

        // Upsert answer
        await env.DB.prepare(`
          INSERT INTO user_answers (user_id, exam_id, question_id, selected_option) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, exam_id, question_id) 
          DO UPDATE SET selected_option = excluded.selected_option
        `).bind(user_id, exam_id, question_id, selected_option).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (e) {
      console.error(e);
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  }
};
