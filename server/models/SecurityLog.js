import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  event: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.model('SecurityLog', securityLogSchema);
