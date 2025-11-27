import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createProject, updateProject, getProjectById, createProjectTeam, updateProjectTeam, deleteProjectTeam } from '../../services/api';
import './ProjectForm.css';

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_team_name: '',
    project_status: 'Planning'
  });
  const [teams, setTeams] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      loadProjectData();
    }
  }, [project]);

  const loadProjectData = async () => {
    try {
      const response = await getProjectById(project.id);
      const projectData = response.data.data;

      setFormData({
        project_team_name: projectData.project_team_name || '',
        project_status: projectData.project_status || 'Planning'
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
    setTeams([...teams, { agile_board_name: '', agile_team_jira_key: '', isNew: true }]);
  };

  const removeTeam = async (index) => {
    const team = teams[index];

    if (!team.isNew && team.id) {
      try {
        await deleteProjectTeam(team.id);
        toast.success('Team deleted successfully!');
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

        if (team.isNew) {
          await createProjectTeam(projectId, {
            agile_board_name: team.agile_board_name,
            agile_team_jira_key: team.agile_team_jira_key
          });
        } else if (team.id) {
          await updateProjectTeam(team.id, {
            agile_board_name: team.agile_board_name,
            agile_team_jira_key: team.agile_team_jira_key
          });
        }
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
          </div>

          <div className="teams-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Teams</h3>
              <button type="button" className="btn btn-secondary" onClick={addTeam}>
                + Add Team
              </button>
            </div>

            {teams.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
                No teams added yet. Click "Add Team" to create one.
              </p>
            ) : (
              <div className="teams-list">
                {teams.map((team, index) => (
                  <div key={index} className="team-item">
                    <div className="form-grid" style={{ flex: 1 }}>
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
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeTeam(index)}
                      style={{ marginLeft: '1rem', height: 'fit-content' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
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
