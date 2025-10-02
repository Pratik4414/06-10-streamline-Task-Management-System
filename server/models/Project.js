import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['Manager', 'Developer', 'Designer', 'Tester', 'Other'], default: 'Developer' }
    }
  ],
  status: { type: String, enum: ['Ongoing', 'Completed', 'On Hold'], default: 'Ongoing' },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Virtual for progress calculation (percentage of completed tasks)
projectSchema.virtual('progress').get(async function () {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ project: this._id });
  if (totalTasks === 0) return 0;
  const completedTasks = await Task.countDocuments({ project: this._id, status: 'Done' });
  return Math.round((completedTasks / totalTasks) * 100);
});

export default mongoose.model('Project', projectSchema);
