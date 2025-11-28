-- Add work_location column to employees table
-- This column stores whether the employee works onsite or offsite

ALTER TABLE employees
ADD COLUMN work_location VARCHAR(20) DEFAULT 'Onsite'
COMMENT 'Work location type: Onsite or Offsite'
AFTER notice_period_days;

-- Update existing records to have default value
UPDATE employees SET work_location = 'Onsite' WHERE work_location IS NULL;
