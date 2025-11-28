import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import EmployeeForm from '../components/employees/EmployeeForm';
import './EmployeeFormPage.css';

const AddEmployeePage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/admin/employees');
  };

  const handleCancel = () => {
    navigate('/admin/employees');
  };

  return (
    <div className="employee-form-page p-0">
      {/* <div className="page-header">
        <Button
          icon="pi pi-arrow-left"
          label="Back to Employees"
          className="p-button-text"
          onClick={handleCancel}
        />
      </div> */}

      <Card className="form-card">
        <div className="card-header">
          <h2><i className="pi pi-user-plus"></i> Add New Employee</h2>
        </div>

        <EmployeeForm
          employee={null}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default AddEmployeePage;
