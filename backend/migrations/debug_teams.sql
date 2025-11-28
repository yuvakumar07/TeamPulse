-- Debug script to check teams in database

-- 1. Check total number of teams
SELECT 'Total Teams Count:' as info;
SELECT COUNT(*) as total_teams FROM project_teams;

-- 2. List all teams with their projects
SELECT '
All Teams with Projects:' as info;
SELECT
    pt.id,
    pt.agile_board_name,
    pt.agile_team_jira_key,
    p.id as project_id,
    p.project_team_name,
    pt.created_at
FROM project_teams pt
JOIN projects p ON pt.project_id = p.id
ORDER BY p.project_team_name, pt.agile_board_name;

-- 3. Check projects without teams
SELECT '
Projects without teams:' as info;
SELECT
    p.id,
    p.project_team_name,
    (SELECT COUNT(*) FROM project_teams WHERE project_id = p.id) as team_count
FROM projects p
WHERE (SELECT COUNT(*) FROM project_teams WHERE project_id = p.id) = 0;

-- 4. Sample query that the backend uses (getAllTeams)
SELECT '
Sample backend query result:' as info;
SELECT pt.*, p.project_team_name
FROM project_teams pt
JOIN projects p ON pt.project_id = p.id
ORDER BY p.project_team_name, pt.agile_board_name
LIMIT 10;
