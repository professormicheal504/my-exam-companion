import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

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
    const payload = await req.json()
    // payload should be the Database Webhook payload
    // { type: 'UPDATE', table: 'publisher_posts', record: { ... }, old_record: { ... } }

    const record = payload.record
    const oldRecord = payload.old_record

    // Verify it's an approval
    if (!record || record.status !== 'approved' || oldRecord?.status === 'approved') {
      return new Response(JSON.stringify({ message: 'Not an approval event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!record.github_url) {
      throw new Error("No GitHub URL found for this post")
    }

    // 1. Fetch the HTML content from jsDelivr/GitHub
    const htmlResponse = await fetch(record.github_url)
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch HTML from ${record.github_url}`)
    }
    const htmlContent = await htmlResponse.text()

    // 2. Upload to Cloudflare R2
    // Requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
    const accountId = Deno.env.get('R2_ACCOUNT_ID')
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucketName = Deno.env.get('R2_BUCKET_NAME')
    const r2PublicDomain = Deno.env.get('R2_PUBLIC_DOMAIN') // e.g., https://pub-xxxx.r2.dev

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("Missing Cloudflare R2 credentials")
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    const fileName = `articles/${record.id}.html`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: htmlContent,
        ContentType: "text/html",
      })
    );

    const cloudflareUrl = r2PublicDomain 
      ? `${r2PublicDomain}/${fileName}` 
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileName}`

    // 3. Update the record with the Cloudflare URL
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need service role to bypass RLS potentially
    )

    const { error: updateError } = await supabaseClient
      .from('publisher_posts')
      .update({ cloudflare_url: cloudflareUrl })
      .eq('id', record.id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true, cloudflare_url: cloudflareUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
