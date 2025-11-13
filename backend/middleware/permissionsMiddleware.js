const db = require('../config/database');

// Cache for role permissions (refreshed periodically)
let permissionsCache = new Map();
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load permissions for a role into cache
const loadRolePermissions = async (roleId) => {
  try {
    const [permissions] = await db.query(
      `SELECT p.name, p.module, p.action
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );

    const permissionNames = permissions.map(p => p.name);
    permissionsCache.set(roleId, permissionNames);
    return permissionNames;
  } catch (error) {
    console.error('Error loading role permissions:', error);
    return [];
  }
};

// Get permissions for a role (with caching)
const getRolePermissions = async (roleId) => {
  const now = Date.now();

  // Refresh cache if expired
  if (!cacheTimestamp || now - cacheTimestamp > CACHE_DURATION) {
    permissionsCache.clear();
    cacheTimestamp = now;
  }

  // Return cached permissions if available
  if (permissionsCache.has(roleId)) {
    return permissionsCache.get(roleId);
  }

  // Load and cache permissions
  return await loadRolePermissions(roleId);
};

// Check if admin has a specific permission
const hasPermission = async (adminId, permissionName) => {
  try {
    // Get admin's role
    const [admins] = await db.query(
      'SELECT role_id FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || !admins[0].role_id) {
      return false;
    }

    const roleId = admins[0].role_id;
    const permissions = await getRolePermissions(roleId);

    return permissions.includes(permissionName);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Check if admin has any of the specified permissions
const hasAnyPermission = async (adminId, permissionNames) => {
  try {
    // Get admin's role
    const [admins] = await db.query(
      'SELECT role_id FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || !admins[0].role_id) {
      return false;
    }

    const roleId = admins[0].role_id;
    const permissions = await getRolePermissions(roleId);

    return permissionNames.some(perm => permissions.includes(perm));
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Check if admin has all specified permissions
const hasAllPermissions = async (adminId, permissionNames) => {
  try {
    // Get admin's role
    const [admins] = await db.query(
      'SELECT role_id FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || !admins[0].role_id) {
      return false;
    }

    const roleId = admins[0].role_id;
    const permissions = await getRolePermissions(roleId);

    return permissionNames.every(perm => permissions.includes(perm));
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Middleware factory to check for a specific permission
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const allowed = await hasPermission(req.admin.id, permissionName);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.',
          required_permission: permissionName
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

// Middleware factory to check for any of multiple permissions
const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const allowed = await hasAnyPermission(req.admin.id, permissionNames);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.',
          required_permissions: permissionNames
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

// Middleware factory to check for all specified permissions
const requireAllPermissions = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.admin || !req.admin.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const allowed = await hasAllPermissions(req.admin.id, permissionNames);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.',
          required_permissions: permissionNames
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

// Middleware to attach user permissions to request object
const attachPermissions = async (req, res, next) => {
  try {
    if (req.admin && req.admin.id) {
      // Get admin's role
      const [admins] = await db.query(
        'SELECT role_id, r.name as role_name FROM admin_users LEFT JOIN roles r ON admin_users.role_id = r.id WHERE admin_users.id = ?',
        [req.admin.id]
      );

      if (admins.length > 0 && admins[0].role_id) {
        const roleId = admins[0].role_id;
        const permissions = await getRolePermissions(roleId);

        // Attach to request
        req.admin.role_id = roleId;
        req.admin.role_name = admins[0].role_name;
        req.admin.permissions = permissions;
      } else {
        req.admin.permissions = [];
      }
    }

    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    next();
  }
};

// Clear permissions cache (useful after role/permission changes)
const clearPermissionsCache = () => {
  permissionsCache.clear();
  cacheTimestamp = null;
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  attachPermissions,
  clearPermissionsCache,
  getRolePermissions
};
