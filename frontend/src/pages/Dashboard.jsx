import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Test endpoint states
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  // Local state for role actions (mock data / interactivity)
  const [activeTab, setActiveTab] = useState('overview');
  
  // Job Seeker auto-apply toggle
  const [autoApplyActive, setAutoApplyActive] = useState(false);
  const [uploadedCV, setUploadedCV] = useState(null);
  const [uploadedCVFile, setUploadedCVFile] = useState(null);
  const [cvUploadStatus, setCvUploadStatus] = useState('');
  const [cvUploadError, setCvUploadError] = useState('');
  const [cvUploads, setCvUploads] = useState([]);
  const [cvUploadsLoading, setCvUploadsLoading] = useState(false);
  const [cvUploadsError, setCvUploadsError] = useState('');

  // HR Manager posting job
  const [jobs, setJobs] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState('');
  const [jobSuccess, setJobSuccess] = useState('');
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');

  // Company Admin manager list
  const [managers, setManagers] = useState([
    { id: 1, name: 'Alice Smith', department: 'Sales', status: 'Active' },
    { id: 2, name: 'Bob Johnson', department: 'Engineering', status: 'Active' },
    { id: 3, name: 'Charlie Davis', department: 'HR Operations', status: 'Inactive' },
  ]);

  const testEndpoint = async (endpoint) => {
    setTestLoading(true);
    setTestResult('');
    setTestError('');
    try {
      const res = await api.get(`/users/${endpoint}`);
      setTestResult(`Success! Access Granted. User '${res.data.full_name}' authenticated for this route.`);
    } catch (err) {
      setTestError(err.response?.data?.detail || `Access Denied! ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const fetchJobs = async () => {
    setJobLoading(true);
    setJobError('');
    try {
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data.map((job) => ({
        ...job,
        applicants: job.applicants ?? 0,
        match: job.match ?? 'N/A',
      })));
    } catch (err) {
      setJobError(err.response?.data?.detail || 'Failed to load job postings.');
    } finally {
      setJobLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    setIsPostingJob(true);
    setJobSuccess('');
    setJobError('');

    try {
      const res = await api.post('/recruitment/jobs', {
        title: newJobTitle,
        description: `Hiring for ${newJobTitle} in ${newJobDept}.`,
        department: newJobDept,
        location: 'Remote',
        salary_range: '',
      });
      setJobs([{ ...res.data, applicants: 0, match: 'N/A' }, ...jobs]);
      setNewJobTitle('');
      setJobSuccess('Job posting created successfully.');
    } catch (err) {
      setJobError(err.response?.data?.detail || 'Could not post the job.');
    } finally {
      setIsPostingJob(false);
    }
  };

  const toggleManagerStatus = (id) => {
    setManagers(managers.map(m => 
      m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m
    ));
  };

  const handleCVUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedCVFile(e.target.files[0]);
      setUploadedCV(e.target.files[0].name);
      setCvUploadStatus('');
      setCvUploadError('');
    }
  };

  const fetchCvUploads = async () => {
    setCvUploadsLoading(true);
    setCvUploadsError('');
    try {
      const res = await api.get('/recruitment/me/cv-uploads');
      setCvUploads(res.data);
    } catch (err) {
      setCvUploadsError(err.response?.data?.detail || 'Unable to load uploaded CVs.');
    } finally {
      setCvUploadsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'hr_manager') {
      fetchJobs();
    }
    if (user?.role === 'job_seeker') {
      fetchCvUploads();
    }
  }, [user]);

  const handleUploadCV = async () => {
    if (!uploadedCVFile) return;

    setCvUploadStatus('');
    setCvUploadError('');

    const formData = new FormData();
    formData.append('file', uploadedCVFile);

    try {
      await api.post('/recruitment/upload-cv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCvUploadStatus('CV uploaded successfully.');
      setUploadedCVFile(null);
      setUploadedCV(null);
    } catch (err) {
      setCvUploadError(err.response?.data?.detail || 'CV upload failed.');
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Workspace Portal</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user.full_name}. Here is your intelligent dashboard summary.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Role-Based Layout Routing */}
      {user.role === 'job_seeker' && (
        <div className="grid-2">
          {/* Left Column: CV & Auto Apply */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel stat-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>AI CV Upload & Parsing</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                Upload your CV in PDF format. Our natural language processing engine (spaCy) will automatically extract your core skills, work history, and match you with ideal postings.
              </p>
              
              <div style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              }}
              onDragOver={(e) => e.preventDefault()}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleCVUpload}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }} 
                />
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ marginBottom: '12px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                  {uploadedCV ? `Selected: ${uploadedCV}` : 'Drag & Drop your CV here or Browse'}
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports PDF files up to 5MB</span>
              </div>
              {uploadedCV && (
                <>
                  {cvUploadStatus && (
                    <div className="alert alert-success" style={{ marginTop: '20px' }}>
                      {cvUploadStatus}
                    </div>
                  )}
                  {cvUploadError && (
                    <div className="alert alert-danger" style={{ marginTop: '20px' }}>
                      {cvUploadError}
                    </div>
                  )}
                  <button
                    className="btn btn-cyan"
                    style={{ marginTop: '20px', width: '100%' }}
                    onClick={handleUploadCV}
                    type="button"
                  >
                    Upload CV to ApplyIt
                  </button>
                </>
              )}
            </div>
            {cvUploadsLoading ? (
              <div className="glass-panel" style={{ padding: '24px' }}>
                Loading your uploaded CVs...
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Uploaded CVs</h2>
                {cvUploadsError ? (
                  <div className="alert alert-danger">{cvUploadsError}</div>
                ) : cvUploads.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No CVs uploaded yet.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '12px' }}>
                    {cvUploads.map((cv) => (
                      <li key={cv.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                          <div>
                            <strong>{cv.filename}</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(cv.created_at).toLocaleString()}</div>
                          </div>
                          <span className="user-badge badge-seeker">Uploaded</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="glass-panel stat-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--accent-secondary)' }}>Auto-Apply Bot</h2>
                {/* Custom Toggle Switch */}
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={autoApplyActive}
                    onChange={(e) => setAutoApplyActive(e.target.checked)}
                    style={{ display: 'none' }} 
                  />
                  <div style={{
                    width: '50px',
                    height: '26px',
                    backgroundColor: autoApplyActive ? 'var(--accent-success)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '99px',
                    padding: '3px',
                    transition: 'var(--transition-smooth)',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transform: autoApplyActive ? 'translateX(24px)' : 'translateX(0)',
                      transition: 'var(--transition-smooth)'
                    }} />
                  </div>
                </label>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>
                When enabled, the automated Playwright crawler will automatically fill and submit applications on external job sites (Indeed, LinkedIn) matching your parsed profile.
              </p>
              <div className="alert" style={{ background: autoApplyActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', color: autoApplyActive ? 'var(--accent-success)' : 'var(--text-muted)', borderColor: autoApplyActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)', marginBottom: 0 }}>
                <span>Status: {autoApplyActive ? 'Active & monitoring recommendations' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Recommendations Feed & Tracking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>AI Recommended Vacancies</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '4px solid var(--accent-cyan)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '1rem' }}>Senior Python / FastAPI Developer</strong>
                    <span className="user-badge badge-seeker" style={{ fontSize: '0.7rem' }}>96% MATCH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Global Tech Corp · Remote</span>
                    <span>$110k - $130k</span>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '1rem' }}>Full Stack Engineer (React + Python)</strong>
                    <span className="user-badge badge-manager" style={{ fontSize: '0.7rem' }}>88% MATCH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>Innovate Ltd · Hybrid</span>
                    <span>$90k - $105k</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Application Tracker</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Global Tech Corp</td>
                    <td>Senior Python Developer</td>
                    <td>2026-06-23</td>
                    <td><span className="user-badge badge-seeker">Applied</span></td>
                  </tr>
                  <tr>
                    <td>Starlight Tech</td>
                    <td>React Developer</td>
                    <td>2026-06-20</td>
                    <td><span className="user-badge badge-admin">Interview</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {user.role === 'hr_manager' && (
        <div className="grid-2">
          {/* Left: Stats & Post Vacancy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="glass-panel stat-card">
                <span className="stat-title">Active Vacancies</span>
                <span className="stat-value">{jobs.length}</span>
                <span className="stat-desc">Currently open to applicants</span>
              </div>
              <div className="glass-panel stat-card">
                <span className="stat-title">Total Applicants</span>
                <span className="stat-value">32</span>
                <span className="stat-desc">+8 new this week</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--accent-primary)' }}>Post a New Vacancy</h2>
              {jobSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '18px' }}>
                  {jobSuccess}
                </div>
              )}
              {jobError && (
                <div className="alert alert-danger" style={{ marginBottom: '18px' }}>
                  {jobError}
                </div>
              )}
              <form onSubmit={handlePostJob}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Lead Backend Engineer"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-control"
                    value={newJobDept}
                    onChange={(e) => setNewJobDept(e.target.value)}
                    style={{ background: '#121420' }}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isPostingJob}>
                  {isPostingJob ? 'Posting vacancy...' : 'Post Job Listing'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Active Postings & Shortlists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Active Job Postings</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Applicants</th>
                    <th>AI Shortlist</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td><strong>{job.title}</strong></td>
                      <td>{job.department}</td>
                      <td style={{ textAlign: 'center' }}>{job.applicants}</td>
                      <td><span className="user-badge badge-seeker">Ready ({job.match})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Top AI-Ranked Candidates</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <strong>Tadiwanashe Hlema</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Applied for: Python Developer</div>
                  </div>
                  <span className="user-badge badge-seeker">96% Cosine Match</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <strong>Alex Mercer</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Applied for: Python Developer</div>
                  </div>
                  <span className="user-badge badge-manager">89% Cosine Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.role === 'company_admin' && (
        <div className="grid-2">
          {/* Left: Stats & HR Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="glass-panel stat-card">
                <span className="stat-title">Platform Headcount</span>
                <span className="stat-value">142</span>
                <span className="stat-desc">Across 5 departments</span>
              </div>
              <div className="glass-panel stat-card">
                <span className="stat-title">Monthly Payroll Run</span>
                <span className="stat-value">$124,500</span>
                <span className="stat-desc">Next scheduled: June 30</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', color: 'var(--accent-warning)' }}>HR Manager Accounts</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
                Activate or deactivate HR accounts to delegate department hiring permissions.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {managers.map(mgr => (
                  <div key={mgr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <strong>{mgr.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{mgr.department}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`user-badge ${mgr.status === 'Active' ? 'badge-seeker' : 'badge-manager'}`}>
                        {mgr.status}
                      </span>
                      <button 
                        onClick={() => toggleManagerStatus(mgr.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Toggle Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Policy config & Audit Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Policy Settings</h2>
              <div className="form-group">
                <label className="form-label">Annual Leave Policy (Days per year)</label>
                <input type="number" className="form-control" defaultValue={21} />
              </div>
              <div className="form-group">
                <label className="form-label">Allow Carry-Over Balance</label>
                <select className="form-control" defaultValue="yes" style={{ background: '#121420' }}>
                  <option value="yes">Yes (Up to 5 days)</option>
                  <option value="no">No</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Save Policy Configurations</button>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>System Logs (Audit Trail)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                <div>[2026-06-24 10:55] USER_LOGIN: Admin logged in from IP 127.0.0.1</div>
                <div>[2026-06-24 09:30] DB_BACKUP: Automatic system snapshot succeeded</div>
                <div>[2026-06-23 16:42] PAYROLL_RUN: Department Engineering payroll triggered by Alice</div>
                <div>[2026-06-23 14:10] VACANCY_POSTED: New job posting created for Python Developer</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Middleware Role Testing Panel */}
      <div className="glass-panel" style={{ marginTop: '40px', padding: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Role-Based Access Control Verification</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
          Test endpoints below to check the role enforcement middleware. Endpoints verify your auth token and roles asynchronously against the FastAPI backend.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => testEndpoint('seeker-only')} className="btn btn-secondary">
            Test Job Seeker Route
          </button>
          <button onClick={() => testEndpoint('hr-only')} className="btn btn-secondary">
            Test HR Manager Route
          </button>
          <button onClick={() => testEndpoint('admin-only')} className="btn btn-secondary">
            Test Admin Route
          </button>
        </div>

        {testLoading && (
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>Verifying permission permissions with API server...</div>
        )}

        {testResult && (
          <div className="alert alert-success" style={{ margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{testResult}</span>
          </div>
        )}

        {testError && (
          <div className="alert alert-danger" style={{ margin: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{testError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
