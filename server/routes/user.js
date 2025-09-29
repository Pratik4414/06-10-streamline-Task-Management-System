import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import SecurityActivity from '../models/SecurityActivity.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate backup codes (shared with auth routes)
const generateBackupCodes = async () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const randomBytes = crypto.randomBytes(4);
    const code = randomBytes.toString('hex').toUpperCase();
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push(formattedCode);
  }
  
  const hashedCodes = [];
  for (const code of codes) {
    const saltRounds = 12;
    const codeHash = await bcrypt.hash(code, saltRounds);
    hashedCodes.push({
      codeHash,
      isUsed: false
    });
  }
  
  return { plainCodes: codes, hashedCodes };
};

// POST /api/users/generate-backup-codes - Generate eight single-use backup codes
router.post('/generate-backup-codes', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Generate backup codes using shared function
    const { plainCodes, hashedCodes } = await generateBackupCodes();
    
    // Update user's backup codes (overwrite existing ones)
    await User.findByIdAndUpdate(userId, {
      $set: {
        'twoFactor.backupCodes': hashedCodes
      }
    });
    
    // Return plain-text codes to frontend
    res.json({
      success: true,
      codes: plainCodes
    });
    
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate backup codes'
    });
  }
});

// GET /api/users/security-activity - Get user's login/logout history
router.get('/security-activity', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const activities = await SecurityActivity.find({ userId })
      .sort({ loginTime: -1 })
      .limit(50); // Limit to recent 50 activities
    
    res.json({
      success: true,
      activities: activities
    });
    
  } catch (error) {
    console.error('Error fetching security activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security activity'
    });
  }
});

export default router;
export { generateBackupCodes };