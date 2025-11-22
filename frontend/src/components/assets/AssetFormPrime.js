import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { toast } from 'react-toastify';
import { createAsset, updateAsset, getAllEmployees } from '../../services/api';

const AssetFormPrime = ({ asset, visible, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    asset_tag: '',
    asset_type: '',
    brand: '',
    model: '',
    serial_number: '',
    specifications: '',
    status: 'Available',
    assigned_to: null,
    assigned_date: null,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);

  const assetTypeOptions = [
    { label: 'Laptop', value: 'Laptop' },
    { label: 'Desktop', value: 'Desktop' },
    { label: 'Monitor', value: 'Monitor' },
    { label: 'Phone', value: 'Phone' },
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Keyboard', value: 'Keyboard' },
    { label: 'Mouse', value: 'Mouse' },
    { label: 'Headset', value: 'Headset' },
    { label: 'Dock', value: 'Dock' },
    { label: 'Other', value: 'Other' }
  ];

  const statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'Under Repair', value: 'Under Repair' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Lost', value: 'Lost' }
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_tag: asset.asset_tag || '',
        asset_type: asset.asset_type || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        specifications: asset.specifications || '',
        status: asset.status || 'Available',
        assigned_to: asset.assigned_to || null,
        assigned_date: asset.assigned_date ? new Date(asset.assigned_date) : null,
        notes: asset.notes || ''
      });
    } else {
      resetForm();
    }
  }, [asset]);

  const loadEmployees = async () => {
    try {
      const response = await getAllEmployees(1, 1000); // Get all employees
      const employeeOptions = response.data.data.map(emp => ({
        label: `${emp.name} (${emp.sso})`,
        value: emp.id
      }));
      setEmployees(employeeOptions);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.asset_tag?.trim()) {
      newErrors.asset_tag = 'Asset tag is required';
    }
    if (!formData.asset_type) {
      newErrors.asset_type = 'Asset type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        assigned_date: formData.assigned_date ? formData.assigned_date.toISOString().split('T')[0] : null,
      };

      if (asset) {
        await updateAsset(asset.id, submitData);
        toast.success('Asset updated successfully!');
      } else {
        await createAsset(submitData);
        toast.success('Asset created successfully!');
      }

      resetForm();
      onSuccess();
      onHide();
    } catch (error) {
      console.error('Error saving asset:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save asset';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_tag: '',
      asset_type: '',
      brand: '',
      model: '',
      serial_number: '',
      specifications: '',
      status: 'Available',
      assigned_to: null,
      assigned_date: null,
      notes: ''
    });
    setErrors({});
  };

  const handleHide = () => {
    resetForm();
    onHide();
  };

  const footer = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={handleHide}
        className="p-button-text"
        aria-label="Cancel"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={submitting}
        autoFocus
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '50vw' }}
      header={asset ? 'Edit Asset' : 'Add New Asset'}
      modal
      className="p-fluid"
      footer={footer}
      onHide={handleHide}
    >
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
            <label htmlFor="asset_tag">
              Asset Tag <span style={{ color: 'red' }}>*</span>
            </label>
            <InputText
              id="asset_tag"
              value={formData.asset_tag}
              onChange={(e) => handleChange('asset_tag', e.target.value)}
              className={classNames({ 'p-invalid': errors.asset_tag })}
              placeholder="e.g., LAPTOP-001"
            />
            {errors.asset_tag && <small className="p-error">{errors.asset_tag}</small>}
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="asset_type">
              Asset Type <span style={{ color: 'red' }}>*</span>
            </label>
            <Dropdown
              id="asset_type"
              value={formData.asset_type}
              options={assetTypeOptions}
              onChange={(e) => handleChange('asset_type', e.value)}
              className={classNames({ 'p-invalid': errors.asset_type })}
              placeholder="Select Asset Type"
            />
            {errors.asset_type && <small className="p-error">{errors.asset_type}</small>}
          </div>
        </div>

        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
            <label htmlFor="brand">Brand</label>
            <InputText
              id="brand"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="e.g., Dell, HP, Lenovo"
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="model">Model</label>
            <InputText
              id="model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="e.g., Latitude 5420"
            />
          </div>
        </div>

        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
            <label htmlFor="serial_number">Serial Number</label>
            <InputText
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => handleChange('serial_number', e.target.value)}
              placeholder="Unique serial number"
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="status">Status</label>
            <Dropdown
              id="status"
              value={formData.status}
              options={statusOptions}
              onChange={(e) => handleChange('status', e.value)}
              placeholder="Select Status"
            />
          </div>
        </div>

        {/* Assignment Information */}
        <div className="formgrid grid">
          <div className="field col-12 md:col-6">
            <label htmlFor="assigned_to">Assigned To</label>
            <Dropdown
              id="assigned_to"
              value={formData.assigned_to}
              options={employees}
              onChange={(e) => handleChange('assigned_to', e.value)}
              placeholder="Select Employee"
              showClear
              filter
            />
          </div>

          <div className="field col-12 md:col-6">
            <label htmlFor="assigned_date">Assignment Date</label>
            <Calendar
              id="assigned_date"
              value={formData.assigned_date}
              onChange={(e) => handleChange('assigned_date', e.value)}
              dateFormat="yy-mm-dd"
              showIcon
              placeholder="Select assignment date"
              disabled={!formData.assigned_to}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="field">
          <label htmlFor="specifications">Specifications</label>
          <InputTextarea
            id="specifications"
            value={formData.specifications}
            onChange={(e) => handleChange('specifications', e.target.value)}
            rows={3}
            placeholder="Technical specifications (e.g., RAM, CPU, Storage)"
          />
        </div>

        <div className="field">
          <label htmlFor="notes">Notes</label>
          <InputTextarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes or comments"
          />
        </div>
      </form>
    </Dialog>
  );
};

export default AssetFormPrime;
