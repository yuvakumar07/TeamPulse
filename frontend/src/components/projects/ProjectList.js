import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllProjects, deleteProject } from '../../services/api';
import ConfirmationModal from '../modals/ConfirmationModal';
import EmployeeDetailsModal from '../modals/EmployeeDetailsModal';
import EmployeeAssignment from './EmployeeAssignment';
import PermissionGuard from '../auth/PermissionGuard';
import { EditIcon, DeleteIcon, ViewIcon, AddIcon, AssignIcon } from '../icons/ActionIcons';
import './ProjectList.css';

const ProjectList = ({ onEdit, onAdd }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedProjectForEmployees, setSelectedProjectForEmployees] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProjectForAssignment, setSelectedProjectForAssignment] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProjects();
  }, [currentPage, statusFilter, sortField, sortOrder]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getAllProjects(currentPage, itemsPerPage, statusFilter, sortField, sortOrder);
      setProjects(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects. Please check if the backend server is running.');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProject(projectToDelete.id);
      toast.success('Project deleted successfully!');
      setShowConfirmation(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
      console.error('Error deleting project:', err);
      setShowConfirmation(false);
      setProjectToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setProjectToDelete(null);
  };

  const handleViewEmployees = (project) => {
    setSelectedProjectForEmployees(project);
    setShowEmployeeModal(true);
  };

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedProjectForEmployees(null);
  };

  const handleAssignEmployees = (project) => {
    setSelectedProjectForAssignment(project);
    setShowAssignmentModal(true);
  };

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedProjectForAssignment(null);
  };

  const handleAssignmentSuccess = () => {
    fetchProjects();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>;
    }
    return sortOrder === 'ASC' ? <span className="sort-icon active">↑</span> : <span className="sort-icon active">↓</span>;
  };

  const filteredProjects = projects.filter(project =>
    (project.project_team_name && project.project_team_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.agile_board_name && project.agile_board_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (project.agile_team_jira_key && project.agile_team_jira_key.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderPagination = () => {
    const { page, totalPages } = pagination;
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
        >
          First
        </button>
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button className="pagination-number" onClick={() => handlePageChange(1)}>
              1
            </button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map(num => (
          <button
            key={num}
            className={`pagination-number ${num === page ? 'active' : ''}`}
            onClick={() => handlePageChange(num)}
          >
            {num}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button className="pagination-number" onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
        >
          Last
        </button>
      </div>
    );
  };

  const getStatusClass = (status) => {
    const classes = {
      'Planning': 'status-planning',
      'Active': 'status-active',
      'On Hold': 'status-onhold',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled'
    };
    return classes[status] || '';
  };

  if (loading) return <div className="loading">Loading projects...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="project-list">
      <div className="list-header">
        <h2>Projects Directory</h2>
        <div className="header-actions">
          <PermissionGuard permission="projects.create">
            <button className="btn btn-primary" onClick={onAdd}>
              <AddIcon className="btn-icon-inline" />
              Add New Project
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <p className="no-data">No projects found</p>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('id')}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('project_team_name')}>
                    Project Team Name {renderSortIcon('project_team_name')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('agile_board_name')}>
                    Agile Board {renderSortIcon('agile_board_name')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('agile_team_jira_key')}>
                    JIRA Key {renderSortIcon('agile_team_jira_key')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('project_status')}>
                    Status {renderSortIcon('project_status')}
                  </th>
                  <th>Employees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td>{project.project_team_name}</td>
                    <td>{project.agile_board_name || 'N/A'}</td>
                    <td>{project.agile_team_jira_key || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusClass(project.project_status)}`}>
                        {project.project_status}
                      </span>
                    </td>
                    <td>{project.employee_count || 0}</td>
                    <td className="actions">
                      <PermissionGuard permission="projects.view">
                        <button
                          className="btn-icon btn-icon-view"
                          onClick={() => handleViewEmployees(project)}
                          title="View assigned employees"
                        >
                          <ViewIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="projects.update">
                        <button
                          className="btn-icon btn-icon-assign"
                          onClick={() => handleAssignEmployees(project)}
                          title="Assign Employees"
                        >
                          <AssignIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="projects.update">
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => onEdit(project)}
                          title="Edit Project"
                        >
                          <EditIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="projects.delete">
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => handleDeleteClick(project)}
                          title="Delete Project"
                        >
                          <DeleteIcon />
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
              </div>
              {renderPagination()}
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={showConfirmation}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also remove all employee assignments."
        employeeName={projectToDelete?.project_team_name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <EmployeeDetailsModal
        isOpen={showEmployeeModal}
        projectId={selectedProjectForEmployees?.id}
        projectName={selectedProjectForEmployees?.project_team_name}
        onClose={handleCloseEmployeeModal}
      />

      {showAssignmentModal && selectedProjectForAssignment && (
        <EmployeeAssignment
          project={selectedProjectForAssignment}
          onClose={handleCloseAssignmentModal}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
};

export default ProjectList;
