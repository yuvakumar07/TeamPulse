-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_team_name VARCHAR(255) NOT NULL,
  agile_board_name VARCHAR(255),
  agile_team_jira_key VARCHAR(100),
  project_status ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'Planning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create project_employees junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS project_employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  employee_id INT NOT NULL,
  allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_employee (project_id, employee_id),
  CONSTRAINT check_allocation CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
);
