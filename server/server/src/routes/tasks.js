const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateTask } = require('../utils/validators');

const router = express.Router();

// GET /api/projects/:id/tasks - List tasks in project
router.get('/projects/:id/tasks', auth, roleGuard('ADMIN', 'MEMBER'), async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.query;

    const where = { projectId: req.params.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tasks });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects/:id/tasks - Create task (Admin only)
router.post('/projects/:id/tasks', auth, roleGuard('ADMIN'), async (req, res) => {
  try {
    const errors = validateTask(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // If assignee provided, verify they are a project member
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assigneeId, projectId: req.params.id } },
      });
      if (!isMember) {
        return res.status(400).json({ error: 'Assignee must be a member of this project.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.params.id,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/tasks/:id - Update task (Admin or Assignee for status)
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: req.user.id, projectId: task.projectId },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }

    // Members can only update status of their own tasks
    if (membership.role === 'MEMBER') {
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Members can only update tasks assigned to them.' });
      }
      // Members can only change status
      const allowed = ['status'];
      const updateKeys = Object.keys(req.body);
      const unauthorized = updateKeys.filter((k) => !allowed.includes(k));
      if (unauthorized.length > 0) {
        return res.status(403).json({ error: 'Members can only update task status.' });
      }
    }

    const errors = validateTask(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) {
      if (assigneeId) {
        // Verify assignee is a project member
        const isMember = await prisma.projectMember.findUnique({
          where: { userId_projectId: { userId: assigneeId, projectId: task.projectId } },
        });
        if (!isMember) {
          return res.status(400).json({ error: 'Assignee must be a member of this project.' });
        }
      }
      updateData.assigneeId = assigneeId || null;
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/tasks/:id - Delete task (Admin only)
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check admin role
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: req.user.id, projectId: task.projectId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only project admins can delete tasks.' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
