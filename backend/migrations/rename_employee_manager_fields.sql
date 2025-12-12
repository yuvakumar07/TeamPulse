-- Rename offshore_manager_id and onsite_manager_id to temp_offshore_manager_id and temp_onsite_manager_id in employees table

USE employee_management;

-- Rename offshore_manager_id to temp_offshore_manager_id
ALTER TABLE employees
CHANGE COLUMN offshore_manager_id temp_offshore_manager_id VARCHAR(255) NULL;

-- Rename onsite_manager_id to temp_onsite_manager_id
ALTER TABLE employees
CHANGE COLUMN onsite_manager_id temp_onsite_manager_id VARCHAR(255) NULL;
