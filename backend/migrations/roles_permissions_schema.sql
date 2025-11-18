-- Roles and Permissions Schema for TeamPulse RBAC

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_module_action (module, action),
  INDEX idx_module (module),
  INDEX idx_name (name)
);

-- 3. Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
);

-- 4. Add role_id to admin_users table
ALTER TABLE admin_users
ADD COLUMN role_id INT NULL AFTER status,
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Insert System Roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions including user and role management', TRUE),
('admin', 'Administrator', 'Full access to employee management and reporting, can manage regular users', TRUE),
('manager', 'Manager', 'Can view and manage employees, limited administrative functions', TRUE),
('viewer', 'Viewer', 'Read-only access to employee data and reports', TRUE);

-- Insert Permissions for Employee Management Module
INSERT INTO permissions (module, action, name, description) VALUES
('employees', 'view', 'employees.view', 'View employee list and details'),
('employees', 'create', 'employees.create', 'Create new employees'),
('employees', 'update', 'employees.update', 'Update employee information'),
('employees', 'delete', 'employees.delete', 'Delete employees'),
('employees', 'export', 'employees.export', 'Export employee data to Excel');

-- Insert Permissions for Admin User Management Module
INSERT INTO permissions (module, action, name, description) VALUES
('admin_users', 'view', 'admin_users.view', 'View admin user list and details'),
('admin_users', 'create', 'admin_users.create', 'Create new admin users'),
('admin_users', 'update', 'admin_users.update', 'Update admin user information'),
('admin_users', 'delete', 'admin_users.delete', 'Delete admin users'),
('admin_users', 'change_role', 'admin_users.change_role', 'Change admin user roles');

-- Insert Permissions for Role Management Module
INSERT INTO permissions (module, action, name, description) VALUES
('roles', 'view', 'roles.view', 'View roles and permissions'),
('roles', 'create', 'roles.create', 'Create custom roles'),
('roles', 'update', 'roles.update', 'Update role permissions'),
('roles', 'delete', 'roles.delete', 'Delete custom roles');

-- Insert Permissions for Audit Logs Module
INSERT INTO permissions (module, action, name, description) VALUES
('audit_logs', 'view', 'audit_logs.view', 'View audit logs and activity history'),
('audit_logs', 'export', 'audit_logs.export', 'Export audit logs');

-- Insert Permissions for Dashboard Module
INSERT INTO permissions (module, action, name, description) VALUES
('dashboard', 'view', 'dashboard.view', 'View dashboard and statistics'),
('dashboard', 'view_analytics', 'dashboard.view_analytics', 'View detailed analytics and reports');

-- Assign Permissions to Super Admin (ALL permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE name = 'super_admin'),
  id
FROM permissions;

-- Assign Permissions to Admin Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE name = 'admin'),
  id
FROM permissions
WHERE module IN ('employees', 'dashboard', 'audit_logs')
   OR name IN ('admin_users.view', 'admin_users.create', 'admin_users.update');

-- Assign Permissions to Manager Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE name = 'manager'),
  id
FROM permissions
WHERE module IN ('employees', 'dashboard')
   OR name = 'audit_logs.view';

-- Assign Permissions to Viewer Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE name = 'viewer'),
  id
FROM permissions
WHERE action = 'view'
   AND module IN ('employees', 'dashboard', 'audit_logs');

-- Update existing admin user to Super Admin role
UPDATE admin_users
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
WHERE username = 'admin';

-- Create indexes for performance
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);

-- View to easily see role permissions
CREATE OR REPLACE VIEW role_permissions_view AS
SELECT
  r.id as role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  p.id as permission_id,
  p.module,
  p.action,
  p.name as permission_name,
  p.description as permission_description
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.id, p.module, p.action;

-- View to see admin users with their roles and permissions
CREATE OR REPLACE VIEW admin_users_with_roles AS
SELECT
  au.id,
  au.username,
  au.email,
  au.full_name,
  au.status,
  r.id as role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  r.description as role_description,
  au.last_login,
  au.created_at
FROM admin_users au
LEFT JOIN roles r ON au.role_id = r.id;

-- Summary of Roles and Permission Counts
SELECT
  r.name as role,
  r.display_name,
  COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY permission_count DESC;
