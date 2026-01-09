import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { getAllEmployees, deleteEmployee, getAllProjects, getAllTeams, getLookupsByCategory, getEmployeeRoles } from '../../services/api';
import { exportEmployeesToExcel } from '../../utils/exportToExcel';
import PermissionGuard from '../auth/PermissionGuard';
import ImportEmployeesDialog from './ImportEmployeesDialog';
import authService from '../../services/authService';

const EmployeeListPrime = ({ onViewAssets }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [allTeams, setAllTeams] = useState([]); // Store all teams
  const [teams, setTeams] = useState([]); // Filtered teams based on project
  const [roleTypeOptions, setRoleTypeOptions] = useState([{ label: 'All', value: 'All' }]); // Role Type options from lookup
  const [roleOptions, setRoleOptions] = useState([{ label: 'All', value: 'All' }]); // Role options from lookup
  const [statusOptions] = useState([
    { label: 'All', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'On Leave', value: 'On Leave' },
    { label: 'Terminated', value: 'Terminated' }
  ]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [lazyState, setlazyState] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'id',
    sortOrder: 1
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [tableHeight, setTableHeight] = useState('calc(100vh - 350px)');
  const dt = useRef(null);

  // Get current user on component mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Fetch Role Type lookups on component mount
  useEffect(() => {
    const fetchRoleTypes = async () => {
      try {
        const response = await getLookupsByCategory('Role Type');

        if (response.data.success) {
          console.log(response.data.data, 'response.data')
          const options = [
            { label: 'All', value: 'All' },
            ...response.data.data.map(item => ({
              label: item.type_name,
              value: item.type_id
            }))
          ];
          setRoleTypeOptions(options);
        }
      } catch (error) {
        console.error('Error fetching role types:', error);
        // Keep default 'All' option if fetch fails
      }
    };
    fetchRoleTypes();
  }, []);

  // Fetch Roles from employee_roles lookup table on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getEmployeeRoles();
        if (response.data.success) {
          const options = [
            { label: 'All', value: 'All' },
            ...response.data.data.map(role => ({
              label: role.role_name,
              value: role.role_name
            }))
          ];
          setRoleOptions(options);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Keep default 'All' option if fetch fails
      }
    };
    fetchRoles();
  }, []);

  // Calculate table height based on window height
  useEffect(() => {
    const calculateTableHeight = () => {
      // Header: 60px, Toolbar: 70px, DataTable header/filters: 120px, Pagination: 60px, Padding: 40px
      const fixedHeight = 350;
      const availableHeight = window.innerHeight - fixedHeight;
      setTableHeight(`${Math.max(400, availableHeight)}px`);
    };

    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);

    return () => window.removeEventListener('resize', calculateTableHeight);
  }, []);

  // Fetch all projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getAllProjects(1, 1000); // Fetch all projects
        const projectOptions = [
          { label: 'All Projects', value: 'All' },
          ...response.data.data.map(project => ({
            label: project.project_team_name,
            value: project.project_team_name
          }))
        ];
        setProjects(projectOptions);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch all teams for filter dropdown
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await getAllTeams(); // Fetch all teams

        if (!response.data.data || response.data.data.length === 0) {
          setAllTeams([]);
          setTeams([{ label: 'All Teams', value: 'All' }]);
          return;
        }

        // Store all teams with their project information
        const teamsData = response.data.data.map(team => ({
          label: `${team.agile_board_name} (${team.project_team_name})`,
          value: team.agile_board_name,
          projectName: team.project_team_name
        }));

        setAllTeams(teamsData);

        // Initially show all teams
        setTeams([{ label: 'All Teams', value: 'All' }, ...teamsData]);
      } catch (err) {
        console.error('Error fetching teams:', err);
        console.error('Error details:', err.response?.data || err.message);
        // Set default option even on error
        setAllTeams([]);
        setTeams([{ label: 'All Teams', value: 'All' }]);
      }
    };
    fetchTeams();
  }, []);

  // Filter teams based on selected project
  useEffect(() => {
    if (projectFilter === 'All') {
      // Show all teams when "All Projects" is selected
      setTeams([{ label: 'All Teams', value: 'All' }, ...allTeams]);
    } else {
      // Filter teams by selected project
      const filteredTeams = allTeams.filter(team => team.projectName === projectFilter);
      setTeams([{ label: 'All Teams', value: 'All' }, ...filteredTeams]);

      // Reset team filter if current selection is not in filtered list
      if (teamFilter !== 'All' && !filteredTeams.some(team => team.value === teamFilter)) {
        setTeamFilter('All');
      }
    }
  }, [projectFilter, allTeams]);

  useEffect(() => {
    loadEmployees();
  }, [lazyState, roleTypeFilter, roleFilter, projectFilter, teamFilter, statusFilter, globalFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const page = lazyState.page + 1;
      const limit = lazyState.rows;
      const sortField = lazyState.sortField || 'id';
      const sortOrder = lazyState.sortOrder === 1 ? 'ASC' : 'DESC';

      const response = await getAllEmployees(page, limit, roleTypeFilter, sortField, sortOrder, globalFilter, projectFilter, teamFilter, roleFilter, statusFilter);
      setEmployees(response.data.data);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      toast.error('Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const onPage = (event) => {
    setlazyState(event);
  };

  const onSort = (event) => {
    setlazyState(event);
  };

  const handleDelete = (employee) => {
    confirmDialog({
      message: `Are you sure you want to delete ${employee.name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteEmployee(employee.id);
          toast.success('Employee deleted successfully!');
          loadEmployees();
        } catch (err) {
          toast.error('Failed to delete employee');
          console.error('Error deleting employee:', err);
        }
      }
    });
  };

  const handleExport = () => {
    try {
      const dataToExport = employees;
      const filename = 'employees';
      exportEmployeesToExcel(dataToExport, filename);
      toast.success(`Employees exported successfully to ${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export employees to Excel');
    }
  };

  const handleImportSuccess = () => {
    loadEmployees();
    setShowImportDialog(false);
  };

  const handleResetFilters = () => {
    setGlobalFilter('');
    setRoleTypeFilter('All');
    setRoleFilter('All');
    setProjectFilter('All');
    setTeamFilter('All');
    setStatusFilter('All');
    setlazyState({
      first: 0,
      rows: 10,
      page: 0,
      sortField: 'id',
      sortOrder: 1
    });
  };

  // Column templates
  const criticalityBodyTemplate = (rowData) => {
    const getSeverity = (criticality) => {
      switch (criticality) {
        case 'Critical': return 'danger';
        case 'High': return 'warning';
        case 'Medium': return 'info';
        case 'Low': return 'success';
        default: return null;
      }
    };
    return <Tag value={rowData.criticality} severity={getSeverity(rowData.criticality)} />;
  };

  const statusBodyTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Inactive': return 'danger';
        case 'On Leave': return 'warning';
        case 'Terminated': return 'danger';
        default: return null;
      }
    };
    return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
  };

  const attritionBodyTemplate = (rowData) => {
    const getSeverity = (attrition) => {
      switch (attrition) {
        case 'No': return 'success';
        case 'Yes': return 'danger';
        case 'At Risk': return 'warning';
        default: return null;
      }
    };
    return <Tag value={rowData.attrition} severity={getSeverity(rowData.attrition)} />;
  };

  const visaTypeBodyTemplate = (rowData) => {
    // Show visa type only for Onsite employees
    if (rowData.role_type === 'Onsite' || rowData.work_location === 'Onsite') {
      if (!rowData.visa_type || rowData.visa_type === 'None') {
        return <Tag value="N/A" severity="secondary" />;
      }
      return <Tag value={rowData.visa_type} severity="info" />;
    }
    // For non-Onsite employees, show N/A
    return <Tag value="N/A" severity="secondary" />;
  };

  const visaStatusBodyTemplate = (rowData) => {
    // Show visa status only for Onsite employees
    if (rowData.role_type !== 'Onsite' && rowData.work_location !== 'Onsite') {
      return <Tag value="N/A" severity="secondary" />;
    }

    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Expired': return 'danger';
        case 'In Process': return 'warning';
        case 'Not Applicable': return 'secondary';
        default: return null;
      }
    };
    return <Tag value={rowData.visa_status} severity={getSeverity(rowData.visa_status)} />;
  };

  const skillsBodyTemplate = (rowData) => {
    const skills = rowData.skills || 'N/A';
    if (skills.length > 30) {
      return <span title={skills}>{skills.substring(0, 30)}...</span>;
    }
    return <span>{skills}</span>;
  };

  const joiningDateBodyTemplate = (rowData) => {
    if (!rowData.joining_date) {
      return <span className="text-500">N/A</span>;
    }
    const date = new Date(rowData.joining_date);
    return <span>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>;
  };

  const allocatedProjectsBodyTemplate = (rowData) => {
    if (!rowData.allocated_projects) {
      return <span className="text-500">No projects</span>;
    }

    // Parse the allocated_projects string: "Project1:TeamName1:50||Project2:TeamName2:30"
    const projects = rowData.allocated_projects.split('||').map(item => {
      const [name, teamName, allocation] = item.split(':');
      return { name, teamName, allocation };
    });

    return (
      <div className="flex flex-wrap gap-1">
        {projects.map((project, index) => (
          <div key={index} style={{ marginBottom: '4px', width: '100%' }}>
            <Tag
              value={`${project.name}`}
              severity="info"
              style={{ fontSize: '0.75rem', marginRight: '4px' }}
            />
            {project.teamName && project.teamName !== 'Not Assigned' && (
              <Tag
                value={project.teamName}
                severity="success"
                style={{ fontSize: '0.7rem', marginRight: '4px' }}
              />
            )}

          </div>
        ))}
      </div>
    );
  };

  const projectTeamNameBodyTemplate = (rowData) => {
    if (!rowData.project_team_name) {
      return <span className="text-500">-</span>;
    }
    return <span>{rowData.project_team_name}</span>;
  };

  const projectStatusBodyTemplate = (rowData) => {
    if (!rowData.project_status) {
      return <span className="text-500">-</span>;
    }

    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Planning': return 'info';
        case 'On Hold': return 'warning';
        case 'Completed': return 'secondary';
        case 'Cancelled': return 'danger';
        default: return null;
      }
    };

    return <Tag value={rowData.project_status} severity={getSeverity(rowData.project_status)} />;
  };

  const agileBoardNameBodyTemplate = (rowData) => {
    if (!rowData.agile_board_name) {
      return <span className="text-500">-</span>;
    }
    return <span>{rowData.agile_board_name}</span>;
  };

  const agileTeamJiraKeyBodyTemplate = (rowData) => {
    if (!rowData.agile_team_jira_key) {
      return <span className="text-500">-</span>;
    }
    return <span>{rowData.agile_team_jira_key}</span>;
  };

  const assetsBodyTemplate = (rowData) => {
    const assetCount = rowData.asset_count || 0;

    if (assetCount === 0) {
      return (
        <div className="flex align-items-center gap-2">
          <Tag value="0 Assets" severity="secondary" icon="pi pi-box" />
        </div>
      );
    }

    // Parse the assigned_assets string: "TAG1:Laptop:Assigned||TAG2:Monitor:Assigned"
    const assets = rowData.assigned_assets ? rowData.assigned_assets.split('||').map(item => {
      const [tag, type, status] = item.split(':');
      return { tag, type, status };
    }) : [];

    const getStatusSeverity = (status) => {
      switch (status) {
        case 'Assigned': return 'info';
        case 'Available': return 'success';
        case 'Under Repair': return 'warning';
        case 'Retired': return 'secondary';
        case 'Lost': return 'danger';
        default: return 'info';
      }
    };

    return (
      <div className="flex align-items-center gap-2">
        <Tag
          value={`${assetCount} Asset${assetCount !== 1 ? 's' : ''}`}
          severity="success"
          icon="pi pi-box"
          style={{ cursor: 'pointer' }}
          onClick={() => onViewAssets(rowData)}
        />
        {assets.length > 0 && assets.length <= 3 && (
          <div className="flex flex-wrap gap-1">
            {assets.map((asset, index) => (
              <Tag
                key={index}
                value={`${asset.tag} (${asset.type})`}
                severity={getStatusSeverity(asset.status)}
                style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                onClick={() => onViewAssets(rowData)}
                title={`${asset.tag} - ${asset.type} - ${asset.status}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const invoiceTotalBodyTemplate = (rowData) => {
    const invoiceTotal = parseFloat(rowData.invoice_total_amount) || 0;

    return (
      <div className="flex align-items-center gap-2">
        <span style={{ fontWeight: '600', color: invoiceTotal > 0 ? '#0066cc' : '#6c757d' }}>
          ${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  };

  const allocationBodyTemplate = (rowData) => {
    const allocation = parseFloat(rowData.total_allocation) || 0;

    // Determine severity based on allocation percentage
    const getSeverity = () => {
      if (allocation === 0) return 'secondary';
      if (allocation < 50) return 'success';
      if (allocation < 80) return 'info';
      if (allocation < 100) return 'warning';
      return 'danger';
    };

    const getIcon = () => {
      if (allocation >= 100) return 'pi pi-exclamation-triangle';
      if (allocation >= 80) return 'pi pi-info-circle';
      return 'pi pi-check-circle';
    };

    return (
      <div className="flex align-items-center gap-2">
        <Tag
          value={`${allocation.toFixed(1)}%`}
          severity={getSeverity()}
          icon={getIcon()}
          style={{ fontWeight: '600' }}
        />
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="assets.view">
          <Button
            icon="pi pi-box"
            rounded
            outlined
            className="p-button-info"
            onClick={() => onViewAssets(rowData)}
            tooltip="View Assets"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="employees.update">
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-success"
            onClick={() => navigate(`/admin/employees/edit/${rowData.id}`)}
            tooltip="Edit"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="employees.delete">
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Delete"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
      </div>
    );
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h2 className="m-0">Employee Directory</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="employees.view">
          <Button
            label="Export"
            icon="pi pi-upload"
            className="p-button-success"
            onClick={handleExport}
          />
        </PermissionGuard>
        <PermissionGuard permission="employees.create">
          <Button
            label="Import"
            icon="pi pi-download"
            className="p-button-help"
            onClick={() => setShowImportDialog(true)}
          />
        </PermissionGuard>
        <PermissionGuard permission="employees.create">
          <Button
            label="Add Employee"
            icon="pi pi-plus"
            onClick={() => navigate('/admin/employees/add')}
          />
        </PermissionGuard>
      </div>
    );
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <span className="p-input-icon-left" style={{ width: '300px' }}>
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setlazyState({ ...lazyState, first: 0, page: 0 });
          }}
          placeholder="Search employees..."
          style={{ width: '100%' }}
        />
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="roleTypeFilter">Role Type:</label>
          <Dropdown
            id="roleTypeFilter"
            value={roleTypeFilter}
            onChange={(e) => {
              setRoleTypeFilter(e.value);
              setlazyState({ ...lazyState, first: 0, page: 0 });
            }}
            options={roleTypeOptions}
            placeholder="Select Role Type"
            style={{ width: '150px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="roleFilter">Role:</label>
          <Dropdown
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.value);
              setlazyState({ ...lazyState, first: 0, page: 0 });
            }}
            options={roleOptions}
            placeholder="Select Role"
            style={{ width: '200px' }}
            filter
            showClear
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="projectFilter">Project:</label>
          <Dropdown
            id="projectFilter"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.value);
              setlazyState({ ...lazyState, first: 0, page: 0 });
            }}
            options={projects}
            placeholder="Select Project"
            style={{ width: '200px' }}
            filter
            showClear
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="teamFilter">Agile Board Name:</label>
          <Dropdown
            id="teamFilter"
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.value);
              setlazyState({ ...lazyState, first: 0, page: 0 });
            }}
            options={teams}
            placeholder="Select Agile Board"
            style={{ width: '250px' }}
            filter
            showClear
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="statusFilter">Status:</label>
          <Dropdown
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.value);
              setlazyState({ ...lazyState, first: 0, page: 0 });
            }}
            options={statusOptions}
            placeholder="Select Status"
            style={{ width: '150px' }}
          />
        </div>
        <Button
          icon="pi pi-filter-slash"
          label="Reset Filters"
          className="p-button-outlined"
          onClick={handleResetFilters}
          style={{ height: '40px' }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <ImportEmployeesDialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        onSuccess={handleImportSuccess}
      />

      <DataTable
        ref={dt}
        value={employees}
        lazy
        dataKey="id"
        paginator
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyState.sortField}
        sortOrder={lazyState.sortOrder}
        loading={loading}
        globalFilter={globalFilter}
        header={header}
        emptyMessage="No employees found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Employees"
        rowsPerPageOptions={[5, 10, 25, 50]}
        responsiveLayout="scroll"
        stripedRows
        showGridlines
        scrollable
        scrollHeight={tableHeight}
      >
        <Column field="id" header="ID" sortable style={{ minWidth: '80px' }} />
        <Column field="sso" header="SSO" sortable style={{ minWidth: '120px' }} />
        <Column field="name" header="Name" sortable style={{ minWidth: '150px' }} />
        <Column field="work_location" header="Work Location" sortable style={{ minWidth: '160px' }} />
        <Column field="role" header="Role" sortable style={{ minWidth: '150px' }} />
        <Column
          field="project_team_name"
          header="Project Team Name"
          body={projectTeamNameBodyTemplate}
          style={{ minWidth: '180px' }}
        />
        <Column
          field="project_status"
          header="Project Status"
          body={projectStatusBodyTemplate}
          style={{ minWidth: '150px' }}
        />
        <Column
          field="agile_board_name"
          header="Agile Board Name"
          body={agileBoardNameBodyTemplate}
          style={{ minWidth: '180px' }}
        />
        <Column
          field="agile_team_jira_key"
          header="Agile Team JIRA Key"
          body={agileTeamJiraKeyBodyTemplate}
          style={{ minWidth: '180px' }}
        />
        <Column field="role_type" header="Role Type" sortable style={{ minWidth: '120px' }} />
        <Column
          field="total_allocation"
          header="Work Allocation %"
          body={allocationBodyTemplate}
          sortable
          style={{ minWidth: '160px' }}
        />
        <Column
          field="joining_date"
          header="Joining Date"
          body={joiningDateBodyTemplate}
          sortable
          style={{ minWidth: '140px' }}
        />
        <Column field="phone" header="Phone" sortable style={{ minWidth: '130px' }} />
        <Column field="location" header="Location" sortable style={{ minWidth: '130px' }} />
        <Column
          field="criticality"
          header="Criticality"
          body={criticalityBodyTemplate}
          sortable
          style={{ minWidth: '60px' }}
        />
        <Column
          field="status"
          header="Status"
          body={statusBodyTemplate}
          sortable
          style={{ minWidth: '110px' }}
        />
        <Column
          field="skills"
          header="Skills"
          body={skillsBodyTemplate}
          sortable
          style={{ minWidth: '350px' }}
        />
        <Column
          field="attrition"
          header="Attrition"
          body={attritionBodyTemplate}
          sortable
          style={{ minWidth: '110px' }}
        />
        <Column
          field="visa_type"
          header="Visa Type"
          body={visaTypeBodyTemplate}
          sortable
          style={{ minWidth: '120px' }}
        />
        <Column
          field="visa_status"
          header="Visa Status"
          body={visaStatusBodyTemplate}
          sortable
          style={{ minWidth: '200px' }}
        />
        <Column
          field="asset_count"
          header="Assets"
          body={assetsBodyTemplate}
          style={{ minWidth: '200px' }}
        />
        {currentUser?.role_name === 'super_admin' && (
          <Column
            field="invoice_total_amount"
            header="Invoice Total"
            body={invoiceTotalBodyTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
        )}
        <Column
          header="Actions"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: '150px' }}
        />
      </DataTable>
    </div>
  );
};

export default EmployeeListPrime;
