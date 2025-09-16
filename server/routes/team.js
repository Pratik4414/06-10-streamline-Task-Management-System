import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/team - Get all users (for manager view)
router.get('/', protect, manager, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/team/add - Add a new team member (manager only)
router.post('/add', protect, manager, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: "A user with this email already exists." });
    }
    const newUser = new User({ name, email, password, role, provider: 'local' });
    const savedUser = await newUser.save();
    // Don't send the password back
    const userToReturn = { _id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role };
    res.status(201).json({ success: true, user: userToReturn });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error while adding user." });
  }
});

export default router;