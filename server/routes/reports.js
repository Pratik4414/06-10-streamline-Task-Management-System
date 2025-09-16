import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get aggregated stats for the dashboard sidebar
// @route   GET /api/reports/dashboard-stats
// @access  Private
router.get('/dashboard-stats', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Get Completed Task counts for team members
        const completedTasks = await Task.aggregate([
            { $match: { status: 'Done' } },
            { $group: { _id: '$assignedTo', tasks: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.name', tasks: 1, fill: '#8A63D2' } }, // Mapped for chart
            { $limit: 4 }
        ]);

        // 2. Calculate Efficiency (Completed Tasks / Total Tasks) for team members
        const allTasks = await Task.aggregate([
            { $group: { _id: '$assignedTo', total: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.name', total: 1 } }
        ]);

        const efficiencyData = allTasks.map(userTasks => {
            const userCompleted = completedTasks.find(c => c.name === userTasks.name);
            const completedCount = userCompleted ? userCompleted.tasks : 0;
            const efficiency = userTasks.total > 0 ? Math.round((completedCount / userTasks.total) * 100) : 0;
            return {
                name: userTasks.name,
                value: efficiency,
                fill: '#8A63D2' // Default color
            };
        });

        // 3. Plan / Schedule (This is typically from a different collection, so we'll keep it as mock data for now)
        const scheduleData = [
            { time: '12:00 - 13:00', task: 'Lunch with the team' },
            { time: '13:00 - 14:00', task: 'Project Alpha sync' },
            { time: '14:00 - 15:00', task: 'Code review' },
        ];

        res.json({
            completedTasksData: completedTasks,
            efficiencyData,
            scheduleData
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;