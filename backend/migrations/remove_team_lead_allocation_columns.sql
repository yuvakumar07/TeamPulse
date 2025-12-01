-- Remove team lead allocation columns from project_teams table
-- These fields are no longer used in the project management form

USE employee_management;

-- Check if columns exist before dropping to avoid errors
ALTER TABLE project_teams
DROP COLUMN IF EXISTS offshore_team_lead_allocation,
DROP COLUMN IF EXISTS onsite_team_lead_allocation;
