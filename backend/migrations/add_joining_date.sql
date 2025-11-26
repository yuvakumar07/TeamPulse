-- Add joining_date column to employees table
USE employee_management;

ALTER TABLE employees
ADD COLUMN joining_date DATE AFTER last_working_day;

-- Add index for better query performance
CREATE INDEX idx_joining_date ON employees(joining_date);
