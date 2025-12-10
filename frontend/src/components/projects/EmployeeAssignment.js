import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getProjectById, getAllEmployees, assignEmployeesToTeam, removeEmployeeFromTeam } from '../../services/api';
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

      console.log('Loaded project data:', projectData);

      const projectTeams = projectData.teams || [];
      console.log('Project teams:', projectTeams);

      setTeams(projectTeams);

      // Auto-select first team if available
      if (projectTeams.length > 0) {
        setSelectedTeam(projectTeams[0]);
      }

      // Return the teams for use in handleSubmit
      return projectTeams;
    } catch (err) {
      console.error('Error loading project data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error('Failed to load project details');
      return [];
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      // Fetch only active employees for selection
      const response = await getAllEmployees(1, 1000, 'All', 'created_at', 'DESC', null, null, null, null, 'Active');
      setAvailableEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employees list');
    }
  };

  const loadTeamEmployees = (team = selectedTeam) => {
    console.log('Loading team employees for team:', team?.agile_board_name);

    if (!team) {
      console.log('No team selected, clearing employees');
      setSelectedEmployees([]);
      return;
    }

    if (!team.employees || team.employees.length === 0) {
      console.log('Team has no employees');
      setSelectedEmployees([]);
      return;
    }

    console.log('Team employees from backend:', team.employees);

    // Load existing employee assignments for the selected team
    const assignments = team.employees
      .filter(emp => !emp.is_team_lead) // Exclude team leads as they're managed separately
      .map(emp => ({
        assignment_id: emp.assignment_id, // Track assignment ID for direct removal
        employee_id: emp.id,
        employee_name: emp.name,
        employee_sso: emp.sso,
        employee_role: emp.role
      }));

    console.log('Mapped employee assignments:', assignments);
    setSelectedEmployees(assignments);
  };

  const handleEmployeeSelect = (employee) => {
    if (!employee) return;

    // Check if already selected in current team
    if (selectedEmployees.some(emp => emp.employee_id === employee.id)) {
      toast.warning('This employee is already assigned to this team');
      return;
    }

    // Show info message if employee is in other teams
    const employeeInOtherTeams = teams.filter(team =>
      team.id !== selectedTeam?.id &&
      team.employees &&
      team.employees.some(emp => emp.id === employee.id)
    );

    if (employeeInOtherTeams.length > 0) {
      const teamNames = employeeInOtherTeams.map(t => t.agile_board_name).join(', ');
      toast.info(`${employee.name} is also assigned to: ${teamNames}`);
    }

    setSelectedEmployees(prev => [...prev, {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_sso: employee.sso,
      employee_role: employee.role
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

  const handleRemoveEmployee = async (employeeId, assignmentId) => {
    console.log('=== REMOVE EMPLOYEE CLICKED ===');
    console.log('Employee ID:', employeeId);
    console.log('Assignment ID:', assignmentId);
    console.log('Selected Team:', selectedTeam?.agile_board_name);

    // If assignment_id exists, this is an existing assignment - remove it from database
    if (assignmentId) {
      console.log('Assignment ID exists, calling API to remove from database...');
      try {
        console.log('Calling removeEmployeeFromTeam API with assignmentId:', assignmentId);
        const response = await removeEmployeeFromTeam(assignmentId);
        console.log('API Response:', response);

        toast.success('Employee removed from team successfully!');

        // Reload project data to reflect the changes
        console.log('Reloading project data...');
        const updatedTeams = await loadProjectData();

        // If we still have the same team selected, reload its employees
        if (selectedTeam && updatedTeams) {
          const updatedTeam = updatedTeams.find(t => t.id === selectedTeam.id);
          if (updatedTeam) {
            console.log('Reloading team employees...');
            setSelectedTeam(updatedTeam);
            loadTeamEmployees(updatedTeam);
          }
        }
      } catch (err) {
        console.error('Error removing employee:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        toast.error(err.response?.data?.message || 'Failed to remove employee');
      }
    } else {
      // If no assignment_id, this is a newly added employee not yet saved - just remove from state
      console.log('No assignment ID, removing from local state only');
      setSelectedEmployees(prev =>
        prev.filter(emp => emp.employee_id !== employeeId)
      );
    }
    console.log('=== REMOVE EMPLOYEE COMPLETED ===');
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
          employee_id: emp.employee_id
        }))
      };

      console.log('Submitting employee assignments:', {
        teamId: selectedTeam.id,
        teamName: selectedTeam.agile_board_name,
        data: dataToSubmit
      });

      await assignEmployeesToTeam(selectedTeam.id, dataToSubmit);

      toast.success(`Employee assignments updated for "${selectedTeam.agile_board_name}"!`);

      // Reload project data to get updated employee lists
      const updatedTeams = await loadProjectData();

      // If we still have the same team selected, reload its employees from the updated teams
      if (selectedTeam && updatedTeams) {
        const updatedTeam = updatedTeams.find(t => t.id === selectedTeam.id);
        if (updatedTeam) {
          setSelectedTeam(updatedTeam);
          loadTeamEmployees(updatedTeam);
        }
      }
    } catch (err) {
      console.error('Error saving employee assignments:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error(err.response?.data?.message || 'Failed to save employee assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = availableEmployees.filter(emp => {
    // Exclude if already in selected employees for current team
    if (selectedEmployees.some(selected => selected.employee_id === emp.id)) {
      return false;
    }

    // Exclude Managers and Team Leads - they are assigned at project/team level
    if (emp.role_type === 'Manager' || emp.role_type === 'Team Lead') {
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
                      // Find which teams in this project the employee is already assigned to
                      const assignedTeams = teams.filter(team =>
                        team.employees && team.employees.some(e => e.id === emp.id)
                      );
                      const isInOtherTeams = assignedTeams.length > 0;

                      return (
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
                            {isInOtherTeams && (
                              <span style={{ color: '#0066cc', fontWeight: '500' }}>
                                {' '}• In: {assignedTeams.map(t => t.agile_board_name).join(', ')}
                              </span>
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
                {console.log('Rendering employee table with employees:', selectedEmployees)}
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>SSO</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployees.map((emp) => {
                      console.log(`Rendering employee row: ${emp.employee_name}, assignment_id: ${emp.assignment_id}`);
                      return (
                        <tr key={emp.employee_id}>
                          <td>{emp.employee_name}</td>
                          <td>{emp.employee_sso || 'N/A'}</td>
                          <td>{emp.employee_role || 'N/A'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => {
                                console.log(`Remove button clicked for employee_id: ${emp.employee_id}, assignment_id: ${emp.assignment_id}`);
                                handleRemoveEmployee(emp.employee_id, emp.assignment_id);
                              }}
                              title={emp.assignment_id ? `Remove from database (ID: ${emp.assignment_id})` : 'Remove from list'}
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
