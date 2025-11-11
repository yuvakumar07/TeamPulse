import React, { useState, useEffect } from 'react';
import { getAllEmployees, deleteEmployee } from '../services/api';
import './EmployeeList.css';

const EmployeeList = ({ onEdit, onAdd }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployees();
      setEmployees(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Please check if the backend server is running.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee');
        console.error('Error deleting employee:', err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary) => {
    if (!salary) return 'N/A';
    return `$${parseFloat(salary).toLocaleString()}`;
  };

  if (loading) return <div className="loading">Loading employees...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="employee-list">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <button className="btn btn-primary" onClick={onAdd}>
          Add New Employee
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredEmployees.length === 0 ? (
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
              {filteredEmployees.map((employee) => (
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
                      onClick={() => onEdit(employee)}
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
  );
};

export default EmployeeList;
