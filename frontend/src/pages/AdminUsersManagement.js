import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { classNames } from 'primereact/utils';
import authService from '../services/authService';
import PermissionGuard from '../components/auth/PermissionGuard';

const AdminUsersManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
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
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const dt = useRef(null);
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
      if (response.success && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles([]);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllAdmins(pagination.page, pagination.limit);
      if (response.success && Array.isArray(response.data)) {
        setAdmins(response.data);
        setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
      } else {
        setAdmins([]);
        toast.error(response.message || 'Failed to load admin users');
      }
    } catch (err) {
      setAdmins([]);
      toast.error(err.response?.data?.message || 'An error occurred while fetching admin users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await authService.getAuditLogs(auditPagination.page, auditPagination.limit);
      if (response.success && Array.isArray(response.data)) {
        setAuditLogs(response.data);
        setAuditPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    }
  };

  useEffect(() => {
    if (showAuditLogs) {
      fetchAuditLogs();
    }
  }, [showAuditLogs, auditPagination.page]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!selectedAdmin && !formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (selectedAdmin) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        const response = await authService.updateAdmin(selectedAdmin.id, updateData);
        if (response.success) {
          fetchAdmins();
          resetForm();
          toast.success('Admin user updated successfully!');
        }
      } else {
        const response = await authService.createAdmin(formData);
        if (response.success) {
          fetchAdmins();
          resetForm();
          toast.success('Admin user created successfully!');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while saving admin user');
    } finally {
      setSubmitting(false);
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

  const handleDelete = (admin) => {
    confirmDialog({
      message: `Are you sure you want to delete admin user ${admin.username}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await authService.deleteAdmin(admin.id);
          if (response.success) {
            fetchAdmins();
            toast.success('Admin user deleted successfully!');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'An error occurred while deleting admin user');
        }
      }
    });
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
    setErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Column templates
  const statusBodyTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Inactive': return 'warning';
        case 'Suspended': return 'danger';
        default: return null;
      }
    };
    return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
  };

  const lastLoginBodyTemplate = (rowData) => {
    return formatDate(rowData.last_login);
  };

  const actionBodyTemplate = (rowData) => {
    const isCurrentUser = currentUser?.id === rowData.id;
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="admin_users.update">
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-success"
            onClick={() => handleEdit(rowData)}
            tooltip="Edit"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="admin_users.delete">
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => handleDelete(rowData)}
            disabled={isCurrentUser}
            tooltip={isCurrentUser ? "Cannot delete yourself" : "Delete"}
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
      </div>
    );
  };

  const roleBodyTemplate = (rowData) => {
    const role = roles.find(r => r.id === rowData.role_id);
    return role ? <Tag value={role.display_name} severity="info" /> : <span className="text-500">No Role</span>;
  };

  // Toolbar templates
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h2 className="m-0">Admin Users Management</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="audit.view">
          <Button
            label={showAuditLogs ? 'Hide Audit Logs' : 'View Audit Logs'}
            icon="pi pi-history"
            onClick={() => setShowAuditLogs(!showAuditLogs)}
            className="p-button-help"
          />
        </PermissionGuard>
        <PermissionGuard permission="admin_users.create">
          <Button
            label="Add New Admin"
            icon="pi pi-plus"
            onClick={() => setShowForm(true)}
            className="p-button-success"
          />
        </PermissionGuard>
        <Button
          label="Back to Dashboard"
          icon="pi pi-arrow-left"
          onClick={() => navigate('/admin/dashboard')}
          className="p-button-secondary"
        />
      </div>
    );
  };

  // Dialog footer
  const dialogFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={resetForm} className="p-button-text" aria-label="Cancel" />
      <Button label="Save" icon="pi pi-check" onClick={handleSubmit} loading={submitting} />
    </div>
  );

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Suspended', value: 'Suspended' }
  ];

  const roleOptions = [
    { label: 'No Role Assigned', value: '' },
    ...(Array.isArray(roles) ? roles.map(role => ({
      label: `${role.display_name} (${role.permission_count || 0} permissions)`,
      value: role.id
    })) : [])
  ];

  // Audit log customization
  const auditLogMarker = (item) => {
    const iconMap = {
      'LOGIN': 'pi-sign-in',
      'LOGOUT': 'pi-sign-out',
      'CREATE': 'pi-plus',
      'UPDATE': 'pi-pencil',
      'DELETE': 'pi-trash'
    };
    const colorMap = {
      'LOGIN': 'success',
      'LOGOUT': 'info',
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger'
    };
    return (
      <span className={`flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1`}
        style={{ backgroundColor: `var(--${colorMap[item.action]}-color)` }}>
        <i className={`pi ${iconMap[item.action]}`}></i>
      </span>
    );
  };

  const auditLogContent = (item) => {
    return (
      <Card title={`${item.full_name || item.username} - ${item.action}`} subTitle={formatDate(item.created_at)}>
        <p>{item.description}</p>
        <small className="text-500">IP: {item.ip_address}</small>
      </Card>
    );
  };

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      {/* Audit Logs Section */}
      {showAuditLogs && (
        <Card title="Audit Logs" className="mb-4">
          {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
            <Timeline value={auditLogs} align="alternate" content={auditLogContent} marker={auditLogMarker} />
          ) : (
            <p className="text-center text-500">No audit logs found</p>
          )}
        </Card>
      )}

      {/* Admin Users DataTable */}
      <DataTable
        ref={dt}
        value={admins}
        loading={loading}
        paginator={pagination.total > 10}
        rows={pagination.limit}
        totalRecords={pagination.total}
        onPage={(e) => setPagination(prev => ({ ...prev, page: e.page + 1 }))}
        emptyMessage="No admin users found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Admins"
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ minWidth: '80px' }} />
        <Column field="username" header="Username" sortable style={{ minWidth: '120px' }} />
        <Column field="full_name" header="Full Name" sortable style={{ minWidth: '150px' }} />
        <Column field="email" header="Email" sortable style={{ minWidth: '200px' }} />
        <Column field="role_id" header="Role" body={roleBodyTemplate} style={{ minWidth: '150px' }} />
        <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '110px' }} />
        <Column field="last_login" header="Last Login" body={lastLoginBodyTemplate} sortable style={{ minWidth: '180px' }} />
        <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
      </DataTable>

      {/* Add/Edit Dialog */}
      <Dialog
        visible={showForm}
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '641px': '95vw' }}
        header={selectedAdmin ? 'Edit Admin User' : 'Add New Admin User'}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={resetForm}
      >
        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
            <label htmlFor="username">Username *</label>
            <InputText
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={!!selectedAdmin}
              className={classNames({ 'p-invalid': errors.username })}
            />
            {errors.username && <small className="p-error">{errors.username}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="email">Email *</label>
            <InputText
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={classNames({ 'p-invalid': errors.email })}
            />
            {errors.email && <small className="p-error">{errors.email}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="full_name">Full Name *</label>
            <InputText
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={classNames({ 'p-invalid': errors.full_name })}
            />
            {errors.full_name && <small className="p-error">{errors.full_name}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="status">Status *</label>
            <Dropdown
              id="status"
              value={formData.status}
              options={statusOptions}
              onChange={(e) => handleInputChange('status', e.value)}
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="role_id">Role</label>
            <Dropdown
              id="role_id"
              value={formData.role_id}
              options={roleOptions}
              onChange={(e) => handleInputChange('role_id', e.value)}
            />
            <small className="block mt-1">Assign a role to grant permissions to this admin user</small>
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="password">
              Password {!selectedAdmin && '*'}
              {selectedAdmin && ' (leave blank to keep current)'}
            </label>
            <InputText
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={classNames({ 'p-invalid': errors.password })}
            />
            {errors.password && <small className="p-error">{errors.password}</small>}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminUsersManagement;
