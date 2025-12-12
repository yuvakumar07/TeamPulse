-- Modify temp_offshore_manager_id and temp_onsite_manager_id to VARCHAR fields
-- Drop foreign key constraints and change column types

-- Drop foreign key constraints
ALTER TABLE employees DROP FOREIGN KEY employees_ibfk_1;
ALTER TABLE employees DROP FOREIGN KEY employees_ibfk_2;

-- Modify columns to VARCHAR
ALTER TABLE employees
  MODIFY COLUMN temp_offshore_manager_id VARCHAR(255) NULL,
  MODIFY COLUMN temp_onsite_manager_id VARCHAR(255) NULL;

-- Note: Foreign key constraints are removed to allow text values instead of employee IDs
-- This allows storing manager names or external manager IDs
