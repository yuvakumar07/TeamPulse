import React, { useState } from 'react';
import EmployeeListPrime from '../components/employees/EmployeeListPrime';
import EmployeeFormPrime from '../components/employees/EmployeeFormPrime';
import AssetsByEmployeeModal from '../components/modals/AssetsByEmployeeModal';
import './Employees.css';

const EmployeesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [selectedEmployeeForAssets, setSelectedEmployeeForAssets] = useState(null);

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

  const handleViewAssets = (employee) => {
    setSelectedEmployeeForAssets(employee);
    setShowAssetsModal(true);
  };

  const handleCloseAssetsModal = () => {
    setShowAssetsModal(false);
    setSelectedEmployeeForAssets(null);
  };

  return (
    <div className="employees-page">
      <EmployeeListPrime
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onViewAssets={handleViewAssets}
      />

      <EmployeeFormPrime
        employee={selectedEmployee}
        visible={showForm}
        onHide={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {showAssetsModal && selectedEmployeeForAssets && (
        <AssetsByEmployeeModal
          employeeId={selectedEmployeeForAssets.id}
          employeeName={selectedEmployeeForAssets.name}
          isOpen={showAssetsModal}
          onClose={handleCloseAssetsModal}
        />
      )}
    </div>
  );
};

export default EmployeesPage;
