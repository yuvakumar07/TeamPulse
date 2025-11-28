import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { toast } from 'react-toastify';
import EmployeeForm from '../components/employees/EmployeeForm';
import { getEmployeeById } from '../services/api';
import './EmployeeFormPage.css';

const EditEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await getEmployeeById(id);
        if (response.data.success) {
          setEmployee(response.data.data);
        } else {
          toast.error('Failed to load employee details');
          navigate('/admin/employees');
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
        toast.error('Failed to load employee details');
        navigate('/admin/employees');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id, navigate]);

  const handleSuccess = () => {
    navigate('/admin/employees');
  };

  const handleCancel = () => {
    navigate('/admin/employees');
  };

  if (loading) {
    return (
      <div className="employee-form-page loading-container">
        <ProgressSpinner />
        <p>Loading employee details...</p>
      </div>
    );
  }

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
          <h2><i className="pi pi-user-edit"></i> Edit Employee</h2>
        </div>

        <EmployeeForm
          employee={employee}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default EditEmployeePage;
