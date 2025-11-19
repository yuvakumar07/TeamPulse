const express = require('express');
const router = express.Router();
const {
  getVisaHistory,
  getVisaHistoryById,
  createVisaHistory,
  updateVisaHistory,
  deleteVisaHistory,
  getUpcomingExpirations
} = require('../controllers/visaController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Get upcoming visa expirations
router.get('/expirations', requirePermission('employees.view'), getUpcomingExpirations);

// Get visa history for an employee
router.get('/employee/:employeeId', requirePermission('employees.view'), getVisaHistory);

// Get single visa history record
router.get('/:id', requirePermission('employees.view'), getVisaHistoryById);

// Create new visa history record
router.post('/', requirePermission('employees.update'), createVisaHistory);

// Update visa history record
router.put('/:id', requirePermission('employees.update'), updateVisaHistory);

// Delete visa history record
router.delete('/:id', requirePermission('employees.delete'), deleteVisaHistory);

module.exports = router;
