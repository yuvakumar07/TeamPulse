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
import { getAllProjects, deleteProject } from '../../services/api';
import EmployeeDetailsModal from '../modals/EmployeeDetailsModal';
import EmployeeAssignment from './EmployeeAssignment';
import PermissionGuard from '../auth/PermissionGuard';

const ProjectListPrime = ({ onEdit, onAdd }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedProjectForEmployees, setSelectedProjectForEmployees] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProjectForAssignment, setSelectedProjectForAssignment] = useState(null);
  const [lazyState, setlazyState] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'created_at',
    sortOrder: -1
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const dt = useRef(null);

  const statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Planning', value: 'Planning' },
    { label: 'Active', value: 'Active' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  useEffect(() => {
    loadProjects();
  }, [lazyState, statusFilter, globalFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const page = lazyState.page + 1;
      const limit = lazyState.rows;
      const sortField = lazyState.sortField || 'created_at';
      const sortOrder = lazyState.sortOrder === 1 ? 'ASC' : 'DESC';

      const response = await getAllProjects(page, limit, statusFilter, sortField, sortOrder, globalFilter);
      setProjects(response.data.data);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      toast.error('Failed to fetch projects');
      console.error('Error fetching projects:', err);
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

  const handleDelete = (project) => {
    confirmDialog({
      message: `Are you sure you want to delete ${project.project_team_name}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteProject(project.id);
          toast.success('Project deleted successfully!');
          loadProjects();
        } catch (err) {
          toast.error('Failed to delete project');
          console.error('Error deleting project:', err);
        }
      }
    });
  };

  const handleViewEmployees = (project) => {
    setSelectedProjectForEmployees(project);
    setShowEmployeeModal(true);
  };

  const handleAssignEmployees = (project) => {
    setSelectedProjectForAssignment(project);
    setShowAssignmentModal(true);
  };

  // Column templates
  const statusBodyTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Completed': return 'info';
        case 'Planning': return 'warning';
        case 'On Hold': return 'warning';
        case 'Cancelled': return 'danger';
        default: return null;
      }
    };
    return <Tag value={rowData.project_status} severity={getSeverity(rowData.project_status)} />;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="projects.view">
          <Button
            icon="pi pi-eye"
            rounded
            outlined
            className="p-button-info"
            onClick={() => handleViewEmployees(rowData)}
            tooltip="View Employees"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="projects.update">
          <Button
            icon="pi pi-users"
            rounded
            outlined
            className="p-button-warning"
            onClick={() => handleAssignEmployees(rowData)}
            tooltip="Assign Employees"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="projects.update">
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
        <PermissionGuard permission="projects.delete">
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
        <h2 className="m-0">Project Directory</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="projects.create">
          <Button
            label="Add Project"
            icon="pi pi-plus"
            onClick={onAdd}
          />
        </PermissionGuard>
      </div>
    );
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <span className="p-input-icon-right" style={{ width: '300px' }}>
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setlazyState({ ...lazyState, first: 0, page: 0 });
          }}
          placeholder="Search projects..."
          style={{ width: '100%' }}
        />
      </span>
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
          style={{ width: '200px' }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <DataTable
        ref={dt}
        value={projects}
        lazy
        dataKey="id"
        paginator={totalRecords > 10}
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
        emptyMessage="No projects found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Projects"
        rowsPerPageOptions={[5, 10, 25, 50]}
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ minWidth: '80px' }} />
        <Column field="project_team_name" header="Project Team Name" sortable style={{ minWidth: '200px' }} />
        <Column field="agile_board_name" header="Agile Board" sortable style={{ minWidth: '200px' }} />
        <Column field="agile_team_jira_key" header="JIRA Key" sortable style={{ minWidth: '150px' }} />
        <Column field="project_status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
        <Column field="employee_count" header="Employees" style={{ minWidth: '100px' }} />
        <Column header="Actions" body={actionBodyTemplate} exportable={false} style={{ minWidth: '200px' }} />
      </DataTable>

      {showEmployeeModal && selectedProjectForEmployees && (
        <EmployeeDetailsModal
          projectId={selectedProjectForEmployees.id}
          projectName={selectedProjectForEmployees.project_team_name}
          isOpen={showEmployeeModal}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedProjectForEmployees(null);
          }}
        />
      )}

      {showAssignmentModal && selectedProjectForAssignment && (
        <EmployeeAssignment
          project={selectedProjectForAssignment}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedProjectForAssignment(null);
          }}
          onSuccess={() => {
            loadProjects();
            setShowAssignmentModal(false);
            setSelectedProjectForAssignment(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectListPrime;
