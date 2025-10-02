import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  file: { type: String }, // Optional: file attachment URL
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Message', messageSchema);
