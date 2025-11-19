-- Add H1B visa tracking to employees table

-- Add visa-related columns to employees table
ALTER TABLE employees
ADD COLUMN visa_type ENUM('H1B', 'L1', 'L2', 'Green Card', 'US Citizen', 'Other', 'None') DEFAULT 'None' AFTER onsite_manager_id,
ADD COLUMN visa_status ENUM('Active', 'Expired', 'In Process', 'Not Applicable') DEFAULT 'Not Applicable' AFTER visa_type,
ADD COLUMN current_visa_start_date DATE AFTER visa_status,
ADD COLUMN current_visa_end_date DATE AFTER current_visa_start_date,
ADD COLUMN i94_expiry_date DATE AFTER current_visa_end_date,
ADD COLUMN passport_number VARCHAR(50) AFTER i94_expiry_date,
ADD COLUMN passport_expiry_date DATE AFTER passport_number,
ADD COLUMN sponsor_company VARCHAR(200) AFTER passport_expiry_date,
ADD COLUMN visa_notes TEXT AFTER sponsor_company;

-- Create visa_history table to track visa changes over time
CREATE TABLE IF NOT EXISTS visa_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  visa_type ENUM('H1B', 'L1', 'L2', 'Green Card', 'US Citizen', 'Other', 'None') NOT NULL,
  visa_status ENUM('Active', 'Expired', 'In Process', 'Not Applicable') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  i94_expiry_date DATE,
  passport_number VARCHAR(50),
  passport_expiry_date DATE,
  sponsor_company VARCHAR(200),
  petition_number VARCHAR(100),
  receipt_number VARCHAR(100),
  approval_notice_number VARCHAR(100),
  filed_date DATE,
  approved_date DATE,
  denial_date DATE,
  denial_reason TEXT,
  extension_count INT DEFAULT 0,
  is_current BOOLEAN DEFAULT FALSE,
  notes TEXT,
  documents_path VARCHAR(500),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employee_id),
  INDEX idx_visa_type (visa_type),
  INDEX idx_visa_status (visa_status),
  INDEX idx_end_date (end_date),
  INDEX idx_is_current (is_current)
);

-- Create visa_reminders table for tracking important dates
CREATE TABLE IF NOT EXISTS visa_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  visa_history_id INT,
  reminder_type ENUM('Visa Expiry', 'I94 Expiry', 'Passport Expiry', 'Extension Due', 'Other') NOT NULL,
  reminder_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Pending', 'Sent', 'Acknowledged', 'Completed', 'Cancelled') DEFAULT 'Pending',
  priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employee_id),
  INDEX idx_reminder_date (reminder_date),
  INDEX idx_status (status)
);

-- Create view for upcoming visa expirations (within 90 days)
CREATE OR REPLACE VIEW upcoming_visa_expirations AS
SELECT
  e.id as employee_id,
  e.name,
  e.sso,
  e.visa_type,
  e.visa_status,
  e.current_visa_end_date,
  e.i94_expiry_date,
  e.passport_expiry_date,
  DATEDIFF(e.current_visa_end_date, CURDATE()) as days_until_visa_expiry,
  DATEDIFF(e.i94_expiry_date, CURDATE()) as days_until_i94_expiry,
  DATEDIFF(e.passport_expiry_date, CURDATE()) as days_until_passport_expiry
FROM employees e
WHERE
  (e.current_visa_end_date IS NOT NULL AND e.current_visa_end_date >= CURDATE() AND e.current_visa_end_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY))
  OR (e.i94_expiry_date IS NOT NULL AND e.i94_expiry_date >= CURDATE() AND e.i94_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY))
  OR (e.passport_expiry_date IS NOT NULL AND e.passport_expiry_date >= CURDATE() AND e.passport_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY))
ORDER BY e.current_visa_end_date ASC;

-- Add indexes for performance
CREATE INDEX idx_visa_type ON employees(visa_type);
CREATE INDEX idx_visa_status ON employees(visa_status);
CREATE INDEX idx_visa_end_date ON employees(current_visa_end_date);
CREATE INDEX idx_i94_expiry ON employees(i94_expiry_date);
