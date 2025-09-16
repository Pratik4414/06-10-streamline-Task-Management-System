import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Manager
router.post('/', protect, manager, async (req, res) => {
  const { name, description, members } = req.body;
  try {
    const project = new Project({
      name,
      description,
      manager: req.user.id,
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
            projects = await Project.find({ $or: [{ manager: req.user.id }, { members: req.user.id }]}).populate('manager members', 'name email');
        } else {
            // Employee sees only projects they are a member of
            projects = await Project.find({ members: req.user.id }).populate('manager members', 'name email');
        }
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
