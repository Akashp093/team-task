const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validateProject, validateEmail } = require('../utils/validators');

const router = express.Router();

// GET /api/projects - List user's projects
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            _count: { select: { tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
      memberCount: m.project.members.length,
      taskCount: m.project._count.tasks,
    }));

    res.json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects - Create project (creator becomes Admin)
router.post('/', auth, async (req, res) => {
  try {
    const errors = validateProject(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    res.status(201).json({ project: { ...project, myRole: 'ADMIN' } });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', auth, roleGuard('ADMIN', 'MEMBER'), async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ project: { ...project, myRole: req.membership.role } });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, roleGuard('ADMIN'), async (req, res) => {
  try {
    const errors = validateProject(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json({ project });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, roleGuard('ADMIN'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects/:id/members - Add member by email
router.post('/:id/members', auth, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: 'No user found with this email. They need to sign up first.' });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } },
    });
    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: req.params.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ member });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', auth, roleGuard('ADMIN'), async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove yourself from the project.' });
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: req.params.userId,
          projectId: req.params.id,
        },
      },
    });

    res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    console.error('Remove member error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Member not found.' });
    }
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
