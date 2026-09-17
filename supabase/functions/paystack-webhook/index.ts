import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Initialize Supabase Client (Service Role for Admin bypass)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Paystack Secret Key (MUST be set in Supabase Secrets)
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || '';

async function verifySignature(req: Request, bodyText: string): Promise<boolean> {
  const signature = req.headers.get('x-paystack-signature');
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(paystackSecretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(bodyText)
  );

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === signature;
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const bodyText = await req.text();
    
    // 1. Verify Paystack Signature to ensure hackers didn't forge this request
    const isValid = await verifySignature(req, bodyText);
    if (!isValid) {
      console.error("Invalid Paystack Signature");
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    // 2. Handle Charge Success Event
    if (event === 'charge.success') {
      const reference = data.reference;
      const amountKobo = data.amount;
      const amountNaira = amountKobo / 100;

      // Expect user_id in the custom metadata when frontend initialized the payment
      const userId = data.metadata?.user_id;

      if (!userId) {
        console.error("No user_id found in Paystack metadata");
        return new Response(JSON.stringify({ error: 'user_id missing in metadata' }), { status: 400 });
      }

      // Check if transaction already exists (Idempotency)
      const { data: existingTx } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('reference', reference)
        .single();
      
      if (existingTx) {
        console.log("Transaction already processed.");
        return new Response(JSON.stringify({ message: 'Already processed' }), { status: 200 });
      }

      // Record Transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: userId,
          amount: amountNaira,
          type: 'credit',
          reference: reference,
          status: 'success'
        }]);

      if (txError) throw txError;

      // Update Wallet Balance via RPC (to prevent race conditions)
      const { error: rpcError } = await supabase.rpc('increment_wallet_balance', {
        x_user_id: userId,
        x_amount: amountNaira
      });

      if (rpcError) throw rpcError;

      console.log(`Wallet updated successfully for ${userId}. Added ${amountNaira}`);
    }

    // Always return 200 to Paystack so they know we received it
    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
