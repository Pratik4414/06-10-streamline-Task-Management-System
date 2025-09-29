import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.user.id).select('-password');
      // Add activityId to user object if present in token
      if (decoded.activityId) {
        req.user.activityId = decoded.activityId;
      }
      // Add grace period info if present
      if (decoded.gracePeriod) {
        req.user.gracePeriod = true;
        req.user.mustSetupBackupCodes = decoded.mustSetupBackupCodes;
      }
      // Add emergency access info if present
      if (decoded.emergencyAccess) {
        req.user.emergencyAccess = true;
        req.user.mustRegenerateBackupCodes = decoded.mustRegenerateBackupCodes;
        req.user.recoveryId = decoded.recoveryId;
      }
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

// Middleware to ensure backup codes are set up (blocks access for grace period users to critical operations)
export const requireBackupCodes = (req, res, next) => {
  if (req.user && req.user.gracePeriod && req.user.mustSetupBackupCodes) {
    return res.status(403).json({ 
      success: false, 
      error: 'You must set up backup codes before accessing this feature',
      requiresBackupCodeSetup: true
    });
  }
  
  // Also check for emergency access users
  if (req.user && req.user.emergencyAccess && req.user.mustRegenerateBackupCodes) {
    return res.status(403).json({ 
      success: false, 
      error: 'You must regenerate backup codes before accessing this feature',
      requiresBackupCodeRegeneration: true,
      emergencyAccess: true
    });
  }
  
  next();
};

export const manager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Not authorized as a manager' });
  }
};
