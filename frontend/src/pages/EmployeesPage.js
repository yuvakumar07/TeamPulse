import React, { useState } from 'react';
import EmployeeListPrime from '../components/employees/EmployeeListPrime';
import EmployeeFormPrime from '../components/employees/EmployeeFormPrime';
import VisaHistoryPrime from '../components/employees/VisaHistoryPrime';
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
    console.log('handleViewVisaHistory called with employee:', employee);
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
      <EmployeeListPrime
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onViewVisaHistory={handleViewVisaHistory}
      />

      <EmployeeFormPrime
        employee={selectedEmployee}
        visible={showForm}
        onHide={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      <VisaHistoryPrime
        employeeId={visaEmployee?.id}
        employeeName={visaEmployee?.name}
        visible={showVisaHistory}
        onHide={handleCloseVisaHistory}
      />
    </div>
  );
};

export default EmployeesPage;
