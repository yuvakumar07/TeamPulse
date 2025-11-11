import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployees,
  removeEmployee,
  selectFilteredEmployees,
  selectLoading,
  selectError,
  selectSearchTerm,
  setSearchTerm,
} from '../redux/employeeSlice';
import './Employees.css';

const Employees = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const employees = useSelector(selectFilteredEmployees);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const searchTerm = useSelector(selectSearchTerm);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleEdit = (employee) => {
    navigate(`/employees/edit/${employee.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await dispatch(removeEmployee(id)).unwrap();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  const handleAddNew = () => {
    navigate('/employees/add');
  };

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary) return 'N/A';
    return `$${parseFloat(salary).toLocaleString()}`;
  };

  if (loading && employees.length === 0) {
    return <div className="loading">Loading employees...</div>;
  }

  if (error && employees.length === 0) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="employees-page">
      <div className="employee-list">
        <div className="list-header">
          <h2>Employee Directory</h2>
          <button className="btn btn-primary" onClick={handleAddNew}>
            Add New Employee
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {employees.length === 0 ? (
          <p className="no-data">No employees found</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Salary</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>{employee.first_name} {employee.last_name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.phone || 'N/A'}</td>
                    <td>{employee.department || 'N/A'}</td>
                    <td>{employee.position || 'N/A'}</td>
                    <td>{formatSalary(employee.salary)}</td>
                    <td>{formatDate(employee.hire_date)}</td>
                    <td>
                      <span className={`status ${employee.status}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEdit(employee)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(employee.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
