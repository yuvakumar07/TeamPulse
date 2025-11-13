import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await authService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard statistics');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error">
          <p>{error}</p>
          <button onClick={fetchDashboardStats} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="welcome-text">
            Welcome back, <strong>{currentUser?.full_name}</strong>
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/employees')} className="btn btn-primary">
            Manage Employees
          </button>
          <button onClick={() => navigate('/admin/users')} className="btn btn-secondary">
            Manage Admin Users
          </button>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Employee Statistics */}
          <section className="dashboard-section">
            <h2>Employee Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.total_employees || 0}</h3>
                  <p>Total Employees</p>
                </div>
              </div>

              <div className="stat-card stat-success">
                <div className="stat-icon">✓</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.active_employees || 0}</h3>
                  <p>Active Employees</p>
                </div>
              </div>

              <div className="stat-card stat-warning">
                <div className="stat-icon">⚠</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.at_risk_count || 0}</h3>
                  <p>At Risk</p>
                </div>
              </div>

              <div className="stat-card stat-danger">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.critical_employees || 0}</h3>
                  <p>Critical Priority</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.inactive_employees || 0}</h3>
                  <p>Inactive</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏖</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.on_leave_employees || 0}</h3>
                  <p>On Leave</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📉</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.attrition_count || 0}</h3>
                  <p>Attrition</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h3>{stats.employeeStats.terminated_employees || 0}</h3>
                  <p>Terminated</p>
                </div>
              </div>
            </div>
          </section>

          {/* Role Distribution */}
          <section className="dashboard-section">
            <h2>Role Distribution</h2>
            <div className="role-distribution">
              {stats.roleDistribution && stats.roleDistribution.length > 0 ? (
                <div className="role-list">
                  {stats.roleDistribution.map((role, index) => (
                    <div key={index} className="role-item">
                      <div className="role-info">
                        <span className="role-name">{role.role_type || 'Unassigned'}</span>
                        <span className="role-count">{role.count} employees</span>
                      </div>
                      <div className="role-bar">
                        <div
                          className="role-bar-fill"
                          style={{
                            width: `${(role.count / stats.employeeStats.total_employees) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No role distribution data available</p>
              )}
            </div>
          </section>

          {/* Admin Users */}
          <section className="dashboard-section">
            <h2>Admin Users</h2>
            <div className="admin-stats">
              <div className="admin-stat-item">
                <span className="admin-stat-label">Total Admin Users:</span>
                <span className="admin-stat-value">{stats.adminStats.total_admins || 0}</span>
              </div>
              <div className="admin-stat-item">
                <span className="admin-stat-label">Active Admin Users:</span>
                <span className="admin-stat-value">{stats.adminStats.active_admins || 0}</span>
              </div>
            </div>
          </section>

          {/* Recent Activities */}
          <section className="dashboard-section">
            <h2>Recent Activities</h2>
            <div className="recent-activities">
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="activities-list">
                  {stats.recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        {activity.action === 'CREATED' ? '➕' : '✏️'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">
                          <strong>{activity.name}</strong> ({activity.sso})
                        </div>
                        <div className="activity-details">
                          <span className="activity-action">{activity.action}</span>
                          <span className="activity-role">{activity.role}</span>
                          <span className={`activity-status status-${activity.status.toLowerCase().replace(' ', '-')}`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="activity-date">{formatDate(activity.updated_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No recent activities</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
