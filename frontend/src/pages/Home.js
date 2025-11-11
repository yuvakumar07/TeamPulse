import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAllEmployees } from '../redux/employeeSlice';
import './Home.css';

const Home = () => {
  const employees = useSelector(selectAllEmployees);

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.status === 'active').length,
    departments: [...new Set(employees.map(emp => emp.department).filter(Boolean))].length,
    positions: [...new Set(employees.map(emp => emp.position).filter(Boolean))].length,
  };

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to TeamPulse</h1>
        <p>Your comprehensive employee management solution</p>
        <div className="hero-actions">
          <Link to="/employees" className="btn btn-primary-large">
            View Employees
          </Link>
          <Link to="/employees/add" className="btn btn-secondary-large">
            Add New Employee
          </Link>
        </div>
      </section>

      <section className="stats-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats.totalEmployees}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{stats.activeEmployees}</div>
            <div className="stat-label">Active Employees</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-number">{stats.departments}</div>
            <div className="stat-label">Departments</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-number">{stats.positions}</div>
            <div className="stat-label">Positions</div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Employee Management</h3>
            <p>Add, edit, and manage employee information with ease</p>
          </div>
          <div className="feature-card">
            <h3>Search & Filter</h3>
            <p>Quickly find employees with powerful search capabilities</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Updates</h3>
            <p>Changes are reflected instantly across the system</p>
          </div>
          <div className="feature-card">
            <h3>Responsive Design</h3>
            <p>Access from any device - desktop, tablet, or mobile</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
