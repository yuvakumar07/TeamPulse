const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission, attachPermissions } = require('../middleware/permissionsMiddleware');

// All routes require authentication
router.use(verifyToken);
router.use(checkAdminStatus);
router.use(attachPermissions);

// Get employees for invoice generation
router.get('/employees', invoiceController.getEmployeesForInvoice);

// Create new invoice
router.post('/', requirePermission('create_invoice'), invoiceController.createInvoice);

// Get all invoices with pagination
router.get('/', requirePermission('view_invoices'), invoiceController.getAllInvoices);

// Get invoice by ID
router.get('/:id', requirePermission('view_invoices'), invoiceController.getInvoiceById);

module.exports = router;
