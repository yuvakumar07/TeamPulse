import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createProject, updateProject, getProjectById, createProjectTeam, updateProjectTeam, deleteProjectTeam, getAllEmployees, getAllTeams } from '../../services/api';
import './ProjectForm.css';

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_team_name: '',
    project_status: 'Planning',
    offshore_manager_id: '',
    onsite_manager_id: ''
  });
  const [teams, setTeams] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [allTeamsGlobal, setAllTeamsGlobal] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchAllTeamsGlobal();
    if (project) {
      loadProjectData();
    }
  }, [project]);

  const fetchEmployees = async () => {
    try {
      const response = await getAllEmployees(1, 1000, 'All');
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employees list');
    }
  };

  const fetchAllTeamsGlobal = async () => {
    try {
      const response = await getAllTeams();
      setAllTeamsGlobal(response.data.data || []);
    } catch (err) {
      console.error('Error fetching all teams:', err);
      toast.error('Failed to load teams list');
    }
  };

  const loadProjectData = async () => {
    try {
      const response = await getProjectById(project.id);
      const projectData = response.data.data;

      setFormData({
        project_team_name: projectData.project_team_name || '',
        project_status: projectData.project_status || 'Planning',
        offshore_manager_id: projectData.offshore_manager_id || '',
        onsite_manager_id: projectData.onsite_manager_id || ''
      });

      setTeams(projectData.teams || []);
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

  const validate = () => {
    const newErrors = {};

    if (!formData.project_team_name.trim()) {
      newErrors.project_team_name = 'Project Team Name is required';
    }

    return newErrors;
  };

  const addTeam = () => {
    setTeams([...teams, {
      agile_board_name: '',
      agile_team_jira_key: '',
      offshore_team_lead_id: '',
      onsite_team_lead_id: '',
      isNew: true
    }]);
  };

  const removeTeam = async (index) => {
    const team = teams[index];

    if (!team.isNew && team.id) {
      try {
        await deleteProjectTeam(team.id);
        toast.success('Team deleted successfully!');

        // Refresh global teams list after deletion
        await fetchAllTeamsGlobal();
      } catch (err) {
        console.error('Error deleting team:', err);
        toast.error('Failed to delete team');
        return;
      }
    }

    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
  };

  const updateTeam = (index, field, value) => {

    // Check if trying to assign a team lead that's already assigned to another team globally
    if ((field == 'offshore_team_lead_id' || field == 'onsite_team_lead_id') && value) {
      const currentTeam = teams[index];
      const currentTeamId = currentTeam.id; // Will be undefined for new teams

      // Check against all teams in the database (excluding the current team being edited)
      const isAlreadyAssignedGlobally = allTeamsGlobal.some((team) => {
        // Skip the current team being edited (if it exists in the database)
        if (currentTeamId && team.id == currentTeamId) return false;

        if (field == 'offshore_team_lead_id') {
          return team.offshore_team_lead_id == value;
        } else if (field == 'onsite_team_lead_id') {
          return team.onsite_team_lead_id == value;
        }
        return false;
      });

      // Also check against other teams in the current form (for newly added teams not yet saved)
      const isAlreadyAssignedLocally = teams.some((team, idx) => {
        if (idx == index) return false; // Skip current team

        if (field == 'offshore_team_lead_id') {
          return team.offshore_team_lead_id == value;
        } else if (field == 'onsite_team_lead_id') {
          return team.onsite_team_lead_id == value;
        }
        return false;
      });

      if (isAlreadyAssignedGlobally || isAlreadyAssignedLocally) {
        const employeeName = employees.find(emp => emp.id === parseInt(value))?.name || 'This employee';
        const leadType = field === 'offshore_team_lead_id' ? 'Offshore Team Lead' : 'Onsite Team Lead';

        // Find which project the employee is assigned to
        let assignedProject = '';
        if (isAlreadyAssignedGlobally) {
          const assignedTeam = allTeamsGlobal.find(team => {
            if (field == 'offshore_team_lead_id') {
              return team.offshore_team_lead_id == value;
            } else {
              return team.onsite_team_lead_id == value;
            }
          });
          assignedProject = assignedTeam ? ` in project "${assignedTeam.project_team_name}"` : '';
        } else {
          assignedProject = ' in this project';
        }

        toast.error(`${employeeName} is already assigned as ${leadType}${assignedProject}. Each team lead can only be assigned to one team across all projects.`);
        return; // Don't update
      }
    }

    const newTeams = [...teams];
    newTeams[index][field] = value;
    setTeams(newTeams);
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
      let projectId = project?.id;

      if (project) {
        await updateProject(project.id, formData);
      } else {
        const response = await createProject(formData);
        projectId = response.data.data.id;
      }

      // Save teams
      for (const team of teams) {
        if (!team.agile_board_name.trim()) continue;

        const teamData = {
          agile_board_name: team.agile_board_name,
          agile_team_jira_key: team.agile_team_jira_key,
          offshore_team_lead_id: team.offshore_team_lead_id || null,
          onsite_team_lead_id: team.onsite_team_lead_id || null
        };

        if (team.isNew) {
          await createProjectTeam(projectId, teamData);
        } else if (team.id) {
          await updateProjectTeam(team.id, teamData);
        }
      }

      toast.success(project ? 'Project updated successfully!' : 'Project created successfully!');

      // Refresh global teams list to ensure validation data is up-to-date
      await fetchAllTeamsGlobal();

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

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

            <div className="form-group">
              <label htmlFor="offshore_manager_id">Offshore Manager</label>
              <select
                id="offshore_manager_id"
                name="offshore_manager_id"
                value={formData.offshore_manager_id}
                onChange={handleChange}
              >
                <option value="">Select Offshore Manager</option>
                {employees
                  .filter(emp => emp.work_location === 'Offsite' && emp.role_type === 'Manager')
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.sso || 'N/A'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="onsite_manager_id">Onsite Manager</label>
              <select
                id="onsite_manager_id"
                name="onsite_manager_id"
                value={formData.onsite_manager_id}
                onChange={handleChange}
              >
                <option value="">Select Onsite Manager</option>
                {employees
                  .filter(emp => emp.work_location === 'Onsite' && emp.role_type === 'Manager')
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.sso || 'N/A'})
                    </option>
                  ))}
              </select>
            </div>
          </div>

             <div className='teamheader'>
              <h3>Teams</h3>
              <button type="button" className="btn btn-secondary" onClick={addTeam}>
                + Add Team
              </button>
            </div>
          <>
           

            {teams.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
                No teams added yet. Click "Add Team" to create one.
              </p>
            ) : (
              <div className="teams-list">
                {teams.map((team, index) => (
                  <div key={index}  style={{ marginBottom: '15px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
                    <div className='teamheader'>
                      <h4 style={{ margin: 0, color: '#495057' }}>Team #{index + 1}</h4>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeTeam(index)}
                      >
                        Remove Team
                      </button>
                    </div>

                    <div className="form-grid m-0" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 15px' }}>
                      <div className="form-group">
                        <label>Agile Board Name</label>
                        <input
                          type="text"
                          value={team.agile_board_name}
                          onChange={(e) => updateTeam(index, 'agile_board_name', e.target.value)}
                          placeholder="Enter board name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Agile Team JIRA Key</label>
                        <input
                          type="text"
                          value={team.agile_team_jira_key || ''}
                          onChange={(e) => updateTeam(index, 'agile_team_jira_key', e.target.value)}
                          placeholder="e.g., PROJ-123"
                        />
                      </div>

                      <div className="form-group">
                        <label>Offshore Team Lead</label>
                        <select
                          value={team.offshore_team_lead_id || ''}
                          onChange={(e) => updateTeam(index, 'offshore_team_lead_id', e.target.value)}
                        >
                          <option value="">Select Offshore Team Lead</option>
                          {employees
                            .filter(emp => emp.work_location === 'Offsite' && emp.role_type === 'Team Lead')
                            .map(emp => {
                              const currentTeamId = team.id; // Will be undefined for new teams

                              // Check if already assigned globally (excluding current team)
                              const isAssignedGlobally = allTeamsGlobal.some((t) =>
                                (!currentTeamId || t.id !== currentTeamId) && t.offshore_team_lead_id === emp.id
                              );

                              // Check if already assigned locally in the form (for new teams not yet saved)
                              const isAssignedLocally = teams.some((t, idx) =>
                                idx !== index && t.offshore_team_lead_id === emp.id.toString()
                              );

                              const isAssigned = isAssignedGlobally || isAssignedLocally;

                              return (
                                <option
                                  key={emp.id}
                                  value={emp.id}
                                  disabled={isAssigned}
                                >
                                  {emp.name} ({emp.sso || 'N/A'}) {isAssigned ? '(Already Assigned)' : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Onsite Team Lead</label>
                        <select
                          value={team.onsite_team_lead_id || ''}
                          onChange={(e) => updateTeam(index, 'onsite_team_lead_id', e.target.value)}
                        >
                          <option value="">Select Onsite Team Lead</option>
                          {employees
                            .filter(emp => emp.work_location === 'Onsite' && emp.role_type === 'Team Lead')
                            .map(emp => {
                              const currentTeamId = team.id; // Will be undefined for new teams

                              // Check if already assigned globally (excluding current team)
                              const isAssignedGlobally = allTeamsGlobal.some((t) =>
                                (!currentTeamId || t.id !== currentTeamId) && t.onsite_team_lead_id === emp.id
                              );

                              // Check if already assigned locally in the form (for new teams not yet saved)
                              const isAssignedLocally = teams.some((t, idx) =>
                                idx !== index && t.onsite_team_lead_id === emp.id.toString()
                              );

                              const isAssigned = isAssignedGlobally || isAssignedLocally;

                              return (
                                <option
                                  key={emp.id}
                                  value={emp.id}
                                  disabled={isAssigned}
                                >
                                  {emp.name} ({emp.sso || 'N/A'}) {isAssigned ? '(Already Assigned)' : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>

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
