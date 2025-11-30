const db = require('../config/database');

// Get all teams across all projects
const getAllTeams = async (req, res) => {
  try {
    const [teams] = await db.query(
      `SELECT pt.*, p.project_team_name
       FROM project_teams pt
       JOIN projects p ON pt.project_id = p.id
       ORDER BY p.project_team_name, pt.agile_board_name`
    );

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching all teams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
};

// Get all teams for a project
const getProjectTeams = async (req, res) => {
  try {
    const { projectId } = req.params;

    const [teams] = await db.query(
      'SELECT * FROM project_teams WHERE project_id = ? ORDER BY created_at',
      [projectId]
    );

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching project teams:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project teams',
      error: error.message
    });
  }
};

// Create a new team for a project
const createProjectTeam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { projectId } = req.params;
    const {
      agile_board_name,
      agile_team_jira_key,
      offshore_team_lead_id,
      onsite_team_lead_id,
      offshore_team_lead_allocation,
      onsite_team_lead_allocation
    } = req.body;

    // Validation
    if (!agile_board_name || !agile_board_name.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Agile Board Name is required'
      });
    }

    // Validate allocation percentages
    if (offshore_team_lead_allocation && (offshore_team_lead_allocation < 0 || offshore_team_lead_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Offshore team lead allocation must be between 0 and 100'
      });
    }

    if (onsite_team_lead_allocation && (onsite_team_lead_allocation < 0 || onsite_team_lead_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Onsite team lead allocation must be between 0 and 100'
      });
    }

    // Check if project exists
    const [projects] = await connection.query(
      'SELECT project_team_name FROM projects WHERE id = ?',
      [projectId]
    );

    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Insert team
    const [result] = await connection.query(
      `INSERT INTO project_teams
       (project_id, agile_board_name, agile_team_jira_key,
        offshore_team_lead_id, onsite_team_lead_id,
        offshore_team_lead_allocation, onsite_team_lead_allocation)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        agile_board_name.trim(),
        agile_team_jira_key?.trim() || null,
        offshore_team_lead_id || null,
        onsite_team_lead_id || null,
        offshore_team_lead_allocation || 0,
        onsite_team_lead_allocation || 0
      ]
    );

    const teamId = result.insertId;

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'CREATE',
          'project_teams',
          teamId,
          `Created team "${agile_board_name}" for project: ${projects[0].project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        id: teamId,
        project_id: projectId,
        agile_board_name,
        agile_team_jira_key
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating project team:', error);

    res.status(500).json({
      success: false,
      message: 'Error creating project team',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update a team
const updateProjectTeam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { teamId } = req.params;
    const {
      agile_board_name,
      agile_team_jira_key,
      offshore_team_lead_id,
      onsite_team_lead_id,
      offshore_team_lead_allocation,
      onsite_team_lead_allocation
    } = req.body;

    // Validation
    if (!agile_board_name || !agile_board_name.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Agile Board Name is required'
      });
    }

    // Validate allocation percentages
    if (offshore_team_lead_allocation && (offshore_team_lead_allocation < 0 || offshore_team_lead_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Offshore team lead allocation must be between 0 and 100'
      });
    }

    if (onsite_team_lead_allocation && (onsite_team_lead_allocation < 0 || onsite_team_lead_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Onsite team lead allocation must be between 0 and 100'
      });
    }

    // Check if team exists and get project info
    const [teams] = await connection.query(
      `SELECT pt.*, p.project_team_name
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

    // Update team
    await connection.query(
      `UPDATE project_teams
       SET agile_board_name = ?, agile_team_jira_key = ?,
           offshore_team_lead_id = ?, onsite_team_lead_id = ?,
           offshore_team_lead_allocation = ?, onsite_team_lead_allocation = ?
       WHERE id = ?`,
      [
        agile_board_name.trim(),
        agile_team_jira_key?.trim() || null,
        offshore_team_lead_id || null,
        onsite_team_lead_id || null,
        offshore_team_lead_allocation || 0,
        onsite_team_lead_allocation || 0,
        teamId
      ]
    );

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'UPDATE',
          'project_teams',
          teamId,
          `Updated team "${agile_board_name}" for project: ${team.project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: {
        id: teamId,
        agile_board_name,
        agile_team_jira_key
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating project team:', error);

    res.status(500).json({
      success: false,
      message: 'Error updating project team',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete a team
const deleteProjectTeam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { teamId } = req.params;

    // Get team details before deletion for audit log
    const [teams] = await connection.query(
      `SELECT pt.*, p.project_team_name
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

    // Delete team
    await connection.query('DELETE FROM project_teams WHERE id = ?', [teamId]);

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'DELETE',
          'project_teams',
          teamId,
          `Deleted team "${team.agile_board_name}" from project: ${team.project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting project team:', error);

    res.status(500).json({
      success: false,
      message: 'Error deleting project team',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllTeams,
  getProjectTeams,
  createProjectTeam,
  updateProjectTeam,
  deleteProjectTeam
};
