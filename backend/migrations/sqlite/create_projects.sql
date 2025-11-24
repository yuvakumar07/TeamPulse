-- Create projects table (SQLite version)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_team_name TEXT NOT NULL,
  agile_board_name TEXT,
  agile_team_jira_key TEXT,
  project_status TEXT DEFAULT 'Planning' CHECK(project_status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create trigger for projects updated_at
CREATE TRIGGER IF NOT EXISTS projects_updated_at
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Create project_employees junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  allocation_percentage REAL NOT NULL DEFAULT 0.00,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE (project_id, employee_id),
  CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
);

-- Create trigger for project_employees updated_at
CREATE TRIGGER IF NOT EXISTS project_employees_updated_at
AFTER UPDATE ON project_employees
FOR EACH ROW
BEGIN
  UPDATE project_employees SET updated_at = datetime('now') WHERE id = OLD.id;
END;
