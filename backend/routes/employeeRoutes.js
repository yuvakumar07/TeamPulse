const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All employee routes now require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
router.get('/', requirePermission('employees.view'), getAllEmployees);
router.get('/:id', requirePermission('employees.view'), getEmployeeById);
router.post('/', requirePermission('employees.create'), createEmployee);
router.put('/:id', requirePermission('employees.update'), updateEmployee);
router.delete('/:id', requirePermission('employees.delete'), deleteEmployee);

module.exports = router;
