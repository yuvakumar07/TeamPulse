import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllEmployees, deleteEmployee } from '../../services/api';
import { exportEmployeesToExcel } from '../../utils/exportToExcel';
import ConfirmationModal from '../modals/ConfirmationModal';
import PermissionGuard from '../auth/PermissionGuard';
import { EditIcon, DeleteIcon, AddIcon, ExportIcon, DocumentIcon } from '../icons/ActionIcons';
import './EmployeeList.css';

const EmployeeList = ({ onEdit, onAdd }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, roleTypeFilter, sortField, sortOrder]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployees(currentPage, itemsPerPage, roleTypeFilter, sortField, sortOrder);
      setEmployees(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Please check if the backend server is running.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteEmployee(employeeToDelete.id);
      toast.success('Employee deleted successfully!');
      setShowConfirmation(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to delete employee');
      console.error('Error deleting employee:', err);
      setShowConfirmation(false);
      setEmployeeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setEmployeeToDelete(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleTypeFilterChange = (e) => {
    setRoleTypeFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new field and default to ASC
      setSortField(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>;
    }
    return sortOrder === 'ASC' ? <span className="sort-icon active">↑</span> : <span className="sort-icon active">↓</span>;
  };

  const handleExportToExcel = () => {
    try {
      const dataToExport = searchTerm ? filteredEmployees : employees;
      const filename = searchTerm ? 'employees_filtered' : 'employees';
      const exportedFile = exportEmployeesToExcel(dataToExport, filename);
      toast.success(`Employees exported successfully to ${exportedFile}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export employees to Excel');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.sso && emp.sso.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.location && emp.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.skills && emp.skills.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getCriticalityClass = (criticality) => {
    const classes = {
      'Low': 'criticality-low',
      'Medium': 'criticality-medium',
      'High': 'criticality-high',
      'Critical': 'criticality-critical'
    };
    return classes[criticality] || '';
  };

  const getAttritionClass = (attrition) => {
    const classes = {
      'No': 'attrition-no',
      'Yes': 'attrition-yes',
      'At Risk': 'attrition-risk'
    };
    return classes[attrition] || '';
  };

  if (loading) return <div className="loading">Loading employees...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employee-list">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <div className="header-actions">
          <PermissionGuard permission="employees.view">
            <button className="btn btn-export" onClick={handleExportToExcel}>
              <ExportIcon className="btn-icon-inline" />
              Export to Excel
            </button>
          </PermissionGuard>
          <PermissionGuard permission="employees.create">
            <button className="btn btn-primary" onClick={onAdd}>
              <AddIcon className="btn-icon-inline" />
              Add New Employee
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="role-type-filter">
          <label htmlFor="roleTypeFilter">Role Type:</label>
          <select
            id="roleTypeFilter"
            value={roleTypeFilter}
            onChange={handleRoleTypeFilterChange}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="DEV">DEV</option>
            <option value="QA">QA</option>
          </select>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <p className="no-data">No employees found</p>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('id')}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('sso')}>
                    SSO {renderSortIcon('sso')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    Name {renderSortIcon('name')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('role')}>
                    Role {renderSortIcon('role')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('role_type')}>
                    Role Type {renderSortIcon('role_type')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('phone')}>
                    Phone {renderSortIcon('phone')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('location')}>
                    Location {renderSortIcon('location')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('criticality')}>
                    Criticality {renderSortIcon('criticality')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('status')}>
                    Status {renderSortIcon('status')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('skills')}>
                    Skills {renderSortIcon('skills')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('attrition')}>
                    Attrition {renderSortIcon('attrition')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('visa_type')}>
                    Visa Type {renderSortIcon('visa_type')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('visa_status')}>
                    Visa Status {renderSortIcon('visa_status')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.sso || 'N/A'}</td>
                    <td>{employee.name}</td>
                    <td>{employee.role || 'N/A'}</td>
                    <td>{employee.role_type || 'N/A'}</td>
                    <td>{employee.phone || 'N/A'}</td>
                    <td>{employee.location || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getCriticalityClass(employee.criticality)}`}>
                        {employee.criticality}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${employee.status?.toLowerCase()}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="skills-cell" title={employee.skills}>
                      {employee.skills ? (employee.skills.length > 30 ? employee.skills.substring(0, 30) + '...' : employee.skills) : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${getAttritionClass(employee.attrition)}`}>
                        {employee.attrition}
                      </span>
                    </td>
                    <td>
                      <span className={`visa-type ${employee.visa_type !== 'None' ? 'visa-active' : ''}`}>
                        {employee.visa_type || 'None'}
                      </span>
                    </td>
                    <td>
                      <span className={`visa-status ${employee.visa_status === 'Active' ? 'visa-status-active' : employee.visa_status === 'Expired' ? 'visa-status-expired' : ''}`}>
                        {employee.visa_status || 'N/A'}
                      </span>
                    </td>
                    <td className="actions">
                      <PermissionGuard permission="employees.update">
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => onEdit(employee)}
                          title="Edit Employee"
                        >
                          <EditIcon />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="employees.delete">
                        <button
                          className="btn-icon btn-icon-delete"
                          onClick={() => handleDeleteClick(employee)}
                          title="Delete Employee"
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees
              </div>
              {renderPagination()}
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={showConfirmation}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        employeeName={employeeToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default EmployeeList;
