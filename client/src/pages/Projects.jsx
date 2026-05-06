import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProjects = () => {
    api.get('/projects').then((res) => setProjects(res.data.projects)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', form);
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-container">
      <div className="projects-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((p) => (
            <div key={p.id} className="card project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-name">{p.name}</div>
              <div className="project-desc">{p.description || 'No description'}</div>
              <div className="project-meta">
                <span>👥 {p.memberCount} member{p.memberCount !== 1 ? 's' : ''}</span>
                <span>📋 {p.taskCount} task{p.taskCount !== 1 ? 's' : ''}</span>
                <span className="project-role"><span className={`badge badge-${p.myRole?.toLowerCase()}`}>{p.myRole}</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Project</button>
        </div>
      )}

      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)} footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
          </>
        }>
          {error && <div className="alert-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input id="project-name-input" className="form-input" placeholder="My Project" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea id="project-desc-input" className="form-textarea" placeholder="What's this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
