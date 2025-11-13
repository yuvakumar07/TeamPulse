const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionsMiddleware');

// All routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);

// Get user's own permissions (no special permission required)
router.get('/my-permissions', roleController.getMyPermissions);

// Role management routes (require specific permissions)
router.get('/roles', requirePermission('roles.view'), roleController.getAllRoles);
router.get('/roles/:id', requirePermission('roles.view'), roleController.getRoleById);
router.post('/roles', requirePermission('roles.create'), roleController.createRole);
router.put('/roles/:id', requirePermission('roles.update'), roleController.updateRole);
router.delete('/roles/:id', requirePermission('roles.delete'), roleController.deleteRole);

// Permission routes
router.get('/permissions', requirePermission('roles.view'), roleController.getAllPermissions);

module.exports = router;
