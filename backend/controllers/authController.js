const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');

// Login admin user
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Find admin by username with role information
    const [admins] = await db.query(
      `SELECT au.*, r.id as role_id, r.name as role_name, r.display_name as role_display_name
       FROM admin_users au
       LEFT JOIN roles r ON au.role_id = r.id
       WHERE au.username = ?`,
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const admin = admins[0];

    // Check if admin is active
    if (admin.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact the system administrator.'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Update last login
    await db.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    // Log the login action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        admin.id,
        'LOGIN',
        'admin_users',
        'Admin user logged in',
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    // Generate token with role information
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      status: admin.status,
      role_id: admin.role_id,
      role_name: admin.role_name
    });

    // Return success with token and admin info
    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          full_name: admin.full_name,
          status: admin.status,
          role_id: admin.role_id,
          role_name: admin.role_name,
          role_display_name: admin.role_display_name,
          last_login: admin.last_login
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.'
    });
  }
};

// Get current admin profile
const getProfile = async (req, res) => {
  try {
    const [admins] = await db.query(
      'SELECT id, username, email, full_name, status, last_login, created_at FROM admin_users WHERE id = ?',
      [req.admin.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.'
      });
    }

    res.json({
      success: true,
      data: admins[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Get current admin
    const [admins] = await db.query(
      'SELECT * FROM admin_users WHERE id = ?',
      [req.admin.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found.'
      });
    }

    const admin = admins[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.admin.id]
    );

    // Log the password change
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'UPDATE',
        'admin_users',
        'Admin changed password',
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while changing password.'
    });
  }
};

// Logout (client-side token removal, but log the action)
const logoutAdmin = async (req, res) => {
  try {
    // Log the logout action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'LOGOUT',
        'admin_users',
        'Admin user logged out',
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.'
    });
  }
};

module.exports = {
  loginAdmin,
  getProfile,
  changePassword,
  logoutAdmin
};
