-- Admin Users Table (SQLite version)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id INTEGER,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Suspended')),
  last_login TEXT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_status ON admin_users(status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS admin_users_updated_at
AFTER UPDATE ON admin_users
FOR EACH ROW
BEGIN
  UPDATE admin_users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Audit Logs Table (SQLite version)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- Note: Default admin user will be created in roles_permissions_schema.sql
-- after roles are set up, so the admin can be assigned the super_admin role
