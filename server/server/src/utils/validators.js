/**
 * Simple validation helpers.
 */

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateSignup(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }
  if (!body.email || !validateEmail(body.email)) {
    errors.push('A valid email is required.');
  }
  if (!body.password || body.password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body.email || !validateEmail(body.email)) {
    errors.push('A valid email is required.');
  }
  if (!body.password) {
    errors.push('Password is required.');
  }
  return errors;
}

function validateProject(body) {
  const errors = [];
  if (!body.name || body.name.trim().length < 1) {
    errors.push('Project name is required.');
  }
  return errors;
}

function validateTask(body) {
  const errors = [];
  if (!body.title || body.title.trim().length < 1) {
    errors.push('Task title is required.');
  }
  const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push('Status must be one of: TODO, IN_PROGRESS, DONE.');
  }
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
  if (body.priority && !validPriorities.includes(body.priority)) {
    errors.push('Priority must be one of: LOW, MEDIUM, HIGH.');
  }
  return errors;
}

module.exports = { validateSignup, validateLogin, validateProject, validateTask, validateEmail };
