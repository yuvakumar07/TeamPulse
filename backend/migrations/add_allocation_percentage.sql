-- Add allocation_percentage column to project_employees table
-- This field tracks what percentage each employee is allocated to a team

USE employee_management;

-- Add allocation_percentage column with default 0.00
ALTER TABLE project_employees
ADD COLUMN IF NOT EXISTS allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- Add check constraint to ensure percentage is between 0 and 100
-- Note: MySQL 8.0.16+ supports CHECK constraints
ALTER TABLE project_employees
ADD CONSTRAINT check_allocation_percentage
CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100);
