const db = require('../config/database');

// Get all projects with employee assignments
const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'project_team_name', 'agile_board_name', 'agile_team_jira_key', 'project_status', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM projects';
    let dataQuery = `
      SELECT p.*,
             COUNT(DISTINCT pe.employee_id) as employee_count,
             SUM(pe.allocation_percentage) as total_allocation
      FROM projects p
      LEFT JOIN project_employees pe ON p.id = pe.project_id
    `;
    const queryParams = [];
    const countParams = [];

    // Add status filter if provided
    if (status && status !== 'All') {
      countQuery += ' WHERE project_status = ?';
      dataQuery += ' WHERE p.project_status = ?';
      queryParams.push(status);
      countParams.push(status);
    }

    // Group by project for aggregation
    dataQuery += ' GROUP BY p.id';

    // Get total count for pagination
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add ordering and pagination
    dataQuery += ` ORDER BY p.${validSortField} ${validSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Get paginated projects
    const [projects] = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project by ID with employee details
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project details
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get assigned employees with their details
    const [employees] = await db.query(
      `SELECT pe.id as assignment_id, pe.allocation_percentage,
              e.id, e.sso, e.name, e.role, e.role_type, e.location
       FROM project_employees pe
       JOIN employees e ON pe.employee_id = e.id
       WHERE pe.project_id = ?
       ORDER BY e.name`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...projects[0],
        employees: employees
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Create new project with employee assignments
const createProject = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      project_team_name,
      agile_board_name,
      agile_team_jira_key,
      project_status,
      employees // Array of {employee_id, allocation_percentage}
    } = req.body;

    // Validation
    if (!project_team_name) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Project Team Name is required'
      });
    }

    // Insert project
    const [result] = await connection.query(
      `INSERT INTO projects
      (project_team_name, agile_board_name, agile_team_jira_key, project_status)
      VALUES (?, ?, ?, ?)`,
      [project_team_name, agile_board_name, agile_team_jira_key, project_status || 'Planning']
    );

    const projectId = result.insertId;

    // Insert employee assignments if provided
    if (employees && Array.isArray(employees) && employees.length > 0) {
      for (const emp of employees) {
        if (emp.employee_id && emp.allocation_percentage !== undefined) {
          // Validate allocation percentage
          if (emp.allocation_percentage < 0 || emp.allocation_percentage > 100) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'Allocation percentage must be between 0 and 100'
            });
          }

          await connection.query(
            `INSERT INTO project_employees (project_id, employee_id, allocation_percentage)
             VALUES (?, ?, ?)`,
            [projectId, emp.employee_id, emp.allocation_percentage]
          );
        }
      }
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'CREATE',
          'projects',
          projectId,
          `Created project: ${project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        id: projectId,
        project_team_name
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating project:', error);

    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update project and employee assignments
const updateProject = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      project_team_name,
      agile_board_name,
      agile_team_jira_key,
      project_status,
      employees // Array of {employee_id, allocation_percentage}
    } = req.body;

    // Check if project exists
    const [existing] = await connection.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update project
    await connection.query(
      `UPDATE projects
      SET project_team_name = ?, agile_board_name = ?, agile_team_jira_key = ?, project_status = ?
      WHERE id = ?`,
      [project_team_name, agile_board_name, agile_team_jira_key, project_status, id]
    );

    // Update employee assignments
    if (employees && Array.isArray(employees)) {
      // Delete existing assignments
      await connection.query('DELETE FROM project_employees WHERE project_id = ?', [id]);

      // Insert new assignments
      for (const emp of employees) {
        if (emp.employee_id && emp.allocation_percentage !== undefined) {
          // Validate allocation percentage
          if (emp.allocation_percentage < 0 || emp.allocation_percentage > 100) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: 'Allocation percentage must be between 0 and 100'
            });
          }

          await connection.query(
            `INSERT INTO project_employees (project_id, employee_id, allocation_percentage)
             VALUES (?, ?, ?)`,
            [id, emp.employee_id, emp.allocation_percentage]
          );
        }
      }
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'UPDATE',
          'projects',
          id,
          `Updated project: ${project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        id,
        project_team_name
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating project:', error);

    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project details before deletion for audit log
    const [projects] = await db.query(
      'SELECT project_team_name FROM projects WHERE id = ?',
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projects[0];

    // Delete project (CASCADE will handle project_employees)
    await db.query('DELETE FROM projects WHERE id = ?', [id]);

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'DELETE',
          'projects',
          id,
          `Deleted project: ${project.project_team_name}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
