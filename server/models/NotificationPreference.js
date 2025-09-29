import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  frequency: {
    type: String,
    enum: ['instant', 'hourly', 'daily'],
    default: 'instant',
  },
  categories: {
    mentions: { type: Boolean, default: true },
    taskStatus: { type: Boolean, default: true },
    deadlines: { type: Boolean, default: true },
    team: { type: Boolean, default: false },
    project: { type: Boolean, default: false },
  },
  updatedAt: { type: Date, default: Date.now },
});

preferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('NotificationPreference', preferenceSchema);
