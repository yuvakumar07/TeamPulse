import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { createProject, updateProject, getProjectById, createProjectTeam, updateProjectTeam, deleteProjectTeam, getAllEmployees, getAllTeams, getAllPos } from '../../services/api';
import './ProjectForm.css';

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    project_team_name: '',
    project_status: 'Planning',
    offshore_manager_id: '',
    onsite_manager_id: '',
    offshore_manager_allocation: 0,
    onsite_manager_allocation: 0,
    po_id: ''
  });
  const [teams, setTeams] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [allTeamsGlobal, setAllTeamsGlobal] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchAllTeamsGlobal();
    fetchPurchaseOrders();
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

  const fetchPurchaseOrders = async () => {
    try {
      const response = await getAllPos(1, 1000, 'All');
      setPurchaseOrders(response.data.data || []);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      toast.error('Failed to load purchase orders list');
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
        onsite_manager_id: projectData.onsite_manager_id || '',
        offshore_manager_allocation: projectData.offshore_manager_allocation || 0,
        onsite_manager_allocation: projectData.onsite_manager_allocation || 0,
        po_id: projectData.po_id || ''
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

  const handleDropdownChange = (name, value) => {
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
      offshore_team_lead_allocation: 0,
      onsite_team_lead_id: '',
      onsite_team_lead_allocation: 0,
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
          offshore_team_lead_allocation: team.offshore_team_lead_allocation || 0,
          onsite_team_lead_id: team.onsite_team_lead_id || null,
          onsite_team_lead_allocation: team.onsite_team_lead_allocation || 0
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

  // Dropdown options
  const projectStatusOptions = [
    { label: 'Planning', value: 'Planning' },
    { label: 'Active', value: 'Active' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  const offshoreManagerOptions = [
    { label: 'Select Offshore Manager', value: '' },
    ...employees
      .filter(emp => {
        // Filter by location and role
        if (emp.work_location !== 'Offshore' || emp.role_type !== 'Manager') {
          return false;
        }
        // Exclude if already 100% allocated, unless this manager is already selected
        if (emp.total_allocation >= 100 && emp.id !== formData.offshore_manager_id) {
          return false;
        }
        return true;
      })
      .map(emp => {
        const totalAllocation = emp.total_allocation || 0;
        const availableCapacity = 100 - totalAllocation;
        const label = totalAllocation > 0 && totalAllocation < 100
          ? `${emp.name} (${emp.sso || 'N/A'}) - ${availableCapacity}% available`
          : `${emp.name} (${emp.sso || 'N/A'})`;
        return {
          label: label,
          value: emp.id
        };
      })
  ];

  const onsiteManagerOptions = [
    { label: 'Select Onsite Manager', value: '' },
    ...employees
      .filter(emp => {
        // Filter by location and role
        if (emp.work_location !== 'Onsite' || emp.role_type !== 'Manager') {
          return false;
        }
        // Exclude if already 100% allocated, unless this manager is already selected
        if (emp.total_allocation >= 100 && emp.id !== formData.onsite_manager_id) {
          return false;
        }
        return true;
      })
      .map(emp => {
        const totalAllocation = emp.total_allocation || 0;
        const availableCapacity = 100 - totalAllocation;
        const label = totalAllocation > 0 && totalAllocation < 100
          ? `${emp.name} (${emp.sso || 'N/A'}) - ${availableCapacity}% available`
          : `${emp.name} (${emp.sso || 'N/A'})`;
        return {
          label: label,
          value: emp.id
        };
      })
  ];

  const purchaseOrderOptions = [
    { label: 'Select Purchase Order (Optional)', value: '' },
    ...purchaseOrders
      .filter(po => po.status === 'Active' || (formData.po_id && po.id === formData.po_id))
      .map(po => ({
        label: `${po.po_number} - ${po.po_owner_name}`,
        value: po.id
      }))
  ];

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
              <InputText
                id="project_team_name"
                name="project_team_name"
                value={formData.project_team_name}
                onChange={handleChange}
                className={errors.project_team_name ? 'p-invalid' : ''}
              />
              {errors.project_team_name && (
                <small className="p-error">{errors.project_team_name}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="project_status">Project Status</label>
              <Dropdown
                id="project_status"
                name="project_status"
                value={formData.project_status}
                options={projectStatusOptions}
                onChange={(e) => handleDropdownChange('project_status', e.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="po_id">Purchase Order</label>
              <Dropdown
                id="po_id"
                name="po_id"
                value={formData.po_id}
                options={purchaseOrderOptions}
                onChange={(e) => handleDropdownChange('po_id', e.value)}
                showClear
                filter
                filterPlaceholder="Search PO..."
                placeholder="Select Purchase Order (Optional)"
              />
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
                  .filter(emp => emp.work_location === 'Offshore' && emp.role_type === 'Manager')
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.sso || 'N/A'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="offshore_manager_allocation">Offshore Manager Allocation %</label>
              <InputNumber
                id="offshore_manager_allocation"
                name="offshore_manager_allocation"
                value={formData.offshore_manager_allocation}
                onValueChange={(e) => handleDropdownChange('offshore_manager_allocation', e.value)}
                min={0}
                max={100}
                suffix="%"
                showButtons
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
              />
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

            <div className="form-group">
              <label htmlFor="onsite_manager_allocation">Onsite Manager Allocation %</label>
              <InputNumber
                id="onsite_manager_allocation"
                name="onsite_manager_allocation"
                value={formData.onsite_manager_allocation}
                onValueChange={(e) => handleDropdownChange('onsite_manager_allocation', e.value)}
                min={0}
                max={100}
                suffix="%"
                showButtons
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
              />
            </div>
          </div>

             <div className='teamheader'>
              <h3>Teams</h3>
              <Button
                type="button"
                label="Add Team"
                icon="pi pi-plus"
                className="p-button-secondary"
                onClick={addTeam}
              />
            </div>
          <>


            {teams.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
                No teams added yet. Click "Add Team" to create one.
              </p>
            ) : (
              <div className="teams-list">
                {teams.map((team, index) => {
                  const offshoreTeamLeadOptions = [
                    { label: 'Select Offshore Team Lead', value: '' },
                    ...employees
                      .filter(emp => {
                        // Filter by location and role
                        if (emp.work_location !== 'Offshore' || emp.role_type !== 'Team Lead') {
                          return false;
                        }
                        // Exclude if already 100% allocated, unless this team lead is already selected
                        if (emp.total_allocation >= 100 && emp.id !== team.offshore_team_lead_id) {
                          return false;
                        }
                        return true;
                      })
                      .map(emp => {
                        const totalAllocation = emp.total_allocation || 0;
                        const availableCapacity = 100 - totalAllocation;
                        const label = totalAllocation > 0 && totalAllocation < 100
                          ? `${emp.name} (${emp.sso || 'N/A'}) - ${availableCapacity}% available`
                          : `${emp.name} (${emp.sso || 'N/A'})`;
                        return {
                          label: label,
                          value: emp.id
                        };
                      })
                  ];

                  const onsiteTeamLeadOptions = [
                    { label: 'Select Onsite Team Lead', value: '' },
                    ...employees
                      .filter(emp => {
                        // Filter by location and role
                        if (emp.work_location !== 'Onsite' || emp.role_type !== 'Team Lead') {
                          return false;
                        }
                        // Exclude if already 100% allocated, unless this team lead is already selected
                        if (emp.total_allocation >= 100 && emp.id !== team.onsite_team_lead_id) {
                          return false;
                        }
                        return true;
                      })
                      .map(emp => {
                        const totalAllocation = emp.total_allocation || 0;
                        const availableCapacity = 100 - totalAllocation;
                        const label = totalAllocation > 0 && totalAllocation < 100
                          ? `${emp.name} (${emp.sso || 'N/A'}) - ${availableCapacity}% available`
                          : `${emp.name} (${emp.sso || 'N/A'})`;
                        return {
                          label: label,
                          value: emp.id
                        };
                      })
                  ];

                  return (
                    <div key={index}  style={{ marginBottom: '15px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
                      <div className='teamheader'>
                        <h4 style={{ margin: 0, color: '#495057' }}>Team #{index + 1}</h4>
                        <Button
                          type="button"
                          label="Remove Team"
                          icon="pi pi-trash"
                          className="p-button-danger p-button-sm"
                          onClick={() => removeTeam(index)}
                        />
                      </div>

                      <div className="form-grid m-0" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 15px' }}>
                        <div className="form-group">
                          <label>Agile Board Name</label>
                          <InputText
                            value={team.agile_board_name}
                            onChange={(e) => updateTeam(index, 'agile_board_name', e.target.value)}
                            placeholder="Enter board name"
                          />
                        </div>
                        <div className="form-group">
                          <label>Agile Team JIRA Key</label>
                          <InputText
                            value={team.agile_team_jira_key || ''}
                            onChange={(e) => updateTeam(index, 'agile_team_jira_key', e.target.value)}
                            placeholder="e.g., PROJ-123"
                          />
                        </div>

                        <div className="form-group">
                          <label>Offshore Team Lead</label>
                          <Dropdown
                            value={team.offshore_team_lead_id || ''}
                            options={offshoreTeamLeadOptions}
                            onChange={(e) => updateTeam(index, 'offshore_team_lead_id', e.value)}
                            filter
                            showClear
                            placeholder="Select Offshore Team Lead"
                          />
                        </div>

                        <div className="form-group">
                          <label>Offshore Team Lead Allocation %</label>
                          <InputNumber
                            value={team.offshore_team_lead_allocation || 0}
                            onValueChange={(e) => updateTeam(index, 'offshore_team_lead_allocation', e.value)}
                            min={0}
                            max={100}
                            suffix="%"
                            showButtons
                            mode="decimal"
                            minFractionDigits={0}
                            maxFractionDigits={2}
                          />
                        </div>

                        <div className="form-group">
                          <label>Onsite Team Lead</label>
                          <Dropdown
                            value={team.onsite_team_lead_id || ''}
                            options={onsiteTeamLeadOptions}
                            onChange={(e) => updateTeam(index, 'onsite_team_lead_id', e.value)}
                            filter
                            showClear
                            placeholder="Select Onsite Team Lead"
                          />
                        </div>

                        <div className="form-group">
                          <label>Onsite Team Lead Allocation %</label>
                          <InputNumber
                            value={team.onsite_team_lead_allocation || 0}
                            onValueChange={(e) => updateTeam(index, 'onsite_team_lead_allocation', e.value)}
                            min={0}
                            max={100}
                            suffix="%"
                            showButtons
                            mode="decimal"
                            minFractionDigits={0}
                            maxFractionDigits={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>

          <div className="form-actions">
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={onClose}
            />
            <Button
              type="submit"
              label={submitting ? 'Saving...' : (project ? 'Update Project' : 'Create Project')}
              icon="pi pi-check"
              loading={submitting}
              disabled={submitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
