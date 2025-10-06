import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import NotificationPreference from '../models/NotificationPreference.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications/preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    let pref = await NotificationPreference.findOne({ user: req.user._id }).lean();
    if (!pref) {
      pref = await NotificationPreference.create({ user: req.user._id });
    }
    res.json({ success: true, preference: pref });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ success: false, error: 'Failed to load preferences' });
  }
});

// PUT /api/notifications/preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const update = req.body || {};
    const pref = await NotificationPreference.findOneAndUpdate(
      { user: req.user._id },
      update,
      { upsert: true, new: true }
    ).lean();
    res.json({ success: true, preference: pref });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

// GET /api/notifications - list user's in-app notifications
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: req.user._id })
    ]);
    res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Notifications list error:', err);
    res.status(500).json({ success: false, error: 'Failed to load notifications' });
  }
});

// PATCH /api/notifications/:id/read - mark as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item: updated });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all - mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notification(s) as read`,
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

// DELETE /api/notifications/clear - clear all notifications for a user
router.delete('/clear', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });
    res.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} notification(s)`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Clear notifications error:', err);
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
});

export default router;
