import express from 'express';

const router = express.Router();

// @desc    Check server health
// @route   GET /api/health
// @access  Public
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Exam Companion API is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

export default router;
