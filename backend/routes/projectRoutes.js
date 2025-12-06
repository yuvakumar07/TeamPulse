const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  assignEmployeesToProject,
  deleteProject,
  importProjectsAndTeams
} = require('../controllers/projectController');
const {
  getAllTeams,
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

// All project routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
// Note: Specific routes must come before parameterized routes (/:id)
router.get('/', requirePermission('projects.view'), getAllProjects);
router.post('/import', upload.single('file'), requirePermission('projects.create'), importProjectsAndTeams);
router.post('/', requirePermission('projects.create'), createProject);
router.get('/:id', requirePermission('projects.view'), getProjectById);
router.put('/:id', requirePermission('projects.update'), updateProject);
router.put('/:id/employees', requirePermission('projects.update'), assignEmployeesToProject);
router.delete('/:id', requirePermission('projects.delete'), deleteProject);

// Project teams routes
// Note: Specific routes must come BEFORE parameterized routes
router.get('/teams/all', requirePermission('projects.view'), getAllTeams); // Changed path to avoid conflict
router.get('/:projectId/teams', requirePermission('projects.view'), getProjectTeams);
router.post('/:projectId/teams', requirePermission('projects.update'), createProjectTeam);
router.put('/teams/:teamId', requirePermission('projects.update'), updateProjectTeam);
router.delete('/teams/:teamId', requirePermission('projects.delete'), deleteProjectTeam);

// Project team employees routes
router.get('/teams/:teamId/employees', requirePermission('projects.view'), getTeamEmployees);
router.put('/teams/:teamId/employees', requirePermission('projects.update'), assignEmployeesToTeam);
router.delete('/team-employees/:assignmentId', requirePermission('projects.update'), removeEmployeeFromTeam);

module.exports = router;
