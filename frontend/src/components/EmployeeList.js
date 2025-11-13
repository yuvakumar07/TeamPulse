import React, { useState, useEffect } from 'react';
import { getAllEmployees, deleteEmployee } from '../services/api';
import { exportEmployeesToExcel } from '../utils/exportToExcel';
import ConfirmationModal from './ConfirmationModal';
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
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, roleTypeFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployees(currentPage, itemsPerPage, roleTypeFilter);
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
      setShowConfirmation(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee');
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

  const handleExportToExcel = () => {
    try {
      const dataToExport = searchTerm ? filteredEmployees : employees;
      const filename = searchTerm ? 'employees_filtered' : 'employees';
      const exportedFile = exportEmployeesToExcel(dataToExport, filename);
      alert(`Employees exported successfully to ${exportedFile}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export employees to Excel');
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
          <button className="btn btn-export" onClick={handleExportToExcel}>
            Export to Excel
          </button>
          <button className="btn btn-primary" onClick={onAdd}>
            Add New Employee
          </button>
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
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
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
                  <th>ID</th>
                  <th>SSO</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Role Type</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Criticality</th>
                  <th>Status</th>
                  <th>Skills</th>
                  <th>Attrition</th>
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
                    <td className="actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => onEdit(employee)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteClick(employee)}
                      >
                        Delete
                      </button>
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
