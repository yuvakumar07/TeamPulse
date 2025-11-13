import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PermissionGuard from '../components/PermissionGuard';
import './AdminUsersManagement.css';

const AdminUsersManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    status: 'Active',
    role_id: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchAdmins();
    fetchRoles();
  }, [pagination.page]);

  const fetchRoles = async () => {
    try {
      const response = await authService.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllAdmins(pagination.page, pagination.limit);
      if (response.success) {
        setAdmins(response.data);
        setPagination(prev => ({ ...prev, total: response.pagination.total }));
      } else {
        setError(response.message || 'Failed to load admin users');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching admin users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await authService.getAuditLogs(auditPagination.page, auditPagination.limit);
      if (response.success) {
        setAuditLogs(response.data);
        setAuditPagination(prev => ({ ...prev, total: response.pagination.total }));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    if (showAuditLogs) {
      fetchAuditLogs();
    }
  }, [showAuditLogs, auditPagination.page]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedAdmin) {
        // Update existing admin
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send password if not changing
        }
        const response = await authService.updateAdmin(selectedAdmin.id, updateData);
        if (response.success) {
          fetchAdmins();
          resetForm();
          alert('Admin user updated successfully');
        }
      } else {
        // Create new admin
        const response = await authService.createAdmin(formData);
        if (response.success) {
          fetchAdmins();
          resetForm();
          alert('Admin user created successfully');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving admin user');
    }
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: '',
      full_name: admin.full_name,
      status: admin.status,
      role_id: admin.role_id || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await authService.deleteAdmin(adminToDelete.id);
      if (response.success) {
        fetchAdmins();
        setShowDeleteModal(false);
        setAdminToDelete(null);
        alert('Admin user deleted successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while deleting admin user');
      setShowDeleteModal(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      status: 'Active',
      role_id: ''
    });
    setSelectedAdmin(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && admins.length === 0) {
    return (
      <div className="admin-users-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-management">
      <div className="page-header">
        <div>
          <h1>Admin Users Management</h1>
          <p>Manage administrator accounts and view audit logs</p>
        </div>
        <div className="header-actions">
          <PermissionGuard permission="audit.view">
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="btn btn-secondary"
            >
              {showAuditLogs ? 'Hide' : 'View'} Audit Logs
            </button>
          </PermissionGuard>
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError('')} className="alert-close">&times;</button>
        </div>
      )}

      {/* Audit Logs Section */}
      {showAuditLogs && (
        <div className="audit-logs-section">
          <h2>Audit Logs</h2>
          {auditLogs.length > 0 ? (
            <div className="audit-logs-list">
              {auditLogs.map((log) => (
                <div key={log.id} className="audit-log-item">
                  <div className="audit-log-icon">
                    {log.action === 'LOGIN' && '🔐'}
                    {log.action === 'LOGOUT' && '🚪'}
                    {log.action === 'CREATE' && '➕'}
                    {log.action === 'UPDATE' && '✏️'}
                    {log.action === 'DELETE' && '🗑️'}
                  </div>
                  <div className="audit-log-content">
                    <div className="audit-log-header">
                      <strong>{log.full_name || log.username}</strong>
                      <span className={`audit-action action-${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="audit-log-description">{log.description}</div>
                    <div className="audit-log-meta">
                      <span>{formatDate(log.created_at)}</span>
                      <span>IP: {log.ip_address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No audit logs found</p>
          )}
        </div>
      )}

      {/* Admin Users List */}
      <div className="admin-users-section">
        <div className="section-header">
          <h2>Admin Users</h2>
          <PermissionGuard permission="admin_users.create">
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : '+ Add New Admin'}
            </button>
          </PermissionGuard>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="admin-form-container">
            <h3>{selectedAdmin ? 'Edit Admin User' : 'Add New Admin User'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={!!selectedAdmin}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role_id">Role</label>
                  <select
                    id="role_id"
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                  >
                    <option value="">No Role Assigned</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.display_name} ({role.permission_count} permissions)
                      </option>
                    ))}
                  </select>
                  <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                    Assign a role to grant permissions to this admin user
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="password">
                    Password {!selectedAdmin && '*'}
                    {selectedAdmin && ' (leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!selectedAdmin}
                    minLength="6"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin Users Table */}
        <div className="admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.username}</td>
                  <td>{admin.full_name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`status-badge status-${admin.status.toLowerCase()}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td>{formatDate(admin.last_login)}</td>
                  <td>
                    <div className="action-buttons">
                      <PermissionGuard permission="admin_users.update">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="btn-icon btn-edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="admin_users.delete">
                        <button
                          onClick={() => handleDeleteClick(admin)}
                          className="btn-icon btn-delete"
                          title="Delete"
                          disabled={currentUser?.id === admin.id}
                        >
                          🗑️
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete admin user <strong>{adminToDelete?.username}</strong>?
            </p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={handleDeleteConfirm} className="btn btn-danger">
                Delete
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;
