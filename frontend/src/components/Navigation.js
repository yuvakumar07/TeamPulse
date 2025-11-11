import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          TeamPulse
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/employees" className={`nav-link ${isActive('/employees')}`}>
              Employees
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/employees/add" className={`nav-link ${isActive('/employees/add')}`}>
              Add Employee
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
