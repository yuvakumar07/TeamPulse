const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  importEmployees,
  getEmployeeRoles
} = require('../controllers/employeeController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// Configure multer for file upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// All employee routes now require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
// Note: Specific routes must come before parameterized routes (/:id)
router.get('/', requirePermission('employees.view'), getAllEmployees);
router.get('/roles/lookup', requirePermission('employees.view'), getEmployeeRoles);
router.post('/import', upload.single('file'), requirePermission('employees.create'), importEmployees);
router.post('/', requirePermission('employees.create'), createEmployee);
router.get('/:id', requirePermission('employees.view'), getEmployeeById);
router.put('/:id', requirePermission('employees.update'), updateEmployee);
router.delete('/:id', requirePermission('employees.delete'), deleteEmployee);

module.exports = router;
