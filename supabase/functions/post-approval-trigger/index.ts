import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

// ─── Environment variables required ───────────────────────────────────────────
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
// R2_PUBLIC_DOMAIN  (e.g. https://pub-xxxx.r2.dev  — the public bucket URL)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Parse the Database Webhook payload ────────────────────────────────────
    // Supabase sends: { type: 'UPDATE', table: 'publisher_posts', record: {...}, old_record: {...} }
    const payload = await req.json()
    const record    = payload.record
    const oldRecord = payload.old_record

    // Only act on pending → approved transitions
    if (!record || record.status !== 'approved' || oldRecord?.status === 'approved') {
      return new Response(
        JSON.stringify({ message: 'Not a pending→approved transition — skipping.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Setup Supabase admin client ───────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')              ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ── Fetch the full post record from the DB ────────────────────────────────
    // We NEVER rely on the payload for rendered_html — the webhook/trigger payload
    // can be truncated if the HTML is large (Supabase webhook 1MB limit).
    // Always re-fetch with the service role key to get the complete data.
    const { data: fullRecord, error: fetchError } = await supabase
      .from('publisher_posts')
      .select('id, title, rendered_html, github_url, category, slug, publisher_id, cloudflare_url')
      .eq('id', record.id)
      .single()

    if (fetchError || !fullRecord) {
      throw new Error(`Could not fetch post ${record.id} from database: ${fetchError?.message}`)
    }

    // ── Get the rendered HTML ─────────────────────────────────────────────────
    let htmlContent: string = fullRecord.rendered_html ?? ''

    if (!htmlContent) {
      if (!fullRecord.github_url) {
        throw new Error(`Post ${record.id}: no rendered_html and no github_url — cannot upload to R2.`)
      }
      console.log(`rendered_html empty for ${record.id}, falling back to GitHub CDN: ${fullRecord.github_url}`)
      const ghRes = await fetch(fullRecord.github_url)
      if (!ghRes.ok) throw new Error(`Failed to fetch HTML from GitHub CDN: ${fullRecord.github_url}`)
      htmlContent = await ghRes.text()
    }

    // ── Validate R2 credentials ───────────────────────────────────────────────
    const accountId      = Deno.env.get('R2_ACCOUNT_ID')
    const accessKeyId    = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucketName     = Deno.env.get('R2_BUCKET_NAME')
    const r2PublicDomain = Deno.env.get('R2_PUBLIC_DOMAIN') ?? ''

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing one or more Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)')
    }

    // ── Upload to Cloudflare R2 ───────────────────────────────────────────────
    const s3 = new S3Client({
      region:      'auto',
      endpoint:    `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })

    // ── Build the R2 key: <cc>/blog/<category>/<slug>.html ───────────────────
    // Mirrors the public URL structure: /ng/blog/study-tips/how-to-pass-jamb
    // cc defaults to 'ng'; if you later store cc on the record, swap it in here.
    const cc       = record.country_code || 'ng'
    const category = (fullRecord.category || 'guide')
                       .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const slug     = (fullRecord.slug || fullRecord.id)
                       .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // No .html extension — R2 serves it as text/html via ContentType below,
    // so the URL stays clean: /ng/blog/study-tips/how-to-pass-jamb
    const r2Key = `${cc}/blog/${category}/${slug}`

    await s3.send(new PutObjectCommand({
      Bucket:       bucketName,
      Key:          r2Key,
      Body:         htmlContent,
      ContentType:  'text/html; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
      ContentDisposition: 'inline',
      Metadata: {
        'post-id':      record.id,
        'publisher-id': record.publisher_id ?? '',
        'approved-at':  new Date().toISOString(),
        'category':     category,
        'slug':         slug,
        'cc':           cc,
      }
    }))

    // ── Build the public URL ──────────────────────────────────────────────────
    // Structure: <R2_PUBLIC_DOMAIN>/<cc>/blog/<category>/<slug>.html
    // e.g.  https://pub-xxxx.r2.dev/ng/blog/study-tips/how-to-pass-jamb.html
    const cloudflareUrl = r2PublicDomain
      ? `${r2PublicDomain.replace(/\/$/, '')}/${r2Key}`
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${r2Key}`

    // ── Update the Supabase record ────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('publisher_posts')
      .update({ cloudflare_url: cloudflareUrl })
      .eq('id', fullRecord.id)

    if (updateError) throw updateError

    console.log(`✓ Article ${fullRecord.id} uploaded to R2: ${cloudflareUrl}`)

    return new Response(
      JSON.stringify({ success: true, cloudflare_url: cloudflareUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('post-approval-trigger error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
