import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AccountRecovery from '../models/AccountRecovery.js';
import SecurityLog from '../models/SecurityLog.js';
import { generateBackupCodes } from './user.js';

const router = express.Router();

// Request account recovery (when backup codes are exhausted)
router.post('/request-recovery', async (req, res) => {
  const { email, reason } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, recovery instructions have been sent.'
      });
    }

    // Check if user actually needs recovery
    const availableCodes = user.twoFactor?.backupCodes?.filter(code => !code.isUsed) || [];
    if (availableCodes.length > 0) {
      return res.status(400).json({
        success: false,
        error: `You still have ${availableCodes.length} unused backup codes. Please use them to login.`
      });
    }

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    
    // Create recovery record
    const recovery = new AccountRecovery({
      userId: user._id,
      email: user.email,
      recoveryToken,
      recoveryType: reason || 'backup_codes_exhausted',
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: reason || 'All backup codes exhausted'
      }
    });
    
    await recovery.save();

    // Log the recovery request
    SecurityLog.create({
      user: user._id,
      event: 'account_recovery_requested',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { recoveryType: reason || 'backup_codes_exhausted' }
    }).catch(() => {});

    // In a real application, you would send an email here
    // For demo purposes, we'll return the recovery token
    // TODO: Implement email service
    console.log(`\n🔐 ACCOUNT RECOVERY EMAIL 🔐`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Account Recovery - Backup Codes Exhausted`);
    console.log(`Recovery Link: http://localhost:5174/recovery?token=${recoveryToken}`);
    console.log(`This link expires in 24 hours.\n`);

    res.json({
      success: true,
      message: 'Recovery instructions have been sent to your email.',
      // Remove this in production - only for development
      developmentToken: recoveryToken
    });

  } catch (err) {
    console.error('Account recovery request error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error processing recovery request'
    });
  }
});

// Verify recovery token and restore access
router.post('/verify-recovery', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Recovery token is required'
    });
  }

  try {
    // Find valid recovery record
    const recovery = await AccountRecovery.findOne({
      recoveryToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!recovery) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired recovery token'
      });
    }

    // Get the user
    const user = await User.findById(recovery.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new backup codes
    const newCodes = generateBackupCodes();
    user.twoFactor = user.twoFactor || {};
    user.twoFactor.backupCodes = newCodes.hashedCodes;
    await user.save();

    // Mark recovery as used
    recovery.isUsed = true;
    recovery.usedAt = new Date();
    await recovery.save();

    // Log successful recovery
    SecurityLog.create({
      user: user._id,
      event: 'account_recovery_completed',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Account recovery successful. New backup codes generated.',
      codes: newCodes.plainCodes,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Account recovery verification error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error processing recovery verification'
    });
  }
});

// Emergency login with recovery token (provides temporary access)
router.post('/emergency-login', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Recovery token is required'
    });
  }

  try {
    // Find valid recovery record
    const recovery = await AccountRecovery.findOne({
      recoveryToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!recovery) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired recovery token'
      });
    }

    // Get the user
    const user = await User.findById(recovery.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate emergency access token (shorter expiry)
    const emergencyToken = jwt.sign({
      user: {
        id: user.id,
        role: user.role
      },
      emergencyAccess: true,
      mustRegenerateBackupCodes: true,
      recoveryId: recovery._id
    }, process.env.JWT_SECRET, { expiresIn: '30m' });

    // Log emergency access
    SecurityLog.create({
      user: user._id,
      event: 'emergency_access_granted',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});

    res.json({
      success: true,
      token: emergencyToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      emergencyAccess: true,
      message: 'Emergency access granted. Please generate new backup codes immediately.',
      expiresIn: '30 minutes'
    });

  } catch (err) {
    console.error('Emergency login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error processing emergency login'
    });
  }
});

export default router;