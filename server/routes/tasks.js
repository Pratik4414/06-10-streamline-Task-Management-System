import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';

const router = express.Router();

// GET /api/tasks - (No changes needed here)
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'manager' 
      ? {} 
      : { assignedTo: req.user.id };

    const tasks = await Task.find(query)
      .populate('project', 'name')
      .populate('assignedTo', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks - Create a task
router.post('/', protect, async (req, res) => {
  const { title, project, assignedTo, dueDate, priority, status } = req.body;
  try {
    // Basic validation on the server side
    if (!title || !project || !assignedTo) {
        return res.status(400).json({ success: false, error: 'Title, project, and assignee are required.' });
    }

    const task = new Task({ 
        title, 
        project, 
        assignedTo, 
        dueDate, 
        priority, 
        status: status || 'To Do' 
    });
    
    let createdTask = await task.save();

    createdTask = await Task.findById(createdTask._id)
        .populate('project', 'name')
        .populate('assignedTo', 'name');

    res.status(201).json(createdTask);
  } catch (error) {
    console.error("Task creation error:", error);
    // *** THIS IS THE FIX ***
    // Provide a more specific error message instead of a generic one.
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server error while creating task.' });
  }
});


export default router;