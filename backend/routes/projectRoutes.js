const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  assignEmployeesToProject,
  deleteProject
} = require('../controllers/projectController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All project routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
router.get('/', requirePermission('projects.view'), getAllProjects);
router.get('/:id', requirePermission('projects.view'), getProjectById);
router.post('/', requirePermission('projects.create'), createProject);
router.put('/:id', requirePermission('projects.update'), updateProject);
router.put('/:id/employees', requirePermission('projects.update'), assignEmployeesToProject);
router.delete('/:id', requirePermission('projects.delete'), deleteProject);

module.exports = router;
