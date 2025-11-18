import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import PermissionGuard from '../components/auth/PermissionGuard';
import './RoleManagement.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_ids: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      } else {
        setError(response.message || 'Failed to load roles');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await authService.getAllPermissions();
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permission_ids = prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId];
      return { ...prev, permission_ids };
    });
  };

  const handleModuleToggle = (module) => {
    const modulePermissions = permissions.grouped[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => formData.permission_ids.includes(id));

    setFormData(prev => {
      const permission_ids = allSelected
        ? prev.permission_ids.filter(id => !modulePermissionIds.includes(id))
        : [...new Set([...prev.permission_ids, ...modulePermissionIds])];
      return { ...prev, permission_ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (selectedRole) {
        // Update existing role
        const response = await authService.updateRole(selectedRole.id, formData);
        if (response.success) {
          fetchRoles();
          resetForm();
          toast.success('Role updated successfully!');
        }
      } else {
        // Create new role
        const response = await authService.createRole(formData);
        if (response.success) {
          fetchRoles();
          resetForm();
          toast.success('Role created successfully!');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving role');
    }
  };

  const handleEdit = async (role) => {
    try {
      const response = await authService.getRoleById(role.id);
      if (response.success) {
        setSelectedRole(role);
        setFormData({
          name: role.name,
          display_name: role.display_name,
          description: role.description || '',
          permission_ids: response.data.permissions.map(p => p.id)
        });
        setShowForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load role details');
    }
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await authService.deleteRole(roleToDelete.id);
      if (response.success) {
        fetchRoles();
        setShowDeleteModal(false);
        setRoleToDelete(null);
        toast.success('Role deleted successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while deleting role');
      toast.error(err.response?.data?.message || 'Failed to delete role');
      setShowDeleteModal(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permission_ids: []
    });
    setSelectedRole(null);
    setShowForm(false);
  };

  const isModuleFullySelected = (module) => {
    const modulePermissions = permissions.grouped[module] || [];
    return modulePermissions.length > 0 &&
           modulePermissions.every(p => formData.permission_ids.includes(p.id));
  };

  if (loading && roles.length === 0) {
    return (
      <div className="role-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management">
      <div className="page-header">
        <div>
          <h1>Role Management</h1>
          <p>Manage system roles and permissions</p>
        </div>
        <div className="header-actions">
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

      {/* Roles List */}
      <div className="roles-section">
        <div className="section-header">
          <h2>Roles</h2>
          <PermissionGuard permission="roles.create">
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : '+ Create Custom Role'}
            </button>
          </PermissionGuard>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="role-form-container">
            <h3>{selectedRole ? 'Edit Role' : 'Create New Role'}</h3>
            {selectedRole?.is_system_role && (
              <div className="alert alert-warning">
                This is a system role. You can only modify permissions, not the name or description.
              </div>
            )}
            <form onSubmit={handleSubmit} className="role-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Role Name (Identifier) *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={!!selectedRole}
                    placeholder="e.g., hr_manager"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="display_name">Display Name *</label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    disabled={selectedRole?.is_system_role}
                    placeholder="e.g., HR Manager"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={selectedRole?.is_system_role}
                  placeholder="Describe the role's purpose and responsibilities"
                />
              </div>

              <div className="form-group">
                <label>Permissions *</label>
                <div className="permissions-container">
                  {Object.keys(permissions.grouped).map(module => (
                    <div key={module} className="permission-module">
                      <div className="module-header">
                        <label>
                          <input
                            type="checkbox"
                            checked={isModuleFullySelected(module)}
                            onChange={() => handleModuleToggle(module)}
                          />
                          <strong>{module.replace('_', ' ').toUpperCase()}</strong>
                        </label>
                      </div>
                      <div className="module-permissions">
                        {permissions.grouped[module].map(permission => (
                          <label key={permission.id} className="permission-item">
                            <input
                              type="checkbox"
                              checked={formData.permission_ids.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                            />
                            <span className="permission-name">{permission.action}</span>
                            <span className="permission-desc">{permission.description}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedRole ? 'Update Role' : 'Create Role'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Roles Table */}
        <div className="roles-table">
          <table>
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Display Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td><code>{role.name}</code></td>
                  <td>{role.display_name}</td>
                  <td className="role-description">{role.description}</td>
                  <td>
                    <span className="permission-count">{role.permission_count} permissions</span>
                  </td>
                  <td>
                    {role.is_system_role ? (
                      <span className="badge badge-system">System</span>
                    ) : (
                      <span className="badge badge-custom">Custom</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <PermissionGuard permission="roles.update">
                        <button
                          onClick={() => handleEdit(role)}
                          className="btn-icon btn-edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                      </PermissionGuard>
                      {!role.is_system_role && (
                        <PermissionGuard permission="roles.delete">
                          <button
                            onClick={() => handleDeleteClick(role)}
                            className="btn-icon btn-delete"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </PermissionGuard>
                      )}
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
              Are you sure you want to delete the role <strong>{roleToDelete?.display_name}</strong>?
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

export default RoleManagement;
