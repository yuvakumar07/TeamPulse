import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProjectById, getAllEmployees, assignEmployeesToTeam } from '../../services/api';
import './EmployeeAssignment.css';

const EmployeeAssignment = ({ project, onClose, onSuccess }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjectData();
    fetchAvailableEmployees();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamEmployees();
    } else {
      setSelectedEmployees([]);
    }
  }, [selectedTeam?.id]); // Depend on team ID instead of team object

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

  const loadProjectData = async () => {
    try {
      setLoadingData(true);
      const response = await getProjectById(project.id);
      const projectData = response.data.data;

      const projectTeams = projectData.teams || [];

      setTeams(projectTeams);

      // Auto-select first team if available
      if (projectTeams.length > 0) {
        setSelectedTeam(projectTeams[0]);
      }

      // Return the teams for use in handleSubmit
      return projectTeams;
    } catch (err) {
      console.error('Error loading project data:', err);
      toast.error('Failed to load project details');
      return [];
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      // Fetch all employees without pagination for selection
      const response = await getAllEmployees(1, 1000, 'All');
      setAvailableEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employees list');
    }
  };

  const loadTeamEmployees = (team = selectedTeam) => {
    if (!team) {
      setSelectedEmployees([]);
      return;
    }

    if (!team.employees || team.employees.length === 0) {
      setSelectedEmployees([]);
      return;
    }

    // Load existing employee assignments for the selected team
    const assignments = team.employees.map(emp => {
      const totalAllocation = parseFloat(emp.total_allocation) || 0;
      const thisTeamAllocation = parseFloat(emp.allocation_percentage) || 0;
      const otherProjectsAllocation = totalAllocation - thisTeamAllocation;

      return {
        employee_id: emp.id,
        employee_name: emp.name,
        employee_sso: emp.sso,
        employee_role: emp.role,
        other_projects_allocation: otherProjectsAllocation,
        allocation_percentage: thisTeamAllocation
      };
    });

    setSelectedEmployees(assignments);
  };

  const handleEmployeeSelect = (employee) => {
    if (!employee) return;

    // Check if already selected in current team
    if (selectedEmployees.some(emp => emp.employee_id === employee.id)) {
      toast.warning('This employee is already assigned to this team');
      return;
    }

    // Check if employee is already in another team in this project
    const employeeInOtherTeam = teams.find(team =>
      team.id !== selectedTeam?.id &&
      team.employees &&
      team.employees.some(emp => emp.id === employee.id)
    );

    if (employeeInOtherTeam) {
      toast.warning(`This employee is already assigned to "${employeeInOtherTeam.agile_board_name}" team`);
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

    if (!selectedTeam) {
      toast.warning('Please select a team first');
      return;
    }

    setSubmitting(true);

    try {
      const dataToSubmit = {
        employees: selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          allocation_percentage: emp.allocation_percentage === '' ? 0 : emp.allocation_percentage
        }))
      };

      await assignEmployeesToTeam(selectedTeam.id, dataToSubmit);

      toast.success(`Employee assignments updated for "${selectedTeam.agile_board_name}"!`);

      // Reload project data to get updated employee lists
      const updatedTeams = await loadProjectData();

      // If we still have the same team selected, reload its employees from the updated teams
      if (selectedTeam && updatedTeams) {
        const updatedTeam = updatedTeams.find(t => t.id === selectedTeam.id);
        if (updatedTeam) {
          setSelectedTeam(updatedTeam);
        }
      }
    } catch (err) {
      console.error('Error saving employee assignments:', err);
      toast.error(err.response?.data?.message || 'Failed to save employee assignments');
    } finally {
      setSubmitting(false);
    }
  };

  // Get all employee IDs that are already assigned to OTHER teams in this project
  // (Current team's employees are handled separately in selectedEmployees)
  const assignedEmployeeIds = new Set();
  teams.forEach(team => {
    // Exclude the currently selected team since its employees are in selectedEmployees
    if (team.id !== selectedTeam?.id && team.employees) {
      team.employees.forEach(emp => {
        assignedEmployeeIds.add(emp.id);
      });
    }
  });

  const filteredEmployees = availableEmployees.filter(emp => {
    // Exclude if already in selected employees for current team
    if (selectedEmployees.some(selected => selected.employee_id === emp.id)) {
      return false;
    }

    // Exclude if already assigned to any team in the project
    if (assignedEmployeeIds.has(emp.id)) {
      return false;
    }

    // Exclude Team Leads and Managers
    if (emp.role_type === 'Team Lead' || emp.role_type === 'Manager') {
      return false;
    }

    // Apply search filter
    if (searchTerm === '') return true;

    return emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (emp.sso && emp.sso.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content employee-assignment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Employees to Teams - {project.project_team_name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {loadingData ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No teams found for this project.</p>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.5rem' }}>
              Please create teams in the project edit form before assigning employees.
            </p>
            <button className="btn btn-cancel" onClick={onClose} style={{ marginTop: '1rem' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e9ecef' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#495057' }}>
                Select Team:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeam(team);
                      // Immediately load employees for the clicked team
                      loadTeamEmployees(team);
                    }}
                    className={`team-tab ${selectedTeam?.id === team.id ? 'active' : ''}`}
                    style={{
                      padding: '0.5rem 1rem',
                      border: selectedTeam?.id === team.id ? '2px solid #007bff' : '1px solid #ced4da',
                      backgroundColor: selectedTeam?.id === team.id ? '#007bff' : 'white',
                      color: selectedTeam?.id === team.id ? 'white' : '#333',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: selectedTeam?.id === team.id ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    {team.agile_board_name}
                    {team.employees && team.employees.length > 0 && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.15rem 0.4rem',
                        backgroundColor: selectedTeam?.id === team.id ? 'rgba(255,255,255,0.3)' : '#e9ecef',
                        borderRadius: '10px',
                        fontSize: '0.75rem'
                      }}>
                        {team.employees.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="employee-assignment-section">
                <div className="employee-selector">
                  <label htmlFor="employee-search">Add Employee to {selectedTeam?.agile_board_name}</label>
              <div className="searchable-dropdown">
                <input
                  type="text"
                  id="employee-search"
                  placeholder="Search and select an employee..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  disabled={!selectedTeam}
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
                      <th>This Team %</th>
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
              <p className="no-employees">No employees assigned to this team yet. Select employees from the dropdown above.</p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedTeam}>
              {submitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeAssignment;
