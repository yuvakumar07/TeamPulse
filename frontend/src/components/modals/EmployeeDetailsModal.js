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
        default: return null;
      }
    };
    return <Tag value={rowData.role_type || 'N/A'} severity={getSeverity(rowData.role_type)} />;
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
      <Column field="name" header="Name" sortable style={{ minWidth: '200px' }} />
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
