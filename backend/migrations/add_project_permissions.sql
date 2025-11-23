-- Add project permissions
INSERT INTO permissions (module, action, name, description) VALUES
('projects', 'view', 'projects.view', 'View projects list and details'),
('projects', 'create', 'projects.create', 'Create new projects'),
('projects', 'update', 'projects.update', 'Update projects information'),
('projects', 'delete', 'projects.delete', 'Delete projects');

-- Grant project permissions to Admin role (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name LIKE 'projects.%'
ON DUPLICATE KEY UPDATE permission_id=VALUES(permission_id);
