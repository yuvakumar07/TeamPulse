import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createEmployee, updateEmployee } from '../../services/api';
import './EmployeeForm.css';

const EmployeeForm = ({ employee, onClose, onSuccess }) => {
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
    last_working_day: '',
    possible_candidate: '',
    asset_id: '',
    asset_return_id: '',
    comments: '',
    attrition: 'No',
    offshore_manager_id: '',
    onsite_manager_id: '',
    visa_type: 'None',
    current_visa_start_date: '',
    current_visa_end_date: '',
    i94_expiry_date: '',
    passport_number: '',
    passport_expiry_date: '',
    sponsor_company: '',
    visa_notes: ''
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
        last_working_day: employee.last_working_day ? employee.last_working_day.split('T')[0] : '',
        possible_candidate: employee.possible_candidate || '',
        asset_id: employee.asset_id || '',
        asset_return_id: employee.asset_return_id || '',
        comments: employee.comments || '',
        attrition: employee.attrition || 'No',
        offshore_manager_id: employee.offshore_manager_id || '',
        onsite_manager_id: employee.onsite_manager_id || '',
        visa_type: employee.visa_type || 'None',
        current_visa_start_date: employee.current_visa_start_date ? employee.current_visa_start_date.split('T')[0] : '',
        current_visa_end_date: employee.current_visa_end_date ? employee.current_visa_end_date.split('T')[0] : '',
        i94_expiry_date: employee.i94_expiry_date ? employee.i94_expiry_date.split('T')[0] : '',
        passport_number: employee.passport_number || '',
        passport_expiry_date: employee.passport_expiry_date ? employee.passport_expiry_date.split('T')[0] : '',
        sponsor_company: employee.sponsor_company || '',
        visa_notes: employee.visa_notes || ''
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...formData,
        offshore_manager_id: formData.offshore_manager_id || null,
        onsite_manager_id: formData.onsite_manager_id || null,
        last_working_day: formData.last_working_day || null,
        current_visa_start_date: formData.current_visa_start_date || null,
        current_visa_end_date: formData.current_visa_end_date || null,
        i94_expiry_date: formData.i94_expiry_date || null,
        passport_expiry_date: formData.passport_expiry_date || null
      };

      if (employee) {
        await updateEmployee(employee.id, dataToSubmit);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(dataToSubmit);
        toast.success('Employee created successfully!');
      }
      onSuccess();
      onClose();
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sso">SSO</label>
              <input
                type="text"
                id="sso"
                name="sso"
                value={formData.sso}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role_type">Role Type</label>
              <select
                id="role_type"
                name="role_type"
                value={formData.role_type}
                onChange={handleChange}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="criticality">Criticality</label>
              <select
                id="criticality"
                name="criticality"
                value={formData.criticality}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              rows="3"
              placeholder="Enter skills separated by commas"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="last_working_day">Last Working Day</label>
              <input
                type="date"
                id="last_working_day"
                name="last_working_day"
                value={formData.last_working_day}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="possible_candidate">Possible Candidate</label>
              <input
                type="text"
                id="possible_candidate"
                name="possible_candidate"
                value={formData.possible_candidate}
                onChange={handleChange}
                placeholder="Replacement candidate name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset_id">Asset ID</label>
              <input
                type="text"
                id="asset_id"
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="asset_return_id">Asset Return ID</label>
              <input
                type="text"
                id="asset_return_id"
                name="asset_return_id"
                value={formData.asset_return_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comments">Comments</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows="3"
              placeholder="Additional comments or notes"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="attrition">Attrition</label>
              <select
                id="attrition"
                name="attrition"
                value={formData.attrition}
                onChange={handleChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="offshore_manager_id">Offshore Manager ID</label>
              <input
                type="number"
                id="offshore_manager_id"
                name="offshore_manager_id"
                value={formData.offshore_manager_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="onsite_manager_id">Onsite Manager ID</label>
            <input
              type="number"
              id="onsite_manager_id"
              name="onsite_manager_id"
              value={formData.onsite_manager_id}
              onChange={handleChange}
            />
          </div>

          <div className="form-section-divider">
            <h3>H1B Visa & Immigration Details</h3>
          </div>

          <div className="form-group">
            <label htmlFor="visa_type">Visa Type</label>
            <select
              id="visa_type"
              name="visa_type"
              value={formData.visa_type}
              onChange={handleChange}
            >
              <option value="None">None</option>
              <option value="H1B">H1B</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="Green Card">Green Card</option>
              <option value="US Citizen">US Citizen</option>
              <option value="Other">Other</option>
            </select>
            <small style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.85rem' }}>
              Visa status will be automatically calculated based on start and end dates
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="current_visa_start_date">Visa Start Date</label>
              <input
                type="date"
                id="current_visa_start_date"
                name="current_visa_start_date"
                value={formData.current_visa_start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="current_visa_end_date">Visa End Date</label>
              <input
                type="date"
                id="current_visa_end_date"
                name="current_visa_end_date"
                value={formData.current_visa_end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="i94_expiry_date">I-94 Expiry Date</label>
              <input
                type="date"
                id="i94_expiry_date"
                name="i94_expiry_date"
                value={formData.i94_expiry_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="passport_expiry_date">Passport Expiry Date</label>
              <input
                type="date"
                id="passport_expiry_date"
                name="passport_expiry_date"
                value={formData.passport_expiry_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passport_number">Passport Number</label>
              <input
                type="text"
                id="passport_number"
                name="passport_number"
                value={formData.passport_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sponsor_company">Sponsor Company</label>
              <input
                type="text"
                id="sponsor_company"
                name="sponsor_company"
                value={formData.sponsor_company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="visa_notes">Visa Notes</label>
            <textarea
              id="visa_notes"
              name="visa_notes"
              value={formData.visa_notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional visa-related notes"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
