import express from "express";
import User from "../models/User.js";
import SecurityActivity from "../models/SecurityActivity.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2"; // Argon2id for password verification (memory-hard, GPU-resistant, modern PHC winner)
import bcrypt from 'bcrypt';
import passport from "passport";
import { protect } from "../middleware/authMiddleware.js";
import SecurityLog from "../models/SecurityLog.js";
import { authenticator } from 'otplib';
import crypto from 'crypto';

// Helper function to generate backup codes
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

const router = express.Router();

// --- Local Registration ---
router.post("/register", async (req, res) => {
  // Now expecting 'role' from the frontend
  const { name, email, password, role } = req.body; 

  // Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, error: "Please provide all required fields." });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    // Generate backup codes for new user
    const { plainCodes, hashedCodes } = await generateBackupCodes();

    // Create a new user instance with backup codes
    user = new User({ 
      name, 
      email, 
      password, 
      role,
      twoFactor: {
        backupCodes: hashedCodes
      }
    });
    await user.save();

    try { await SecurityLog.create({ user: user._id, event: 'register', ip: req.ip, userAgent: req.headers['user-agent'] }); } catch {}
    
    // Return success with backup codes for immediate download
    res.status(201).json({ 
      success: true, 
      message: "Registered successfully",
      backupCodes: plainCodes,
      requiresBackupCodeDownload: true
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ success: false, error: "Server error during registration" });
  }
});

// --- Local Login ---
router.post("/login", async (req, res) => {
  let { email, password } = req.body || {};
  if (typeof email === 'string') email = email.trim().toLowerCase();
  
  if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please provide email and password." });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.password) { // Check if user exists and has a password (i.e., not a Google-only user)
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }

    try {
      const ok = await argon2.verify(user.password, password);
      if (!ok) {
        return res.status(400).json({ success: false, error: "Invalid credentials" });
      }
    } catch (verifyErr) {
      console.error('Password verification error (argon2):', verifyErr.message);
      return res.status(500).json({ success: false, error: "Server error during password verification" });
    }

    // Check if user has backup codes
    const hasBackupCodes = user.twoFactor?.backupCodes && user.twoFactor.backupCodes.length > 0;
    
    if (!hasBackupCodes) {
      // New user without backup codes - provide temporary access with mandate to set up codes
      const gracePeriodToken = jwt.sign({ 
        user: { id: user.id, role: user.role },
        gracePeriod: true,
        mustSetupBackupCodes: true
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      SecurityLog.create({ 
        user: user._id, 
        event: 'login_grace_period', 
        ip: req.ip, 
        userAgent: req.headers['user-agent'] 
      }).catch(()=>{});
      
      return res.json({ 
        success: true, 
        token: gracePeriodToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        gracePeriod: true,
        mustSetupBackupCodes: true,
        message: "Please set up backup codes immediately for security."
      });
    }
    
    // Step 1: Password verified, now require backup code (for users with codes)
    const tempToken = jwt.sign({ 
      step: 'password-verified', 
      userId: user.id, 
      email: user.email 
    }, process.env.JWT_SECRET, { expiresIn: '10m' });
    
    SecurityLog.create({ 
      user: user._id, 
      event: 'login_password_verified', 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    }).catch(()=>{});
    
    return res.json({ 
      success: true, 
      passwordVerified: true, 
      requiresBackupCode: true,
      tempToken: tempToken
    });

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    // Sign the token
    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      SecurityLog.create({ user: user._id, event: 'login', ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      return res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch(tokenErr) {
      console.error('JWT sign error:', tokenErr);
      return res.status(500).json({ success: false, error: 'Auth token generation failed' });
    }
  } catch (err) {
    console.error("Login Error:", err.message);
    try { await SecurityLog.create({ user: undefined, event: 'login_error', ip: req.ip, userAgent: req.headers['user-agent'], success: false, metadata: { email } }); } catch {}
    res.status(500).json({ success: false, error: "Server error during login" });
  }
});

// --- Verify backup code to complete login (Step 2) ---
router.post('/verify-backup-code', async (req, res) => {
  const { tempToken, backupCode } = req.body;
  
  if (!tempToken || !backupCode) {
    return res.status(400).json({ 
      success: false, 
      error: 'Temporary token and backup code are required' 
    });
  }
  
  try {
    // Verify the temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    
    if (decoded.step !== 'password-verified') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid temporary token' 
      });
    }
    
    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if user has backup codes
    if (!user.twoFactor?.backupCodes || user.twoFactor.backupCodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No backup codes found. Please use account recovery.', 
        requiresRecovery: true
      });
    }
    
    // Check for available (unused) backup codes
    const availableCodes = user.twoFactor.backupCodes.filter(code => !code.isUsed);
    if (availableCodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'All backup codes have been used. Please use account recovery.', 
        requiresRecovery: true,
        allCodesExhausted: true
      });
    }
    
    // Find a matching unused backup code
    let matchedCodeIndex = -1;
    for (let i = 0; i < user.twoFactor.backupCodes.length; i++) {
      const codeObj = user.twoFactor.backupCodes[i];
      if (!codeObj.isUsed) {
        const isMatch = await bcrypt.compare(backupCode, codeObj.codeHash);
        if (isMatch) {
          matchedCodeIndex = i;
          break;
        }
      }
    }
    
    if (matchedCodeIndex === -1) {
      SecurityLog.create({ 
        user: user._id, 
        event: 'login_backup_code_failed', 
        ip: req.ip, 
        userAgent: req.headers['user-agent'] 
      }).catch(()=>{});
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or already used backup code' 
      });
    }
    
    // Mark the code as used
    user.twoFactor.backupCodes[matchedCodeIndex].isUsed = true;
    await user.save();
    
    // Record login in security activity
    const securityActivity = new SecurityActivity({
      userId: user._id,
      loginTime: new Date()
    });
    await securityActivity.save();
    
    // Generate final JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
      activityId: securityActivity._id // Store activity ID for logout tracking
    };
    
    // Check remaining backup codes and warn if low
    const remainingCodes = user.twoFactor.backupCodes.filter(code => !code.isUsed).length;
    const isLowOnCodes = remainingCodes <= 2;
    
    try {
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      SecurityLog.create({ 
        user: user._id, 
        event: 'login_success', 
        ip: req.ip, 
        userAgent: req.headers['user-agent'] 
      }).catch(() => {});
      
      return res.json({
        success: true,
        token,
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        },
        activityId: securityActivity._id,
        backupCodesRemaining: remainingCodes,
        lowOnBackupCodes: isLowOnCodes,
        warning: isLowOnCodes ? `Warning: Only ${remainingCodes} backup codes remaining. Generate new codes soon.` : null
      });
    } catch(tokenErr) {
      console.error('JWT sign error:', tokenErr);
      return res.status(500).json({ 
        success: false, 
        error: 'Auth token generation failed' 
      });
    }
    
  } catch (err) {
    console.error('Backup code verification error:', err);
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid or expired temporary token' 
    });
  }
});

// --- Logout endpoint ---
router.post('/logout', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const activityId = req.user.activityId; // Get from JWT payload if available
    
    // Find the most recent activity record without logout time
    let activityQuery = { userId, logoutTime: null };
    if (activityId) {
      activityQuery._id = activityId;
    }
    
    const activity = await SecurityActivity.findOne(activityQuery).sort({ loginTime: -1 });
    
    if (activity) {
      const logoutTime = new Date();
      const loginTime = activity.loginTime;
      
      // Calculate duration
      const durationMs = logoutTime - loginTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      
      let durationStr = '';
      if (hours > 0) durationStr += `${hours}h `;
      if (minutes > 0) durationStr += `${minutes}m `;
      durationStr += `${seconds}s`;
      
      // Update the activity record
      activity.logoutTime = logoutTime;
      activity.duration = durationStr.trim();
      await activity.save();
    }
    
    SecurityLog.create({ 
      user: userId, 
      event: 'logout', 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    }).catch(() => {});
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
});

// --- Forgot Password ---
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, error: "Please provide an email address." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, we don't reveal if the email exists or not
      return res.json({ 
        success: true, 
        message: "If an account with this email exists, password reset instructions have been sent." 
      });
    }

    // In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with reset link
    // 
    // For now, we'll simulate the process
    console.log(`Password reset requested for: ${email}`);
    console.log(`User found: ${user.name} (${user.email})`);
    console.log('In a real app, an email would be sent with reset instructions.');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ 
      success: true, 
      message: "Password reset instructions have been sent to your email address." 
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).json({ success: false, error: "Server error. Please try again later." });
  }
});

// --- Reset Password (authenticated) ---
router.post("/reset-password", protect, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, error: "New passwords do not match." });
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.password) {
      return res.status(400).json({ success: false, error: "Invalid request." });
    }
    const ok = await argon2.verify(user.password, oldPassword);
    if (!ok) {
      return res.status(400).json({ success: false, error: "Old password is incorrect." });
    }
    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();
    try { await SecurityLog.create({ user: user._id, event: 'password_reset', ip: req.ip, userAgent: req.headers['user-agent'] }); } catch {}
    return res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({ success: false, error: "Server error during password reset." });
  }
});



// --- Regenerate backup codes with password confirmation ---
router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    // Verify password using argon2 (same as login)
    try {
      const isValidPassword = await argon2.verify(user.password, password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password'
        });
      }
    } catch (verifyErr) {
      console.error('Password verification error:', verifyErr.message);
      return res.status(500).json({
        success: false,
        error: 'Server error during password verification'
      });
    }

    // Generate new backup codes
    const { plainCodes, hashedCodes } = await generateBackupCodes();

    // Update user with new backup codes and invalidate old ones
    user.twoFactor = user.twoFactor || {};
    user.twoFactor.backupCodes = hashedCodes;
    await user.save();

    // Log the backup code regeneration
    SecurityLog.create({ 
      user: user._id, 
      event: 'backup_codes_regenerated', 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    }).catch(() => {});

    console.log(`✅ Backup codes regenerated for user: ${email}`);

    res.status(200).json({
      success: true,
      message: 'New backup codes generated successfully',
      backupCodes: plainCodes
    });

  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// --- Google OAuth Routes ---
// This route starts the Google authentication process
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// This is the callback URL that Google will redirect to after user consent
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "http://localhost:5173/login", // Redirect to frontend login on failure
    session: false // We are using JWT, not sessions
  }),
  (req, res) => {
    // On successful authentication, req.user is available.
    // We sign a JWT for this user.
    const payload = {
        user: {
            id: req.user.id,
            role: req.user.role,
        }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Redirect back to the frontend with the token and user info
    const user = JSON.stringify({
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
    });
    
    // A common practice is to pass the token as a query parameter or use a dedicated page to handle it
    res.redirect(`http://localhost:5173/dashboard?token=${token}&user=${encodeURIComponent(user)}`);
  }
);


export default router;
