import React, { useState } from 'react';
import ProjectList from '../components/ProjectList';
import ProjectForm from '../components/ProjectForm';
import './Employees.css'; // Reuse the same CSS

const ProjectsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedProject(null);
    setShowForm(true);
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProject(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="employees-page">
      <ProjectList
        key={refreshTrigger}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {showForm && (
        <ProjectForm
          project={selectedProject}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
