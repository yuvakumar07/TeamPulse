-- Create project_teams table to allow multiple teams per project
CREATE TABLE IF NOT EXISTS project_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  agile_board_name VARCHAR(255) NOT NULL,
  agile_team_jira_key VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Migrate existing data from projects table to project_teams
-- Only migrate projects that have agile_board_name or agile_team_jira_key populated
INSERT INTO project_teams (project_id, agile_board_name, agile_team_jira_key)
SELECT
  id,
  COALESCE(agile_board_name, 'Default Team'),
  agile_team_jira_key
FROM projects
WHERE agile_board_name IS NOT NULL OR agile_team_jira_key IS NOT NULL;

-- Remove agile_board_name and agile_team_jira_key from projects table
ALTER TABLE projects DROP COLUMN agile_board_name;
ALTER TABLE projects DROP COLUMN agile_team_jira_key;
