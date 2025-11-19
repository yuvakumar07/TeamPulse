import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createProject, updateProject, getProjectById } from '../../services/api';
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
        agile_board_name: projectData.agile_board_name || '',
        agile_team_jira_key: projectData.agile_team_jira_key || '',
        project_status: projectData.project_status || 'Planning'
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (project) {
        await updateProject(project.id, formData);
      } else {
        await createProject(formData);
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
