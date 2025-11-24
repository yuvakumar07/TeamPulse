-- Asset Management Schema (SQLite version)

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_tag TEXT NOT NULL UNIQUE,
  asset_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  specifications TEXT,
  status TEXT DEFAULT 'Available' CHECK(status IN ('Available', 'Assigned', 'Under Repair', 'Retired', 'Lost')),
  assigned_to INTEGER,
  assigned_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
);

-- Create indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);

-- Create trigger for assets updated_at
CREATE TRIGGER IF NOT EXISTS assets_updated_at
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
  UPDATE assets SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Insert asset permissions
INSERT OR IGNORE INTO permissions (module, action, name, description) VALUES
('assets', 'view', 'assets.view', 'View assets'),
('assets', 'create', 'assets.create', 'Create new assets'),
('assets', 'update', 'assets.update', 'Update existing assets'),
('assets', 'delete', 'assets.delete', 'Delete assets'),
('assets', 'assign', 'assets.assign', 'Assign assets to employees'),
('assets', 'export', 'assets.export', 'Export assets to Excel');

-- Assign asset permissions to super_admin role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
  AND p.module = 'assets';

-- Assign permissions to admin role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.module = 'assets'
  AND p.action IN ('view', 'create', 'update', 'assign', 'export');

-- Assign permissions to manager role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.module = 'assets'
  AND p.action IN ('view', 'export');

-- Assign view permission to viewer role
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.module = 'assets'
  AND p.action = 'view';
