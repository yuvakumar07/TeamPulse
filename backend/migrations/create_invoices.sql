-- Create invoices and invoice_items tables for project invoice management

USE employee_management;

-- Create invoices table to store invoice header information
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INT NOT NULL,
  team_id INT DEFAULT NULL,
  invoice_month INT NOT NULL,
  invoice_year INT NOT NULL,
  status ENUM('Draft', 'Submitted', 'Approved', 'Paid', 'Cancelled') DEFAULT 'Draft',
  total_billing_hours DECIMAL(10,2) DEFAULT 0,
  total_leave_hours DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES project_teams(id) ON DELETE SET NULL,
  UNIQUE KEY unique_invoice (project_id, team_id, invoice_month, invoice_year)
);

-- Create invoice_items table to store individual employee billing details
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  employee_id INT NOT NULL,
  employee_name VARCHAR(100) NOT NULL,
  employee_role VARCHAR(100),
  role_type VARCHAR(50),
  billing_hours DECIMAL(10,2) DEFAULT 0,
  leave_hours DECIMAL(10,2) DEFAULT 0,
  cost_per_hour DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Create index for faster queries (IF NOT EXISTS supported in MySQL 8.0+)
CREATE INDEX IF NOT EXISTS idx_invoice_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_team ON invoices(team_id);
CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoices(invoice_year, invoice_month);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_employee ON invoice_items(employee_id);
