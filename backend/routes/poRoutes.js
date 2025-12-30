const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllPos,
  getPoById,
  createPo,
  updatePo,
  deletePo,
  getPosByProject,
  importPos
} = require('../controllers/poController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// All PO routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
router.get('/', requirePermission('pos.view'), getAllPos);
router.get('/project/:project_id', requirePermission('pos.view'), getPosByProject);
router.get('/:id', requirePermission('pos.view'), getPoById);
router.post('/', requirePermission('pos.create'), createPo);
router.post('/import', requirePermission('pos.create'), upload.single('file'), importPos);
router.put('/:id', requirePermission('pos.update'), updatePo);
router.delete('/:id', requirePermission('pos.delete'), deletePo);

module.exports = router;
