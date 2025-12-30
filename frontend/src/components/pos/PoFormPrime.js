import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { toast } from 'react-toastify';
import { createPo, updatePo } from '../../services/api';

const PoFormPrime = ({ po, visible, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    po_number: '',
    po_owner_name: '',
    start_date: null,
    end_date: null,
    amount: null,
    status: 'Active',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Expired', value: 'Expired' }
  ];

  useEffect(() => {
    if (po) {
      setFormData({
        po_number: po.po_number || '',
        po_owner_name: po.po_owner_name || '',
        start_date: po.start_date ? new Date(po.start_date) : null,
        end_date: po.end_date ? new Date(po.end_date) : null,
        amount: po.amount || null,
        status: po.status || 'Active',
        description: po.description || ''
      });
    } else {
      resetForm();
    }
  }, [po]);

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

    if (!formData.po_number?.trim()) {
      newErrors.po_number = 'PO number is required';
    }

    if (!formData.po_owner_name?.trim()) {
      newErrors.po_owner_name = 'PO owner name is required';
    }

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null
      };

      if (po) {
        await updatePo(po.id, submitData);
        toast.success('PO updated successfully!');
      } else {
        await createPo(submitData);
        toast.success('PO created successfully!');
      }

      resetForm();
      onHide();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving PO:', error);
      toast.error(error.response?.data?.message || 'Failed to save PO');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      po_number: '',
      po_owner_name: '',
      start_date: null,
      end_date: null,
      amount: null,
      status: 'Active',
      description: ''
    });
    setErrors({});
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => {
          resetForm();
          onHide();
        }}
        className="p-button-text"
        disabled={submitting}
      />
      <Button
        label={submitting ? 'Saving...' : 'Save'}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '600px' }}
      header={po ? 'Edit Purchase Order' : 'Create Purchase Order'}
      modal
      className="p-fluid"
      footer={dialogFooter}
      onHide={() => {
        resetForm();
        onHide();
      }}
    >
      <div className="p-field" style={{ marginBottom: '1rem' }}>
        <label htmlFor="po_number" className="p-mb-2">
          PO Number <span className="p-error">*</span>
        </label>
        <InputText
          id="po_number"
          value={formData.po_number}
          onChange={(e) => handleChange('po_number', e.target.value)}
          className={classNames({ 'p-invalid': errors.po_number })}
          placeholder="Enter PO number"
        />
        {errors.po_number && <small className="p-error">{errors.po_number}</small>}
      </div>

      <div className="p-field" style={{ marginBottom: '1rem' }}>
        <label htmlFor="po_owner_name" className="p-mb-2">
          PO Owner Name <span className="p-error">*</span>
        </label>
        <InputText
          id="po_owner_name"
          value={formData.po_owner_name}
          onChange={(e) => handleChange('po_owner_name', e.target.value)}
          className={classNames({ 'p-invalid': errors.po_owner_name })}
          placeholder="Enter PO owner name"
        />
        {errors.po_owner_name && <small className="p-error">{errors.po_owner_name}</small>}
      </div>

      <div className="p-field" style={{ marginBottom: '1rem' }}>
        <label htmlFor="status" className="p-mb-2">
          Status
        </label>
        <Dropdown
          id="status"
          value={formData.status}
          options={statusOptions}
          onChange={(e) => handleChange('status', e.value)}
          placeholder="Select status"
        />
      </div>

      <div className="p-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="p-field">
          <label htmlFor="start_date" className="p-mb-2">
            Start Date
          </label>
          <Calendar
            id="start_date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.value)}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Select start date"
          />
        </div>

        <div className="p-field">
          <label htmlFor="end_date" className="p-mb-2">
            End Date
          </label>
          <Calendar
            id="end_date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.value)}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Select end date"
            className={classNames({ 'p-invalid': errors.end_date })}
          />
          {errors.end_date && <small className="p-error">{errors.end_date}</small>}
        </div>
      </div>

      <div className="p-field" style={{ marginBottom: '1rem' }}>
        <label htmlFor="amount" className="p-mb-2">
          Amount
        </label>
        <InputNumber
          id="amount"
          value={formData.amount}
          onValueChange={(e) => handleChange('amount', e.value)}
          mode="currency"
          currency="USD"
          locale="en-US"
          placeholder="Enter amount"
        />
      </div>

      <div className="p-field" style={{ marginBottom: '1rem' }}>
        <label htmlFor="description" className="p-mb-2">
          Description
        </label>
        <InputTextarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          placeholder="Enter description or notes"
        />
      </div>
    </Dialog>
  );
};

export default PoFormPrime;
