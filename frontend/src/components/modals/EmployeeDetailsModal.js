import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { TabView, TabPanel } from 'primereact/tabview';
import { getProjectById } from '../../services/api';
import './EmployeeDetailsModal.css';

const EmployeeDetailsModal = ({ projectId, projectName, isOpen, onClose }) => {
  const [teams, setTeams] = useState([]);
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
    }
  }, [isOpen, projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProjectById(projectId);
      setProjectData(response.data.data);
      setTeams(response.data.data.teams || []);
      setAllocatedEmployees(response.data.data.allocated_employees || []);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Assigned employees (employees assigned to specific teams)
  const assignedEmployees = teams.flatMap(team =>
    (team.employees || []).map(emp => ({
      ...emp,
      team_name: team.agile_board_name,
      team_jira_key: team.agile_team_jira_key,
      assignment_type: 'Assigned to Team'
    }))
  );

  // Allocated employees (employees allocated to project but not assigned to teams)
  const allocatedOnly = allocatedEmployees.map(emp => ({
    ...emp,
    team_name: 'Not Assigned',
    team_jira_key: null,
    assignment_type: 'Allocated Only'
  }));

  // All employees combined
  const allEmployees = [...assignedEmployees, ...allocatedOnly];

  // Use backend's DISTINCT count for unique employees
  const totalUniqueEmployees = projectData?.total_employees || 0;
  const totalAssignments = allEmployees.length;
  const totalAllocatedOnly = allocatedOnly.length;
  const totalAssigned = assignedEmployees.length;

  // Column templates
  const roleTypeBodyTemplate = (rowData) => {
    const getSeverity = (roleType) => {
      switch (roleType) {
        case 'Onsite': return 'success';
        case 'Offshore': return 'info';
        case 'Contractor': return 'warning';
        case 'Team Lead': return 'warning';
        default: return null;
      }
    };
    return <Tag value={rowData.role_type || 'N/A'} severity={getSeverity(rowData.role_type)} />;
  };

  const nameBodyTemplate = (rowData) => {
    return (
      <div>
        <div style={{ fontWeight: rowData.is_team_lead ? '600' : 'normal' }}>
          {rowData.is_team_lead && (
            <i className="pi pi-star-fill" style={{ color: '#ffc107', marginRight: '0.5rem' }} title={rowData.team_lead_type}></i>
          )}
          {rowData.name}
        </div>
        {rowData.is_team_lead && (
          <small style={{ color: '#856404', fontStyle: 'italic' }}>
            {rowData.team_lead_type}
          </small>
        )}
      </div>
    );
  };

  const allocationBodyTemplate = (rowData) => {
    const allocation = parseFloat(rowData.allocation_percentage || 0);
    const getSeverity = () => {
      if (allocation > 100) return 'danger';
      if (allocation === 100) return 'success';
      if (allocation >= 75) return 'info';
      return 'warning';
    };
    return <Tag value={`${allocation.toFixed(2)}%`} severity={getSeverity()} />;
  };

  const teamBodyTemplate = (rowData) => {
    return (
      <div>
        <div>{rowData.team_name}</div>
        {rowData.team_jira_key && (
          <small style={{ color: '#6c757d' }}>JIRA: {rowData.team_jira_key}</small>
        )}
      </div>
    );
  };

  const assignmentTypeBodyTemplate = (rowData) => {
    const getSeverity = () => {
      return rowData.assignment_type === 'Assigned to Team' ? 'success' : 'warning';
    };
    return <Tag value={rowData.assignment_type} severity={getSeverity()} />;
  };

  const getHeader = (title, count) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <strong>{title}: {count}</strong>
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search employees..."
          style={{ width: '250px' }}
        />
      </span>
    </div>
  );

  const allHeader = getHeader('Total Employees', totalAssignments);
  const assignedHeader = getHeader('Assigned to Teams', totalAssigned);
  const allocatedHeader = getHeader('Allocated Only', totalAllocatedOnly);

  const renderDataTable = (data, header) => (
    <DataTable
      value={data}
      dataKey="id"
      paginator={data.length > 10}
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      globalFilter={globalFilter}
      header={header}
      emptyMessage="No employees found"
      stripedRows
      showGridlines
      responsiveLayout="scroll"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Employees"
    >
      <Column field="sso" header="SSO" sortable style={{ minWidth: '100px' }} />
      <Column field="name" header="Name" body={nameBodyTemplate} sortable style={{ minWidth: '200px' }} />
      <Column field="role" header="Role" sortable style={{ minWidth: '150px' }} />
      <Column field="role_type" header="Role Type" body={roleTypeBodyTemplate} sortable style={{ minWidth: '120px' }} />
      <Column field="location" header="Location" sortable style={{ minWidth: '120px' }} />
      <Column field="team_name" header="Team" body={teamBodyTemplate} sortable style={{ minWidth: '180px' }} />
      <Column field="assignment_type" header="Status" body={assignmentTypeBodyTemplate} sortable style={{ minWidth: '150px' }} />
      <Column field="allocation_percentage" header="Allocation" body={allocationBodyTemplate} sortable style={{ minWidth: '120px' }} />
    </DataTable>
  );

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header={`Project Details: ${projectName}`}
      style={{ width: '90vw', maxWidth: '1400px' }}
      modal
      className="employee-details-modal"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem' }}></i>
          <p>Loading project details...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
          <i className="pi pi-exclamation-circle" style={{ fontSize: '2rem' }}></i>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Project Managers Section */}
          {(projectData?.managers?.offshore_manager || projectData?.managers?.onsite_manager) && (
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '6px', border: '1px solid #b3d9e8' }}>
              <strong style={{ fontSize: '1.1rem', color: '#0066cc' }}>Project Managers</strong>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {projectData.managers.offshore_manager && (
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <div style={{ fontWeight: '600', color: '#17a2b8', marginBottom: '0.25rem' }}>
                      <i className="pi pi-globe" style={{ marginRight: '0.5rem' }}></i>
                      Offshore Manager
                    </div>
                    <div style={{ marginLeft: '1.5rem' }}>
                      <div><strong>{projectData.managers.offshore_manager.name}</strong></div>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        SSO: {projectData.managers.offshore_manager.sso} | Role: {projectData.managers.offshore_manager.role}
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        Allocation: <Tag value={`${projectData.managers.offshore_manager.allocation}%`} severity="info" />
                      </div>
                    </div>
                  </div>
                )}
                {projectData.managers.onsite_manager && (
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <div style={{ fontWeight: '600', color: '#28a745', marginBottom: '0.25rem' }}>
                      <i className="pi pi-building" style={{ marginRight: '0.5rem' }}></i>
                      Onsite Manager
                    </div>
                    <div style={{ marginLeft: '1.5rem' }}>
                      <div><strong>{projectData.managers.onsite_manager.name}</strong></div>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        SSO: {projectData.managers.onsite_manager.sso} | Role: {projectData.managers.onsite_manager.role}
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>
                        Allocation: <Tag value={`${projectData.managers.onsite_manager.allocation}%`} severity="success" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <strong>Summary:</strong>{' '}
            <span style={{ marginLeft: '0.5rem' }}>
              Unique Employees: <strong>{totalUniqueEmployees}</strong>
            </span>
            <span style={{ marginLeft: '1.5rem' }}>
              Assigned to Teams: <Tag value={totalAssigned} severity="success" />
            </span>
            <span style={{ marginLeft: '1rem' }}>
              Allocated Only: <Tag value={totalAllocatedOnly} severity="warning" />
            </span>
          </div>

          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            <TabPanel header={`All Employees (${totalAssignments})`}>
              {allEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  <i className="pi pi-info-circle" style={{ fontSize: '2rem' }}></i>
                  <p>No employees allocated to this project</p>
                </div>
              ) : (
                renderDataTable(allEmployees, allHeader)
              )}
            </TabPanel>

            <TabPanel header={`By Team (${teams.length})`}>
              {teams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  <i className="pi pi-info-circle" style={{ fontSize: '2rem' }}></i>
                  <p>No teams created for this project</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {teams.map((team, index) => (
                    <div key={team.id} style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fff'
                    }}>
                      {/* Team Header */}
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#495057' }}>
                              <i className="pi pi-users" style={{ marginRight: '0.5rem' }}></i>
                              {team.agile_board_name}
                            </h4>
                            {team.agile_team_jira_key && (
                              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                JIRA Key: {team.agile_team_jira_key}
                              </div>
                            )}
                          </div>
                          <div>
                            <Tag value={`${team.employees?.length || 0} employees`} severity="info" />
                          </div>
                        </div>

                        {/* Team Leads Section */}
                        {(team.team_leads?.offshore_team_lead || team.team_leads?.onsite_team_lead) && (
                          <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#fff3cd',
                            borderRadius: '6px',
                            border: '1px solid #ffeaa7'
                          }}>
                            <strong style={{ color: '#856404', fontSize: '0.95rem' }}>
                              <i className="pi pi-star" style={{ marginRight: '0.5rem' }}></i>
                              Team Leads
                            </strong>
                            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              {team.team_leads.offshore_team_lead && (
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                  <div style={{ fontWeight: '600', color: '#17a2b8', fontSize: '0.9rem' }}>
                                    <i className="pi pi-globe" style={{ marginRight: '0.5rem' }}></i>
                                    Offshore Team Lead
                                  </div>
                                  <div style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                                    <div><strong>{team.team_leads.offshore_team_lead.name}</strong></div>
                                    <div style={{ color: '#6c757d' }}>
                                      {team.team_leads.offshore_team_lead.sso} | {team.team_leads.offshore_team_lead.role}
                                    </div>
                                    <div>
                                      Allocation: <Tag value={`${team.team_leads.offshore_team_lead.allocation}%`} severity="info" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {team.team_leads.onsite_team_lead && (
                                <div style={{ flex: '1', minWidth: '200px' }}>
                                  <div style={{ fontWeight: '600', color: '#28a745', fontSize: '0.9rem' }}>
                                    <i className="pi pi-building" style={{ marginRight: '0.5rem' }}></i>
                                    Onsite Team Lead
                                  </div>
                                  <div style={{ marginLeft: '1.5rem', fontSize: '0.9rem' }}>
                                    <div><strong>{team.team_leads.onsite_team_lead.name}</strong></div>
                                    <div style={{ color: '#6c757d' }}>
                                      {team.team_leads.onsite_team_lead.sso} | {team.team_leads.onsite_team_lead.role}
                                    </div>
                                    <div>
                                      Allocation: <Tag value={`${team.team_leads.onsite_team_lead.allocation}%`} severity="success" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team Employees */}
                      <div style={{ padding: '1rem' }}>
                        {!team.employees || team.employees.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: '#6c757d' }}>
                            <i className="pi pi-info-circle"></i> No employees assigned to this team
                          </div>
                        ) : (
                          <DataTable
                            value={team.employees}
                            dataKey="id"
                            stripedRows
                            showGridlines
                            responsiveLayout="scroll"
                            emptyMessage="No employees in this team"
                          >
                            <Column field="sso" header="SSO" sortable style={{ minWidth: '100px' }} />
                            <Column field="name" header="Name" body={nameBodyTemplate} sortable style={{ minWidth: '200px' }} />
                            <Column field="role" header="Role" sortable style={{ minWidth: '150px' }} />
                            <Column field="role_type" header="Role Type" body={roleTypeBodyTemplate} sortable style={{ minWidth: '120px' }} />
                            <Column field="location" header="Location" sortable style={{ minWidth: '120px' }} />
                            <Column field="allocation_percentage" header="Allocation" body={allocationBodyTemplate} sortable style={{ minWidth: '120px' }} />
                          </DataTable>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>

            <TabPanel header={`Assigned to Teams (${totalAssigned})`}>
              {assignedEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  <i className="pi pi-info-circle" style={{ fontSize: '2rem' }}></i>
                  <p>No employees assigned to teams yet</p>
                </div>
              ) : (
                renderDataTable(assignedEmployees, assignedHeader)
              )}
            </TabPanel>

            <TabPanel header={`Allocated Only (${totalAllocatedOnly})`}>
              {allocatedOnly.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  <i className="pi pi-info-circle" style={{ fontSize: '2rem' }}></i>
                  <p>All employees are assigned to teams</p>
                </div>
              ) : (
                renderDataTable(allocatedOnly, allocatedHeader)
              )}
            </TabPanel>
          </TabView>
        </>
      )}
    </Dialog>
  );
};

export default EmployeeDetailsModal;
