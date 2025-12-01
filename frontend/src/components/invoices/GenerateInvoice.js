import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getEmployeesForInvoice, createInvoice, getAllProjects } from '../../services/api';
import { getProjectById } from '../../services/api';
import './GenerateInvoice.css';

const GenerateInvoice = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1 = Selection Form, 2 = Employee Billing Form
  const [formData, setFormData] = useState({
    invoice_month: new Date().getMonth() + 1,
    invoice_year: new Date().getFullYear(),
    project_id: '',
    team_id: ''
  });
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeBilling, setEmployeeBilling] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectTeams();
    } else {
      setTeams([]);
      setFormData(prev => ({ ...prev, team_id: '' }));
    }
  }, [formData.project_id]);

  const fetchProjects = async () => {
    try {
      const response = await getAllProjects(1, 1000, 'All');
      setProjects(response.data.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load projects');
    }
  };

  const fetchProjectTeams = async () => {
    try {
      const response = await getProjectById(formData.project_id);
      const projectData = response.data.data;
      setTeams(projectData.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      toast.error('Failed to load teams');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();

    if (!formData.project_id || !formData.invoice_month || !formData.invoice_year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await getEmployeesForInvoice(
        formData.project_id,
        formData.team_id || null
      );

      const employeeList = response.data.data || [];

      if (employeeList.length === 0) {
        toast.warning('No employees found for the selected project/team');
        setLoading(false);
        return;
      }

      setEmployees(employeeList);

      // Initialize billing data for each employee
      const initialBilling = employeeList.map(emp => ({
        employee_id: emp.id,
        employee_name: emp.name,
        employee_role: emp.role,
        role_type: emp.role_type,
        billing_hours: 0,
        leave_hours: 0,
        cost_per_hour: 0,
        notes: ''
      }));

      setEmployeeBilling(initialBilling);
      setStep(2);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingChange = (employeeId, field, value) => {
    setEmployeeBilling(prev =>
      prev.map(emp =>
        emp.employee_id === employeeId
          ? { ...emp, [field]: value }
          : emp
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter employees with billing hours
    const employeesWithBilling = employeeBilling.filter(
      emp => parseFloat(emp.billing_hours) > 0 || parseFloat(emp.leave_hours) > 0
    );

    if (employeesWithBilling.length === 0) {
      toast.warning('Please enter billing hours for at least one employee');
      return;
    }

    setSubmitting(true);

    try {
      const invoiceData = {
        project_id: formData.project_id,
        team_id: formData.team_id || null,
        invoice_month: parseInt(formData.invoice_month),
        invoice_year: parseInt(formData.invoice_year),
        employees: employeesWithBilling,
        notes: ''
      };

      await createInvoice(invoiceData);

      toast.success('Invoice generated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = (emp) => {
    const hours = parseFloat(emp.billing_hours) || 0;
    const rate = parseFloat(emp.cost_per_hour) || 0;
    return (hours * rate).toFixed(2);
  };

  const calculateGrandTotal = () => {
    return employeeBilling.reduce((sum, emp) => {
      const hours = parseFloat(emp.billing_hours) || 0;
      const rate = parseFloat(emp.cost_per_hour) || 0;
      return sum + (hours * rate);
    }, 0).toFixed(2);
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content generate-invoice-modal ${step === 2 ? 'large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Generate Invoice - {step === 1 ? 'Step 1: Select Period' : 'Step 2: Enter Billing Details'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="invoice_month">
                  Month <span className="required">*</span>
                </label>
                <select
                  id="invoice_month"
                  name="invoice_month"
                  value={formData.invoice_month}
                  onChange={handleChange}
                  required
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="invoice_year">
                  Year <span className="required">*</span>
                </label>
                <select
                  id="invoice_year"
                  name="invoice_year"
                  value={formData.invoice_year}
                  onChange={handleChange}
                  required
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="project_id">
                  Project <span className="required">*</span>
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_team_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="team_id">Team (Optional)</label>
                <select
                  id="team_id"
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                  disabled={!formData.project_id || teams.length === 0}
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.agile_board_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Loading...' : 'Next: Enter Billing Details'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="invoice-summary">
              <div className="summary-item">
                <strong>Project:</strong> {projects.find(p => p.id === parseInt(formData.project_id))?.project_team_name}
              </div>
              {formData.team_id && (
                <div className="summary-item">
                  <strong>Team:</strong> {teams.find(t => t.id === parseInt(formData.team_id))?.agile_board_name}
                </div>
              )}
              <div className="summary-item">
                <strong>Period:</strong> {months.find(m => m.value === parseInt(formData.invoice_month))?.label} {formData.invoice_year}
              </div>
            </div>

            <div className="employee-billing-section">
              <h3>Employee Billing Details</h3>
              <div className="table-container">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Role</th>
                      <th>Role Type</th>
                      <th>Billing Hours</th>
                      <th>Leave Hours</th>
                      <th>Cost/Hour ($)</th>
                      <th>Total ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeBilling.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td>{emp.employee_name}</td>
                        <td>{emp.employee_role || 'N/A'}</td>
                        <td>{emp.role_type || 'N/A'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="744"
                            step="0.5"
                            value={emp.billing_hours}
                            onChange={(e) => handleBillingChange(emp.employee_id, 'billing_hours', e.target.value)}
                            className="hours-input"
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="744"
                            step="0.5"
                            value={emp.leave_hours}
                            onChange={(e) => handleBillingChange(emp.employee_id, 'leave_hours', e.target.value)}
                            className="hours-input"
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={emp.cost_per_hour}
                            onChange={(e) => handleBillingChange(emp.employee_id, 'cost_per_hour', e.target.value)}
                            className="cost-input"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="total-cell">
                          <strong>${calculateTotal(emp)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="grand-total-row">
                      <td colSpan="6" style={{ textAlign: 'right', paddingRight: '1rem' }}>
                        <strong>Grand Total:</strong>
                      </td>
                      <td className="total-cell">
                        <strong>${calculateGrandTotal()}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GenerateInvoice;
