const db = require('../config/database');
const { clearPermissionsCache } = require('../middleware/permissionsMiddleware');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const [roles] = await db.query(`
      SELECT
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_system_role,
        r.created_at,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system_role DESC, r.name
    `);

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching roles.'
    });
  }
};

// Get role by ID with permissions
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get role details
    const [roles] = await db.query(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.'
      });
    }

    // Get role permissions
    const [permissions] = await db.query(`
      SELECT p.id, p.module, p.action, p.name, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module, p.action
    `, [id]);

    res.json({
      success: true,
      data: {
        ...roles[0],
        permissions
      }
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching role.'
    });
  }
};

// Get all permissions grouped by module
const getAllPermissions = async (req, res) => {
  try {
    const [permissions] = await db.query(`
      SELECT id, module, action, name, description
      FROM permissions
      ORDER BY module, action
    `);

    // Group by module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        all: permissions,
        grouped
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching permissions.'
    });
  }
};

// Create custom role
const createRole = async (req, res) => {
  try {
    const { name, display_name, description, permission_ids } = req.body;

    // Validation
    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'Name and display name are required.'
      });
    }

    // Check if role name already exists
    const [existing] = await db.query(
      'SELECT id FROM roles WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists.'
      });
    }

    // Create role
    const [result] = await db.query(
      'INSERT INTO roles (name, display_name, description, is_system_role) VALUES (?, ?, ?, FALSE)',
      [name, display_name, description]
    );

    const roleId = result.insertId;

    // Assign permissions if provided
    if (permission_ids && permission_ids.length > 0) {
      const values = permission_ids.map(permId => [roleId, permId]);
      await db.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
        [values]
      );
    }

    // Clear permissions cache
    clearPermissionsCache();

    // Log the action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'CREATE',
        'roles',
        roleId,
        `Created role: ${display_name}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      data: {
        id: roleId,
        name,
        display_name
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating role.'
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, permission_ids } = req.body;

    // Check if role exists and is not a system role
    const [roles] = await db.query(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.'
      });
    }

    const role = roles[0];

    if (role.is_system_role) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system roles.'
      });
    }

    // Update role details
    await db.query(
      'UPDATE roles SET display_name = ?, description = ? WHERE id = ?',
      [display_name || role.display_name, description, id]
    );

    // Update permissions if provided
    if (permission_ids !== undefined) {
      // Delete existing permissions
      await db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

      // Add new permissions
      if (permission_ids.length > 0) {
        const values = permission_ids.map(permId => [id, permId]);
        await db.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }
    }

    // Clear permissions cache
    clearPermissionsCache();

    // Log the action
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'UPDATE',
        'roles',
        id,
        `Updated role: ${role.name}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Role updated successfully.'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating role.'
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists and is not a system role
    const [roles] = await db.query(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.'
      });
    }

    const role = roles[0];

    if (role.is_system_role) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system roles.'
      });
    }

    // Check if any users have this role
    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM admin_users WHERE role_id = ?',
      [id]
    );

    if (users[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${users[0].count} user(s) are assigned to this role.`
      });
    }

    // Log the action before deletion
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.admin.id,
        'DELETE',
        'roles',
        id,
        `Deleted role: ${role.name}`,
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown'
      ]
    );

    // Delete role (cascade will delete role_permissions)
    await db.query('DELETE FROM roles WHERE id = ?', [id]);

    // Clear permissions cache
    clearPermissionsCache();

    res.json({
      success: true,
      message: 'Role deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting role.'
    });
  }
};

// Get user's permissions
const getMyPermissions = async (req, res) => {
  try {
    if (!req.admin.role_id) {
      return res.json({
        success: true,
        data: {
          role: null,
          permissions: []
        }
      });
    }

    // Get role details
    const [roles] = await db.query(
      'SELECT id, name, display_name, description FROM roles WHERE id = ?',
      [req.admin.role_id]
    );

    // Get permissions
    const [permissions] = await db.query(`
      SELECT p.name, p.module, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module, p.action
    `, [req.admin.role_id]);

    res.json({
      success: true,
      data: {
        role: roles[0] || null,
        permissions: permissions.map(p => p.name),
        detailed_permissions: permissions
      }
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching permissions.'
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  getMyPermissions
};
