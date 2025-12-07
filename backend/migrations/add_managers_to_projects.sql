-- Add offshore and onsite manager columns to projects table

USE teampulse;

-- Add manager columns to projects table
ALTER TABLE projects
ADD COLUMN offshore_manager_id INT DEFAULT NULL AFTER project_status,
ADD COLUMN onsite_manager_id INT DEFAULT NULL AFTER offshore_manager_id,
ADD FOREIGN KEY (offshore_manager_id) REFERENCES employees(id) ON DELETE SET NULL,
ADD FOREIGN KEY (onsite_manager_id) REFERENCES employees(id) ON DELETE SET NULL;
