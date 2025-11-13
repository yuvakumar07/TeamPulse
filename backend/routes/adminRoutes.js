const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Admin user management routes (with permission checks)
router.get('/users', requirePermission('admin_users.view'), adminController.getAllAdmins);
router.get('/users/:id', requirePermission('admin_users.view'), adminController.getAdminById);
router.post('/users', requirePermission('admin_users.create'), adminController.createAdmin);
router.put('/users/:id', requirePermission('admin_users.update'), adminController.updateAdmin);
router.delete('/users/:id', requirePermission('admin_users.delete'), adminController.deleteAdmin);

// Audit logs (with permission checks)
router.get('/audit-logs', requirePermission('audit_logs.view'), adminController.getAuditLogs);

// Dashboard statistics (with permission checks)
router.get('/dashboard/stats', requirePermission('dashboard.view'), adminController.getDashboardStats);

module.exports = router;
