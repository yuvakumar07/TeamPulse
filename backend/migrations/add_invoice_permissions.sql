-- Add invoice management permissions

USE employee_management;

-- Insert Permissions for Invoice Management Module
INSERT INTO permissions (module, action, name, description) VALUES
('invoices', 'view', 'invoices.view', 'View invoice list and details'),
('invoices', 'create', 'invoices.create', 'Create and generate invoices'),
('invoices', 'update', 'invoices.update', 'Update invoice information'),
('invoices', 'delete', 'invoices.delete', 'Delete invoices'),
('invoices', 'approve', 'invoices.approve', 'Approve invoices for payment'),
('invoices', 'export', 'invoices.export', 'Export invoice data');

-- Assign invoice permissions to Super Admin role (has all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
AND p.module = 'invoices'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign invoice view and create permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.module = 'invoices'
AND p.action IN ('view', 'create', 'update', 'export')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign invoice view permissions to Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
AND p.module = 'invoices'
AND p.action IN ('view', 'create')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign invoice view permissions to Viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.module = 'invoices'
AND p.action = 'view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
