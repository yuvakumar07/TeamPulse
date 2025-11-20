import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { createEmployee, updateEmployee } from '../../services/api';

const EmployeeFormPrime = ({ employee, visible, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    sso: '',
    name: '',
    role: '',
    role_type: 'Full-Time',
    phone: '',
    location: '',
    criticality: 'Medium',
    status: 'Active',
    skills: '',
    last_working_day: null,
    possible_candidate: '',
    asset_id: '',
    asset_return_id: '',
    comments: '',
    attrition: 'No',
    offshore_manager_id: null,
    onsite_manager_id: null
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        sso: employee.sso || '',
        name: employee.name || '',
        role: employee.role || '',
        role_type: employee.role_type || 'Full-Time',
        phone: employee.phone || '',
        location: employee.location || '',
        criticality: employee.criticality || 'Medium',
        status: employee.status || 'Active',
        skills: employee.skills || '',
        last_working_day: employee.last_working_day ? new Date(employee.last_working_day) : null,
        possible_candidate: employee.possible_candidate || '',
        asset_id: employee.asset_id || '',
        asset_return_id: employee.asset_return_id || '',
        comments: employee.comments || '',
        attrition: employee.attrition || 'No',
        offshore_manager_id: employee.offshore_manager_id || null,
        onsite_manager_id: employee.onsite_manager_id || null
      });
    } else {
      resetForm();
    }
  }, [employee]);

  const resetForm = () => {
    setFormData({
      sso: '',
      name: '',
      role: '',
      role_type: 'Full-Time',
      phone: '',
      location: '',
      criticality: 'Medium',
      status: 'Active',
      skills: '',
      last_working_day: null,
      possible_candidate: '',
      asset_id: '',
      asset_return_id: '',
      comments: '',
      attrition: 'No',
      offshore_manager_id: null,
      onsite_manager_id: null
    });
    setErrors({});
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
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
      const dataToSubmit = {
        ...formData,
        last_working_day: formData.last_working_day ? formData.last_working_day.toISOString().split('T')[0] : null
      };

      if (employee) {
        await updateEmployee(employee.id, dataToSubmit);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(dataToSubmit);
        toast.success('Employee created successfully!');
      }
      onSuccess();
      onHide();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to save employee');
      }
      console.error('Error saving employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const roleTypeOptions = [
    { label: 'Full-Time', value: 'Full-Time' },
    { label: 'Part-Time', value: 'Part-Time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Intern', value: 'Intern' }
  ];

  const criticalityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'On Leave', value: 'On Leave' },
    { label: 'Terminated', value: 'Terminated' }
  ];

  const attritionOptions = [
    { label: 'No', value: 'No' },
    { label: 'Yes', value: 'Yes' },
    { label: 'At Risk', value: 'At Risk' }
  ];

  const dialogFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button label="Save" icon="pi pi-check" onClick={handleSubmit} loading={submitting} />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '50vw' }}
      breakpoints={{ '960px': '75vw', '641px': '95vw' }}
      header={employee ? 'Edit Employee' : 'Add New Employee'}
      modal
      className="p-fluid"
      footer={dialogFooter}
      onHide={onHide}
    >
      <div className="formgrid grid">
        {/* Basic Information */}
        <div className="field col-12 md:col-6">
          <label htmlFor="sso">SSO</label>
          <InputText
            id="sso"
            value={formData.sso}
            onChange={(e) => handleChange('sso', e.target.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="name">Name *</label>
          <InputText
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={classNames({ 'p-invalid': errors.name })}
          />
          {errors.name && <small className="p-error">{errors.name}</small>}
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="role">Role</label>
          <InputText
            id="role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="role_type">Role Type</label>
          <Dropdown
            id="role_type"
            value={formData.role_type}
            options={roleTypeOptions}
            onChange={(e) => handleChange('role_type', e.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="phone">Phone</label>
          <InputText
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="location">Location</label>
          <InputText
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="criticality">Criticality</label>
          <Dropdown
            id="criticality"
            value={formData.criticality}
            options={criticalityOptions}
            onChange={(e) => handleChange('criticality', e.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="status">Status</label>
          <Dropdown
            id="status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => handleChange('status', e.value)}
          />
        </div>

        <div className="field col-12">
          <label htmlFor="skills">Skills</label>
          <InputTextarea
            id="skills"
            value={formData.skills}
            onChange={(e) => handleChange('skills', e.target.value)}
            rows={3}
            placeholder="Enter skills separated by commas"
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="last_working_day">Last Working Day</label>
          <Calendar
            id="last_working_day"
            value={formData.last_working_day}
            onChange={(e) => handleChange('last_working_day', e.value)}
            dateFormat="yy-mm-dd"
            showIcon
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="possible_candidate">Possible Candidate</label>
          <InputText
            id="possible_candidate"
            value={formData.possible_candidate}
            onChange={(e) => handleChange('possible_candidate', e.target.value)}
            placeholder="Replacement candidate name"
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="asset_id">Asset ID</label>
          <InputText
            id="asset_id"
            value={formData.asset_id}
            onChange={(e) => handleChange('asset_id', e.target.value)}
          />
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="asset_return_id">Asset Return ID</label>
          <InputText
            id="asset_return_id"
            value={formData.asset_return_id}
            onChange={(e) => handleChange('asset_return_id', e.target.value)}
          />
        </div>

        <div className="field col-12">
          <label htmlFor="comments">Comments</label>
          <InputTextarea
            id="comments"
            value={formData.comments}
            onChange={(e) => handleChange('comments', e.target.value)}
            rows={3}
            placeholder="Additional comments or notes"
          />
        </div>

        <div className="field col-12 md:col-4">
          <label htmlFor="attrition">Attrition</label>
          <Dropdown
            id="attrition"
            value={formData.attrition}
            options={attritionOptions}
            onChange={(e) => handleChange('attrition', e.value)}
          />
        </div>

        <div className="field col-12 md:col-4">
          <label htmlFor="offshore_manager_id">Offshore Manager ID</label>
          <InputNumber
            id="offshore_manager_id"
            value={formData.offshore_manager_id}
            onValueChange={(e) => handleChange('offshore_manager_id', e.value)}
            useGrouping={false}
          />
        </div>

        <div className="field col-12 md:col-4">
          <label htmlFor="onsite_manager_id">Onsite Manager ID</label>
          <InputNumber
            id="onsite_manager_id"
            value={formData.onsite_manager_id}
            onValueChange={(e) => handleChange('onsite_manager_id', e.value)}
            useGrouping={false}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default EmployeeFormPrime;
