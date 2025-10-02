import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, manager } from '../middleware/authMiddleware.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

const router = express.Router();

// Multer setup for local file uploads (can be replaced with S3/GCP)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// @desc    Upload project file
// @route   POST /api/projects/:id/files
// @access  Private
router.post('/:id/files', protect, upload.single('file'), async (req, res) => {
  try {
    // Save file info to project or a separate model if needed
    res.status(201).json({ filename: req.file.filename, path: req.file.path });
  } catch (error) {
    res.status(500).json({ error: 'File upload error' });
  }
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Manager
router.post('/', protect, manager, async (req, res) => {
  const { name, description, team: teamId } = req.body;
  try {
    let members = [];
    if (teamId) {
      // Fetch team and assign all its members to the project
      const Team = (await import('../models/Team.js')).default;
      const team = await Team.findById(teamId).populate('members', 'name email');
      if (!team) return res.status(400).json({ error: 'Invalid team selected.' });
      members = team.members.map(user => ({ user: user._id, role: 'Developer' }));
    }
    const project = new Project({
      name,
      description,
      manager: req.user.id,
      team: teamId,
      members,
    });
    const createdProject = await project.save();
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get projects for the logged-in user
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let projects;
    if (req.user.role === 'manager') {
      // Manager sees all projects they manage or are a member of
      projects = await Project.find({ $or: [{ manager: req.user.id }, { members: { $elemMatch: { user: req.user.id } } }] })
        .populate('manager', 'name email')
        .populate('members.user', 'name email')
        .populate('team', 'name');
    } else {
      // Employee sees only projects they are a member of
      projects = await Project.find({ members: { $elemMatch: { user: req.user.id } } })
        .populate('manager', 'name email')
        .populate('members.user', 'name email')
        .populate('team', 'name');
    }
    res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
