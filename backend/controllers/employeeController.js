const db = require('../config/database');

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
    const search = req.query.search;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'sso', 'name', 'role', 'role_type', 'phone', 'location', 'criticality', 'status', 'skills', 'attrition', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM employees e';
    let dataQuery = `
      SELECT e.*,
             COALESCE(SUM(pe.allocation_percentage), 0) as total_allocation,
             GROUP_CONCAT(
               DISTINCT CONCAT(p.project_team_name, ':', pe.allocation_percentage)
               ORDER BY p.project_team_name
               SEPARATOR '||'
             ) as allocated_projects
      FROM employees e
      LEFT JOIN project_employees pe ON e.id = pe.employee_id
      LEFT JOIN projects p ON pe.project_id = p.id
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

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push('(e.sso LIKE ? OR e.name LIKE ? OR e.role LIKE ? OR e.phone LIKE ? OR e.location LIKE ? OR e.skills LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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

    console.log('dataQuery', dataQuery);

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
  try {
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
      last_working_day,
      possible_candidate,
      asset_id,
      asset_return_id,
      comments,
      attrition,
      offshore_manager_id,
      onsite_manager_id,
      visa_type,
      current_visa_start_date,
      current_visa_end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      visa_notes
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type || 'None', current_visa_start_date, current_visa_end_date);

    const [result] = await db.query(
      `INSERT INTO employees
      (sso, name, role, role_type, phone, location, criticality, status, skills, last_working_day,
       possible_candidate, asset_id, asset_return_id, comments, attrition, offshore_manager_id, onsite_manager_id,
       visa_type, visa_status, current_visa_start_date, current_visa_end_date, i94_expiry_date,
       passport_number, passport_expiry_date, sponsor_company, visa_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sso, name, role, role_type, phone, location, criticality || 'Medium', status || 'Active',
       skills, last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition || 'No', offshore_manager_id, onsite_manager_id,
       visa_type || 'None', computedVisaStatus, current_visa_start_date, current_visa_end_date,
       i94_expiry_date, passport_number, passport_expiry_date, sponsor_company, visa_notes]
    );

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'CREATE',
          'employees',
          result.insertId,
          `Created employee: ${name} (${sso || 'N/A'})`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: result.insertId,
        sso,
        name
      }
    });
  } catch (error) {
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
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
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
      last_working_day,
      possible_candidate,
      asset_id,
      asset_return_id,
      comments,
      attrition,
      offshore_manager_id,
      onsite_manager_id,
      visa_type,
      current_visa_start_date,
      current_visa_end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      visa_notes
    } = req.body;

    // Check if employee exists
    const [existing] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type, current_visa_start_date, current_visa_end_date);

    const [result] = await db.query(
      `UPDATE employees
      SET sso = ?, name = ?, role = ?, role_type = ?, phone = ?, location = ?,
          criticality = ?, status = ?, skills = ?, last_working_day = ?,
          possible_candidate = ?, asset_id = ?, asset_return_id = ?, comments = ?,
          attrition = ?, offshore_manager_id = ?, onsite_manager_id = ?,
          visa_type = ?, visa_status = ?, current_visa_start_date = ?, current_visa_end_date = ?,
          i94_expiry_date = ?, passport_number = ?, passport_expiry_date = ?, sponsor_company = ?, visa_notes = ?
      WHERE id = ?`,
      [sso, name, role, role_type, phone, location, criticality, status, skills,
       last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition, offshore_manager_id, onsite_manager_id,
       visa_type, computedVisaStatus, current_visa_start_date, current_visa_end_date,
       i94_expiry_date, passport_number, passport_expiry_date, sponsor_company, visa_notes, id]
    );

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
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

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
