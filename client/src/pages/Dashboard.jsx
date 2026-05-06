import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const isOverdue = (d, s) => d && new Date(d) < new Date() && s !== 'DONE';
  const statusLabel = (s) => s === 'IN_PROGRESS' ? 'In Progress' : s === 'TODO' ? 'To Do' : 'Done';
  const statusClass = (s) => s === 'IN_PROGRESS' ? 'badge-in-progress' : s === 'TODO' ? 'badge-todo' : 'badge-done';
  const priorityClass = (p) => p === 'HIGH' ? 'badge-high' : p === 'LOW' ? 'badge-low' : 'badge-medium';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's an overview of your tasks and projects</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-glow"></div>
          <div className="stat-icon">📋</div>
          <div className="stat-value">{data?.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-glow"></div>
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{data?.statusCounts?.IN_PROGRESS || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-glow"></div>
          <div className="stat-icon">✅</div>
          <div className="stat-value">{data?.statusCounts?.DONE || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-glow"></div>
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{data?.overdueCount || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-glow"></div>
          <div className="stat-icon">📁</div>
          <div className="stat-value">{data?.projectCount || 0}</div>
          <div className="stat-label">Projects</div>
        </div>
      </div>

      {data?.overdueTasks?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-rose)' }}>⚠️ Overdue Tasks</h2>
          <div className="tasks-table">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Due Date</th></tr></thead>
              <tbody>
                {data.overdueTasks.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td><Link to={`/projects/${t.project?.id}`}>{t.project?.name}</Link></td>
                    <td><span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span></td>
                    <td style={{ color: 'var(--accent-rose)' }}>{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Recent Tasks</h2>
        {data?.recentTasks?.length > 0 ? (
          <div className="tasks-table">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
              <tbody>
                {data.recentTasks.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><Link to={`/projects/${t.project?.id}`}>{t.project?.name}</Link></td>
                    <td><span className={`badge ${statusClass(t.status)}`}>{statusLabel(t.status)}</span></td>
                    <td><span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span></td>
                    <td className={isOverdue(t.dueDate, t.status) ? 'overdue' : ''} style={isOverdue(t.dueDate, t.status) ? { color: 'var(--accent-rose)' } : {}}>{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No tasks yet</h3>
            <p>Tasks assigned to you will appear here.</p>
            <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
          </div>
        )}
      </div>
    </div>
  );
}
