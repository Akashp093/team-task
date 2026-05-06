import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditTask, setShowEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = project?.myRole === 'ADMIN';

  const fetchProject = () => {
    api.get(`/projects/${id}`).then((res) => setProject(res.data.project)).catch((err) => {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);

  const columns = [
    { key: 'TODO', label: 'To Do', tasks: project?.tasks?.filter((t) => t.status === 'TODO') || [] },
    { key: 'IN_PROGRESS', label: 'In Progress', tasks: project?.tasks?.filter((t) => t.status === 'IN_PROGRESS') || [] },
    { key: 'DONE', label: 'Done', tasks: project?.tasks?.filter((t) => t.status === 'DONE') || [] },
  ];

  const handleCreateTask = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post(`/projects/${id}/tasks`, { ...taskForm, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' });
      fetchProject();
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.put(`/tasks/${showEditTask.id}`, taskForm);
      setShowEditTask(null); fetchProject();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); fetchProject(); } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try { await api.put(`/tasks/${taskId}`, { status: newStatus }); fetchProject(); } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setShowMemberModal(false); setMemberEmail(''); setMemberRole('MEMBER'); fetchProject();
    } catch (err) { setError(err.response?.data?.error || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); fetchProject(); } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const openEditTask = (task) => {
    setTaskForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', assigneeId: task.assigneeId || '' });
    setShowEditTask(task); setError('');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const isOverdue = (d, s) => d && new Date(d) < new Date() && s !== 'DONE';
  const initial = (name) => name?.charAt(0)?.toUpperCase() || '?';
  const priorityClass = (p) => p === 'HIGH' ? 'badge-high' : p === 'LOW' ? 'badge-low' : 'badge-medium';

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!project) return null;

  return (
    <div className="page-container">
      <div className="project-detail-header">
        <div className="project-info">
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
        </div>
        <div className="project-detail-actions">
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => { setShowTaskModal(true); setError(''); }}>+ Add Task</button>}
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => { setShowMemberModal(true); setError(''); }}>+ Add Member</button>}
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>}
        </div>
      </div>

      <div className="members-section">
        <h2>👥 Team ({project.members?.length})</h2>
        <div className="members-list">
          {project.members?.map((m) => (
            <div key={m.id} className="member-chip">
              <div className="avatar-sm">{initial(m.user.name)}</div>
              <span>{m.user.name}</span>
              <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
              {isAdmin && m.userId !== user.id && (
                <button className="remove-member" onClick={() => handleRemoveMember(m.userId)} title="Remove member">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((col) => (
          <div key={col.key} className="kanban-column">
            <div className="kanban-column-header">
              <h3>{col.label}</h3>
              <span className="count">{col.tasks.length}</span>
            </div>
            <div className="kanban-tasks">
              {col.tasks.map((task) => (
                <div key={task.id} className="task-card" onClick={() => (isAdmin || task.assigneeId === user.id) && openEditTask(task)}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
                    {task.dueDate && (
                      <span className={`task-due ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                        📅 {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="task-assignee">
                        <span className="avatar-sm">{initial(task.assignee.name)}</span>
                        {task.assignee.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {col.tasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>No tasks</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <Modal title="Create Task" onClose={() => setShowTaskModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateTask} disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button></>
        }>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleCreateTask}>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
              <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Assignee</label><select className="form-select" value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}><option value="">Unassigned</option>{project.members?.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {showEditTask && (
        <Modal title="Edit Task" onClose={() => setShowEditTask(null)} footer={
          <>{isAdmin && <button className="btn btn-danger btn-sm" onClick={() => { handleDeleteTask(showEditTask.id); setShowEditTask(null); }} style={{ marginRight: 'auto' }}>Delete</button>}
          <button className="btn btn-secondary" onClick={() => setShowEditTask(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdateTask} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></>
        }>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleUpdateTask}>
            {isAdmin ? (
              <>
                <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option></select></div>
                  <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Assignee</label><select className="form-select" value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}><option value="">Unassigned</option>{project.members?.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></div>
                </div>
              </>
            ) : (
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option></select></div>
            )}
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal title="Add Team Member" onClose={() => setShowMemberModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddMember} disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button></>
        }>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleAddMember}>
            <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-input" placeholder="colleague@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
