import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { createEmployee, updateEmployee, getAllProjects, getAllTeams } from '../../services/api';
import './EmployeeForm.css';

const EmployeeForm = ({ employee, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    sso: '',
    name: '',
    role: '',
    role_type: 'DEV',
    phone: '',
    location: '',
    criticality: 'Medium',
    status: 'Active',
    skills: '',
    joining_date: null,
    last_working_day: null,
    possible_candidate: '',
    asset_id: '',
    asset_return_id: '',
    comments: '',
    attrition: 'No',
    notice_period_days: null,
    work_location: 'Onsite',
    offshore_manager_id: null,
    onsite_manager_id: null,
    visa_type: 'None',
    current_visa_start_date: null,
    current_visa_end_date: null,
    i94_expiry_date: null,
    passport_number: '',
    passport_expiry_date: null,
    sponsor_company: '',
    visa_notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectAllocations, setProjectAllocations] = useState({});
  const [projectTeamSelections, setProjectTeamSelections] = useState({});

  // Fetch all projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getAllProjects(1, 1000, null, 'project_team_name', 'ASC');
        if (response.data.success) {
          setProjects(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      }
    };
    fetchProjects();
  }, []);

  // Fetch all teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await getAllTeams();
        if (response.data.success) {
          setAllTeams(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        sso: employee.sso || '',
        name: employee.name || '',
        role: employee.role || '',
        role_type: employee.role_type || 'DEV',
        phone: employee.phone || '',
        location: employee.location || '',
        criticality: employee.criticality || 'Medium',
        status: employee.status || 'Active',
        skills: employee.skills || '',
        joining_date: employee.joining_date ? new Date(employee.joining_date) : null,
        last_working_day: employee.last_working_day ? new Date(employee.last_working_day) : null,
        possible_candidate: employee.possible_candidate || '',
        asset_id: employee.asset_id || '',
        asset_return_id: employee.asset_return_id || '',
        comments: employee.comments || '',
        attrition: employee.attrition || 'No',
        notice_period_days: employee.notice_period_days || null,
        work_location: employee.work_location || 'Onsite',
        offshore_manager_id: employee.offshore_manager_id || null,
        onsite_manager_id: employee.onsite_manager_id || null,
        visa_type: employee.visa_type || 'None',
        current_visa_start_date: employee.current_visa_start_date ? new Date(employee.current_visa_start_date) : null,
        current_visa_end_date: employee.current_visa_end_date ? new Date(employee.current_visa_end_date) : null,
        i94_expiry_date: employee.i94_expiry_date ? new Date(employee.i94_expiry_date) : null,
        passport_number: employee.passport_number || '',
        passport_expiry_date: employee.passport_expiry_date ? new Date(employee.passport_expiry_date) : null,
        sponsor_company: employee.sponsor_company || '',
        visa_notes: employee.visa_notes || ''
      });

      // Parse employee's current project assignments
      if (employee.allocated_projects) {
        const projectAssignments = employee.allocated_projects.split('||');
        const allocations = {};
        const projectIds = [];

        projectAssignments.forEach(assignment => {
          const [projectName, allocationPercentage] = assignment.split(':');
          setTimeout(() => {
            const project = projects.find(p => p.project_team_name === projectName);
            if (project) {
              projectIds.push(project.id);
              allocations[project.id] = parseFloat(allocationPercentage) || 0;
            }
          }, 100);
        });

        setTimeout(() => {
          setSelectedProjects(projectIds);
          setProjectAllocations(allocations);
        }, 150);
      }
    }
  }, [employee, projects]);

  const handleChange = (name, value) => {
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

  const handleProjectSelection = (projectIds) => {
    setSelectedProjects(projectIds);
    const newAllocations = { ...projectAllocations };
    projectIds.forEach(id => {
      if (!(id in newAllocations)) {
        newAllocations[id] = 0;
      }
    });
    Object.keys(newAllocations).forEach(id => {
      if (!projectIds.includes(parseInt(id))) {
        delete newAllocations[id];
      }
    });
    setProjectAllocations(newAllocations);
  };

  const handleAllocationChange = (projectId, value) => {
    setProjectAllocations(prev => ({
      ...prev,
      [projectId]: value || 0
    }));
  };

  const handleTeamSelection = (projectId, teamId) => {
    setProjectTeamSelections(prev => ({
      ...prev,
      [projectId]: teamId
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.visa_type || formData.visa_type === 'None') {
      newErrors.visa_type = 'Visa Type is required';
    }
    if (!formData.current_visa_start_date) {
      newErrors.current_visa_start_date = 'Visa Start Date is required';
    }
    if (!formData.current_visa_end_date) {
      newErrors.current_visa_end_date = 'Visa End Date is required';
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
        joining_date: formData.joining_date ? formData.joining_date.toISOString().split('T')[0] : null,
        last_working_day: formData.last_working_day ? formData.last_working_day.toISOString().split('T')[0] : null,
        current_visa_start_date: formData.current_visa_start_date ? formData.current_visa_start_date.toISOString().split('T')[0] : null,
        current_visa_end_date: formData.current_visa_end_date ? formData.current_visa_end_date.toISOString().split('T')[0] : null,
        i94_expiry_date: formData.i94_expiry_date ? formData.i94_expiry_date.toISOString().split('T')[0] : null,
        passport_expiry_date: formData.passport_expiry_date ? formData.passport_expiry_date.toISOString().split('T')[0] : null,
        projects: selectedProjects.map(projectId => ({
          project_id: projectId,
          team_id: projectTeamSelections[projectId] || null,
          allocation_percentage: projectAllocations[projectId] || 0
        }))
      };

      if (employee) {
        await updateEmployee(employee.id, dataToSubmit);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(dataToSubmit);
        toast.success('Employee created successfully!');
      }
      onSuccess();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to save employee');
      }
      console.error('Error saving employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const roleTypeOptions = [
    { label: 'DEV', value: 'DEV' },
    { label: 'QA', value: 'QA' }
  ];

  const criticalityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'On Leave', value: 'On Leave' },
    { label: 'Terminated', value: 'Terminated' }
  ];

  const attritionOptions = [
    { label: 'No', value: 'No' },
    { label: 'Yes', value: 'Yes' },
    { label: 'At Risk', value: 'At Risk' }
  ];

  const workLocationOptions = [
    { label: 'Onsite', value: 'Onsite' },
    { label: 'Offsite', value: 'Offsite' }
  ];

  const visaTypeOptions = [
    { label: 'None', value: 'None' },
    { label: 'H1B', value: 'H1B' },
    { label: 'L1', value: 'L1' },
    { label: 'L2', value: 'L2' },
    { label: 'Green Card', value: 'Green Card' },
    { label: 'US Citizen', value: 'US Citizen' },
    { label: 'Other', value: 'Other' }
  ];

  return (
    <div className="employee-form-container p-fluid">
      <form onSubmit={handleSubmit}>
        <TabView>
          {/* Tab 1: Basic Information */}
          <TabPanel header="Basic Information" leftIcon="pi pi-user mr-2">
            <div className="formgrid grid">
              <div className="field col-12 md:col-4">
                <label htmlFor="sso">SSO</label>
                <InputText
                  id="sso"
                  value={formData.sso}
                  onChange={(e) => handleChange('sso', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="name">Name *</label>
                <InputText
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={classNames({ 'p-invalid': errors.name })}
                />
                {errors.name && <small className="p-error">{errors.name}</small>}
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="role">Role</label>
                <InputText
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="role_type">Role Type</label>
                <Dropdown
                  id="role_type"
                  value={formData.role_type}
                  options={roleTypeOptions}
                  onChange={(e) => handleChange('role_type', e.value)}
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="phone">Phone</label>
                <InputText
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-4">
                <label htmlFor="location">Location</label>
                <InputText
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>

              <div className="field col-12">
                <label htmlFor="skills">Skills</label>
                <InputTextarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  rows={3}
                  placeholder="Enter skills separated by commas"
                />
              </div>
            </div>
          </TabPanel>

          {/* Tab 2: Employment Details */}
          <TabPanel header="Employment Details" leftIcon="pi pi-briefcase mr-2">
            <div className="formgrid grid">
              <div className="field col-12 md:col-3">
                <label htmlFor="joining_date">Joining Date</label>
                <Calendar
                  id="joining_date"
                  value={formData.joining_date}
                  onChange={(e) => handleChange('joining_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                  placeholder="Select joining date"
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="last_working_day">Last Working Day</label>
                <Calendar
                  id="last_working_day"
                  value={formData.last_working_day}
                  onChange={(e) => handleChange('last_working_day', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="status">Status</label>
                <Dropdown
                  id="status"
                  value={formData.status}
                  options={statusOptions}
                  onChange={(e) => handleChange('status', e.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="criticality">Criticality</label>
                <Dropdown
                  id="criticality"
                  value={formData.criticality}
                  options={criticalityOptions}
                  onChange={(e) => handleChange('criticality', e.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="attrition">Attrition</label>
                <Dropdown
                  id="attrition"
                  value={formData.attrition}
                  options={attritionOptions}
                  onChange={(e) => handleChange('attrition', e.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="notice_period_days">Notice Period Days</label>
                <InputNumber
                  id="notice_period_days"
                  value={formData.notice_period_days}
                  onValueChange={(e) => handleChange('notice_period_days', e.value)}
                  min={0}
                  max={365}
                  suffix=" days"
                  placeholder="e.g., 30, 60, 90"
                  useGrouping={false}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="work_location">Work Location</label>
                <Dropdown
                  id="work_location"
                  value={formData.work_location}
                  options={workLocationOptions}
                  onChange={(e) => handleChange('work_location', e.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="possible_candidate">Possible Candidate</label>
                <InputText
                  id="possible_candidate"
                  value={formData.possible_candidate}
                  onChange={(e) => handleChange('possible_candidate', e.target.value)}
                  placeholder="Replacement candidate name"
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="offshore_manager_id">Offshore Manager ID</label>
                <InputNumber
                  id="offshore_manager_id"
                  value={formData.offshore_manager_id}
                  onValueChange={(e) => handleChange('offshore_manager_id', e.value)}
                  useGrouping={false}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="onsite_manager_id">Onsite Manager ID</label>
                <InputNumber
                  id="onsite_manager_id"
                  value={formData.onsite_manager_id}
                  onValueChange={(e) => handleChange('onsite_manager_id', e.value)}
                  useGrouping={false}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="asset_id">Asset ID</label>
                <InputText
                  id="asset_id"
                  value={formData.asset_id}
                  onChange={(e) => handleChange('asset_id', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="asset_return_id">Asset Return ID</label>
                <InputText
                  id="asset_return_id"
                  value={formData.asset_return_id}
                  onChange={(e) => handleChange('asset_return_id', e.target.value)}
                />
              </div>

              <div className="field col-12">
                <label htmlFor="comments">Comments</label>
                <InputTextarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  placeholder="Additional comments or notes"
                />
              </div>
            </div>
          </TabPanel>

          {/* Tab 3: Project Assignments */}
          <TabPanel header="Project Assignments" leftIcon="pi pi-building mr-2">
            <div className="formgrid grid">

              <div className="field col-12">
                <label htmlFor="projects">Assign Projects</label>
                <MultiSelect
                  id="projects"
                  value={selectedProjects}
                  options={projects.map(p => ({ label: p.project_team_name, value: p.id }))}
                  onChange={(e) => handleProjectSelection(e.value)}
                  placeholder="Select projects to assign"
                  display="chip"
                  filter
                />
              </div>

              {selectedProjects.length > 0 && (
                <div className="col-12">
                  <div className="p-3" style={{ background: '#f8f9fa', borderRadius: '6px' }}>
                    <h4 className="mt-0 mb-3">Project & Team Assignments</h4>
                    <div className="grid">
                      {selectedProjects.map(projectId => {
                        const project = projects.find(p => p.id === projectId);
                        const projectTeams = allTeams.filter(team => team.project_id === projectId);

                        return project ? (
                          <div key={projectId} className="col-12 mb-3" style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '1rem' }}>
                            <h5 className="mb-2" style={{ color: '#495057' }}>
                              <i className="pi pi-briefcase mr-2"></i>
                              {project.project_team_name}
                            </h5>

                            <div className="grid">
                              <div className="col-12 md:col-6 mb-2">
                                <label htmlFor={`team-${projectId}`} className="block mb-2">
                                  Agile Board Name
                                </label>
                                <Dropdown
                                  id={`team-${projectId}`}
                                  value={projectTeamSelections[projectId] || null}
                                  options={[
                                    { label: 'No Team (Allocated Only)', value: null },
                                    ...projectTeams.map(team => ({
                                      label: team.agile_board_name,
                                      value: team.id
                                    }))
                                  ]}
                                  onChange={(e) => handleTeamSelection(projectId, e.value)}
                                  placeholder="Select agile board"
                                  className="w-full"
                                />
                                {projectTeams.length === 0 && (
                                  <small className="text-muted">No teams available for this project</small>
                                )}
                              </div>

                              <div className="col-12 md:col-6 mb-2">
                                <label htmlFor={`allocation-${projectId}`} className="block mb-2">
                                  Allocation Percentage
                                </label>
                                <InputNumber
                                  id={`allocation-${projectId}`}
                                  value={projectAllocations[projectId] || 0}
                                  onValueChange={(e) => handleAllocationChange(projectId, e.value)}
                                  suffix="%"
                                  min={0}
                                  max={100}
                                  showButtons
                                  buttonLayout="horizontal"
                                  step={5}
                                  incrementButtonIcon="pi pi-plus"
                                  decrementButtonIcon="pi pi-minus"
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <div className="mt-3 p-2" style={{ background: '#fff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                      <strong>Total Allocation: </strong>
                      <span style={{
                        color: Object.values(projectAllocations).reduce((sum, val) => sum + (val || 0), 0) > 100 ? '#dc3545' : '#28a745',
                        fontWeight: 'bold'
                      }}>
                        {Object.values(projectAllocations).reduce((sum, val) => sum + (val || 0), 0)}%
                      </span>
                      {Object.values(projectAllocations).reduce((sum, val) => sum + (val || 0), 0) > 100 && (
                        <span className="ml-2" style={{ color: '#dc3545' }}>
                          <i className="pi pi-exclamation-triangle mr-1"></i>
                          Over-allocated!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Tab 4: Visa & Immigration */}
          <TabPanel header="Visa & Immigration" leftIcon="pi pi-id-card mr-2">
            <div className="formgrid grid">
              <div className="field col-12 md:col-6">
                <label htmlFor="visa_type">Visa Type *</label>
                <Dropdown
                  id="visa_type"
                  value={formData.visa_type}
                  options={visaTypeOptions}
                  onChange={(e) => handleChange('visa_type', e.value)}
                  className={classNames({ 'p-invalid': errors.visa_type })}
                />
                {errors.visa_type && <small className="p-error">{errors.visa_type}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="sponsor_company">Sponsor Company</label>
                <InputText
                  id="sponsor_company"
                  value={formData.sponsor_company}
                  onChange={(e) => handleChange('sponsor_company', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="current_visa_start_date">Visa Start Date *</label>
                <Calendar
                  id="current_visa_start_date"
                  value={formData.current_visa_start_date}
                  onChange={(e) => handleChange('current_visa_start_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                  className={classNames({ 'p-invalid': errors.current_visa_start_date })}
                />
                {errors.current_visa_start_date && <small className="p-error">{errors.current_visa_start_date}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="current_visa_end_date">Visa End Date *</label>
                <Calendar
                  id="current_visa_end_date"
                  value={formData.current_visa_end_date}
                  onChange={(e) => handleChange('current_visa_end_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                  className={classNames({ 'p-invalid': errors.current_visa_end_date })}
                />
                {errors.current_visa_end_date && <small className="p-error">{errors.current_visa_end_date}</small>}
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="i94_expiry_date">I-94 Expiry Date</label>
                <Calendar
                  id="i94_expiry_date"
                  value={formData.i94_expiry_date}
                  onChange={(e) => handleChange('i94_expiry_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="passport_number">Passport Number</label>
                <InputText
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleChange('passport_number', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="passport_expiry_date">Passport Expiry Date</label>
                <Calendar
                  id="passport_expiry_date"
                  value={formData.passport_expiry_date}
                  onChange={(e) => handleChange('passport_expiry_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12">
                <label htmlFor="visa_notes">Visa Notes</label>
                <InputTextarea
                  id="visa_notes"
                  value={formData.visa_notes}
                  onChange={(e) => handleChange('visa_notes', e.target.value)}
                  rows={3}
                  placeholder="Additional visa-related notes"
                />
              </div>
            </div>
          </TabPanel>
        </TabView>

        {/* Form Actions */}
        <div className="form-actions mt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={onCancel}
            className="p-button-secondary"
            type="button"
          />
          <Button
            label="Save"
            icon="pi pi-check"
            type="submit"
            loading={submitting}
          />
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
