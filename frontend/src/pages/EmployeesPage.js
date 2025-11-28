import React, { useState } from 'react';
import EmployeeListPrime from '../components/employees/EmployeeListPrime';
import AssetsByEmployeeModal from '../components/modals/AssetsByEmployeeModal';
import './Employees.css';

const EmployeesPage = () => {
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [selectedEmployeeForAssets, setSelectedEmployeeForAssets] = useState(null);

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
        onViewAssets={handleViewAssets}
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
