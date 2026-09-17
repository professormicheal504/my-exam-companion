import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: 'No reference provided' }), { status: 400, headers: corsHeaders });
    }

    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`
      }
    });
    
    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Transaction not successful' }), { status: 400, headers: corsHeaders });
    }

    const tx = verifyData.data;
    const amount = tx.amount / 100; // Convert kobo to Naira
    const userId = tx.metadata?.custom_fields?.find((f: any) => f.variable_name === 'user_id')?.value;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No user ID in metadata' }), { status: 400, headers: corsHeaders });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Check if transaction already exists
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('reference', reference)
      .single();

    if (existingTx) {
      // Already processed (maybe by webhook)
      return new Response(JSON.stringify({ message: 'Already processed', success: true }), { headers: corsHeaders });
    }

    // 4. Credit Wallet via RPC
    const { error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
      p_reference: reference,
      p_description: 'Wallet Top-Up (Paystack)'
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ message: 'Success', success: true }), { headers: corsHeaders, status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
