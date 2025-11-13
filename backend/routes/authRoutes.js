const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.loginAdmin);

// Protected routes (require authentication)
router.get('/profile', verifyToken, checkAdminStatus, authController.getProfile);
router.post('/change-password', verifyToken, checkAdminStatus, authController.changePassword);
router.post('/logout', verifyToken, authController.logoutAdmin);

module.exports = router;
