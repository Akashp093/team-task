import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="logo-icon">T</div>
        <span>TaskFlow</span>
      </Link>
      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>Dashboard</Link>
        <Link to="/projects" className={isActive('/projects')}>Projects</Link>
      </div>
      <div className="navbar-user">
        <span className="navbar-username">{user?.name}</span>
        <div className="navbar-avatar">{initial}</div>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
