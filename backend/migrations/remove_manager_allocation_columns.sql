-- Remove manager allocation columns from projects table
-- These fields are no longer used in the project management form

USE employee_management;

-- Check if columns exist before dropping to avoid errors
ALTER TABLE projects
DROP COLUMN IF EXISTS offshore_manager_allocation,
DROP COLUMN IF EXISTS onsite_manager_allocation;
