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
const {
  getProjectTeams,
  createProjectTeam,
  updateProjectTeam,
  deleteProjectTeam
} = require('../controllers/projectTeamController');
const {
  getTeamEmployees,
  assignEmployeesToTeam,
  removeEmployeeFromTeam
} = require('../controllers/projectTeamEmployeeController');
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

// Project teams routes
router.get('/:projectId/teams', requirePermission('projects.view'), getProjectTeams);
router.post('/:projectId/teams', requirePermission('projects.update'), createProjectTeam);
router.put('/teams/:teamId', requirePermission('projects.update'), updateProjectTeam);
router.delete('/teams/:teamId', requirePermission('projects.delete'), deleteProjectTeam);

// Project team employees routes
router.get('/teams/:teamId/employees', requirePermission('projects.view'), getTeamEmployees);
router.put('/teams/:teamId/employees', requirePermission('projects.update'), assignEmployeesToTeam);
router.delete('/team-employees/:assignmentId', requirePermission('projects.update'), removeEmployeeFromTeam);

module.exports = router;
