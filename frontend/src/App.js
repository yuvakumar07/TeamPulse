import React, { useState } from 'react';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import './App.css';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setSelectedEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedEmployee(null);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Employee Management Portal</h1>
        <p>Manage your workforce efficiently</p>
      </header>

      <main className="app-main">
        <EmployeeList
          key={refreshKey}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />

        {showForm && (
          <EmployeeForm
            employee={selectedEmployee}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Employee Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
