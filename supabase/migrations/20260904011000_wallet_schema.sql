-- Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own wallet
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Create Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    reference TEXT UNIQUE, -- Paystack reference
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Function to increment wallet balance securely (used by Paystack webhook)
CREATE OR REPLACE FUNCTION increment_wallet_balance(x_user_id UUID, x_amount NUMERIC, x_reference TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as postgres role to bypass RLS for this specific update
AS $$
BEGIN
    -- Update balance, or insert if it doesn't exist (UPSERT logic)
    INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (x_user_id, x_amount, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = public.wallets.balance + EXCLUDED.balance,
        updated_at = now();
        
    -- Insert transaction if reference is provided
    IF x_reference IS NOT NULL THEN
        INSERT INTO public.wallet_transactions (user_id, amount, type, reference, status, created_at)
        VALUES (x_user_id, x_amount, 'credit', x_reference, 'success', now());
    END IF;
END;
$$;

-- Function to handle new user sign-ups and create empty wallet (Balance = 0)
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0.00);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user_wallet when a new auth.users row is created
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();
