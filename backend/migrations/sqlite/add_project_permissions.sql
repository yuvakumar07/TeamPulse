-- Add project permissions (SQLite version)
INSERT OR IGNORE INTO permissions (module, action, name, description) VALUES
('projects', 'view', 'projects.view', 'View projects list and details'),
('projects', 'create', 'projects.create', 'Create new projects'),
('projects', 'update', 'projects.update', 'Update projects information'),
('projects', 'delete', 'projects.delete', 'Delete projects');

-- Grant project permissions to super_admin role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.module = 'projects';

-- Grant project permissions to admin role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.module = 'projects';
