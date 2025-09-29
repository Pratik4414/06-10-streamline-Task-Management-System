import mongoose from 'mongoose';

const AccountRecoverySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  recoveryToken: {
    type: String,
    required: true,
    unique: true
  },
  recoveryType: {
    type: String,
    enum: ['backup_codes_exhausted', 'forgot_password', 'account_lockout'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  },
  metadata: {
    ip: String,
    userAgent: String,
    reason: String
  }
});

// Index for automatic cleanup of expired tokens
AccountRecoverySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AccountRecovery', AccountRecoverySchema);