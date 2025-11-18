import React, { useState, useEffect } from 'react';
import { getProjectById } from '../../services/api';
import './EmployeeDetailsModal.css';

const EmployeeDetailsModal = ({ projectId, projectName, isOpen, onClose }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchEmployeeDetails();
    }
  }, [isOpen, projectId]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProjectById(projectId);
      setEmployees(response.data.data.employees || []);
    } catch (err) {
      console.error('Error fetching employee details:', err);
      setError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalAllocation = employees.reduce((sum, emp) => sum + parseFloat(emp.allocation_percentage || 0), 0);

  return (
    <div className="employee-modal-overlay" onClick={onClose}>
      <div className="employee-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="employee-modal-header">
          <h2>Employees Assigned to {projectName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="employee-modal-body">
          {loading ? (
            <div className="loading">Loading employees...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : employees.length === 0 ? (
            <p className="no-data">No employees assigned to this project</p>
          ) : (
            <>
              <div className="allocation-summary-box">
                <strong>Total Allocation: {totalAllocation.toFixed(2)}%</strong>
                {totalAllocation > 100 && (
                  <span className="warning-text"> (Exceeds 100%)</span>
                )}
              </div>

              <div className="employee-details-table-container">
                <table className="employee-details-table">
                  <thead>
                    <tr>
                      <th>SSO</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Role Type</th>
                      <th>Location</th>
                      <th>Allocation %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.sso || 'N/A'}</td>
                        <td className="employee-name">{employee.name}</td>
                        <td>{employee.role || 'N/A'}</td>
                        <td>
                          <span className="role-type-badge">
                            {employee.role_type || 'N/A'}
                          </span>
                        </td>
                        <td>{employee.location || 'N/A'}</td>
                        <td>
                          <span className="allocation-badge">
                            {parseFloat(employee.allocation_percentage).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="employee-summary">
                <p><strong>Total Employees:</strong> {employees.length}</p>
              </div>
            </>
          )}
        </div>

        <div className="employee-modal-footer">
          <button className="btn btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
