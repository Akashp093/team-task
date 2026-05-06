const prisma = require('../config/db');

/**
 * Middleware factory that checks if the current user has the required role
 * in the project specified by :id or :projectId param.
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'MEMBER')
 */
function roleGuard(...roles) {
  return async (req, res, next) => {
    const projectId = req.params.id || req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required.' });
    }

    try {
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: projectId,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this project.' });
      }

      if (!roles.includes(membership.role)) {
        return res.status(403).json({ error: 'You do not have permission to perform this action.' });
      }

      req.membership = membership;
      next();
    } catch (err) {
      console.error('Role guard error:', err);
      return res.status(500).json({ error: 'Server error checking permissions.' });
    }
  };
}

module.exports = roleGuard;
