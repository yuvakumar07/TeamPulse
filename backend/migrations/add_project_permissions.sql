-- Add project permissions
INSERT INTO permissions (name, description) VALUES
('projects.view', 'Can view projects'),
('projects.create', 'Can create projects'),
('projects.update', 'Can update projects'),
('projects.delete', 'Can delete projects')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Grant project permissions to Admin role (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE name LIKE 'projects.%'
ON DUPLICATE KEY UPDATE permission_id=VALUES(permission_id);
