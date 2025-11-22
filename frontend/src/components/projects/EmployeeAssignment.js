import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProjectById, getAllEmployees, assignEmployeesToProject } from '../../services/api';
import './EmployeeAssignment.css';

const EmployeeAssignment = ({ project, onClose, onSuccess }) => {
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableEmployees();
    loadProjectEmployees();
  }, []);

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

  const loadProjectEmployees = async () => {
    try {
      const response = await getProjectById(project.id);
      const projectData = response.data.data;

      // Load existing employee assignments
      if (projectData.employees && projectData.employees.length > 0) {
        const assignments = projectData.employees.map(emp => {
          const totalAllocation = parseFloat(emp.total_allocation) || 0;
          const thisProjectAllocation = parseFloat(emp.allocation_percentage) || 0;
          // Calculate allocation from other projects
          const otherProjectsAllocation = totalAllocation - thisProjectAllocation;

          return {
            employee_id: emp.id,
            employee_name: emp.name,
            employee_sso: emp.sso,
            employee_role: emp.role,
            other_projects_allocation: otherProjectsAllocation,
            allocation_percentage: thisProjectAllocation
          };
        });
        setSelectedEmployees(assignments);
      }
    } catch (err) {
      console.error('Error loading project employees:', err);
      toast.error('Failed to load project employee assignments');
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
      other_projects_allocation: employee.total_allocation || 0,
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
    // Allow empty string to clear the field
    if (value === '') {
      setSelectedEmployees(prev =>
        prev.map(emp =>
          emp.employee_id === employeeId
            ? { ...emp, allocation_percentage: '' }
            : emp
        )
      );
      return;
    }

    const percentage = parseFloat(value);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataToSubmit = {
        employees: selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          allocation_percentage: emp.allocation_percentage === '' ? 0 : emp.allocation_percentage
        }))
      };

      await assignEmployeesToProject(project.id, dataToSubmit);

      toast.success('Employee assignments updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving employee assignments:', err);
      toast.error(err.response?.data?.message || 'Failed to save employee assignments');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content employee-assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Employees - {project.project_team_name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="employee-assignment-section">
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
                    {filteredEmployees.slice(0, 50).map(emp => {
                      const totalAllocation = parseFloat(emp.total_allocation) || 0;
                      const isOverAllocated = totalAllocation >= 100;
                      const availableAllocation = Math.max(0, 100 - totalAllocation);

                      return (
                        <div
                          key={emp.id}
                          className="dropdown-item"
                          onClick={() => handleEmployeeSelect(emp)}
                        >
                          <div className="dropdown-item-main">
                            <span className="employee-name-dropdown">{emp.name}</span>
                            <span className="employee-sso-dropdown">({emp.sso || 'N/A'})</span>
                            <span className={`allocation-badge ${isOverAllocated ? 'over-allocated' : ''}`}>
                              {totalAllocation.toFixed(0)}%
                            </span>
                          </div>
                          <div className="dropdown-item-sub">
                            {emp.role || 'N/A'} • {emp.location || 'N/A'} •
                            {isOverAllocated ? (
                              <span className="warning-text"> Over-allocated!</span>
                            ) : (
                              <span> Available: {availableAllocation.toFixed(0)}%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>SSO</th>
                      <th>Role</th>
                      <th>Current Total</th>
                      <th>This Project %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployees.map((emp) => {
                      const otherProjects = parseFloat(emp.other_projects_allocation) || 0;
                      const thisProject = parseFloat(emp.allocation_percentage) || 0;
                      const currentTotal = otherProjects + thisProject;
                      const isOverAllocated = currentTotal > 100;

                      return (
                        <tr key={emp.employee_id} className={isOverAllocated ? 'over-allocated-row' : ''}>
                          <td>{emp.employee_name}</td>
                          <td>{emp.employee_sso || 'N/A'}</td>
                          <td>{emp.employee_role || 'N/A'}</td>
                          <td>
                            <span className={`allocation-display ${isOverAllocated ? 'over-allocated-text' : 'available-text'}`}>
                              {currentTotal.toFixed(1)}%
                              {isOverAllocated && ' ⚠️'}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={emp.allocation_percentage === 0 ? '' : emp.allocation_percentage}
                              onChange={(e) => handleAllocationChange(emp.employee_id, e.target.value)}
                              className="allocation-input"
                              placeholder="0"
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
                      );
                    })}
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
              {submitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeAssignment;
