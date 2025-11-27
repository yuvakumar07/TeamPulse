import React, { useState, useEffect } from 'react';
import { getProjectById } from '../../services/api';
import './EmployeeDetailsModal.css';

const EmployeeDetailsModal = ({ projectId, projectName, isOpen, onClose }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setTeams(response.data.data.teams || []);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate total employees across all teams
  const allEmployees = teams.flatMap(team => team.employees || []);
  const totalEmployees = allEmployees.length;
  const totalAllocation = allEmployees.reduce((sum, emp) => sum + parseFloat(emp.allocation_percentage || 0), 0);

  return (
    <div className="employee-modal-overlay" onClick={onClose}>
      <div className="employee-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="employee-modal-header">
          <h2>Project Details: {projectName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="employee-modal-body">
          {loading ? (
            <div className="loading">Loading project details...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <>
              <div className="allocation-summary-box" style={{ marginBottom: '1rem' }}>
                <strong>Total Employees: {totalEmployees}</strong>
                {totalEmployees > 0 && (
                  <span style={{ marginLeft: '1rem' }}>Total Allocation: {totalAllocation.toFixed(2)}%</span>
                )}
                {totalAllocation > 100 && (
                  <span className="warning-text"> (Exceeds 100%)</span>
                )}
              </div>

              {teams.length === 0 ? (
                <p className="no-data">No teams created for this project</p>
              ) : (
                <div className="teams-with-employees">
                  {teams.map((team) => (
                    <div key={team.id} className="team-section" style={{ marginBottom: '1.5rem' }}>
                      <div className="team-header" style={{
                        backgroundColor: '#f8f9fa',
                        padding: '0.75rem',
                        borderRadius: '6px 6px 0 0',
                        border: '1px solid #dee2e6',
                        borderBottom: 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{team.agile_board_name}</h4>
                            {team.agile_team_jira_key && (
                              <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>JIRA: {team.agile_team_jira_key}</span>
                            )}
                          </div>
                          <span style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {team.employees?.length || 0} {(team.employees?.length || 0) === 1 ? 'employee' : 'employees'}
                          </span>
                        </div>
                      </div>

                      {team.employees && team.employees.length > 0 ? (
                        <div className="employee-details-table-container" style={{ border: '1px solid #dee2e6', borderRadius: '0 0 6px 6px' }}>
                          <table className="employee-details-table" style={{ marginBottom: 0 }}>
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
                              {team.employees.map((employee) => (
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
                      ) : (
                        <div style={{
                          border: '1px solid #dee2e6',
                          borderTop: 'none',
                          borderRadius: '0 0 6px 6px',
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#6c757d',
                          backgroundColor: 'white'
                        }}>
                          No employees assigned to this team
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
