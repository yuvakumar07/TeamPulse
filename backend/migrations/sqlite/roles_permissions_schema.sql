-- Roles and Permissions Schema for TeamPulse RBAC (SQLite version)

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Create trigger for roles updated_at
CREATE TRIGGER IF NOT EXISTS roles_updated_at
AFTER UPDATE ON roles
FOR EACH ROW
BEGIN
  UPDATE roles SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (module, action)
);

-- Create indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- 3. Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Insert System Roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions including user and role management', 1),
('admin', 'Administrator', 'Full access to employee management and reporting, can manage regular users', 1),
('manager', 'Manager', 'Can view and manage employees, limited administrative functions', 1),
('viewer', 'Viewer', 'Read-only access to employee data and reports', 1);

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

-- Add role_id column to admin_users if not exists
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN with FOREIGN KEY directly
-- We need to check if column exists first, but for simplicity in migrations:

-- For new installations, the admin_users table should be created with role_id
-- For existing installations, you may need to recreate the table

-- Insert default admin user with Super Admin role
-- Password hash is bcrypt hash of 'admin123'
INSERT OR REPLACE INTO admin_users (id, username, email, password_hash, full_name, role_id, status)
VALUES (
  1,
  'admin',
  'admin@teampulse.com',
  '$2b$10$4.bFoTAvpf4mdMP9erT5f.WG8yOBZLymsDQpBWFJoM/kkKaSHWDkK',
  'System Administrator',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  'Active'
);

-- Note: The password for the default admin is 'admin123'
-- You should change this password immediately after first login

-- Create index for admin_users role_id
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);

-- View to easily see role permissions
CREATE VIEW IF NOT EXISTS role_permissions_view AS
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
CREATE VIEW IF NOT EXISTS admin_users_with_roles AS
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
