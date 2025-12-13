import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getEmployeesForInvoice, createInvoice, getAllProjects, checkInvoiceExists } from '../../services/api';
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
  const [managerBilling, setManagerBilling] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState({
    offshore_manager: 'N/A',
    onsite_manager: 'N/A'
  });

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
      // Check if invoice already exists
      const checkResponse = await checkInvoiceExists(
        formData.project_id,
        formData.team_id || null,
        formData.invoice_month,
        formData.invoice_year
      );

      if (checkResponse.data.exists) {
        const invoiceNumber = checkResponse.data.data.invoice_number;
        toast.warning(
          `Invoice already exists for this period! Invoice Number: ${invoiceNumber}`,
          { autoClose: 5000 }
        );
        setLoading(false);
        return;
      }

      const response = await getEmployeesForInvoice(
        formData.project_id,
        formData.team_id || null
      );

      const employeeList = response.data.data || [];
      const managersData = response.data.managers || {
        offshore_manager: 'N/A',
        onsite_manager: 'N/A'
      };
      const managerDetails = response.data.managerDetails || [];

      if (employeeList.length === 0 && managerDetails.length === 0) {
        toast.warning('No employees or managers found for the selected project/team');
        setLoading(false);
        return;
      }

      setEmployees(employeeList);
      setManagers(managersData);

      // Initialize billing data for regular employees (managers are already excluded by backend)
      const initialBilling = employeeList.map(emp => ({
        employee_id: emp.id,
        employee_name: emp.name,
        employee_role: emp.role,
        role_type: emp.role_type,
        team_name: emp.team_name,
        billing_hours: 0,
        leave_hours: 0,
        cost_per_hour: 0,
        notes: ''
      }));

      // Initialize billing data for managers from managerDetails array
      const initialManagerBilling = managerDetails.map(mgr => ({
        employee_id: mgr.id,
        employee_name: mgr.name,
        employee_role: mgr.role,
        role_type: mgr.role_type,
        team_name: mgr.team_name,
        manager_type: mgr.manager_type === 'offshore' ? 'Offshore' : 'Onsite',
        billing_hours: 0,
        leave_hours: 0,
        cost_per_hour: 0,
        notes: ''
      }));

      setEmployeeBilling(initialBilling);
      setManagerBilling(initialManagerBilling);
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

  const handleManagerBillingChange = (employeeId, field, value) => {
    setManagerBilling(prev =>
      prev.map(mgr =>
        mgr.employee_id === employeeId
          ? { ...mgr, [field]: value }
          : mgr
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter employees with billing hours
    const employeesWithBilling = employeeBilling.filter(
      emp => parseFloat(emp.billing_hours) > 0 || parseFloat(emp.leave_hours) > 0
    );

    // Filter managers with billing hours
    const managersWithBilling = managerBilling.filter(
      mgr => parseFloat(mgr.billing_hours) > 0 || parseFloat(mgr.leave_hours) > 0
    );

    // Combine employees and managers
    const allBillingItems = [...employeesWithBilling, ...managersWithBilling];

    if (allBillingItems.length === 0) {
      toast.warning('Please enter billing hours for at least one employee or manager');
      return;
    }

    setSubmitting(true);

    try {
      const invoiceData = {
        project_id: formData.project_id,
        team_id: formData.team_id || null,
        invoice_month: parseInt(formData.invoice_month),
        invoice_year: parseInt(formData.invoice_year),
        employees: allBillingItems,
        notes: '',
        offshore_manager: managers.offshore_manager,
        onsite_manager: managers.onsite_manager
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
    const billingHours = parseFloat(emp.billing_hours) || 0;
    const leaveHours = parseFloat(emp.leave_hours) || 0;
    const balanceHours = billingHours - leaveHours;
    const rate = parseFloat(emp.cost_per_hour) || 0;
    return (balanceHours * rate).toFixed(2);
  };

  const calculateManagerTotal = (mgr) => {
    const billingHours = parseFloat(mgr.billing_hours) || 0;
    const leaveHours = parseFloat(mgr.leave_hours) || 0;
    const balanceHours = billingHours - leaveHours;
    const rate = parseFloat(mgr.cost_per_hour) || 0;
    let total = balanceHours * rate;

    // Add 0.11% bonus for Offshore Managers
    if (mgr.manager_type === 'Offshore') {
      total = total * 1.0011; // 0.11% bonus
    }

    return total.toFixed(2);
  };

  const calculateManagerBonus = (mgr) => {
    const billingHours = parseFloat(mgr.billing_hours) || 0;
    const leaveHours = parseFloat(mgr.leave_hours) || 0;
    const balanceHours = billingHours - leaveHours;
    const rate = parseFloat(mgr.cost_per_hour) || 0;
    const baseTotal = balanceHours * rate;

    // Calculate 0.11% bonus for Offshore Managers
    if (mgr.manager_type === 'Offshore') {
      return (baseTotal * 0.0011).toFixed(2);
    }

    return '0.00';
  };

  const calculateEmployeeTotal = () => {
    return employeeBilling.reduce((sum, emp) => {
      const billingHours = parseFloat(emp.billing_hours) || 0;
      const leaveHours = parseFloat(emp.leave_hours) || 0;
      const balanceHours = billingHours - leaveHours;
      const rate = parseFloat(emp.cost_per_hour) || 0;
      return sum + (balanceHours * rate);
    }, 0);
  };

  const calculateManagerTotalSum = () => {
    return managerBilling.reduce((sum, mgr) => {
      return sum + parseFloat(calculateManagerTotal(mgr));
    }, 0);
  };

  const calculateGrandTotal = () => {
    return (calculateEmployeeTotal() + calculateManagerTotalSum()).toFixed(2);
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

  const monthOptions = months.map(month => ({
    label: month.label,
    value: month.value
  }));

  const yearOptions = years.map(year => ({
    label: year.toString(),
    value: year
  }));

  const projectOptions = [
    { label: 'Select Project', value: '' },
    ...projects.map(project => ({
      label: project.project_team_name,
      value: project.id
    }))
  ];

  const teamOptions = [
    { label: 'All Teams', value: 0 },
    ...teams.map(team => ({
      label: team.agile_board_name,
      value: team.id
    }))
  ];

  return (
    <Dialog
      header={`Generate Invoice - ${step === 1 ? 'Step 1: Select Period' : 'Step 2: Enter Billing Details'}`}
      visible={true}
      onHide={onClose}
      style={{ width: step === 2 ? '95vw' : '50vw' }}
      maximizable
      modal
    >
      {step === 1 ? (
        <form onSubmit={handleNext}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="invoice_month">
                Month <span className="required">*</span>
              </label>
              <Dropdown
                id="invoice_month"
                value={formData.invoice_month}
                options={monthOptions}
                onChange={(e) => handleChange({ target: { name: 'invoice_month', value: e.value } })}
                placeholder="Select Month"
                filter
                filterPlaceholder="Search months"
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label htmlFor="invoice_year">
                Year <span className="required">*</span>
              </label>
              <Dropdown
                id="invoice_year"
                value={formData.invoice_year}
                options={yearOptions}
                onChange={(e) => handleChange({ target: { name: 'invoice_year', value: e.value } })}
                placeholder="Select Year"
                filter
                filterPlaceholder="Search years"
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label htmlFor="project_id">
                Project <span className="required">*</span>
              </label>
              <Dropdown
                id="project_id"
                value={formData.project_id}
                options={projectOptions}
                onChange={(e) => handleChange({ target: { name: 'project_id', value: e.value } })}
                placeholder="Select Project"
                filter
                filterPlaceholder="Search projects"
                showClear
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label htmlFor="team_id">Team (Optional)</label>
              <Dropdown
                id="team_id"
                value={formData.team_id}
                options={teamOptions}
                onChange={(e) => handleChange({ target: { name: 'team_id', value: e.value } })}
                placeholder="All Teams"
                filter
                filterPlaceholder="Search teams"
                showClear
                disabled={!formData.project_id || teams.length === 0}
                className="w-full"
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={onClose}
              className="p-button-text"
              type="button"
            />
            <Button
              label={loading ? 'Loading...' : 'Next: Enter Billing Details'}
              icon="pi pi-arrow-right"
              iconPos="right"
              type="submit"
              disabled={loading}
              className="p-button-warning"
            />
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
              <div className="summary-item">
                <strong>Offshore Manager:</strong> {managers.offshore_manager}
              </div>
              <div className="summary-item">
                <strong>Onsite Manager:</strong> {managers.onsite_manager}
              </div>
            </div>

            <div className="employee-billing-section">
              <h3>Employee Billing Details</h3>
              <DataTable
                value={employeeBilling}
                className="p-datatable-gridlines"
                stripedRows
                responsiveLayout="scroll"
                footer={
                  <div style={{ textAlign: 'right', paddingRight: '1rem' }}>
                    <strong>Employee Subtotal: ${calculateEmployeeTotal().toFixed(2)}</strong>
                  </div>
                }
              >
                <Column
                  field="employee_name"
                  header="Employee Name"
                  style={{ minWidth: '150px' }}
                />
                <Column
                  field="employee_role"
                  header="Role"
                  body={(rowData) => rowData.employee_role || 'N/A'}
                  style={{ minWidth: '120px' }}
                />
                <Column
                  field="role_type"
                  header="Role Type"
                  body={(rowData) => rowData.role_type || 'N/A'}
                  style={{ minWidth: '120px' }}
                />
                <Column
                  field="team_name"
                  header="Project Team"
                  body={(rowData) => rowData.team_name || 'N/A'}
                  style={{ minWidth: '150px' }}
                />
                <Column
                  header="Billing Hours"
                  body={(rowData) => (
                    <InputNumber
                      value={rowData.billing_hours}
                      onValueChange={(e) => handleBillingChange(rowData.employee_id, 'billing_hours', e.value)}
                      min={0}
                      max={744}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      placeholder="0"
                      className="w-full"
                    />
                  )}
                  style={{ minWidth: '140px' }}
                />
                <Column
                  header="Leave Hours"
                  body={(rowData) => (
                    <InputNumber
                      value={rowData.leave_hours}
                      onValueChange={(e) => handleBillingChange(rowData.employee_id, 'leave_hours', e.value)}
                      min={0}
                      max={744}
                      minFractionDigits={1}
                      maxFractionDigits={1}
                      placeholder="0"
                      className="w-full"
                    />
                  )}
                  style={{ minWidth: '140px' }}
                />
                <Column
                  header="Balance Hours"
                  body={(rowData) => (
                    <strong style={{ color: '#0066cc' }}>
                      {(parseFloat(rowData.billing_hours || 0) - parseFloat(rowData.leave_hours || 0)).toFixed(1)}
                    </strong>
                  )}
                  style={{ minWidth: '120px', textAlign: 'center' }}
                />
                <Column
                  header="Cost/Hour ($)"
                  body={(rowData) => (
                    <InputNumber
                      value={rowData.cost_per_hour}
                      onValueChange={(e) => handleBillingChange(rowData.employee_id, 'cost_per_hour', e.value)}
                      min={0}
                      minFractionDigits={2}
                      maxFractionDigits={2}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )}
                  style={{ minWidth: '140px' }}
                />
                <Column
                  header="Total ($)"
                  body={(rowData) => (
                    <strong style={{ color: '#28a745' }}>
                      ${calculateTotal(rowData)}
                    </strong>
                  )}
                  style={{ minWidth: '120px', textAlign: 'right' }}
                />
              </DataTable>
            </div>

            {/* Manager Billing Section */}
            {managerBilling.length > 0 && (
              <div className="manager-billing-section">
                <h3>
                  <i className="pi pi-star-fill"></i> Manager Billing
                </h3>
                <DataTable
                  value={managerBilling}
                  className="p-datatable-gridlines manager-billing-table"
                  stripedRows
                  responsiveLayout="scroll"
                  footer={
                    <div style={{ textAlign: 'right', paddingRight: '1rem' }}>
                      <strong>Manager Subtotal: ${calculateManagerTotalSum().toFixed(2)}</strong>
                    </div>
                  }
                >
                  <Column
                    field="employee_name"
                    header="Manager Name"
                    body={(rowData) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '600' }}>{rowData.employee_name}</span>
                        <span className="manager-type-badge">
                          {rowData.manager_type} Manager
                        </span>
                      </div>
                    )}
                    style={{ minWidth: '200px' }}
                  />
                  <Column
                    field="employee_role"
                    header="Role"
                    body={(rowData) => rowData.employee_role || 'N/A'}
                    style={{ minWidth: '120px' }}
                  />
                  <Column
                    field="role_type"
                    header="Role Type"
                    body={(rowData) => rowData.role_type || 'N/A'}
                    style={{ minWidth: '120px' }}
                  />
                  <Column
                    field="team_name"
                    header="Project Team"
                    body={(rowData) => rowData.team_name || 'N/A'}
                    style={{ minWidth: '150px' }}
                  />
                  <Column
                    header="Billing Hours"
                    body={(rowData) => (
                      <InputNumber
                        value={rowData.billing_hours}
                        onValueChange={(e) => handleManagerBillingChange(rowData.employee_id, 'billing_hours', e.value)}
                        min={0}
                        max={744}
                        minFractionDigits={1}
                        maxFractionDigits={1}
                        placeholder="0"
                        className="w-full"
                      />
                    )}
                    style={{ minWidth: '140px' }}
                  />
                  <Column
                    header="Leave Hours"
                    body={(rowData) => (
                      <InputNumber
                        value={rowData.leave_hours}
                        onValueChange={(e) => handleManagerBillingChange(rowData.employee_id, 'leave_hours', e.value)}
                        min={0}
                        max={744}
                        minFractionDigits={1}
                        maxFractionDigits={1}
                        placeholder="0"
                        className="w-full"
                      />
                    )}
                    style={{ minWidth: '140px' }}
                  />
                  <Column
                    header="Balance Hours"
                    body={(rowData) => (
                      <strong style={{ color: '#0066cc' }}>
                        {(parseFloat(rowData.billing_hours || 0) - parseFloat(rowData.leave_hours || 0)).toFixed(1)}
                      </strong>
                    )}
                    style={{ minWidth: '120px', textAlign: 'center' }}
                  />
                  <Column
                    header="Cost/Hour ($)"
                    body={(rowData) => (
                      <InputNumber
                        value={rowData.cost_per_hour}
                        onValueChange={(e) => handleManagerBillingChange(rowData.employee_id, 'cost_per_hour', e.value)}
                        min={0}
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        placeholder="0.00"
                        className="w-full"
                      />
                    )}
                    style={{ minWidth: '140px' }}
                  />
                  <Column
                    header="Bonus ($)"
                    body={(rowData) => (
                      <span style={{ color: rowData.manager_type === 'Offshore' ? '#FFC500' : '#999', fontWeight: '500' }}>
                        {rowData.manager_type === 'Offshore' ? `+$${calculateManagerBonus(rowData)}` : '-'}
                      </span>
                    )}
                    style={{ minWidth: '100px', textAlign: 'center' }}
                  />
                  <Column
                    header="Total ($)"
                    body={(rowData) => (
                      <strong style={{ color: '#28a745' }}>
                        ${calculateManagerTotal(rowData)}
                      </strong>
                    )}
                    style={{ minWidth: '120px', textAlign: 'right' }}
                  />
                </DataTable>
              </div>
            )}

            {/* Grand Total Banner */}
            <div className="grand-total-banner">
              <span className="grand-total-label">Grand Total (Employees + Managers):</span>
              <span className="grand-total-amount">${calculateGrandTotal()}</span>
            </div>

            <div className="form-actions">
              <Button
                label="Back"
                icon="pi pi-arrow-left"
                onClick={() => setStep(1)}
                className="p-button-text"
                type="button"
              />
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onClose}
                className="p-button-text"
                type="button"
              />
              <Button
                label={submitting ? 'Generating...' : 'Generate Invoice'}
                icon="pi pi-check"
                type="submit"
                disabled={submitting}
                className="p-button-warning"
              />
            </div>
          </form>
        )}
      </Dialog>
  );
};

export default GenerateInvoice;
