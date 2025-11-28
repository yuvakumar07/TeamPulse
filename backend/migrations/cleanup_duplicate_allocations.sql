-- Clean up duplicate allocations where an employee has both:
-- 1. An "allocated only" record (team_id IS NULL)
-- 2. A "assigned to team" record (team_id IS NOT NULL)
-- for the same project

-- This migration removes the "allocated only" records when a team assignment exists
-- to prevent double-counting of allocation percentages

DELETE pe1
FROM project_employees pe1
WHERE pe1.team_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM project_employees pe2
    WHERE pe2.project_id = pe1.project_id
      AND pe2.employee_id = pe1.employee_id
      AND pe2.team_id IS NOT NULL
  );

-- This query deletes "allocated only" records (team_id IS NULL)
-- only when the same employee has at least one team assignment (team_id IS NOT NULL)
-- in the same project, preventing duplicate allocation counting.
