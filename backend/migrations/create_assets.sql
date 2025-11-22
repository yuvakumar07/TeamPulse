-- Asset Management Schema
-- This migration creates the assets table and adds asset permissions

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_tag VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for the asset',
  asset_type VARCHAR(50) NOT NULL COMMENT 'Type: Laptop, Desktop, Monitor, Phone, Tablet, etc.',
  brand VARCHAR(100) COMMENT 'Manufacturer/Brand name',
  model VARCHAR(100) COMMENT 'Model number/name',
  serial_number VARCHAR(100) UNIQUE COMMENT 'Serial number',
  specifications TEXT COMMENT 'Technical specifications (JSON or text)',
  status ENUM('Available', 'Assigned', 'Under Repair', 'Retired', 'Lost') DEFAULT 'Available' COMMENT 'Current status of the asset',
  assigned_to INT COMMENT 'Employee ID to whom asset is assigned',
  assigned_date DATE COMMENT 'Date when asset was assigned',
  notes TEXT COMMENT 'Additional notes or description',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_asset_tag (asset_tag),
  INDEX idx_asset_type (asset_type),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Asset management table';

-- Insert asset permissions
INSERT INTO permissions (module, action, name, description) VALUES
('assets', 'view', 'assets.view', 'View assets'),
('assets', 'create', 'assets.create', 'Create new assets'),
('assets', 'update', 'assets.update', 'Update existing assets'),
('assets', 'delete', 'assets.delete', 'Delete assets'),
('assets', 'assign', 'assets.assign', 'Assign assets to employees'),
('assets', 'export', 'assets.export', 'Export assets to Excel')
ON DUPLICATE KEY UPDATE module=module;

-- Assign asset permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.module = 'assets'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign view and export permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.module = 'assets'
  AND p.action IN ('view', 'create', 'update', 'assign', 'export')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign view permission to manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.module = 'assets'
  AND p.action IN ('view', 'export')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign view permission to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.module = 'assets'
  AND p.action = 'view'
ON DUPLICATE KEY UPDATE role_id=role_id;
