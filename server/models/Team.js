import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isRoster: { type: Boolean, default: false }, // internal default team to manage manager's roster
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Team', teamSchema);
