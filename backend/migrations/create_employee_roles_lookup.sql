-- Create employee_roles lookup table
CREATE TABLE IF NOT EXISTS employee_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_name (role_name),
  INDEX idx_is_active (is_active)
);

-- Insert default employee roles
INSERT INTO employee_roles (role_name, description, is_active) VALUES
('Software Engineer', 'Software development and engineering roles', TRUE),
('Senior Software Engineer', 'Senior level software development roles', TRUE),
('Lead Engineer', 'Technical lead and team leadership roles', TRUE),
('Architect', 'System architecture and design roles', TRUE),
('QA Engineer', 'Quality assurance and testing roles', TRUE),
('Senior QA Engineer', 'Senior level QA and testing roles', TRUE),
('DevOps Engineer', 'DevOps and infrastructure roles', TRUE),
('Data Analyst', 'Data analysis and reporting roles', TRUE),
('Data Scientist', 'Data science and machine learning roles', TRUE),
('Product Manager', 'Product management roles', TRUE),
('Project Manager', 'Project management roles', TRUE),
('Scrum Master', 'Agile scrum master roles', TRUE),
('Business Analyst', 'Business analysis roles', TRUE),
('UX Designer', 'User experience design roles', TRUE),
('UI Developer', 'User interface development roles', TRUE),
('Full Stack Developer', 'Full stack development roles', TRUE),
('Frontend Developer', 'Frontend development roles', TRUE),
('Backend Developer', 'Backend development roles', TRUE),
('Mobile Developer', 'Mobile application development roles', TRUE),
('Database Administrator', 'Database administration roles', TRUE),
('System Administrator', 'System administration roles', TRUE),
('Technical Writer', 'Technical documentation roles', TRUE),
('HR Specialist', 'Human resources roles', TRUE),
('Marketing Manager', 'Marketing management roles', TRUE),
('Sales Representative', 'Sales and business development roles', TRUE),
('Solutions Architect', 'Solutions architecture roles', TRUE);

INSERT INTO employee_roles (role_name, description, is_active) VALUES
('Team Member', 'Team Member role', TRUE),
('Team Lead', 'Team Lead role', TRUE),
('Shadow', 'Shadow resource role', TRUE),
('Shadow Resource', 'Shadow resource role', TRUE),
('GDC SE', 'GDC Software Engineer', TRUE),
('SDC SE', 'SDC Software Engineer', TRUE),
('GDC SE/Lead', 'GDC SE / Lead role', TRUE),
('PM', 'Project Manager', TRUE),
('PMO', 'Project Management Office role', TRUE),
('Delivery Manager', 'Delivery Manager role', TRUE),
('Manager', 'Manager role', TRUE),
('Product Owner', 'Product Owner role', TRUE),
('Program Manager', 'Program Manager role', TRUE),
('Data Architect', 'Data Architect role', TRUE),
('Technical Manager', 'Technical Manager role', TRUE),
('Developer', 'Developer role', TRUE),
('Android Mobile Developer', 'Android Mobile Developer role', TRUE),
('SFDC Admin', 'SFDC Administrator role', TRUE),
('BA Lead', 'Business Analyst Lead role', TRUE);

