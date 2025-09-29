import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import SecurityLog from '../models/SecurityLog.js';

const router = express.Router();

// GET /api/security/logs - list current user's security events
router.get('/logs', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SecurityLog.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SecurityLog.countDocuments({ user: req.user._id })
    ]);
    res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Security logs error:', err);
    res.status(500).json({ success: false, error: 'Failed to load security logs' });
  }
});

export default router;
