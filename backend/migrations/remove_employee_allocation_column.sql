-- Remove allocation_percentage column from project_employees table
-- This field is no longer used in employee assignment

USE employee_management;

-- Check if column exists before dropping to avoid errors
ALTER TABLE project_employees
DROP COLUMN IF EXISTS allocation_percentage;
