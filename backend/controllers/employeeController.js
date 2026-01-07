const db = require('../config/database');
const xlsx = require('xlsx');

// Helper function to calculate visa status based on dates
const calculateVisaStatus = (visaType, startDate, endDate) => {
  if (!visaType || visaType === 'None' || visaType === 'US Citizen' || visaType === 'Green Card') {
    return 'Not Applicable';
  }

  if (!startDate && !endDate) {
    return 'In Process';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    if (start > today) {
      return 'In Process';
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      return 'Expired';
    }
  }

  return 'Active';
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const roleType = req.query.role_type;
    const role = req.query.role;
    const search = req.query.search;
    const project = req.query.project;
    const team = req.query.team;
    const status = req.query.status;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'sso', 'name', 'role', 'role_type', 'phone', 'location', 'work_location', 'criticality', 'status', 'skills', 'attrition', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM employees e
      LEFT JOIN project_employees pe ON e.id = pe.employee_id
      LEFT JOIN projects p ON pe.project_id = p.id
      LEFT JOIN project_teams pt ON pe.team_id = pt.id
    `;
    let dataQuery = `
      SELECT e.*,
             COALESCE((SELECT SUM(pe2.allocation_percentage)
                       FROM project_employees pe2
                       WHERE pe2.employee_id = e.id), 0) +
             COALESCE((SELECT SUM(p2.offshore_manager_allocation)
                       FROM projects p2
                       WHERE p2.offshore_manager_id = e.id), 0) +
             COALESCE((SELECT SUM(p2.onsite_manager_allocation)
                       FROM projects p2
                       WHERE p2.onsite_manager_id = e.id), 0) +
             COALESCE((SELECT SUM(pt2.offshore_team_lead_allocation)
                       FROM project_teams pt2
                       WHERE pt2.offshore_team_lead_id = e.id), 0) +
             COALESCE((SELECT SUM(pt2.onsite_team_lead_allocation)
                       FROM project_teams pt2
                       WHERE pt2.onsite_team_lead_id = e.id), 0) as total_allocation,
             GROUP_CONCAT(
               DISTINCT CONCAT(p.project_team_name, ':', IFNULL(pt.agile_board_name, 'Not Assigned'))
               ORDER BY p.project_team_name
               SEPARATOR '||'
             ) as allocated_projects,
             GROUP_CONCAT(DISTINCT p.project_team_name ORDER BY p.project_team_name SEPARATOR ', ') as project_team_name,
             GROUP_CONCAT(DISTINCT p.project_status ORDER BY p.project_team_name SEPARATOR ', ') as project_status,
             GROUP_CONCAT(DISTINCT pt.agile_board_name ORDER BY p.project_team_name SEPARATOR ', ') as agile_board_name,
             GROUP_CONCAT(DISTINCT pt.agile_team_jira_key ORDER BY p.project_team_name SEPARATOR ', ') as agile_team_jira_key,
             COUNT(DISTINCT a.id) as asset_count,
             GROUP_CONCAT(
               DISTINCT CONCAT(a.asset_tag, ':', a.asset_type, ':', a.status)
               ORDER BY a.asset_tag
               SEPARATOR '||'
             ) as assigned_assets,
             COALESCE(SUM(ii.total_amount), 0) as invoice_total_amount
      FROM employees e
      LEFT JOIN project_employees pe ON e.id = pe.employee_id
      LEFT JOIN projects p ON pe.project_id = p.id
      LEFT JOIN project_teams pt ON pe.team_id = pt.id
      LEFT JOIN assets a ON e.id = a.assigned_to
      LEFT JOIN invoice_items ii ON e.id = ii.employee_id
    `;
    const queryParams = [];
    const countParams = [];
    const conditions = [];

    // Add role_type filter if provided
    if (roleType && roleType !== 'All') {
      conditions.push('e.role_type = ?');
      queryParams.push(roleType);
      countParams.push(roleType);
    }

    // Add role filter if provided
    if (role && role !== 'All') {
      conditions.push('e.role = ?');
      queryParams.push(role);
      countParams.push(role);
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push('(e.sso LIKE ? OR e.name LIKE ? OR e.role LIKE ? OR e.phone LIKE ? OR e.location LIKE ? OR e.skills LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Add project filter if provided
    if (project && project.trim() !== '') {
      conditions.push('p.project_team_name = ?');
      queryParams.push(project.trim());
      countParams.push(project.trim());
    }

    // Add team filter if provided
    if (team && team.trim() !== '') {
      conditions.push('pt.agile_board_name = ?');
      queryParams.push(team.trim());
      countParams.push(team.trim());
    }

    // Add status filter if provided
    if (status && status !== 'All') {
      conditions.push('e.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    // Group by employee for aggregation
    dataQuery += ' GROUP BY e.id';

    // Get total count for pagination
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add ordering and pagination
    dataQuery += ` ORDER BY e.${validSortField} ${validSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Get paginated employees
    const [employees] = await db.query(dataQuery, queryParams);

    // Calculate visa_status for each employee
    const employeesWithStatus = employees.map(employee => ({
      ...employee,
      visa_status: calculateVisaStatus(employee.visa_type, employee.current_visa_start_date, employee.current_visa_end_date)
    }));

    res.json({
      success: true,
      data: employeesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get single employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [employees] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = employees[0];
    employee.visa_status = calculateVisaStatus(employee.visa_type, employee.current_visa_start_date, employee.current_visa_end_date);

    // Fetch employee's project and team assignments with manager information
    const [projectAssignments] = await db.query(
      `SELECT pe.project_id, pe.team_id, pe.allocation_percentage,
              p.project_team_name,
              pt.agile_board_name,
              om.id as offshore_manager_id,
              om.name as offshore_manager_name,
              osm.id as onsite_manager_id,
              osm.name as onsite_manager_name
       FROM project_employees pe
       JOIN projects p ON pe.project_id = p.id
       LEFT JOIN project_teams pt ON pe.team_id = pt.id
       LEFT JOIN employees om ON p.offshore_manager_id = om.id
       LEFT JOIN employees osm ON p.onsite_manager_id = osm.id
       WHERE pe.employee_id = ?
       ORDER BY p.project_team_name, pt.agile_board_name`,
      [id]
    );

    employee.project_assignments = projectAssignments;

    // Fetch projects where employee is a manager (offshore or onsite)
    const [managedProjects] = await db.query(
      `SELECT p.id, p.project_team_name, p.offshore_manager_id, p.onsite_manager_id,
              p.offshore_manager_allocation, p.onsite_manager_allocation,
              om.name as offshore_manager_name,
              osm.name as onsite_manager_name
       FROM projects p
       LEFT JOIN employees om ON p.offshore_manager_id = om.id
       LEFT JOIN employees osm ON p.onsite_manager_id = osm.id
       WHERE p.offshore_manager_id = ? OR p.onsite_manager_id = ?
       ORDER BY p.project_team_name`,
      [id, id]
    );

    employee.managed_projects = managedProjects;

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      sso,
      name,
      role,
      role_type,
      phone,
      location,
      criticality,
      status,
      skills,
      joining_date,
      last_working_day,
      possible_candidate,
      asset_id,
      asset_return_id,
      comments,
      attrition,
      notice_period_days,
      work_location,
      temp_offshore_manager_id,
      temp_onsite_manager_id,
      visa_type,
      current_visa_start_date,
      current_visa_end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      visa_notes,
      projects // Array of {project_id, team_id}
    } = req.body;

    // Validation
    if (!name) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if SSO already exists (only if SSO is provided and not empty)
    if (sso && sso.trim() !== '') {
      const [ssoCheck] = await connection.query(
        'SELECT id FROM employees WHERE sso = ? AND sso IS NOT NULL AND sso != ""',
        [sso]
      );

      if (ssoCheck.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'SSO already exists'
        });
      }
    }

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type || 'None', current_visa_start_date, current_visa_end_date);

    const [result] = await connection.query(
      `INSERT INTO employees
      (sso, name, role, role_type, phone, location, criticality, status, skills, joining_date, last_working_day,
       possible_candidate, asset_id, asset_return_id, comments, attrition, notice_period_days, work_location, temp_offshore_manager_id, temp_onsite_manager_id,
       visa_type, visa_status, current_visa_start_date, current_visa_end_date, i94_expiry_date,
       passport_number, passport_expiry_date, sponsor_company, visa_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sso, name, role, role_type, phone, location, criticality || 'Medium', status || 'Active',
       skills, joining_date, last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition || 'No', notice_period_days, work_location || 'Onsite', temp_offshore_manager_id, temp_onsite_manager_id,
       visa_type || 'None', computedVisaStatus, current_visa_start_date, current_visa_end_date,
       i94_expiry_date, passport_number, passport_expiry_date, sponsor_company, visa_notes]
    );

    const employeeId = result.insertId;

    // Insert project assignments if provided
    if (projects && Array.isArray(projects) && projects.length > 0) {
      for (const proj of projects) {
        if (proj.project_id) {
          await connection.query(
            `INSERT INTO project_employees (project_id, team_id, employee_id)
             VALUES (?, ?, ?)`,
            [proj.project_id, proj.team_id || null, employeeId]
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
          'employees',
          employeeId,
          `Created employee: ${name} (${sso || 'N/A'})`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: employeeId,
        sso,
        name
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating employee:', error);

    // Handle duplicate SSO error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'SSO already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      sso,
      name,
      role,
      role_type,
      phone,
      location,
      criticality,
      status,
      skills,
      joining_date,
      last_working_day,
      possible_candidate,
      asset_id,
      asset_return_id,
      comments,
      attrition,
      notice_period_days,
      work_location,
      temp_offshore_manager_id,
      temp_onsite_manager_id,
      visa_type,
      current_visa_start_date,
      current_visa_end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      visa_notes,
      projects // Array of {project_id, team_id}
    } = req.body;

    // Check if employee exists
    const [existing] = await connection.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if SSO is being changed and if the new SSO already exists for another employee
    // Only check for duplicates if SSO is provided and not empty
    if (sso && sso.trim() !== '' && sso !== existing[0].sso) {
      const [ssoCheck] = await connection.query(
        'SELECT id FROM employees WHERE sso = ? AND sso IS NOT NULL AND sso != "" AND id != ?',
        [sso, id]
      );

      if (ssoCheck.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'SSO already exists'
        });
      }
    }

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type, current_visa_start_date, current_visa_end_date);

    await connection.query(
      `UPDATE employees
      SET sso = ?, name = ?, role = ?, role_type = ?, phone = ?, location = ?,
          criticality = ?, status = ?, skills = ?, joining_date = ?, last_working_day = ?,
          possible_candidate = ?, asset_id = ?, asset_return_id = ?, comments = ?,
          attrition = ?, notice_period_days = ?, work_location = ?, temp_offshore_manager_id = ?, temp_onsite_manager_id = ?,
          visa_type = ?, visa_status = ?, current_visa_start_date = ?, current_visa_end_date = ?,
          i94_expiry_date = ?, passport_number = ?, passport_expiry_date = ?, sponsor_company = ?, visa_notes = ?
      WHERE id = ?`,
      [sso, name, role, role_type, phone, location, criticality, status, skills,
       joining_date, last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition, notice_period_days, work_location, temp_offshore_manager_id, temp_onsite_manager_id,
       visa_type, computedVisaStatus, current_visa_start_date, current_visa_end_date,
       i94_expiry_date, passport_number, passport_expiry_date, sponsor_company, visa_notes, id]
    );

    // Update project assignments
    if (projects && Array.isArray(projects)) {
      // Delete existing assignments
      await connection.query('DELETE FROM project_employees WHERE employee_id = ?', [id]);

      // Insert new assignments
      for (const proj of projects) {
        if (proj.project_id) {
          await connection.query(
            `INSERT INTO project_employees (project_id, team_id, employee_id)
             VALUES (?, ?, ?)`,
            [proj.project_id, proj.team_id || null, id]
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
          'employees',
          id,
          `Updated employee: ${name} (${sso || 'N/A'})`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        id,
        sso,
        name
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating employee:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'SSO already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Get employee details before deletion for audit log
    const [employees] = await db.query(
      'SELECT name, sso FROM employees WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = employees[0];

    const [result] = await db.query(
      'DELETE FROM employees WHERE id = ?',
      [id]
    );

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'DELETE',
          'employees',
          id,
          `Deleted employee: ${employee.name} (${employee.sso || 'N/A'})`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

// Import employees from Excel/CSV
const importEmployees = async (req, res) => {
  const connection = await db.getConnection();

  try {
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

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or has no valid data'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel rows start at 1, and row 1 is header

      try {
        await connection.beginTransaction();

        // Map Excel columns to database fields (case-insensitive)
        const employeeData = {
          sso: (row.SSO || row.sso) ? String(row.SSO || row.sso) : null,
          name: row.Name || row.name || null,
          role: row.Role || row.role || null,
          role_type: row['Role Type'] || row['role type'] || row.role_type || row['ROLE TYPE'] || 'DEV',
          phone: row.Phone || row.phone || null,
          location: row.Location || row.location || null,
          joining_date: row['Joining Date'] || row['joining date'] || row.joining_date || row['JOINING DATE'] || null,
          criticality: row.Criticality || row.criticality || 'Medium',
          status: row.Status || row.status || 'Active',
          skills: row.Skills || row.skills || null,
          last_working_day: row['Last Working Day'] || row['last working day'] || row.last_working_day || row['LAST WORKING DAY'] || null,
          possible_candidate: row['Possible Candidate'] || row['possible candidate'] || row.possible_candidate || row['POSSIBLE CANDIDATE'] || null,
          asset_id: row['Asset ID'] || row['asset id'] || row.asset_id || row['ASSET ID'] || null,
          asset_return_id: row['Asset Return ID'] || row['asset return id'] || row.asset_return_id || row['ASSET RETURN ID'] || null,
          comments: row.Comments || row.comments || null,
          attrition: row.Attrition || row.attrition || 'No',
          visa_type: row['Visa Type'] || row['visa type'] || row.visa_type || row['VISA TYPE'] || 'H1B',
          current_visa_start_date: row['Current Visa Start Date'] || row['current visa start date'] || row.current_visa_start_date || row['CURRENT VISA START DATE'] || null,
          current_visa_end_date: row['Current Visa End Date'] || row['current visa end date'] || row.current_visa_end_date || row['CURRENT VISA END DATE'] || null,
          i94_expiry_date: row['I94 Expiry Date'] || row['i94 expiry date'] || row.i94_expiry_date || row['I94 EXPIRY DATE'] || null,
          passport_number: row['Passport Number'] || row['passport number'] || row.passport_number || row['PASSPORT NUMBER'] || null,
          passport_expiry_date: row['Passport Expiry Date'] || row['passport expiry date'] || row.passport_expiry_date || row['PASSPORT EXPIRY DATE'] || null,
          sponsor_company: row['Sponsor Company'] || row['sponsor company'] || row.sponsor_company || row['SPONSOR COMPANY'] || null,
          visa_notes: row['Visa Notes'] || row['visa notes'] || row.visa_notes || row['VISA NOTES'] || null,
          work_location: row['Work Location'] || row['work location'] || row.work_location || row['WORK LOCATION'] || 'Offshore',
          temp_offshore_manager_id: row['Temp Offshore Manager ID'] || row['temp offshore manager id'] || row.temp_offshore_manager_id || row['TEMP OFFSHORE MANAGER ID'] || null,
          temp_onsite_manager_id: row['Temp Onsite Manager ID'] || row['temp onsite manager id'] || row.temp_onsite_manager_id || row['TEMP ONSITE MANAGER ID'] || null
        };

        // Extract project and team information
        const projectTeamName = row['Project Team Name'] || row['project team name'] || row.project_team_name || row['PROJECT TEAM NAME'] || null;
        const agileBoardName = row['Agile Board Name'] || row['agile board name'] || row.agile_board_name || row['AGILE BOARD NAME'] || null;
        const allocationPercentage = row['Allocation Percentage'] || row['allocation percentage'] || row.allocation_percentage || row['ALLOCATION PERCENTAGE'] || 0;

        // Validate required fields
        if (!employeeData.name) {
          await connection.rollback();
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Name is required'
          });
          continue;
        }

        // Convert date strings to proper format if needed
        const dateFields = ['joining_date', 'last_working_day', 'current_visa_start_date', 'current_visa_end_date', 'i94_expiry_date', 'passport_expiry_date'];
        dateFields.forEach(field => {
          if (employeeData[field]) {
            // Handle Excel date serial numbers
            if (typeof employeeData[field] === 'number') {
              const date = xlsx.SSF.parse_date_code(employeeData[field]);
              employeeData[field] = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else if (typeof employeeData[field] === 'string') {
              // Try to parse common date formats
              const parsedDate = new Date(employeeData[field]);
              if (!isNaN(parsedDate.getTime())) {
                employeeData[field] = parsedDate.toISOString().split('T')[0];
              }
            }
          }
        });

        // Calculate visa status
        const computedVisaStatus = calculateVisaStatus(
          employeeData.visa_type,
          employeeData.current_visa_start_date,
          employeeData.current_visa_end_date
        );

        // Check if employee already exists (by SSO or name if SSO not provided)
        let employeeId;
        let existingEmployee = null;

        if (employeeData.sso) {
          // Convert SSO to string (Excel might read it as number)
          const ssoString = String(employeeData.sso).trim();
          if (ssoString !== '') {
            const [existing] = await connection.query(
              'SELECT id FROM employees WHERE sso = ?',
              [ssoString]
            );
            if (existing.length > 0) {
              existingEmployee = existing[0];
              employeeId = existingEmployee.id;
            }
          }
        }

        // If employee doesn't exist, create new employee
        if (!existingEmployee) {
          const [employeeResult] = await connection.query(
            `INSERT INTO employees
            (sso, name, role, role_type, phone, location, joining_date, criticality, status, skills, last_working_day,
             possible_candidate, asset_id, asset_return_id, comments, attrition, visa_type, visa_status,
             current_visa_start_date, current_visa_end_date, i94_expiry_date, passport_number,
             passport_expiry_date, sponsor_company, visa_notes, work_location, temp_offshore_manager_id, temp_onsite_manager_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              employeeData.sso,
              employeeData.name,
              employeeData.role,
              employeeData.role_type,
              employeeData.phone,
              employeeData.location,
              employeeData.joining_date,
              employeeData.criticality,
              employeeData.status,
              employeeData.skills,
              employeeData.last_working_day,
              employeeData.possible_candidate,
              employeeData.asset_id,
              employeeData.asset_return_id,
              employeeData.comments,
              employeeData.attrition,
              employeeData.visa_type,
              computedVisaStatus,
              employeeData.current_visa_start_date,
              employeeData.current_visa_end_date,
              employeeData.i94_expiry_date,
              employeeData.passport_number,
              employeeData.passport_expiry_date,
              employeeData.sponsor_company,
              employeeData.visa_notes,
              employeeData.work_location || 'Offshore',
              employeeData.temp_offshore_manager_id || null,
              employeeData.temp_onsite_manager_id || null
            ]
          );
          employeeId = employeeResult.insertId;
        }

        // Handle project and team assignment based on Role Type
        // Following "Assign Employees to Teams" modal logic:
        // - Managers and Team Leads are NOT assigned via project_employees
        // - They are managed at project/team level (offshore_manager_id, onsite_manager_id, team_lead_id)
        // - Only DEV, QA, and other non-manager roles are assigned to project_employees
        if (projectTeamName && projectTeamName.trim() !== '') {
          // Look up project by project_team_name
          const [projects] = await connection.query(
            'SELECT id FROM projects WHERE project_team_name = ?',
            [projectTeamName.trim()]
          );

          if (projects.length === 0) {
            await connection.rollback();
            results.failed++;
            results.errors.push({
              row: rowNumber,
              name: employeeData.name,
              error: `Project not found: ${projectTeamName}`
            });
            continue;
          }

          const projectId = projects[0].id;
          let teamId = null;

          // If agile board name is provided, look up the team
          if (agileBoardName && agileBoardName.trim() !== '') {
            const [teams] = await connection.query(
              'SELECT id FROM project_teams WHERE project_id = ? AND agile_board_name = ?',
              [projectId, agileBoardName.trim()]
            );

            if (teams.length === 0) {
              await connection.rollback();
              results.failed++;
              results.errors.push({
                row: rowNumber,
                name: employeeData.name,
                error: `Team not found: ${agileBoardName} in project ${projectTeamName}`
              });
              continue;
            }

            teamId = teams[0].id;
          }

          // Check role_type to determine assignment behavior
          const roleType = employeeData.role_type?.trim();
          const isManagerOrLead = roleType === 'Manager' || roleType === 'Team Lead';

          if (isManagerOrLead) {
            // Managers and Team Leads should NOT be assigned to project_employees
            // They are assigned at project/team level:
            // - Managers: offshore_manager_id, onsite_manager_id in projects table
            // - Team Leads: offshore_team_lead_id, onsite_team_lead_id in project_teams table
            console.log(`Skipping project_employees assignment for ${roleType}: ${employeeData.name} (ID: ${employeeId})`);
            console.log(`Note: Assign ${roleType}s through Project/Team management UI`);
          } else {
            // Assign DEV, QA, and other non-manager roles to project_employees
            // Delete any "allocated only" record (team_id = NULL) for this employee in this project
            if (teamId) {
              await connection.query(
                `DELETE FROM project_employees
                 WHERE project_id = ? AND employee_id = ? AND team_id IS NULL`,
                [projectId, employeeId]
              );
            }

            // Check if this assignment already exists
            const [existingAssignment] = await connection.query(
              'SELECT id FROM project_employees WHERE project_id = ? AND employee_id = ? AND (team_id = ? OR (team_id IS NULL AND ? IS NULL))',
              [projectId, employeeId, teamId, teamId]
            );

            if (existingAssignment.length === 0) {
              // Insert into project_employees (no allocation_percentage in insert)
              await connection.query(
                'INSERT INTO project_employees (project_id, team_id, employee_id) VALUES (?, ?, ?)',
                [projectId, teamId, employeeId]
              );
            }
          }
        }

        await connection.commit();
        results.success++;
      } catch (error) {
        await connection.rollback();
        results.failed++;
        let errorMessage = error.message;

        // Log detailed error for debugging
        console.error(`Import error at row ${rowNumber}:`, error);
        console.error('Row data:', row);

        // Handle duplicate SSO error
        if (error.code === 'ER_DUP_ENTRY') {
          errorMessage = 'SSO already exists';
        }

        results.errors.push({
          row: rowNumber,
          name: row.Name || row.name || 'Unknown',
          error: errorMessage
        });
      }
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'IMPORT',
          'employees',
          null,
          `Imported employees: ${results.success} succeeded, ${results.failed} failed`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.json({
      success: true,
      message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error importing employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing employees',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get all employee roles from lookup table
const getEmployeeRoles = async (req, res) => {
  try {
    const [roles] = await db.query(
      'SELECT id, role_name, description FROM employee_roles WHERE is_active = TRUE ORDER BY role_name ASC'
    );

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching employee roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee roles',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  importEmployees,
  getEmployeeRoles
};
