const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - Aggregated stats for current user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all tasks assigned to user
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Count by status
    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    myTasks.forEach((t) => {
      statusCounts[t.status]++;
    });

    // Overdue tasks (due date passed and not DONE)
    const now = new Date();
    const overdueTasks = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Recent tasks (last 10 updated)
    const recentTasks = myTasks.slice(0, 10);

    // Project count
    const projectCount = await prisma.projectMember.count({
      where: { userId },
    });

    res.json({
      totalTasks: myTasks.length,
      statusCounts,
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasks.slice(0, 5),
      recentTasks,
      projectCount,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
