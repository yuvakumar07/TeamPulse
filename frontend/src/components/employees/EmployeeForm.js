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
import { createEmployee, updateEmployee, getAllProjects, getAllTeams, getEmployeeRoles, getLookupsByCategory } from '../../services/api';
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
  const [roles, setRoles] = useState([]); // Employee roles from lookup table
  const [roleTypeOptions, setRoleTypeOptions] = useState([]);
  const [attritionOptions, setAttritionOptions] = useState([]);
  const [workLocationOptions, setWorkLocationOptions] = useState([]);
  const [criticalityOptions, setCriticalityOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [visaTypeOptions, setVisaTypeOptions] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectAllocations, setProjectAllocations] = useState({}); // Deprecated - keeping for backward compatibility
  const [projectTeamSelections, setProjectTeamSelections] = useState({});
  const [projectTeamAllocations, setProjectTeamAllocations] = useState({}); // { projectId: { teamId: allocation% } }

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

  // Fetch all employee roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getEmployeeRoles();
        if (response.data.success) {
          setRoles(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load roles');
      }
    };
    fetchRoles();
  }, []);

  // Fetch all lookup values on component mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        // Fetch Role Type lookups
        const roleTypeResponse = await getLookupsByCategory('Role Type');
        if (roleTypeResponse.data.success) {
          setRoleTypeOptions(roleTypeResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }

        // Fetch Attrition lookups
        const attritionResponse = await getLookupsByCategory('Attrition');
        if (attritionResponse.data.success) {
          setAttritionOptions(attritionResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }

        // Fetch Work Location lookups
        const workLocationResponse = await getLookupsByCategory('Work Location');
        console.log(workLocationResponse.data.data, 'workLocationResponse.data')
        if (workLocationResponse.data.success) {
          setWorkLocationOptions(workLocationResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }

        // Fetch Criticality lookups
        const criticalityResponse = await getLookupsByCategory('Criticality');
        if (criticalityResponse.data.success) {
          setCriticalityOptions(criticalityResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }

        // Fetch Status lookups
        const statusResponse = await getLookupsByCategory('Status');
        if (statusResponse.data.success) {
          setStatusOptions(statusResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }

        // Fetch Visa Type lookups
        const visaTypeResponse = await getLookupsByCategory('Visa Type');
        if (visaTypeResponse.data.success) {
          setVisaTypeOptions(visaTypeResponse.data.data.map(item => ({
            label: item.type_name,
            value: item.type_name
          })));
        }
      } catch (error) {
        console.error('Error fetching lookups:', error);
        toast.error('Failed to load lookup values');
      }
    };
    fetchLookups();
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
      if (employee.project_assignments && employee.project_assignments.length > 0) {
        const projectIds = new Set();
        const teamSelections = {};
        const teamAllocations = {};

        employee.project_assignments.forEach(assignment => {
          const projectId = assignment.project_id;
          const teamId = assignment.team_id;
          const allocation = parseFloat(assignment.allocation_percentage) || 0;

          // Add project to selected projects
          projectIds.add(projectId);

          // If team is assigned
          if (teamId) {
            if (!teamSelections[projectId]) {
              teamSelections[projectId] = [];
            }
            teamSelections[projectId].push(teamId);

            if (!teamAllocations[projectId]) {
              teamAllocations[projectId] = {};
            }
            teamAllocations[projectId][teamId] = allocation;
          }
        });

        setSelectedProjects(Array.from(projectIds));
        setProjectTeamSelections(teamSelections);
        setProjectTeamAllocations(teamAllocations);
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
    // Ensure value is not null/undefined
    const inputValue = value || 0;

    // First, clamp individual value to 0-100 range
    const clampedValue = Math.min(100, Math.max(0, inputValue));

    // Calculate total allocation excluding the current project
    const otherProjectsTotal = Object.entries(projectAllocations)
      .filter(([id]) => parseInt(id) !== projectId)
      .reduce((sum, [, allocation]) => sum + (allocation || 0), 0);

    // Calculate maximum allowed for this project (never exceeds 100)
    const maxAllowed = Math.min(100, Math.max(0, 100 - otherProjectsTotal));

    // Check if new value would exceed 100% total
    const newTotal = otherProjectsTotal + clampedValue;
    if (newTotal > 100) {
      toast.warning(`Total allocation cannot exceed 100%. Maximum allowed for this project: ${maxAllowed}%`);
      // Use the maximum allowed value
      setProjectAllocations(prev => ({
        ...prev,
        [projectId]: maxAllowed
      }));
      return;
    }

    // Set the clamped value (0-100 range)
    setProjectAllocations(prev => ({
      ...prev,
      [projectId]: clampedValue
    }));
  };

  const handleTeamSelection = (projectId, teamIds) => {
    setProjectTeamSelections(prev => ({
      ...prev,
      [projectId]: teamIds // Now stores an array of team IDs
    }));

    // Initialize allocations for newly selected teams
    setProjectTeamAllocations(prev => {
      const newAllocations = { ...prev };
      if (!newAllocations[projectId]) {
        newAllocations[projectId] = {};
      }

      // Add new teams with 0 allocation
      teamIds.forEach(teamId => {
        if (!(teamId in newAllocations[projectId])) {
          newAllocations[projectId][teamId] = 0;
        }
      });

      // Remove teams that are no longer selected
      Object.keys(newAllocations[projectId]).forEach(teamId => {
        if (!teamIds.includes(parseInt(teamId))) {
          delete newAllocations[projectId][teamId];
        }
      });

      return newAllocations;
    });
  };

  const handleTeamAllocationChange = (projectId, teamId, value) => {
    // Ensure value is not null/undefined
    const inputValue = value || 0;

    // First, clamp individual value to 0-100 range
    const clampedValue = Math.min(100, Math.max(0, inputValue));

    // Calculate total allocation across ALL teams in ALL projects (excluding current team)
    let totalAllocation = 0;
    Object.entries(projectTeamAllocations).forEach(([pId, teams]) => {
      Object.entries(teams).forEach(([tId, allocation]) => {
        if (!(parseInt(pId) === projectId && parseInt(tId) === teamId)) {
          totalAllocation += allocation || 0;
        }
      });
    });

    // Calculate maximum allowed for this team
    const maxAllowed = Math.min(100, Math.max(0, 100 - totalAllocation));

    // Check if new value would exceed 100% total
    const newTotal = totalAllocation + clampedValue;
    if (newTotal > 100) {
      toast.warning(`Total allocation cannot exceed 100%. Maximum allowed for this team: ${maxAllowed}%`);
      // Use the maximum allowed value
      setProjectTeamAllocations(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          [teamId]: maxAllowed
        }
      }));
      return;
    }

    // Set the clamped value (0-100 range)
    setProjectTeamAllocations(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [teamId]: clampedValue
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Only validate visa fields if Work Location is Onsite
    if (formData.work_location === 'Onsite') {
      if (!formData.visa_type || formData.visa_type === 'None') {
        newErrors.visa_type = 'Visa Type is required';
      }
      if (!formData.current_visa_start_date) {
        newErrors.current_visa_start_date = 'Visa Start Date is required';
      }
      if (!formData.current_visa_end_date) {
        newErrors.current_visa_end_date = 'Visa End Date is required';
      }
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

    // Build projects array - create entries for each team with their allocation percentages
    const projectsArray = [];
    selectedProjects.forEach(projectId => {
      const selectedTeams = projectTeamSelections[projectId] || [];

      if (selectedTeams.length > 0) {
        // Create an entry for each selected team with their allocation percentage
        selectedTeams.forEach(teamId => {
          const allocation = projectTeamAllocations[projectId]?.[teamId] || 0;
          projectsArray.push({
            project_id: projectId,
            team_id: teamId,
            allocation_percentage: allocation
          });
        });
      } else {
        // No teams selected, create entry with null team_id and allocation set to 0
        projectsArray.push({
          project_id: projectId,
          team_id: null,
          allocation_percentage: 0
        });
      }
    });

    const dataToSubmit = {
      ...formData,
      joining_date: formData.joining_date ? formData.joining_date.toISOString().split('T')[0] : null,
      last_working_day: formData.last_working_day ? formData.last_working_day.toISOString().split('T')[0] : null,
      current_visa_start_date: formData.current_visa_start_date ? formData.current_visa_start_date.toISOString().split('T')[0] : null,
      current_visa_end_date: formData.current_visa_end_date ? formData.current_visa_end_date.toISOString().split('T')[0] : null,
      i94_expiry_date: formData.i94_expiry_date ? formData.i94_expiry_date.toISOString().split('T')[0] : null,
      passport_expiry_date: formData.passport_expiry_date ? formData.passport_expiry_date.toISOString().split('T')[0] : null,
      projects: projectsArray
    };

    try {
      if (employee) {
        await updateEmployee(employee.id, dataToSubmit);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(dataToSubmit);
        toast.success('Employee created successfully!');
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving employee:', err);
      console.error('Error response:', err.response?.data);
      console.error('Data submitted:', dataToSubmit);

      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to save employee');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-form-container p-fluid">
      <form onSubmit={handleSubmit}>
        <TabView>
          {/* Tab 1: Basic Information */}
          <TabPanel header="Basic Information" leftIcon="pi pi-user mr-2">
            <div className="formgrid grid">
              <div className="field col-12 md:col-3">
                <label htmlFor="sso">SSO</label>
                <InputText
                  id="sso"
                  value={formData.sso}
                  onChange={(e) => handleChange('sso', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="name">Name *</label>
                <InputText
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={classNames({ 'p-invalid': errors.name })}
                />
                {errors.name && <small className="p-error">{errors.name}</small>}
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
                <label htmlFor="role">Role</label>
                <Dropdown
                  id="role"
                  value={formData.role}
                  options={roles.map(r => ({ label: r.role_name, value: r.role_name }))}
                  onChange={(e) => handleChange('role', e.value)}
                  placeholder="Select a role"
                  filter
                  showClear
                  emptyMessage="No roles available"
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="role_type">Role Type</label>
                <Dropdown
                  id="role_type"
                  value={formData.role_type}
                  options={roleTypeOptions}
                  onChange={(e) => handleChange('role_type', e.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
                <label htmlFor="phone">Phone</label>
                <InputText
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-3">
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
                <label htmlFor="possible_candidate">Possible Candidate</label>
                <InputText
                  id="possible_candidate"
                  value={formData.possible_candidate}
                  onChange={(e) => handleChange('possible_candidate', e.target.value)}
                  placeholder="Replacement candidate name"
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

          
          <TabPanel header="Project Assignments" leftIcon="pi pi-building mr-2">
            <div className="formgrid grid">

              {/* Show managed projects for Managers */}
              {employee && formData.role_type === 'Manager' && employee.managed_projects && employee.managed_projects.length > 0 && (
                <div className="col-12 mb-3">
                  <div className="p-3" style={{ background: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 className="mt-0 mb-0" style={{ color: '#0066cc' }}>
                        <i className="pi pi-briefcase mr-2"></i>
                        Managed Projects
                      </h4>
                      {(() => {
                        // Calculate total manager allocation from all projects
                        const totalAllocation = employee.managed_projects.reduce((sum, project) => {
                          const offshoreAlloc = parseFloat(project.offshore_manager_allocation) || 0;
                          const onsiteAlloc = parseFloat(project.onsite_manager_allocation) || 0;
                          return sum + offshoreAlloc + onsiteAlloc;
                        }, 0);
                        return totalAllocation > 0 ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            backgroundColor: totalAllocation >= 100 ? '#fff3cd' : totalAllocation >= 80 ? '#ffe5b4' : '#d1ecf1',
                            color: totalAllocation >= 100 ? '#856404' : totalAllocation >= 80 ? '#996515' : '#0c5460'
                          }}>
                            Total: {totalAllocation.toFixed(1)}% allocated
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="grid">
                      {employee.managed_projects.map((project, idx) => {
                        const offshoreAlloc = parseFloat(project.offshore_manager_allocation) || 0;
                        const onsiteAlloc = parseFloat(project.onsite_manager_allocation) || 0;
                        const totalProjectAlloc = offshoreAlloc + onsiteAlloc;

                        return (
                          <div key={idx} className="col-12 md:col-6 mb-2">
                            <div className="p-2" style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontWeight: '600', color: '#323232', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{project.project_team_name}</span>
                                {totalProjectAlloc > 0 && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    backgroundColor: '#d1ecf1',
                                    color: '#0c5460'
                                  }}>
                                    {totalProjectAlloc}%
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#495057', marginLeft: '1rem' }}>
                                {project.offshore_manager_name && (
                                  <div style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <i className="pi pi-user mr-2" style={{ fontSize: '0.75rem', color: '#FFC500' }}></i>
                                      <strong>Offshore Manager:</strong> {project.offshore_manager_name}
                                    </div>
                                    {offshoreAlloc > 0 && (
                                      <span style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                        {offshoreAlloc}%
                                      </span>
                                    )}
                                  </div>
                                )}
                                {project.onsite_manager_name && (
                                  <div style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <i className="pi pi-user mr-2" style={{ fontSize: '0.75rem', color: '#FFC500' }}></i>
                                      <strong>Onsite Manager:</strong> {project.onsite_manager_name}
                                    </div>
                                    {onsiteAlloc > 0 && (
                                      <span style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                        {onsiteAlloc}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Show current project/team assignments for non-Managers */}
              {employee && formData.role_type !== 'Manager' && employee.project_assignments && employee.project_assignments.length > 0 && (
                <div className="col-12 mb-3">
                  <div className="p-3" style={{ background: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 className="mt-0 mb-0" style={{ color: '#0066cc' }}>
                        <i className="pi pi-briefcase mr-2"></i>
                        Current Project Assignments
                      </h4>
                      {(() => {
                        const totalAllocation = employee.project_assignments.reduce((sum, assignment) => {
                          return sum + (parseFloat(assignment.allocation_percentage) || 0);
                        }, 0);
                        return (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            backgroundColor: totalAllocation >= 100 ? '#fff3cd' : totalAllocation >= 80 ? '#ffe5b4' : '#d1ecf1',
                            color: totalAllocation >= 100 ? '#856404' : totalAllocation >= 80 ? '#996515' : '#0c5460'
                          }}>
                            Total: {totalAllocation.toFixed(1)}% allocated
                          </span>
                        );
                      })()}
                    </div>
                    <div className="grid">
                      {/* Group assignments by project */}
                      {(() => {
                        const projectGroups = {};
                        employee.project_assignments.forEach(assignment => {
                          if (!projectGroups[assignment.project_id]) {
                            projectGroups[assignment.project_id] = {
                              project_name: assignment.project_team_name,
                              offshore_manager_name: assignment.offshore_manager_name,
                              onsite_manager_name: assignment.onsite_manager_name,
                              teams: []
                            };
                          }
                          projectGroups[assignment.project_id].teams.push({
                            team_name: assignment.agile_board_name || 'Not Assigned',
                            allocation: assignment.allocation_percentage
                          });
                        });

                        return Object.values(projectGroups).map((projectGroup, idx) => (
                          <div key={idx} className="col-12 md:col-6 mb-2">
                            <div className="p-2" style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                              <div style={{ fontWeight: '600', color: '#323232', marginBottom: '0.5rem' }}>
                                {projectGroup.project_name}
                              </div>
                              {/* Display managers */}
                              <div style={{ fontSize: '0.85rem', color: '#495057', marginLeft: '1rem', marginBottom: '0.5rem' }}>
                                {projectGroup.offshore_manager_name && (
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    <i className="pi pi-user mr-2" style={{ fontSize: '0.75rem', color: '#FFC500' }}></i>
                                    <strong>Offshore Manager:</strong> {projectGroup.offshore_manager_name}
                                  </div>
                                )}
                                {projectGroup.onsite_manager_name && (
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    <i className="pi pi-user mr-2" style={{ fontSize: '0.75rem', color: '#FFC500' }}></i>
                                    <strong>Onsite Manager:</strong> {projectGroup.onsite_manager_name}
                                  </div>
                                )}
                              </div>
                              {/* Display teams with allocation */}
                              {projectGroup.teams.map((team, teamIdx) => (
                                <div key={teamIdx} style={{ fontSize: '0.9rem', color: '#6c757d', marginLeft: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div>
                                    <i className="pi pi-users mr-2" style={{ fontSize: '0.8rem' }}></i>
                                    {team.team_name}
                                  </div>
                                  {team.allocation > 0 && (
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      backgroundColor: '#d1ecf1',
                                      color: '#0c5460',
                                      marginLeft: '8px'
                                    }}>
                                      {team.allocation}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Projects - Hide for Manager role type */}
              {formData.role_type !== 'Manager' && (
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
              )}

              {formData.role_type !== 'Manager' && selectedProjects.length > 0 && (
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
                              <div className="col-12 mb-2">
                                <label htmlFor={`team-${projectId}`} className="block mb-2">
                                  Select Teams
                                </label>
                                <MultiSelect
                                  id={`team-${projectId}`}
                                  value={projectTeamSelections[projectId] || []}
                                  options={projectTeams.map(team => ({
                                    label: team.agile_board_name,
                                    value: team.id
                                  }))}
                                  onChange={(e) => handleTeamSelection(projectId, e.value)}
                                  placeholder="Select agile boards"
                                  className="w-full"
                                  display="chip"
                                  filter
                                />
                                {projectTeams.length === 0 && (
                                  <small className="text-muted">No teams available for this project</small>
                                )}
                                <small className="text-muted block mt-1">
                                  Select one or more teams to assign this employee
                                </small>
                              </div>

                              {/* Show allocation inputs for selected teams */}
                              {projectTeamSelections[projectId] && projectTeamSelections[projectId].length > 0 && (
                                <div className="col-12">
                                  <h6 className="mb-2" style={{ color: '#495057' }}>Team Allocations (%)</h6>
                                  <div className="grid">
                                    {projectTeamSelections[projectId].map(teamId => {
                                      const team = projectTeams.find(t => t.id === teamId);
                                      const currentAllocation = projectTeamAllocations[projectId]?.[teamId] || 0;

                                      return team ? (
                                        <div key={teamId} className="col-12 md:col-6 mb-2">
                                          <label htmlFor={`allocation-${projectId}-${teamId}`} className="block mb-1" style={{ fontSize: '0.9rem' }}>
                                            <i className="pi pi-users mr-2" style={{ fontSize: '0.8rem' }}></i>
                                            {team.agile_board_name}
                                          </label>
                                          <InputNumber
                                            id={`allocation-${projectId}-${teamId}`}
                                            value={currentAllocation}
                                            onValueChange={(e) => handleTeamAllocationChange(projectId, teamId, e.value)}
                                            min={0}
                                            max={100}
                                            suffix="%"
                                            showButtons
                                            mode="decimal"
                                            minFractionDigits={0}
                                            maxFractionDigits={2}
                                            className="w-full"
                                            placeholder="Enter allocation %"
                                          />
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                  <small className="text-muted block mt-2">
                                    <i className="pi pi-info-circle mr-1"></i>
                                    Total allocation across all teams cannot exceed 100%
                                  </small>
                                </div>
                              )}

                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>                    
                  </div>
                </div>
              )}
              
            </div>
          </TabPanel>          

          {/* Tab 4: Visa & Immigration - Only show if Work Location is Onsite */}
          {formData.work_location === 'Onsite' && (
            <TabPanel header="Visa & Immigration" leftIcon="pi pi-id-card mr-2">
              <div className="formgrid grid">
                <div className="field col-12 md:col-3">
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

                <div className="field col-12 md:col-3">
                  <label htmlFor="sponsor_company">Sponsor Company</label>
                  <InputText
                    id="sponsor_company"
                    value={formData.sponsor_company}
                    onChange={(e) => handleChange('sponsor_company', e.target.value)}
                  />
                </div>

                <div className="field col-12 md:col-3">
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

                <div className="field col-12 md:col-3">
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

                <div className="field col-12 md:col-3">
                  <label htmlFor="i94_expiry_date">I-94 Expiry Date</label>
                  <Calendar
                    id="i94_expiry_date"
                    value={formData.i94_expiry_date}
                    onChange={(e) => handleChange('i94_expiry_date', e.value)}
                    dateFormat="yy-mm-dd"
                    showIcon
                  />
                </div>

                <div className="field col-12 md:col-3">
                  <label htmlFor="passport_number">Passport Number</label>
                  <InputText
                    id="passport_number"
                    value={formData.passport_number}
                    onChange={(e) => handleChange('passport_number', e.target.value)}
                  />
                </div>

                <div className="field col-12 md:col-3">
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
          )}
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
