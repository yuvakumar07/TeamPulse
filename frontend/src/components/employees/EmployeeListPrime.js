import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { getAllEmployees, deleteEmployee, getAllProjects } from '../../services/api';
import { exportEmployeesToExcel } from '../../utils/exportToExcel';
import PermissionGuard from '../auth/PermissionGuard';
import ImportEmployeesDialog from './ImportEmployeesDialog';

const EmployeeListPrime = ({ onEdit, onAdd, onViewAssets }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [projects, setProjects] = useState([]);
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

  const roleTypeOptions = [
    { label: 'All', value: 'All' },
    { label: 'DEV', value: 'DEV' },
    { label: 'QA', value: 'QA' }
  ];

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

  useEffect(() => {
    loadEmployees();
  }, [lazyState, roleTypeFilter, projectFilter, globalFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const page = lazyState.page + 1;
      const limit = lazyState.rows;
      const sortField = lazyState.sortField || 'id';
      const sortOrder = lazyState.sortOrder === 1 ? 'ASC' : 'DESC';

      const response = await getAllEmployees(page, limit, roleTypeFilter, sortField, sortOrder, globalFilter, projectFilter);
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
    if (!rowData.visa_type || rowData.visa_type === 'None') {
      return <Tag value="None" severity="secondary" />;
    }
    return <Tag value={rowData.visa_type} severity="info" />;
  };

  const visaStatusBodyTemplate = (rowData) => {
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

    // Parse the allocated_projects string: "Project1:50||Project2:30"
    const projects = rowData.allocated_projects.split('||').map(item => {
      const [name, allocation] = item.split(':');
      return { name, allocation };
    });

    return (
      <div className="flex flex-wrap gap-1">
        {projects.map((project, index) => (
          <Tag
            key={index}
            value={`${project.name} (${project.allocation}%)`}
            severity="info"
            style={{ fontSize: '0.75rem' }}
          />
        ))}
      </div>
    );
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
            onClick={() => onEdit(rowData)}
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
            onClick={onAdd}
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
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

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
        <Column
          field="joining_date"
          header="Joining Date"
          body={joiningDateBodyTemplate}
          sortable
          style={{ minWidth: '140px' }}
        />
        <Column field="role" header="Role" sortable style={{ minWidth: '150px' }} />
        <Column field="role_type" header="Role Type" sortable style={{ minWidth: '120px' }} />
        <Column field="phone" header="Phone" sortable style={{ minWidth: '130px' }} />
        <Column field="location" header="Location" sortable style={{ minWidth: '130px' }} />
        <Column
          field="criticality"
          header="Criticality"
          body={criticalityBodyTemplate}
          sortable
          style={{ minWidth: '130px' }}
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
          style={{ minWidth: '200px' }}
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
          style={{ minWidth: '130px' }}
        />
        <Column
          field="allocated_projects"
          header="Allocated Projects"
          body={allocatedProjectsBodyTemplate}
          style={{ minWidth: '250px' }}
        />
        <Column
          field="asset_count"
          header="Assets"
          body={assetsBodyTemplate}
          style={{ minWidth: '200px' }}
        />
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
