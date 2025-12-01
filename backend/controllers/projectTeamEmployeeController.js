const db = require('../config/database');

// Get all employees assigned to a team
const getTeamEmployees = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get team details first
    const [teams] = await db.query(
      `SELECT pt.*, p.project_team_name
       FROM project_teams pt
       JOIN projects p ON pt.project_id = p.id
       WHERE pt.id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get assigned employees with their details
    const [employees] = await db.query(
      `SELECT pe.id as assignment_id, pe.team_id,
              e.id, e.sso, e.name, e.role, e.role_type, e.location,
              0 as total_allocation
       FROM project_employees pe
       JOIN employees e ON pe.employee_id = e.id
       WHERE pe.team_id = ?
       ORDER BY e.name`,
      [teamId]
    );

    res.json({
      success: true,
      data: {
        team: teams[0],
        employees: employees
      }
    });
  } catch (error) {
    console.error('Error fetching team employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team employees',
      error: error.message
    });
  }
};

// Assign employees to a team
const assignEmployeesToTeam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { teamId } = req.params;
    const { employees } = req.body;

    // Check if team exists and get project info
    const [teams] = await connection.query(
      `SELECT pt.*, p.project_team_name, p.id as project_id
       FROM project_teams pt
       JOIN projects p ON pt.project_id = p.id
       WHERE pt.id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teams[0];

    // Validate employees array
    if (!employees || !Array.isArray(employees)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Employees array is required'
      });
    }

    // Delete existing assignments for this team
    await connection.query('DELETE FROM project_employees WHERE team_id = ?', [teamId]);

    // Insert new assignments
    for (const emp of employees) {
      if (emp.employee_id) {
        // Delete any "allocated only" record (team_id = NULL) for this employee in this project
        // This prevents duplicate allocations when moving from "allocated only" to "assigned to team"
        await connection.query(
          `DELETE FROM project_employees
           WHERE project_id = ? AND employee_id = ? AND team_id IS NULL`,
          [team.project_id, emp.employee_id]
        );

        // Insert the new team assignment
        await connection.query(
          `INSERT INTO project_employees (project_id, team_id, employee_id)
           VALUES (?, ?, ?)`,
          [team.project_id, teamId, emp.employee_id]
        );
      }
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'UPDATE',
          'project_team_employees',
          teamId,
          `Updated employee assignments for team "${team.agile_board_name}" in project: ${team.project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Employee assignments updated successfully',
      data: {
        team_id: teamId,
        team_name: team.agile_board_name
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning employees to team:', error);

    res.status(500).json({
      success: false,
      message: 'Error assigning employees to team',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Remove an employee from a team
const removeEmployeeFromTeam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { assignmentId } = req.params;

    // Get assignment details before deletion
    const [assignments] = await connection.query(
      `SELECT pe.*, e.name as employee_name, pt.agile_board_name, p.project_team_name
       FROM project_employees pe
       JOIN employees e ON pe.employee_id = e.id
       JOIN project_teams pt ON pe.team_id = pt.id
       JOIN projects p ON pe.project_id = p.id
       WHERE pe.id = ?`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignment = assignments[0];

    // Delete assignment
    await connection.query('DELETE FROM project_employees WHERE id = ?', [assignmentId]);

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'DELETE',
          'project_team_employees',
          assignmentId,
          `Removed ${assignment.employee_name} from team "${assignment.agile_board_name}" in project: ${assignment.project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Employee removed from team successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error removing employee from team:', error);

    res.status(500).json({
      success: false,
      message: 'Error removing employee from team',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getTeamEmployees,
  assignEmployeesToTeam,
  removeEmployeeFromTeam
};
