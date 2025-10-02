import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get aggregated stats for the dashboard sidebar and project-level analytics
// @route   GET /api/reports/dashboard-stats
// @access  Private
router.get('/dashboard-stats', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { projectId } = req.query;

        let matchStage = {};
        if (projectId) {
            matchStage.project = new mongoose.Types.ObjectId(projectId);
        }

        // 1. Get Completed Task counts for team members (optionally filtered by project)
        const completedTasks = await Task.aggregate([
            { $match: { status: 'Done', ...matchStage } },
            { $group: { _id: '$assignedTo', tasks: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.name', tasks: 1, fill: '#8A63D2' } },
            { $limit: 4 }
        ]);

        // 2. Calculate Efficiency (Completed Tasks / Total Tasks) for team members
        const allTasks = await Task.aggregate([
            { $match: matchStage },
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
                fill: '#8A63D2'
            };
        });

        // 3. Burn-down chart data (tasks vs time)
        const burnDownData = await Task.aggregate([
            { $match: matchStage },
            { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, status: "$status" }, count: { $sum: 1 } } },
            { $sort: { "_id.date": 1 } }
        ]);

        res.json({
            completedTasksData: completedTasks,
            efficiencyData,
            burnDownData
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;