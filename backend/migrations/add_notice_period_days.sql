-- Add notice_period_days column to employees table
-- This column stores the number of days notice required before an employee leaves

ALTER TABLE employees
ADD COLUMN notice_period_days INT NULL
COMMENT 'Number of days notice period required (e.g., 30, 60, 90 days)'
AFTER attrition;

-- Optional: Update existing records with default values based on role_type or criticality
-- Uncomment below if you want to set default values for existing employees
-- UPDATE employees SET notice_period_days = 30 WHERE role_type = 'DEV' AND notice_period_days IS NULL;
-- UPDATE employees SET notice_period_days = 60 WHERE criticality IN ('High', 'Critical') AND notice_period_days IS NULL;
