import React from 'react';
import authService from '../../services/authService';

/**
 * PermissionGuard Component
 *
 * Conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGuard permission="employees.create">
 *   <button>Add Employee</button>
 * </PermissionGuard>
 *
 * <PermissionGuard permissions={['employees.create', 'employees.update']} requireAll={false}>
 *   <button>Edit Employee</button>
 * </PermissionGuard>
 */

const PermissionGuard = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null
}) => {
  // Single permission check
  if (permission) {
    const hasPermission = authService.hasPermission(permission);
    return hasPermission ? children : fallback;
  }

  // Multiple permissions check
  if (permissions && Array.isArray(permissions)) {
    const hasPermissions = requireAll
      ? authService.hasAllPermissions(permissions)
      : authService.hasAnyPermission(permissions);

    return hasPermissions ? children : fallback;
  }

  // No permission specified, render children
  return children;
};

export default PermissionGuard;
