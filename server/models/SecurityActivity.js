import mongoose from 'mongoose';

const SecurityActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loginTime: {
    type: Date,
    required: true
  },
  logoutTime: {
    type: Date,
    default: null
  },
  duration: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('SecurityActivity', SecurityActivitySchema);