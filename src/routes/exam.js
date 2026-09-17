import express from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for admin/RPC access
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// @desc    Purchase an exam using wallet balance
// @route   POST /api/exam/purchase-exam
// @access  Private (Requires Supabase JWT)
router.post('/purchase-exam', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ message: 'Supabase client not configured on server' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Missing or invalid authorization header' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify user via Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        
        const { exam_id } = req.body;
        if (!exam_id) {
            return res.status(400).json({ message: 'exam_id is required' });
        }
        
        const amount = 500; // Fixed price for exam unlock
        const reference = 'PURCHASE_' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // Call the secure RPC to deduct balance and create purchase record atomically
        const { data: success, error: rpcError } = await supabase.rpc('purchase_exam_with_wallet', {
            x_user_id: user.id,
            x_exam_id: exam_id,
            x_amount: amount,
            x_reference: reference
        });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            return res.status(500).json({ message: 'Internal server error processing purchase' });
        }

        if (!success) {
            return res.status(402).json({ message: 'Insufficient funds' });
        }
        
        res.status(200).json({ message: 'Exam purchased successfully', exam_id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during purchase' });
    }
});

export default router;
