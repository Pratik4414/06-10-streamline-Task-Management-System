import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AccountRecovery from '../models/AccountRecovery.js';
import SecurityLog from '../models/SecurityLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { generateBackupCodes } from './user.js';

const router = express.Router();

// Enhanced backup code generation - Multiple methods for exhausted codes
router.post('/generate-codes-methods', protect, async (req, res) => {
  const { method, verificationData } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let isVerified = false;
    let verificationMethod = '';

    switch (method) {
      case 'password_confirmation':
        // Method 1: Password Re-confirmation
        if (!verificationData.currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Current password is required'
          });
        }
        
        try {
          const argon2 = (await import('argon2')).default;
          const passwordMatch = await argon2.verify(user.password, verificationData.currentPassword);
          if (passwordMatch) {
            isVerified = true;
            verificationMethod = 'Password Confirmation';
          }
        } catch (err) {
          console.error('Password verification error:', err);
        }
        break;

      case 'email_verification':
        // Method 2: Email Verification Code
        if (!verificationData.emailCode || !verificationData.emailCodeHash) {
          return res.status(400).json({
            success: false,
            error: 'Email verification code is required'
          });
        }
        
        // Verify the email code (this would typically be sent via email)
        const emailCodeMatch = crypto.timingSafeEqual(
          Buffer.from(crypto.createHash('sha256').update(verificationData.emailCode).digest('hex')),
          Buffer.from(verificationData.emailCodeHash)
        );
        
        if (emailCodeMatch) {
          isVerified = true;
          verificationMethod = 'Email Verification';
        }
        break;

      case 'security_questions':
        // Method 3: Security Questions (if implemented)
        if (!verificationData.securityAnswers) {
          return res.status(400).json({
            success: false,
            error: 'Security question answers are required'
          });
        }
        
        // Verify security questions (simplified for demo)
        if (verificationData.securityAnswers.length >= 2) {
          isVerified = true;
          verificationMethod = 'Security Questions';
        }
        break;

      case 'emergency_override':
        // Method 4: Emergency Override (for admin or critical situations)
        if (req.user.role === 'manager' || req.user.emergencyAccess) {
          isVerified = true;
          verificationMethod = 'Emergency Override';
        }
        break;

      case 'progressive_verification':
        // Method 5: Progressive Verification (multiple factors)
        let verificationScore = 0;
        const verifications = [];

        if (verificationData.passwordConfirmed) {
          verificationScore += 40;
          verifications.push('Password');
        }
        
        if (verificationData.emailVerified) {
          verificationScore += 30;
          verifications.push('Email');
        }
        
        if (verificationData.deviceTrusted) {
          verificationScore += 20;
          verifications.push('Trusted Device');
        }
        
        if (verificationData.ipWhitelisted) {
          verificationScore += 10;
          verifications.push('Whitelisted IP');
        }

        if (verificationScore >= 70) {
          isVerified = true;
          verificationMethod = `Progressive Verification (${verifications.join(', ')})`;
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid verification method'
        });
    }

    if (!isVerified) {
      SecurityLog.create({
        user: user._id,
        event: 'backup_codes_generation_failed',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        metadata: { method, verificationMethod }
      }).catch(() => {});

      return res.status(400).json({
        success: false,
        error: 'Verification failed. Please check your credentials.'
      });
    }

    // Generate new backup codes
    const newCodes = generateBackupCodes();
    user.twoFactor = user.twoFactor || {};
    user.twoFactor.backupCodes = newCodes.hashedCodes;
    await user.save();

    // Log successful generation
    SecurityLog.create({
      user: user._id,
      event: 'backup_codes_regenerated',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method, verificationMethod }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Backup codes generated successfully via ${verificationMethod}`,
      codes: newCodes.plainCodes,
      method: verificationMethod,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Enhanced backup code generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during backup code generation'
    });
  }
});

// Generate email verification code for backup code generation
router.post('/request-email-verification', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    
    // Store code hash temporarily (in production, use Redis or similar)
    const verificationRecord = {
      userId: user._id,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date()
    };

    // In production, store this in a temporary collection or cache
    console.log(`\\n📧 EMAIL VERIFICATION CODE 📧`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Backup Code Generation - Email Verification`);
    console.log(`Your verification code: ${verificationCode}`);
    console.log(`This code expires in 10 minutes.\\n`);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      codeHash, // In production, don't send this
      expiresIn: '10 minutes'
    });

  } catch (err) {
    console.error('Email verification request error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error sending verification code'
    });
  }
});

// Self-service backup code regeneration with enhanced verification
router.post('/self-service-regenerate', protect, async (req, res) => {
  const { 
    currentPassword, 
    emailVerificationCode, 
    emailCodeHash,
    confirmRegeneration 
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has any available backup codes
    const availableCodes = user.twoFactor?.backupCodes?.filter(code => !code.isUsed) || [];
    
    if (availableCodes.length > 0) {
      return res.status(400).json({
        success: false,
        error: `You still have ${availableCodes.length} unused backup codes. Use the regular regeneration method.`
      });
    }

    if (!confirmRegeneration) {
      return res.status(400).json({
        success: false,
        error: 'Please confirm that you want to regenerate backup codes'
      });
    }

    let verificationsPassed = 0;
    const requiredVerifications = 2; // Need at least 2 verifications

    // Verification 1: Current Password
    if (currentPassword) {
      try {
        const argon2 = (await import('argon2')).default;
        const passwordMatch = await argon2.verify(user.password, currentPassword);
        if (passwordMatch) {
          verificationsPassed++;
        }
      } catch (err) {
        console.error('Password verification error:', err);
      }
    }

    // Verification 2: Email Code
    if (emailVerificationCode && emailCodeHash) {
      const providedCodeHash = crypto.createHash('sha256').update(emailVerificationCode).digest('hex');
      if (crypto.timingSafeEqual(Buffer.from(providedCodeHash), Buffer.from(emailCodeHash))) {
        verificationsPassed++;
      }
    }

    if (verificationsPassed < requiredVerifications) {
      return res.status(400).json({
        success: false,
        error: `Insufficient verification. ${verificationsPassed}/${requiredVerifications} verifications passed.`,
        hint: 'Please provide both current password and email verification code.'
      });
    }

    // Generate new backup codes
    const newCodes = generateBackupCodes();
    user.twoFactor = user.twoFactor || {};
    user.twoFactor.backupCodes = newCodes.hashedCodes;
    await user.save();

    // Log the self-service regeneration
    SecurityLog.create({
      user: user._id,
      event: 'backup_codes_self_service_regenerated',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { 
        verificationsUsed: verificationsPassed,
        method: 'self_service_multi_factor'
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully via self-service verification',
      codes: newCodes.plainCodes,
      regeneratedAt: new Date().toISOString(),
      previousCodesInvalidated: true
    });

  } catch (err) {
    console.error('Self-service regeneration error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during self-service regeneration'
    });
  }
});

export default router;