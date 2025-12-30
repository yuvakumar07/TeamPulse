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

// Get employees by Purchase Order
router.get('/employees-by-po', invoiceController.getEmployeesByPo);

// Check if invoice exists
router.get('/check-exists', invoiceController.checkInvoiceExists);

// Create new invoice
router.post('/', requirePermission('invoices.create'), invoiceController.createInvoice);

// Get all invoices with pagination
router.get('/',  invoiceController.getAllInvoices);

// Download invoice PDF (must come before /:id to avoid route conflict)
router.get('/:id/pdf', requirePermission('invoices.view'), invoiceController.generateInvoicePDF);

// Get invoice by ID
router.get('/:id', requirePermission('invoices.view'), invoiceController.getInvoiceById);

// Update invoice
router.put('/:id', requirePermission('invoices.update'), invoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', requirePermission('invoices.delete'), invoiceController.deleteInvoice);

module.exports = router;
