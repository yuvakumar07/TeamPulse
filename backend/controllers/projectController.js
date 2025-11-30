const db = require('../config/database');

// Get all projects with employee assignments
const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'project_team_name', 'project_status', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM projects p';
    let dataQuery = `
      SELECT p.*,
             COUNT(DISTINCT pe.employee_id) as employee_count,
             SUM(pe.allocation_percentage) as total_allocation,
             (SELECT COUNT(*) FROM project_teams pt WHERE pt.project_id = p.id) as team_count
      FROM projects p
      LEFT JOIN project_employees pe ON p.id = pe.project_id
    `;
    const queryParams = [];
    const countParams = [];
    const conditions = [];

    // Add status filter if provided
    if (status && status !== 'All') {
      conditions.push('p.project_status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push('p.project_team_name LIKE ?');
      queryParams.push(searchPattern);
      countParams.push(searchPattern);
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
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

    // Get project details with manager information
    const [projects] = await db.query(
      `SELECT p.*,
              om.id as offshore_manager_emp_id, om.sso as offshore_manager_sso,
              om.name as offshore_manager_name, om.role as offshore_manager_role,
              osm.id as onsite_manager_emp_id, osm.sso as onsite_manager_sso,
              osm.name as onsite_manager_name, osm.role as onsite_manager_role
       FROM projects p
       LEFT JOIN employees om ON p.offshore_manager_id = om.id
       LEFT JOIN employees osm ON p.onsite_manager_id = osm.id
       WHERE p.id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project teams with team lead information
    const [teams] = await db.query(
      `SELECT pt.*,
              otl.id as offshore_tl_emp_id, otl.sso as offshore_tl_sso,
              otl.name as offshore_tl_name, otl.role as offshore_tl_role,
              ostl.id as onsite_tl_emp_id, ostl.sso as onsite_tl_sso,
              ostl.name as onsite_tl_name, ostl.role as onsite_tl_role
       FROM project_teams pt
       LEFT JOIN employees otl ON pt.offshore_team_lead_id = otl.id
       LEFT JOIN employees ostl ON pt.onsite_team_lead_id = ostl.id
       WHERE pt.project_id = ?
       ORDER BY pt.created_at`,
      [id]
    );

    // Get employees grouped by teams
    const teamsWithEmployees = [];
    for (const team of teams) {
      // Get regular team employees
      const [employees] = await db.query(
        `SELECT pe.id as assignment_id, pe.allocation_percentage, pe.team_id,
                e.id, e.sso, e.name, e.role, e.role_type, e.location,
                (SELECT COALESCE(SUM(pe2.allocation_percentage), 0)
                 FROM project_employees pe2
                 WHERE pe2.employee_id = e.id) as total_allocation,
                FALSE as is_team_lead,
                NULL as team_lead_type
         FROM project_employees pe
         JOIN employees e ON pe.employee_id = e.id
         WHERE pe.team_id = ?
         ORDER BY e.name`,
        [team.id]
      );

      // Add offshore team lead to employees list if exists and not already in list
      if (team.offshore_tl_emp_id) {
        const isAlreadyInList = employees.some(emp => emp.id === team.offshore_tl_emp_id);
        if (!isAlreadyInList) {
          employees.push({
            assignment_id: null,
            allocation_percentage: team.offshore_team_lead_allocation,
            team_id: team.id,
            id: team.offshore_tl_emp_id,
            sso: team.offshore_tl_sso,
            name: team.offshore_tl_name,
            role: team.offshore_tl_role,
            role_type: 'Team Lead',
            location: null,
            total_allocation: team.offshore_team_lead_allocation,
            is_team_lead: true,
            team_lead_type: 'Offshore Team Lead'
          });
        } else {
          // Mark existing employee as team lead
          const empIndex = employees.findIndex(emp => emp.id === team.offshore_tl_emp_id);
          employees[empIndex].is_team_lead = true;
          employees[empIndex].team_lead_type = 'Offshore Team Lead';
        }
      }

      // Add onsite team lead to employees list if exists and not already in list
      if (team.onsite_tl_emp_id) {
        const isAlreadyInList = employees.some(emp => emp.id === team.onsite_tl_emp_id);
        if (!isAlreadyInList) {
          employees.push({
            assignment_id: null,
            allocation_percentage: team.onsite_team_lead_allocation,
            team_id: team.id,
            id: team.onsite_tl_emp_id,
            sso: team.onsite_tl_sso,
            name: team.onsite_tl_name,
            role: team.onsite_tl_role,
            role_type: 'Team Lead',
            location: null,
            total_allocation: team.onsite_team_lead_allocation,
            is_team_lead: true,
            team_lead_type: 'Onsite Team Lead'
          });
        } else {
          // Mark existing employee as team lead
          const empIndex = employees.findIndex(emp => emp.id === team.onsite_tl_emp_id);
          employees[empIndex].is_team_lead = true;
          employees[empIndex].team_lead_type = 'Onsite Team Lead';
        }
      }

      // Sort employees by team lead status (team leads first) then by name
      employees.sort((a, b) => {
        if (a.is_team_lead && !b.is_team_lead) return -1;
        if (!a.is_team_lead && b.is_team_lead) return 1;
        return a.name.localeCompare(b.name);
      });

      // Extract team lead info from team data
      const {
        offshore_tl_emp_id, offshore_tl_sso, offshore_tl_name, offshore_tl_role,
        onsite_tl_emp_id, onsite_tl_sso, onsite_tl_name, onsite_tl_role,
        ...baseTeamData
      } = team;

      // Structure team lead information
      const teamLeads = {
        offshore_team_lead: offshore_tl_emp_id ? {
          id: offshore_tl_emp_id,
          sso: offshore_tl_sso,
          name: offshore_tl_name,
          role: offshore_tl_role,
          allocation: team.offshore_team_lead_allocation
        } : null,
        onsite_team_lead: onsite_tl_emp_id ? {
          id: onsite_tl_emp_id,
          sso: onsite_tl_sso,
          name: onsite_tl_name,
          role: onsite_tl_role,
          allocation: team.onsite_team_lead_allocation
        } : null
      };

      teamsWithEmployees.push({
        ...baseTeamData,
        team_leads: teamLeads,
        employees: employees
      });
    }

    // Get total employee count across all teams
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT pe.employee_id) as total_employees
       FROM project_employees pe
       WHERE pe.project_id = ?`,
      [id]
    );

    // Get allocated employees (not assigned to any specific team yet)
    const [allocatedEmployees] = await db.query(
      `SELECT pe.id as assignment_id, pe.allocation_percentage,
              e.id, e.sso, e.name, e.role, e.role_type, e.location,
              (SELECT COALESCE(SUM(pe2.allocation_percentage), 0)
               FROM project_employees pe2
               WHERE pe2.employee_id = e.id) as total_allocation
       FROM project_employees pe
       JOIN employees e ON pe.employee_id = e.id
       WHERE pe.project_id = ? AND pe.team_id IS NULL
       ORDER BY e.name`,
      [id]
    );

    // Extract base project data (excluding manager employee details from spread)
    const projectData = projects[0];
    const {
      offshore_manager_emp_id, offshore_manager_sso, offshore_manager_name, offshore_manager_role,
      onsite_manager_emp_id, onsite_manager_sso, onsite_manager_name, onsite_manager_role,
      ...baseProjectData
    } = projectData;

    // Structure manager information
    const managers = {
      offshore_manager: offshore_manager_emp_id ? {
        id: offshore_manager_emp_id,
        sso: offshore_manager_sso,
        name: offshore_manager_name,
        role: offshore_manager_role,
        allocation: baseProjectData.offshore_manager_allocation
      } : null,
      onsite_manager: onsite_manager_emp_id ? {
        id: onsite_manager_emp_id,
        sso: onsite_manager_sso,
        name: onsite_manager_name,
        role: onsite_manager_role,
        allocation: baseProjectData.onsite_manager_allocation
      } : null
    };

    res.json({
      success: true,
      data: {
        ...baseProjectData,
        managers,
        teams: teamsWithEmployees,
        allocated_employees: allocatedEmployees,
        total_employees: countResult[0].total_employees
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
      project_status,
      offshore_manager_id,
      onsite_manager_id,
      offshore_manager_allocation,
      onsite_manager_allocation,
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

    // Validate allocation percentages
    if (offshore_manager_allocation && (offshore_manager_allocation < 0 || offshore_manager_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Offshore manager allocation must be between 0 and 100'
      });
    }

    if (onsite_manager_allocation && (onsite_manager_allocation < 0 || onsite_manager_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Onsite manager allocation must be between 0 and 100'
      });
    }

    // Insert project
    const [result] = await connection.query(
      `INSERT INTO projects
      (project_team_name, project_status, offshore_manager_id, onsite_manager_id,
       offshore_manager_allocation, onsite_manager_allocation)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        project_team_name,
        project_status || 'Planning',
        offshore_manager_id || null,
        onsite_manager_id || null,
        offshore_manager_allocation || 0,
        onsite_manager_allocation || 0
      ]
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
      project_status,
      offshore_manager_id,
      onsite_manager_id,
      offshore_manager_allocation,
      onsite_manager_allocation,
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

    // Validate allocation percentages
    if (offshore_manager_allocation && (offshore_manager_allocation < 0 || offshore_manager_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Offshore manager allocation must be between 0 and 100'
      });
    }

    if (onsite_manager_allocation && (onsite_manager_allocation < 0 || onsite_manager_allocation > 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Onsite manager allocation must be between 0 and 100'
      });
    }

    // Update project
    await connection.query(
      `UPDATE projects
      SET project_team_name = ?, project_status = ?, offshore_manager_id = ?, onsite_manager_id = ?,
          offshore_manager_allocation = ?, onsite_manager_allocation = ?
      WHERE id = ?`,
      [
        project_team_name,
        project_status,
        offshore_manager_id || null,
        onsite_manager_id || null,
        offshore_manager_allocation || 0,
        onsite_manager_allocation || 0,
        id
      ]
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

// Assign employees to project
const assignEmployeesToProject = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { employees } = req.body;

    // Check if project exists
    const [existing] = await connection.query(
      'SELECT project_team_name FROM projects WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const projectName = existing[0].project_team_name;

    // Validate employees array
    if (!employees || !Array.isArray(employees)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Employees array is required'
      });
    }

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

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'UPDATE',
          'projects',
          id,
          `Updated employee assignments for project: ${projectName}`,
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
        id,
        project_team_name: projectName
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning employees to project:', error);

    res.status(500).json({
      success: false,
      message: 'Error assigning employees to project',
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
  assignEmployeesToProject,
  deleteProject
};
