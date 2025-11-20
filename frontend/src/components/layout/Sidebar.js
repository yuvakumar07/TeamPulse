import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import PermissionGuard from '../auth/PermissionGuard';
import { DashboardIcon, EmployeesIcon, ProjectsIcon, AdminUsersIcon, RolesIcon } from '../icons/MenuIcons';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isAdminRoute = () => {
    return location.pathname.startsWith('/admin');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Don't show sidebar on admin login page or non-admin routes
  if (location.pathname === '/' || !isAdminRoute() || !isAuthenticated) {
    return null;
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}>
        <span className="toggle-icon">{isCollapsed ? '►' : '◄'}</span>
      </button>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/admin/dashboard" className={`sidebar-link ${isActive('/admin/dashboard')}`} title="Dashboard">
              <DashboardIcon className="sidebar-icon" />
              <span className="sidebar-text">Dashboard</span>
            </Link>
          </li>

          <PermissionGuard permissions={['employees.view', 'employees.create', 'employees.update', 'employees.delete']} requireAll={false}>
            <li className="sidebar-item">
              <Link to="/admin/employees" className={`sidebar-link ${isActive('/admin/employees')}`} title="Employees">
                <EmployeesIcon className="sidebar-icon" />
                <span className="sidebar-text">Employees</span>
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard permissions={['projects.view', 'projects.create', 'projects.update', 'projects.delete']} requireAll={false}>
            <li className="sidebar-item">
              <Link to="/admin/projects" className={`sidebar-link ${isActive('/admin/projects')}`} title="Projects">
                <ProjectsIcon className="sidebar-icon" />
                <span className="sidebar-text">Projects</span>
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard permission="admin_users.view">
            <li className="sidebar-item">
              <Link to="/admin/users" className={`sidebar-link ${isActive('/admin/users')}`} title="Admin Users">
                <AdminUsersIcon className="sidebar-icon" />
                <span className="sidebar-text">Admin Users</span>
              </Link>
            </li>
          </PermissionGuard>

          <PermissionGuard permission="roles.view">
            <li className="sidebar-item">
              <Link to="/admin/roles" className={`sidebar-link ${isActive('/admin/roles')}`} title="Roles">
                <RolesIcon className="sidebar-icon" />
                <span className="sidebar-text">Roles</span>
              </Link>
            </li>
          </PermissionGuard>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
