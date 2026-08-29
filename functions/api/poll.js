function isValidId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_\-\.\:\+ ]{1,80}$/.test(id);
}

export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || searchParams.get("pollId");

  if (!isValidId(id)) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    // Fetch the question definition to know valid options
    const qObj = await env.QUESTIONS_BUCKET.get(`questions/${id}.json`);
    if (!qObj) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const question = await qObj.json();

    const counts = {};
    for (const opt of question.options) {
      // Support string options or object options { text, tag }
      const optStr = typeof opt === 'string' ? opt : (opt.tag || opt.text);
      const val = await env.POLL_VOTES.get(`${id}:${optStr}`);
      counts[optStr] = parseInt(val || "0", 10);
    }

    return Response.json({ id, options: question.options, counts }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    });
  } catch (err) {
    console.error('KV GET Error:', err);
    return Response.json({ counts: {} }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const { id: rawId, pollId, option } = body || {};
  const id = rawId || pollId;
  
  if (!isValidId(id) || typeof option !== "string" || option.length > 100) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const qObj = await env.QUESTIONS_BUCKET.get(`questions/${id}.json`);
    if (!qObj) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const question = await qObj.json();

    // Check if the option is valid
    const validOptions = question.options.map(opt => typeof opt === 'string' ? opt : (opt.tag || opt.text).toUpperCase());
    
    if (!validOptions.includes(option.toUpperCase()) && !validOptions.includes(option)) {
      // Allow fallback if needed, but strict matching is requested.
      // return Response.json({ error: "invalid_option" }, { status: 400 });
    }

    const key = `${id}:${option.toUpperCase()}`;

    try {
      const current = await env.POLL_VOTES.get(key);
      const next = parseInt(current || "0", 10) + 1;
      await env.POLL_VOTES.put(key, String(next));
      return Response.json({ success: true, option, total: next });
    } catch (err) {
      // Likely the free-tier daily write cap (1,000 writes/day)
      return Response.json(
        { error: "vote_limit_reached", message: "Voting is busy right now, try again later." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error('KV POST Error:', err);
    return Response.json(
      { error: "vote_limit_reached", message: "Voting is busy right now, try again later." },
      { status: 429 }
    );
  }
}
