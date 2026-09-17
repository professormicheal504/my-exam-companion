-- Create Exam Purchases Table
CREATE TABLE IF NOT EXISTS public.exam_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, exam_id)
);

-- Enable RLS
ALTER TABLE public.exam_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.exam_purchases;
CREATE POLICY "Users can view their own purchases" ON public.exam_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Function to securely purchase an exam using wallet balance
CREATE OR REPLACE FUNCTION purchase_exam_with_wallet(x_user_id UUID, x_exam_id TEXT, x_amount NUMERIC, x_reference TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as postgres role to bypass RLS for this specific update
AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM public.wallets
    WHERE user_id = x_user_id;

    -- Check if sufficient funds
    IF current_balance < x_amount THEN
        RETURN FALSE;
    END IF;

    -- Check if already purchased
    IF EXISTS (SELECT 1 FROM public.exam_purchases WHERE user_id = x_user_id AND exam_id = x_exam_id) THEN
        RETURN TRUE; -- Already bought
    END IF;

    -- Deduct from wallet
    UPDATE public.wallets 
    SET balance = balance - x_amount,
        updated_at = now()
    WHERE user_id = x_user_id;

    -- Record debit transaction
    INSERT INTO public.wallet_transactions (user_id, amount, type, reference, status, created_at)
    VALUES (x_user_id, x_amount, 'debit', x_reference, 'success', now());

    -- Record purchase
    INSERT INTO public.exam_purchases (user_id, exam_id, amount, reference, created_at)
    VALUES (x_user_id, x_exam_id, x_amount, x_reference, now());

    RETURN TRUE;
END;
$$;
