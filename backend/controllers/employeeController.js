const db = require('../config/database');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const roleType = req.query.role_type;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'sso', 'name', 'role', 'role_type', 'phone', 'location', 'criticality', 'status', 'skills', 'attrition', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM employees';
    let dataQuery = `
      SELECT e.*,
             COALESCE(SUM(pe.allocation_percentage), 0) as total_allocation
      FROM employees e
      LEFT JOIN project_employees pe ON e.id = pe.employee_id
    `;
    const queryParams = [];
    const countParams = [];

    // Add role_type filter if provided
    if (roleType && roleType !== 'All') {
      countQuery += ' WHERE role_type = ?';
      dataQuery += ' WHERE e.role_type = ?';
      queryParams.push(roleType);
      countParams.push(roleType);
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

    res.json({
      success: true,
      data: employees,
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

    res.json({
      success: true,
      data: employees[0]
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
      onsite_manager_id
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO employees
      (sso, name, role, role_type, phone, location, criticality, status, skills, last_working_day,
       possible_candidate, asset_id, asset_return_id, comments, attrition, offshore_manager_id, onsite_manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sso, name, role, role_type, phone, location, criticality || 'Medium', status || 'Active',
       skills, last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition || 'No', offshore_manager_id, onsite_manager_id]
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
      onsite_manager_id
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

    const [result] = await db.query(
      `UPDATE employees
      SET sso = ?, name = ?, role = ?, role_type = ?, phone = ?, location = ?,
          criticality = ?, status = ?, skills = ?, last_working_day = ?,
          possible_candidate = ?, asset_id = ?, asset_return_id = ?, comments = ?,
          attrition = ?, offshore_manager_id = ?, onsite_manager_id = ?
      WHERE id = ?`,
      [sso, name, role, role_type, phone, location, criticality, status, skills,
       last_working_day, possible_candidate, asset_id, asset_return_id, comments,
       attrition, offshore_manager_id, onsite_manager_id, id]
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
