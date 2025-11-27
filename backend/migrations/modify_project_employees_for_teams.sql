-- Modify project_employees to link to project_teams instead of projects
-- Add team_id column to project_employees table
ALTER TABLE project_employees ADD COLUMN team_id INT NULL AFTER project_id;

-- For existing records, we need to handle them:
-- Option 1: Assign to first team of the project (if teams exist)
-- Option 2: Keep them at project level (team_id = NULL) temporarily

-- Add foreign key constraint for team_id
ALTER TABLE project_employees
ADD CONSTRAINT fk_project_employees_team
FOREIGN KEY (team_id) REFERENCES project_teams(id) ON DELETE CASCADE;

-- Note: After migration, project_id will remain for reference, but team_id becomes primary assignment
-- Employees MUST be assigned to a team (team_id required going forward)
-- The project_id helps with queries but team_id is the main relationship
