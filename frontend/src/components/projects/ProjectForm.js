import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createProject, updateProject, getProjectById, createProjectTeam, updateProjectTeam, deleteProjectTeam, getAllEmployees, getAllTeams } from '../../services/api';
import './ProjectForm.css';

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_team_name: '',
    project_status: 'Planning',
    temp_offshore_manager_id: '',
    temp_onsite_manager_id: ''
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
        temp_offshore_manager_id: projectData.temp_offshore_manager_id || '',
        temp_onsite_manager_id: projectData.temp_onsite_manager_id || ''
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
              <label htmlFor="temp_offshore_manager_id">Temp Offshore Manager</label>
              <select
                id="temp_offshore_manager_id"
                name="temp_offshore_manager_id"
                value={formData.temp_offshore_manager_id}
                onChange={handleChange}
              >
                <option value="">Select Temp Offshore Manager</option>
                {employees
                  .filter(emp => emp.work_location === 'Offshore' && emp.role_type === 'Manager')
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.sso || 'N/A'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="temp_onsite_manager_id">Temp Onsite Manager</label>
              <select
                id="temp_onsite_manager_id"
                name="temp_onsite_manager_id"
                value={formData.temp_onsite_manager_id}
                onChange={handleChange}
              >
                <option value="">Select Temp Onsite Manager</option>
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
                            .filter(emp => emp.work_location === 'Offshore' && emp.role_type === 'Team Lead')
                            .map(emp => (
                              <option
                                key={emp.id}
                                value={emp.id}
                              >
                                {emp.name} ({emp.sso || 'N/A'})
                              </option>
                            ))}
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
                            .map(emp => (
                              <option
                                key={emp.id}
                                value={emp.id}
                              >
                                {emp.name} ({emp.sso || 'N/A'})
                              </option>
                            ))}
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
