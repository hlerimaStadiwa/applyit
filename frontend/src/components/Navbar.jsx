import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'company_admin': return 'badge-admin';
      case 'hr_manager': return 'badge-manager';
      default: return 'badge-seeker';
    }
  };

  const formatRoleName = (role) => {
    if (!role) return '';
    return role.replace('_', ' ');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        ApplyIt
      </Link>
      
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <div className="nav-user">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.full_name}</strong>
              </span>
              <span className={`user-badge ${getRoleBadgeClass(user.role)}`}>
                {formatRoleName(user.role)}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
