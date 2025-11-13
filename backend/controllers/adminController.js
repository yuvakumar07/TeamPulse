const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Get all admin users
const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT au.id, au.username, au.email, au.full_name, au.status, au.role_id,
                        r.name as role_name, r.display_name as role_display_name,
                        au.last_login, au.created_at, au.updated_at
                 FROM admin_users au
                 LEFT JOIN roles r ON au.role_id = r.id`;
    const params = [];

    // Filter by status if provided
    if (status) {
      query += ' WHERE au.status = ?';
      params.push(status);
    }

    // Add pagination
    query += ' ORDER BY au.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [admins] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM admin_users';
    const countParams = [];
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching admin users.'
    });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const [admins] = await db.query(
      `SELECT au.id, au.username, au.email, au.full_name, au.status, au.role_id,
              r.name as role_name, r.display_name as role_display_name,
              au.last_login, au.created_at, au.updated_at
       FROM admin_users au
       LEFT JOIN roles r ON au.role_id = r.id
       WHERE au.id = ?`,
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    res.json({
      success: true,
      data: admins[0]
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching admin user.'
    });
  }
};

// Create new admin user
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, full_name, status = 'Active', role_id } = req.body;

    // Validate input
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and full name are required.'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Validate role_id if provided
    if (role_id) {
      const [roles] = await db.query('SELECT id FROM roles WHERE id = ?', [role_id]);
      if (roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID.'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new admin
    const [result] = await db.query(
      'INSERT INTO admin_users (username, email, password_hash, full_name, status, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, status, role_id || null]
    );

    // Log the action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'CREATE',
        'admin_users',
        result.insertId,
        `Created admin user: ${username}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully.',
      data: {
        id: result.insertId,
        username,
        email,
        full_name
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while creating admin user.'
    });
  }
};

// Update admin user
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, status, password } = req.body;

    // Check if admin exists
    const [existingAdmins] = await db.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [id]
    );

    if (existingAdmins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.admin.id && status && status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    params.push(id);

    await db.query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log the action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'UPDATE',
        'admin_users',
        id,
        `Updated admin user: ${username || existingAdmins[0].username}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Admin user updated successfully.'
    });
  } catch (error) {
    console.error('Update admin error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while updating admin user.'
    });
  }
};

// Delete admin user
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Check if admin exists
    const [existingAdmins] = await db.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [id]
    );

    if (existingAdmins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.'
      });
    }

    // Log the action before deletion
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'DELETE',
        'admin_users',
        id,
        `Deleted admin user: ${existingAdmins[0].username}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    // Delete admin
    await db.query('DELETE FROM admin_users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Admin user deleted successfully.'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting admin user.'
    });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, admin_id, action, entity_type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        al.*,
        au.username,
        au.full_name
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.admin_id = au.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by admin_id if provided
    if (admin_id) {
      query += ' AND al.admin_id = ?';
      params.push(admin_id);
    }

    // Filter by action if provided
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    // Filter by entity_type if provided
    if (entity_type) {
      query += ' AND al.entity_type = ?';
      params.push(entity_type);
    }

    // Add pagination
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const countParams = [];
    if (admin_id) {
      countQuery += ' AND admin_id = ?';
      countParams.push(admin_id);
    }
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    if (entity_type) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entity_type);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching audit logs.'
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get employee statistics
    const [employeeStats] = await db.query(`
      SELECT
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_employees,
        SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_employees,
        SUM(CASE WHEN status = 'Terminated' THEN 1 ELSE 0 END) as terminated_employees,
        SUM(CASE WHEN attrition = 'Yes' THEN 1 ELSE 0 END) as attrition_count,
        SUM(CASE WHEN attrition = 'At Risk' THEN 1 ELSE 0 END) as at_risk_count,
        SUM(CASE WHEN criticality = 'Critical' THEN 1 ELSE 0 END) as critical_employees,
        SUM(CASE WHEN criticality = 'High' THEN 1 ELSE 0 END) as high_criticality_employees
      FROM employees
    `);

    // Get role distribution
    const [roleDistribution] = await db.query(`
      SELECT role_type, COUNT(*) as count
      FROM employees
      WHERE role_type IS NOT NULL
      GROUP BY role_type
      ORDER BY count DESC
    `);

    // Get admin users count
    const [adminStats] = await db.query(`
      SELECT
        COUNT(*) as total_admins,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_admins
      FROM admin_users
    `);

    // Get recent activities (last 10)
    const [recentActivities] = await db.query(`
      SELECT
        e.id,
        e.sso,
        e.name,
        e.role,
        e.status,
        e.created_at,
        e.updated_at,
        CASE
          WHEN e.created_at = e.updated_at THEN 'CREATED'
          ELSE 'UPDATED'
        END as action
      FROM employees e
      ORDER BY e.updated_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        employeeStats: employeeStats[0],
        roleDistribution,
        adminStats: adminStats[0],
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching dashboard statistics.'
    });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAuditLogs,
  getDashboardStats
};
