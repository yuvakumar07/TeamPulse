const db = require('../config/database');
const xlsx = require('xlsx');

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
             0 as total_allocation,
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
        `SELECT pe.id as assignment_id, pe.team_id,
                e.id, e.sso, e.name, e.role, e.role_type, e.location,
                0 as total_allocation,
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
            allocation_percentage: 0,
            team_id: team.id,
            id: team.offshore_tl_emp_id,
            sso: team.offshore_tl_sso,
            name: team.offshore_tl_name,
            role: team.offshore_tl_role,
            role_type: 'Team Lead',
            location: null,
            total_allocation: 0,
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
            allocation_percentage: 0,
            team_id: team.id,
            id: team.onsite_tl_emp_id,
            sso: team.onsite_tl_sso,
            name: team.onsite_tl_name,
            role: team.onsite_tl_role,
            role_type: 'Team Lead',
            location: null,
            total_allocation: 0,
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
          role: offshore_tl_role
        } : null,
        onsite_team_lead: onsite_tl_emp_id ? {
          id: onsite_tl_emp_id,
          sso: onsite_tl_sso,
          name: onsite_tl_name,
          role: onsite_tl_role
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
      `SELECT pe.id as assignment_id,
              e.id, e.sso, e.name, e.role, e.role_type, e.location,
              0 as total_allocation
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
        role: offshore_manager_role
      } : null,
      onsite_manager: onsite_manager_emp_id ? {
        id: onsite_manager_emp_id,
        sso: onsite_manager_sso,
        name: onsite_manager_name,
        role: onsite_manager_role
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
      employees // Array of {employee_id}
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
      (project_team_name, project_status, offshore_manager_id, onsite_manager_id)
      VALUES (?, ?, ?, ?)`,
      [
        project_team_name,
        project_status || 'Planning',
        offshore_manager_id || null,
        onsite_manager_id || null
      ]
    );

    const projectId = result.insertId;

    // Insert employee assignments if provided
    if (employees && Array.isArray(employees) && employees.length > 0) {
      for (const emp of employees) {
        if (emp.employee_id) {
          await connection.query(
            `INSERT INTO project_employees (project_id, employee_id)
             VALUES (?, ?)`,
            [projectId, emp.employee_id]
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
      employees // Array of {employee_id}
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
      SET project_team_name = ?, project_status = ?, offshore_manager_id = ?, onsite_manager_id = ?
      WHERE id = ?`,
      [
        project_team_name,
        project_status,
        offshore_manager_id || null,
        onsite_manager_id || null,
        id
      ]
    );

    // Update employee assignments
    if (employees && Array.isArray(employees)) {
      // Delete existing assignments
      await connection.query('DELETE FROM project_employees WHERE project_id = ?', [id]);

      // Insert new assignments
      for (const emp of employees) {
        if (emp.employee_id) {
          await connection.query(
            `INSERT INTO project_employees (project_id, employee_id)
             VALUES (?, ?)`,
            [id, emp.employee_id]
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
      if (emp.employee_id) {
        await connection.query(
          `INSERT INTO project_employees (project_id, employee_id)
           VALUES (?, ?)`,
          [id, emp.employee_id]
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

// Import projects and teams from Excel/CSV
const importProjectsAndTeams = async (req, res) => {
  const connection = await db.getConnection();

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read the uploaded file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or contains no valid data'
      });
    }

    await connection.beginTransaction();

    const results = {
      total: data.length,
      projectsImported: 0,
      teamsImported: 0,
      skipped: 0,
      errors: []
    };

    const validStatuses = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];
    const projectCache = new Map(); // Cache to track created/existing projects

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header row)

      try {
        // Validate required fields
        if (!row.project_team_name || row.project_team_name.trim() === '') {
          results.errors.push({
            row: rowNum,
            error: 'Missing project_team_name'
          });
          results.skipped++;
          continue;
        }

        const projectTeamName = row.project_team_name.trim();
        let projectId = null;

        // Check if we've already processed this project in current import
        if (projectCache.has(projectTeamName)) {
          projectId = projectCache.get(projectTeamName);
        } else {
          // Validate project_status if provided
          let projectStatus = 'Planning'; // Default status
          if (row.project_status && row.project_status.trim() !== '') {
            const status = row.project_status.trim();
            if (validStatuses.includes(status)) {
              projectStatus = status;
            } else {
              results.errors.push({
                row: rowNum,
                error: `Invalid project_status: ${status}. Valid values are: ${validStatuses.join(', ')}`
              });
              results.skipped++;
              continue;
            }
          }

          // Check if project already exists in database
          const [existing] = await connection.query(
            'SELECT id FROM projects WHERE project_team_name = ?',
            [projectTeamName]
          );

          if (existing.length > 0) {
            // Project exists, use its ID
            projectId = existing[0].id;
            projectCache.set(projectTeamName, projectId);
          } else {
            // Create new project
            const [result] = await connection.query(
              `INSERT INTO projects (project_team_name, project_status)
               VALUES (?, ?)`,
              [projectTeamName, projectStatus]
            );
            projectId = result.insertId;
            projectCache.set(projectTeamName, projectId);
            results.projectsImported++;
          }
        }

        // Now handle team data if provided
        if (row.agile_board_name && row.agile_board_name.trim() !== '') {
          const agileBoardName = row.agile_board_name.trim();
          const agileTeamJiraKey = row.agile_team_jira_key?.trim() || null;

          // Check if this team already exists for this project
          const [existingTeam] = await connection.query(
            'SELECT id FROM project_teams WHERE project_id = ? AND agile_board_name = ?',
            [projectId, agileBoardName]
          );

          if (existingTeam.length > 0) {
            results.errors.push({
              row: rowNum,
              error: `Team "${agileBoardName}" already exists for project "${projectTeamName}"`
            });
            results.skipped++;
            continue;
          }

          // Insert team
          await connection.query(
            `INSERT INTO project_teams (project_id, agile_board_name, agile_team_jira_key)
             VALUES (?, ?, ?)`,
            [projectId, agileBoardName, agileTeamJiraKey]
          );

          results.teamsImported++;
        }
      } catch (error) {
        results.errors.push({
          row: rowNum,
          error: error.message
        });
        results.skipped++;
      }
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'IMPORT',
          'projects',
          null,
          `Imported ${results.projectsImported} projects and ${results.teamsImported} teams from ${req.file.originalname}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Import completed. ${results.projectsImported} projects and ${results.teamsImported} teams imported, ${results.skipped} skipped.`,
      results
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error importing projects and teams:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing projects and teams',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  assignEmployeesToProject,
  deleteProject,
  importProjectsAndTeams
};
