const express = require('express');
const router = express.Router();
const {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  getAssetsByEmployee
} = require('../controllers/assetController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All asset routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Routes with permission checks
router.get('/', requirePermission('assets.view'), getAllAssets);
router.get('/employee/:employee_id', requirePermission('assets.view'), getAssetsByEmployee);
router.get('/:id', requirePermission('assets.view'), getAssetById);
router.post('/', requirePermission('assets.create'), createAsset);
router.put('/:id', requirePermission('assets.update'), updateAsset);
router.put('/:id/assign', requirePermission('assets.assign'), assignAsset);
router.put('/:id/unassign', requirePermission('assets.assign'), unassignAsset);
router.delete('/:id', requirePermission('assets.delete'), deleteAsset);

module.exports = router;
