import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  type: { type: String, enum: ['mention', 'taskStatus', 'deadline', 'team', 'project'], required: true },
  title: { type: String, required: true },
  message: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  metadata: { type: Object },
});

export default mongoose.model('Notification', notificationSchema);
