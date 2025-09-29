import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import mongoose from 'mongoose';

// Simple heuristic: send reminders 24h and 2h before due; mark when sent via metadata on Notification
export async function runDeadlineReminders(now = new Date()) {
  const inHours = (ms) => ms / (1000 * 60 * 60);
  const twoHours = 2;
  const twentyFour = 24;

  const windowMinutes = 5; // send within a small window to avoid duplicates
  const start = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const end = new Date(now.getTime() + windowMinutes * 60 * 1000);

  // Find tasks with due dates such that due - now ~= 24h or 2h
  const dueCandidates = await Task.find({ dueDate: { $gte: start, $lte: new Date(now.getTime() + 1000 * 60 * 60 * (twentyFour + 1)) } })
    .populate('assignedTo', '_id name')
    .lean();

  const ops = [];
  for (const task of dueCandidates) {
    if (!task.assignedTo || !task.dueDate) continue;
    const hoursLeft = inHours(new Date(task.dueDate).getTime() - now.getTime());
    const bucket = Math.abs(hoursLeft - twoHours) < 0.2 ? '2h' : (Math.abs(hoursLeft - twentyFour) < 0.5 ? '24h' : null);
    if (!bucket) continue;

    // Check prefs
    const pref = await NotificationPreference.findOne({ user: task.assignedTo._id }).lean();
    if (pref && pref.categories && pref.categories.deadlines === false) continue;

    ops.push(Notification.create({
      user: task.assignedTo._id,
      type: 'deadline',
      title: `Reminder: "${task.title}" due ${bucket === '2h' ? 'in 2 hours' : 'tomorrow'}`,
      message: `Your task is approaching its deadline.`,
      link: `/tasks/${task._id}`,
      metadata: { taskId: task._id, bucket },
    }));
  }

  if (ops.length) await Promise.allSettled(ops);
}
