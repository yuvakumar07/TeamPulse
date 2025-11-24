-- SQLite Schema for Employee Management

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sso TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT,
  role_type TEXT,
  phone TEXT,
  location TEXT,
  criticality TEXT DEFAULT 'Medium' CHECK(criticality IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'On Leave', 'Terminated')),
  skills TEXT,
  last_working_day TEXT,
  possible_candidate TEXT,
  asset_id TEXT,
  asset_return_id TEXT,
  comments TEXT,
  attrition TEXT DEFAULT 'No' CHECK(attrition IN ('Yes', 'No', 'At Risk')),
  offshore_manager_id INTEGER,
  onsite_manager_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (offshore_manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (onsite_manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS employees_updated_at
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
  UPDATE employees SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Insert sample data
INSERT INTO employees (sso, name, role, role_type, phone, location, criticality, status, skills, last_working_day, possible_candidate, asset_id, asset_return_id, comments, attrition, offshore_manager_id, onsite_manager_id) VALUES
('SSO001', 'John Doe', 'Software Engineer', 'DEV', '555-0101', 'New York', 'High', 'Active', 'Java, Python, React', NULL, NULL, 'ASSET001', NULL, 'Excellent performer', 'No', NULL, NULL),
('SSO002', 'Jane Smith', 'Marketing Manager', 'DEV', '555-0102', 'San Francisco', 'Critical', 'Active', 'Digital Marketing, SEO, Analytics', NULL, NULL, 'ASSET002', NULL, 'Team lead', 'No', NULL, NULL),
('SSO003', 'Robert Johnson', 'Sales Representative', 'DEV', '555-0103', 'Chicago', 'Medium', 'Active', 'Sales, CRM, Negotiation', NULL, NULL, 'ASSET003', NULL, 'Good sales record', 'No', NULL, NULL),
('SSO004', 'Emily Williams', 'HR Specialist', 'DEV', '555-0104', 'Boston', 'Medium', 'Active', 'Recruitment, HR Policies', NULL, NULL, 'ASSET004', NULL, 'Handles onboarding', 'No', NULL, NULL),
('SSO005', 'Michael Brown', 'Senior Developer', 'DEV', '555-0105', 'Seattle', 'Critical', 'Active', 'Node.js, AWS, Docker', NULL, NULL, 'ASSET005', NULL, 'Technical lead', 'No', NULL, NULL),
('SSO006', 'Sarah Davis', 'Product Manager', 'DEV', '555-0106', 'Austin', 'High', 'Active', 'Product Strategy, Agile', NULL, NULL, 'ASSET006', NULL, 'Managing product roadmap', 'No', NULL, NULL),
('SSO007', 'David Wilson', 'DevOps Engineer', 'Contract', '555-0107', 'Denver', 'High', 'Active', 'Kubernetes, CI/CD, Terraform', NULL, NULL, 'ASSET007', NULL, 'Infrastructure expert', 'No', NULL, NULL),
('SSO008', 'Lisa Anderson', 'Data Analyst', 'DEV', '555-0108', 'Portland', 'Medium', 'Active', 'SQL, Python, Tableau', NULL, NULL, 'ASSET008', NULL, 'Data insights', 'No', NULL, NULL),
('SSO009', 'James Taylor', 'UX Designer', 'DEV', '555-0109', 'Los Angeles', 'Medium', 'Active', 'Figma, User Research, Prototyping', NULL, NULL, 'ASSET009', NULL, 'Creative designer', 'No', NULL, NULL),
('SSO010', 'Maria Garcia', 'QA Engineer', 'DEV', '555-0110', 'Miami', 'Medium', 'Active', 'Test Automation, Selenium, JIRA', NULL, NULL, 'ASSET010', NULL, 'Quality assurance lead', 'No', NULL, NULL),
('SSO011', 'Christopher Martinez', 'Backend Developer', 'DEV', '555-0111', 'Dallas', 'High', 'Active', 'Python, Django, PostgreSQL', NULL, NULL, 'ASSET011', NULL, 'Backend specialist', 'No', NULL, NULL),
('SSO012', 'Jennifer Robinson', 'Frontend Developer', 'Part-Time', '555-0112', 'Phoenix', 'Low', 'Active', 'React, TypeScript, CSS', NULL, NULL, 'ASSET012', NULL, 'UI development', 'No', NULL, NULL),
('SSO013', 'Daniel Lee', 'Business Analyst', 'DEV', '555-0113', 'Atlanta', 'Medium', 'On Leave', 'Requirements Analysis, SQL', NULL, NULL, 'ASSET013', NULL, 'On medical leave', 'No', NULL, NULL),
('SSO014', 'Michelle Clark', 'Scrum Master', 'QA', '555-0114', 'Minneapolis', 'Medium', 'Active', 'Agile, Scrum, Jira', NULL, NULL, 'ASSET014', NULL, 'Facilitates sprints', 'No', NULL, NULL),
('SSO015', 'Kevin Rodriguez', 'Solutions Architect', 'QA', '555-0115', 'Tampa', 'Critical', 'Active', 'System Design, Microservices, Cloud', '2024-12-31', 'Alex Thompson', 'ASSET015', NULL, 'Planning to leave', 'At Risk', NULL, NULL);
