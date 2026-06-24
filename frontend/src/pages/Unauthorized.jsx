import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="auth-wrapper animate-fade-in">
      <div className="glass-panel auth-card" style={{ textAlign: 'center' }}>
        <svg 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="var(--accent-danger)" 
          strokeWidth="2" 
          style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))' }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '12px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          You do not have the required permissions to view this workspace. Please contact your company administrator.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
