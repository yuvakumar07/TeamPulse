import React, { useState } from 'react';
import EmployeeList from '../components/employees/EmployeeList';
import EmployeeForm from '../components/employees/EmployeeForm';
import VisaHistory from '../components/employees/VisaHistory';
import './Employees.css';

const EmployeesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showVisaHistory, setShowVisaHistory] = useState(false);
  const [visaEmployee, setVisaEmployee] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEmployee(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewVisaHistory = (employee) => {
    setVisaEmployee(employee);
    setShowVisaHistory(true);
  };

  const handleCloseVisaHistory = () => {
    setShowVisaHistory(false);
    setVisaEmployee(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="employees-page">
      <EmployeeList
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onViewVisaHistory={handleViewVisaHistory}
      />

      {showForm && (
        <EmployeeForm
          employee={selectedEmployee}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {showVisaHistory && visaEmployee && (
        <VisaHistory
          employeeId={visaEmployee.id}
          employeeName={visaEmployee.name}
          onClose={handleCloseVisaHistory}
        />
      )}
    </div>
  );
};

export default EmployeesPage;
