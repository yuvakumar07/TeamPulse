import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import authService from '../services/authService';
import PermissionGuard from '../components/auth/PermissionGuard';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_ids: []
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const dt = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllRoles();
      if (response.success && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
        toast.error(response.message || 'Failed to load roles');
      }
    } catch (err) {
      setRoles([]);
      toast.error(err.response?.data?.message || 'An error occurred while fetching roles');
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

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    if (!formData.display_name.trim()) newErrors.display_name = 'Display name is required';
    if (formData.permission_ids.length === 0) newErrors.permissions = 'At least one permission is required';
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
      if (selectedRole) {
        const response = await authService.updateRole(selectedRole.id, formData);
        if (response.success) {
          fetchRoles();
          resetForm();
          toast.success('Role updated successfully!');
        }
      } else {
        const response = await authService.createRole(formData);
        if (response.success) {
          fetchRoles();
          resetForm();
          toast.success('Role created successfully!');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while saving role');
    } finally {
      setSubmitting(false);
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
      toast.error(err.response?.data?.message || 'Failed to load role details');
    }
  };

  const handleDelete = (role) => {
    confirmDialog({
      message: `Are you sure you want to delete the role "${role.display_name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await authService.deleteRole(role.id);
          if (response.success) {
            fetchRoles();
            toast.success('Role deleted successfully!');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'An error occurred while deleting role');
        }
      }
    });
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
    setErrors({});
  };

  const isModuleFullySelected = (module) => {
    const modulePermissions = permissions.grouped[module] || [];
    return modulePermissions.length > 0 &&
           modulePermissions.every(p => formData.permission_ids.includes(p.id));
  };

  // Column templates
  const nameBodyTemplate = (rowData) => {
    return <code style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem', backgroundColor: '#f4f4f4', borderRadius: '4px' }}>{rowData.name}</code>;
  };

  const typeBodyTemplate = (rowData) => {
    return rowData.is_system_role ?
      <Tag value="System" severity="warning" /> :
      <Tag value="Custom" severity="info" />;
  };

  const permissionCountBodyTemplate = (rowData) => {
    return <Tag value={`${rowData.permission_count} permissions`} severity="success" />;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="roles.update">
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
        {!rowData.is_system_role && (
          <PermissionGuard permission="roles.delete">
            <Button
              icon="pi pi-trash"
              rounded
              outlined
              severity="danger"
              onClick={() => handleDelete(rowData)}
              tooltip="Delete"
              tooltipOptions={{ position: 'top' }}
            />
          </PermissionGuard>
        )}
      </div>
    );
  };

  // Toolbar templates
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h2 className="m-0">Role Management</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="roles.create">
          <Button
            label="Create Custom Role"
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

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      {/* Roles DataTable */}
      <DataTable
        ref={dt}
        value={roles}
        loading={loading}
        emptyMessage="No roles found"
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ minWidth: '80px' }} />
        <Column field="name" header="Role Name" body={nameBodyTemplate} sortable style={{ minWidth: '150px' }} />
        <Column field="display_name" header="Display Name" sortable style={{ minWidth: '150px' }} />
        <Column field="description" header="Description" sortable style={{ minWidth: '200px' }} />
        <Column field="permission_count" header="Permissions" body={permissionCountBodyTemplate} style={{ minWidth: '150px' }} />
        <Column field="is_system_role" header="Type" body={typeBodyTemplate} sortable style={{ minWidth: '110px' }} />
        <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
      </DataTable>

      {/* Add/Edit Dialog */}
      <Dialog
        visible={showForm}
        style={{ width: '60vw' }}
        breakpoints={{ '960px': '80vw', '641px': '95vw' }}
        header={selectedRole ? 'Edit Role' : 'Create New Role'}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={resetForm}
      >
        {selectedRole?.is_system_role && (
          <Message severity="warn" text="This is a system role. You can only modify permissions, not the name or description." className="mb-3" />
        )}

        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="name">Role Name (Identifier) *</label>
              <InputText
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!!selectedRole}
                placeholder="e.g., hr_manager"
                className={classNames({ 'p-invalid': errors.name })}
              />
              {errors.name && <small className="p-error">{errors.name}</small>}
              <small className="block mt-1">Unique identifier for the role (cannot be changed after creation)</small>
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="display_name">Display Name *</label>
              <InputText
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                disabled={selectedRole?.is_system_role}
                placeholder="e.g., HR Manager"
                className={classNames({ 'p-invalid': errors.display_name })}
              />
              {errors.display_name && <small className="p-error">{errors.display_name}</small>}
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="description">Description</label>
              <InputTextarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={selectedRole?.is_system_role}
                rows={3}
                placeholder="Describe the role's purpose and responsibilities"
              />
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label>Permissions *</label>
              {errors.permissions && <small className="p-error block mb-2">{errors.permissions}</small>}
            </div>
          </div>

          {Object.keys(permissions.grouped).map(module => (
            <div key={module} className="col-12 md:col-6">
              <Panel header={module.replace('_', ' ').toUpperCase()} toggleable collapsed={false} className="mb-3">
                <div className="field-checkbox mb-3">
                  <Checkbox
                    inputId={`module-${module}`}
                    checked={isModuleFullySelected(module)}
                    onChange={() => handleModuleToggle(module)}
                  />
                  <label htmlFor={`module-${module}`} className="ml-2">
                    <strong>Select All</strong>
                  </label>
                </div>
                {permissions.grouped[module].map(permission => (
                  <div key={permission.id} className="field-checkbox mb-2">
                    <Checkbox
                      inputId={`permission-${permission.id}`}
                      checked={formData.permission_ids.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                    />
                    <label htmlFor={`permission-${permission.id}`} className="ml-2">
                      <div>
                        <div className="font-semibold">{permission.action}</div>
                        <div className="text-sm text-500">{permission.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </Panel>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
