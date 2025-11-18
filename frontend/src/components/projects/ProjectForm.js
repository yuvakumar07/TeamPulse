import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createProject, updateProject, getProjectById, getAllEmployees } from '../../services/api';
import './ProjectForm.css';

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_team_name: '',
    agile_board_name: '',
    agile_team_jira_key: '',
    project_status: 'Planning'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchAvailableEmployees();
  }, []);

  useEffect(() => {
    if (project) {
      loadProjectData();
    }
  }, [project]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.searchable-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchAvailableEmployees = async () => {
    try {
      setLoadingEmployees(true);
      // Fetch all employees without pagination for selection
      const response = await getAllEmployees(1, 1000, 'All');
      setAvailableEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employees list');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadProjectData = async () => {
    try {
      const response = await getProjectById(project.id);
      const projectData = response.data.data;

      setFormData({
        project_team_name: projectData.project_team_name || '',
        agile_board_name: projectData.agile_board_name || '',
        agile_team_jira_key: projectData.agile_team_jira_key || '',
        project_status: projectData.project_status || 'Planning'
      });

      // Load existing employee assignments
      if (projectData.employees && projectData.employees.length > 0) {
        const assignments = projectData.employees.map(emp => ({
          employee_id: emp.id,
          employee_name: emp.name,
          employee_sso: emp.sso,
          employee_role: emp.role,
          allocation_percentage: parseFloat(emp.allocation_percentage) || 0
        }));
        setSelectedEmployees(assignments);
      }
    } catch (err) {
      console.error('Error loading project:', err);
      toast.error('Failed to load project details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const handleEmployeeSelect = (employee) => {
    if (!employee) return;

    // Check if already selected
    if (selectedEmployees.some(emp => emp.employee_id === employee.id)) {
      toast.warning('This employee is already assigned to the project');
      return;
    }

    setSelectedEmployees(prev => [...prev, {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_sso: employee.sso,
      employee_role: employee.role,
      allocation_percentage: 0
    }]);

    // Reset search and close dropdown
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleAllocationChange = (employeeId, value) => {
    const percentage = parseFloat(value) || 0;

    if (percentage < 0 || percentage > 100) {
      toast.warning('Allocation percentage must be between 0 and 100');
      return;
    }

    setSelectedEmployees(prev =>
      prev.map(emp =>
        emp.employee_id === employeeId
          ? { ...emp, allocation_percentage: percentage }
          : emp
      )
    );
  };

  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.filter(emp => emp.employee_id !== employeeId)
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.project_team_name.trim()) {
      newErrors.project_team_name = 'Project Team Name is required';
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
      const dataToSubmit = {
        ...formData,
        employees: selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          allocation_percentage: emp.allocation_percentage
        }))
      };

      if (project) {
        await updateProject(project.id, dataToSubmit);
      } else {
        await createProject(dataToSubmit);
      }

      toast.success(project ? 'Project updated successfully!' : 'Project created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = availableEmployees.filter(emp =>
    !selectedEmployees.some(selected => selected.employee_id === emp.id) &&
    (searchTerm === '' ||
     emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (emp.sso && emp.sso.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const totalAllocation = selectedEmployees.reduce((sum, emp) => sum + (emp.allocation_percentage || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content project-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'Add New Project'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="project_team_name">
                Project Team Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="project_team_name"
                name="project_team_name"
                value={formData.project_team_name}
                onChange={handleChange}
                className={errors.project_team_name ? 'error' : ''}
              />
              {errors.project_team_name && (
                <span className="error-message">{errors.project_team_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="agile_board_name">Agile Board Name</label>
              <input
                type="text"
                id="agile_board_name"
                name="agile_board_name"
                value={formData.agile_board_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="agile_team_jira_key">Agile Team JIRA Key</label>
              <input
                type="text"
                id="agile_team_jira_key"
                name="agile_team_jira_key"
                value={formData.agile_team_jira_key}
                onChange={handleChange}
                placeholder="e.g., PROJ-123"
              />
            </div>

            <div className="form-group">
              <label htmlFor="project_status">Project Status</label>
              <select
                id="project_status"
                name="project_status"
                value={formData.project_status}
                onChange={handleChange}
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="employee-assignment-section">
            <h3>Employee Assignments</h3>

            <div className="employee-selector">
              <label htmlFor="employee-search">Add Employee</label>
              <div className="searchable-dropdown">
                <input
                  type="text"
                  id="employee-search"
                  placeholder="Search and select an employee..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  disabled={loadingEmployees}
                  className="searchable-input"
                  autoComplete="off"
                />
                {showDropdown && filteredEmployees.length > 0 && (
                  <div className="dropdown-list">
                    {filteredEmployees.slice(0, 50).map(emp => (
                      <div
                        key={emp.id}
                        className="dropdown-item"
                        onClick={() => handleEmployeeSelect(emp)}
                      >
                        <div className="dropdown-item-main">
                          <span className="employee-name-dropdown">{emp.name}</span>
                          <span className="employee-sso-dropdown">({emp.sso || 'N/A'})</span>
                        </div>
                        <div className="dropdown-item-sub">
                          {emp.role || 'N/A'} • {emp.location || 'N/A'}
                        </div>
                      </div>
                    ))}
                    {filteredEmployees.length > 50 && (
                      <div className="dropdown-item-info">
                        Showing first 50 results. Type to narrow search.
                      </div>
                    )}
                  </div>
                )}
                {showDropdown && searchTerm && filteredEmployees.length === 0 && (
                  <div className="dropdown-list">
                    <div className="dropdown-item-info">No employees found</div>
                  </div>
                )}
              </div>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="selected-employees">
                <div className="allocation-summary">
                  <strong>Total Allocation: {totalAllocation.toFixed(2)}%</strong>
                  {totalAllocation > 100 && (
                    <span className="warning"> (Warning: Exceeds 100%)</span>
                  )}
                </div>
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>SSO</th>
                      <th>Role</th>
                      <th>Allocation %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployees.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td>{emp.employee_name}</td>
                        <td>{emp.employee_sso || 'N/A'}</td>
                        <td>{emp.employee_role || 'N/A'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={emp.allocation_percentage}
                            onChange={(e) => handleAllocationChange(emp.employee_id, e.target.value)}
                            className="allocation-input"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemoveEmployee(emp.employee_id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedEmployees.length === 0 && (
              <p className="no-employees">No employees assigned yet. Select employees from the dropdown above.</p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
