const express = require('express');
const router = express.Router();
const {
  getLookupsByCategory,
  getAllCategories,
  getAllLookups,
  createLookup,
  updateLookup,
  deleteLookup
} = require('../controllers/lookupController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All lookup routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Public lookup routes (view permission only)
router.get('/categories', getAllCategories);
router.get('/all', getAllLookups);
router.get('/category/:category', getLookupsByCategory);

// Admin-only routes for managing lookups
router.post('/', requirePermission('admin_users.create'), createLookup);
router.put('/:id', requirePermission('admin_users.update'), updateLookup);
router.delete('/:id', requirePermission('admin_users.delete'), deleteLookup);

module.exports = router;
