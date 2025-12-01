-- Add edit_invoice and delete_invoice permissions
INSERT INTO permissions (name, description, category, created_at, updated_at)
VALUES
  ('edit_invoice', 'Can edit invoices', 'invoices', NOW(), NOW()),
  ('delete_invoice', 'Can delete invoices', 'invoices', NOW(), NOW());

-- Assign permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
AND p.name IN ('edit_invoice', 'delete_invoice')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN ('edit_invoice', 'delete_invoice')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign permissions to manager role (edit only, not delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
AND p.name = 'edit_invoice'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
