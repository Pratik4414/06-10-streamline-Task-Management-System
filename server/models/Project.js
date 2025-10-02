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
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  startDate: { type: Date },
  endDate: { type: Date },
  deadline: { type: Date },
  tags: [{ type: String, trim: true }],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  activityLog: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add activity log helper method
projectSchema.methods.addActivity = function(userId, action, details) {
  this.activityLog.unshift({
    user: userId,
    action: action,
    details: details,
    timestamp: new Date()
  });
  // Keep only last 50 activities
  if (this.activityLog.length > 50) {
    this.activityLog = this.activityLog.slice(0, 50);
  }
};

// Virtual for progress calculation (percentage of completed tasks)
projectSchema.virtual('progress').get(async function () {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ project: this._id });
  if (totalTasks === 0) return 0;
  const completedTasks = await Task.countDocuments({ project: this._id, status: 'Done' });
  return Math.round((completedTasks / totalTasks) * 100);
});

export default mongoose.model('Project', projectSchema);
