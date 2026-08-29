// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight request
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

    const { messages, examContext } = body;
    const mistralKey = Deno.env.get("MISTRAL_API_KEY");

    if (!mistralKey) {
      return errorResponse('Missing Mistral API Key.', 500);
    }

    const systemPrompt = `You are a premium AI Study Agent (like Claude) for students taking JAMB, WAEC, and NECO exams. You are highly intelligent, Socratic, and engaging. You never just give the answer—you guide the student to understand it. Keep your tone encouraging and elite. 
Use Markdown for rich formatting (tables, bold text, lists).
Here is the context about the student's recent exam performance:
${examContext || 'No recent exam data available.'}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [])
    ];

    const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralKey}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.5,
      })
    });

    if (!mistralRes.ok) throw new Error(`Mistral API error: ${mistralRes.status}`);
    const mistralData = await mistralRes.json();
    
    if (!mistralData.choices || mistralData.choices.length === 0) {
      return errorResponse('Mistral returned no completion choices.', 400);
    }
    
    return new Response(JSON.stringify({ text: mistralData.choices[0].message?.content || '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Server error (chat):", error);
    return errorResponse(error.message, 500);
  }
});
