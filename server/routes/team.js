import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

const router = express.Router();

// GET /api/team/overview - Teams with members and unassigned employees for this manager
router.get('/overview', protect, manager, async (req, res) => {
  try {
    const managerId = req.user._id;
    // Fetch all teams owned by this manager with populated members
    const teams = await Team.find({ manager: managerId })
      .sort({ name: 1 })
      .populate({ path: 'members', select: 'name email role', options: { sort: { name: 1 } } })
      .lean();

    // Build a set of all assigned user ids in this manager's teams
    const assignedIds = new Set();
    for (const t of teams) {
      for (const m of t.members) assignedIds.add(String(m._id));
    }

    // Unassigned = users (excluding manager) not present in any team.members
    const unassigned = await User.find({
      _id: { $ne: managerId, $nin: Array.from(assignedIds) },
    })
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, teams, unassigned });
  } catch (error) {
    console.error('Team overview error:', error);
    res.status(500).json({ success: false, error: 'Server error while loading team overview.' });
  }
});

// GET /api/team - Get roster (all users managed by this manager, excluding the manager)
router.get('/', protect, manager, async (req, res) => {
  try {
    // For now, roster = all users except self; can be narrowed to only manager's org later
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Team list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/team/available-users - Users not currently in the roster table (exclude manager and existing list)
router.get('/available-users', protect, manager, async (req, res) => {
  try {
    // Manager excludes self; on client we pass currently displayed ids in query to exclude
    const excludeIds = (req.query.exclude || '').split(',').filter(Boolean);
    const filter = { _id: { $ne: req.user._id } };
    if (excludeIds.length) {
      filter._id.$nin = excludeIds;
    }
    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Available users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/team/add-members - Add existing users to roster (manager only)
router.post('/add-members', protect, manager, async (req, res) => {
  try {
    const { userIds } = req.body; // array of user IDs to include in roster view
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds must be a non-empty array' });
    }
    const users = await User.find({ _id: { $in: userIds, $ne: req.user._id } }).select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ success: false, error: 'Server error while adding members.' });
  }
});

// POST /api/team/create - Create a team entity with selected members
router.post('/create', protect, manager, async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Team name and at least one member are required.' });
    }
    // Validate users exist and exclude manager
    const validMembers = await User.find({ _id: { $in: memberIds, $ne: req.user._id } }).select('_id');
    if (validMembers.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid members selected.' });
    }
    const team = new Team({ name, manager: req.user._id, members: validMembers.map(u => u._id) });
    const created = await team.save();
    const populated = await Team.findById(created._id).populate('members', 'name email role');
    res.status(201).json({ success: true, team: populated });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, error: 'Server error while creating team.' });
  }
});

// PATCH /api/team/:id/members - Replace members of a team owned by this manager
router.patch('/:id/members', protect, manager, async (req, res) => {
  try {
    const teamId = req.params.id;
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ success: false, error: 'memberIds must be an array' });
    }
    const team = await Team.findOne({ _id: teamId, manager: req.user._id });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    // Filter out manager and ensure users exist
    const validMembers = await User.find({ _id: { $in: memberIds, $ne: req.user._id } }).select('_id');
    team.members = validMembers.map(u => u._id);
    await team.save();

    const populated = await Team.findById(team._id)
      .populate('members', 'name email role')
      .lean();

    // Compute updated unassigned list (users not in any team for this manager)
    const mgrTeams = await Team.find({ manager: req.user._id }).select('members').lean();
    const assigned = new Set();
    for (const t of mgrTeams) (t.members || []).forEach(m => assigned.add(String(m)));
    const unassigned = await User.find({ _id: { $ne: req.user._id, $nin: Array.from(assigned) } })
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, team: populated, unassigned });
  } catch (error) {
    console.error('Update team members error:', error);
    res.status(500).json({ success: false, error: 'Server error while updating team.' });
  }
});

// DELETE /api/team/:id - Delete a team owned by this manager
router.delete('/:id', protect, manager, async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findOne({ _id: teamId, manager: req.user._id });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    await Team.deleteOne({ _id: teamId });

    // Recompute unassigned list (users not in any team for this manager)
    const mgrTeams = await Team.find({ manager: req.user._id }).select('members').lean();
    const assigned = new Set();
    for (const t of mgrTeams) (t.members || []).forEach(m => assigned.add(String(m)));
    const unassigned = await User.find({ _id: { $ne: req.user._id, $nin: Array.from(assigned) } })
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, deletedId: teamId, unassigned });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting team.' });
  }
});

export default router;