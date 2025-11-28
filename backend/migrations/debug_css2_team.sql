-- Debug script to check css2 team assignments
-- Run this to see what data exists for the css2 team

-- 1. Find the css2 team
SELECT 'Team Information:' as info;
SELECT pt.id as team_id, pt.agile_board_name, pt.project_id, p.project_team_name
FROM project_teams pt
JOIN projects p ON pt.project_id = p.id
WHERE pt.agile_board_name LIKE '%css2%';

-- 2. Check all employees assigned to css2 team
SELECT '
Employees assigned to css2 team:' as info;
SELECT
    pt.agile_board_name as team_name,
    e.id as employee_id,
    e.sso,
    e.name,
    e.role,
    pe.allocation_percentage,
    pe.team_id,
    pe.project_id
FROM project_employees pe
JOIN employees e ON pe.employee_id = e.id
JOIN project_teams pt ON pe.team_id = pt.id
WHERE pt.agile_board_name LIKE '%css2%'
ORDER BY e.name;

-- 3. Check for any "allocated only" records in the same project
SELECT '
Allocated only employees (no team) in css2 project:' as info;
SELECT
    p.project_team_name,
    e.id as employee_id,
    e.sso,
    e.name,
    pe.allocation_percentage,
    pe.team_id,
    pe.project_id
FROM project_employees pe
JOIN employees e ON pe.employee_id = e.id
JOIN projects p ON pe.project_id = p.id
WHERE pe.team_id IS NULL
  AND pe.project_id IN (
    SELECT project_id
    FROM project_teams
    WHERE agile_board_name LIKE '%css2%'
  )
ORDER BY e.name;

-- 4. Check for duplicate records (same employee, same project, different team_id)
SELECT '
Duplicate allocations (same employee, multiple teams):' as info;
SELECT
    e.sso,
    e.name,
    COUNT(*) as record_count,
    SUM(pe.allocation_percentage) as total_allocation,
    GROUP_CONCAT(CONCAT(COALESCE(pt.agile_board_name, 'NO TEAM'), ' (', pe.allocation_percentage, '%)') SEPARATOR ', ') as assignments
FROM project_employees pe
JOIN employees e ON pe.employee_id = e.id
LEFT JOIN project_teams pt ON pe.team_id = pt.id
WHERE pe.project_id IN (
    SELECT project_id
    FROM project_teams
    WHERE agile_board_name LIKE '%css2%'
  )
GROUP BY e.id, e.sso, e.name
HAVING record_count > 1
ORDER BY total_allocation DESC;
