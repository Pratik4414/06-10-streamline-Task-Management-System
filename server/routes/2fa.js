import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import SecurityLog from '../models/SecurityLog.js';
import crypto from 'crypto';
import { authenticator } from 'otplib';

const router = express.Router();

// POST /api/2fa/setup-totp - start TOTP setup, returns secret and otpauth URL
router.post('/setup-totp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
  const secret = authenticator.generateSecret();
    // store encrypted or as-is for demo
    user.twoFactor = user.twoFactor || {};
    user.twoFactor.totpSecret = secret;
    await user.save();
  const otpauth = authenticator.keyuri(user.email, 'ProjectPlatform', secret);
    res.json({ success: true, secret, otpauth });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ success: false, error: 'Failed to start 2FA setup' });
  }
});

// POST /api/2fa/enable - verify code and enable 2FA
router.post('/enable', protect, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: 'Code required' });
  try {
    const user = await User.findById(req.user._id);
  const ok = authenticator.check(code, user.twoFactor?.totpSecret);
    if (!ok) return res.status(400).json({ success: false, error: 'Invalid code' });
    user.twoFactor.enabled = true;
    user.twoFactor.method = 'totp';
    await user.save();
    try { await SecurityLog.create({ user: user._id, event: '2fa_enabled', ip: req.ip, userAgent: req.headers['user-agent'] }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('2FA enable error:', err);
    res.status(500).json({ success: false, error: 'Failed to enable 2FA' });
  }
});

// POST /api/2fa/disable - requires password or current 2FA code ideally (omitted for brevity)
router.post('/disable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactor.enabled = false;
    user.twoFactor.totpSecret = undefined;
    user.twoFactor.backupCodes = [];
    await user.save();
    try { await SecurityLog.create({ user: user._id, event: '2fa_disabled', ip: req.ip, userAgent: req.headers['user-agent'] }); } catch {}
    res.json({ success: true });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
  }
});

// POST /api/2fa/backup-codes - generate backup codes
router.post('/backup-codes', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const codes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    user.twoFactor.backupCodes = codes.map(c => ({ codeHash: crypto.createHash('sha256').update(c).digest('hex') }));
    await user.save();
    res.json({ success: true, codes }); // frontend will download txt
  } catch (err) {
    console.error('Backup codes error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate backup codes' });
  }
});

export default router;
