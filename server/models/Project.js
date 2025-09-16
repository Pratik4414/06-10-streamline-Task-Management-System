import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['On Track', 'At Risk', 'Completed'], default: 'On Track' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Project', projectSchema);
