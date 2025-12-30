-- PO (Purchase Order) Management Schema
-- This migration creates the pos table and adds PO permissions

-- Create pos table
CREATE TABLE IF NOT EXISTS pos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique PO number',
  po_owner_name VARCHAR(255) NOT NULL COMMENT 'Name of the PO owner',
  project_id INT COMMENT 'Associated project ID',
  start_date DATE COMMENT 'PO start date',
  end_date DATE COMMENT 'PO end date',
  amount DECIMAL(15, 2) COMMENT 'PO amount',
  status ENUM('Active', 'Closed', 'Pending', 'Expired') DEFAULT 'Active' COMMENT 'Current status of the PO',
  description TEXT COMMENT 'PO description or notes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_po_number (po_number),
  INDEX idx_po_owner_name (po_owner_name),
  INDEX idx_status (status),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Purchase Order management table';

-- Insert PO permissions
INSERT INTO permissions (module, action, name, description) VALUES
('pos', 'view', 'pos.view', 'View purchase orders'),
('pos', 'create', 'pos.create', 'Create new purchase orders'),
('pos', 'update', 'pos.update', 'Update existing purchase orders'),
('pos', 'delete', 'pos.delete', 'Delete purchase orders'),
('pos', 'export', 'pos.export', 'Export purchase orders to Excel')
ON DUPLICATE KEY UPDATE module=module;

-- Assign PO permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.module = 'pos'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.module = 'pos'
  AND p.action IN ('view', 'create', 'update', 'export')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign view permission to manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.module = 'pos'
  AND p.action IN ('view', 'export')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign view permission to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.module = 'pos'
  AND p.action = 'view'
ON DUPLICATE KEY UPDATE role_id=role_id;
