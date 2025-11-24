-- Add H1B visa tracking to employees table (SQLite version)

-- Note: SQLite doesn't support ADD COLUMN with constraints in the same statement
-- and doesn't support ENUM. We use CHECK constraints instead.

-- We'll need to handle this differently. Since SQLite has limited ALTER TABLE support,
-- we need to track these as new columns without CHECK constraints during ALTER

-- For SQLite, the best approach is to recreate the schema with visa columns included
-- This file serves as a reference for the columns to add

-- Create visa_history table to track visa changes over time
CREATE TABLE IF NOT EXISTS visa_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  visa_type TEXT NOT NULL CHECK(visa_type IN ('H1B', 'L1', 'L2', 'Green Card', 'US Citizen', 'Other', 'None')),
  visa_status TEXT NOT NULL CHECK(visa_status IN ('Active', 'Expired', 'In Process', 'Not Applicable')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  i94_expiry_date TEXT,
  passport_number TEXT,
  passport_expiry_date TEXT,
  sponsor_company TEXT,
  petition_number TEXT,
  receipt_number TEXT,
  approval_notice_number TEXT,
  filed_date TEXT,
  approved_date TEXT,
  denial_date TEXT,
  denial_reason TEXT,
  extension_count INTEGER DEFAULT 0,
  is_current INTEGER DEFAULT 0,
  notes TEXT,
  documents_path TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Create indexes for visa_history
CREATE INDEX IF NOT EXISTS idx_visa_history_employee_id ON visa_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_history_visa_type ON visa_history(visa_type);
CREATE INDEX IF NOT EXISTS idx_visa_history_visa_status ON visa_history(visa_status);
CREATE INDEX IF NOT EXISTS idx_visa_history_end_date ON visa_history(end_date);
CREATE INDEX IF NOT EXISTS idx_visa_history_is_current ON visa_history(is_current);

-- Create trigger for visa_history updated_at
CREATE TRIGGER IF NOT EXISTS visa_history_updated_at
AFTER UPDATE ON visa_history
FOR EACH ROW
BEGIN
  UPDATE visa_history SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Create visa_reminders table for tracking important dates
CREATE TABLE IF NOT EXISTS visa_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  visa_history_id INTEGER,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('Visa Expiry', 'I94 Expiry', 'Passport Expiry', 'Extension Due', 'Other')),
  reminder_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Sent', 'Acknowledged', 'Completed', 'Cancelled')),
  priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (visa_history_id) REFERENCES visa_history(id)
);

-- Create indexes for visa_reminders
CREATE INDEX IF NOT EXISTS idx_visa_reminders_employee_id ON visa_reminders(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_reminders_reminder_date ON visa_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_visa_reminders_status ON visa_reminders(status);

-- Create trigger for visa_reminders updated_at
CREATE TRIGGER IF NOT EXISTS visa_reminders_updated_at
AFTER UPDATE ON visa_reminders
FOR EACH ROW
BEGIN
  UPDATE visa_reminders SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Create view for upcoming visa expirations (within 90 days)
-- SQLite doesn't have DATEDIFF or DATE_ADD functions, so we use julianday
CREATE VIEW IF NOT EXISTS upcoming_visa_expirations AS
SELECT
  e.id as employee_id,
  e.name,
  e.sso,
  e.visa_type,
  e.visa_status,
  e.current_visa_end_date,
  e.i94_expiry_date,
  e.passport_expiry_date,
  CAST((julianday(e.current_visa_end_date) - julianday('now')) AS INTEGER) as days_until_visa_expiry,
  CAST((julianday(e.i94_expiry_date) - julianday('now')) AS INTEGER) as days_until_i94_expiry,
  CAST((julianday(e.passport_expiry_date) - julianday('now')) AS INTEGER) as days_until_passport_expiry
FROM employees e
WHERE
  (e.current_visa_end_date IS NOT NULL AND julianday(e.current_visa_end_date) >= julianday('now') AND julianday(e.current_visa_end_date) <= julianday('now', '+90 days'))
  OR (e.i94_expiry_date IS NOT NULL AND julianday(e.i94_expiry_date) >= julianday('now') AND julianday(e.i94_expiry_date) <= julianday('now', '+90 days'))
  OR (e.passport_expiry_date IS NOT NULL AND julianday(e.passport_expiry_date) >= julianday('now') AND julianday(e.passport_expiry_date) <= julianday('now', '+90 days'))
ORDER BY e.current_visa_end_date ASC;
