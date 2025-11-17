import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PermissionGuard from './PermissionGuard';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isAdminRoute = () => {
    return location.pathname.startsWith('/admin');
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  // Don't show navigation on admin login page
  if (location.pathname === '/admin/login') {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          TeamPulse
        </Link>
        <ul className="nav-menu">
          {!isAdminRoute() && (
            <>
              <li className="nav-item">
                <Link to="/" className={`nav-link ${isActive('/')}`}>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/login" className="nav-link nav-admin-link">
                  Admin Login
                </Link>
              </li>
            </>
          )}
          {isAdminRoute() && isAuthenticated && (
            <>
              <li className="nav-item">
                <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard')}`}>
                  Dashboard
                </Link>
              </li>
              <PermissionGuard permissions={['employees.view', 'employees.create', 'employees.update', 'employees.delete']} requireAll={false}>
                <li className="nav-item">
                  <Link to="/admin/employees" className={`nav-link ${isActive('/admin/employees')}`}>
                    Employees
                  </Link>
                </li>
              </PermissionGuard>
              <PermissionGuard permissions={['projects.view', 'projects.create', 'projects.update', 'projects.delete']} requireAll={false}>
                <li className="nav-item">
                  <Link to="/admin/projects" className={`nav-link ${isActive('/admin/projects')}`}>
                    Projects
                  </Link>
                </li>
              </PermissionGuard>
              <PermissionGuard permission="admin_users.view">
                <li className="nav-item">
                  <Link to="/admin/users" className={`nav-link ${isActive('/admin/users')}`}>
                    Admin Users
                  </Link>
                </li>
              </PermissionGuard>
              <PermissionGuard permission="roles.view">
                <li className="nav-item">
                  <Link to="/admin/roles" className={`nav-link ${isActive('/admin/roles')}`}>
                    Roles
                  </Link>
                </li>
              </PermissionGuard>
              <li className="nav-item">
                <span className="nav-user-info">
                  Welcome, {currentUser?.full_name}
                </span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link nav-logout-btn">
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
