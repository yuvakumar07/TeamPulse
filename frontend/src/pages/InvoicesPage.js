import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllInvoices, deleteInvoice, downloadInvoicePDF } from '../services/api';
import GenerateInvoice from '../components/invoices/GenerateInvoice';
import ViewInvoiceModal from '../components/invoices/ViewInvoiceModal';
import EditInvoiceModal from '../components/invoices/EditInvoiceModal';
import authService from '../services/authService';
import './InvoicesPage.css';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getAllInvoices(
        pagination.page,
        pagination.limit,
        statusFilter
      );

      setInvoices(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleGenerateSuccess = () => {
    fetchInvoices();
  };

  const handleView = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowViewModal(true);
  };

  const handleEdit = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowEditModal(true);
  };

  const handleDeleteClick = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteInvoice(selectedInvoiceId);
      toast.success('Invoice deleted successfully');
      setShowDeleteConfirm(false);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchInvoices();
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      await downloadInvoicePDF(invoiceId, invoiceNumber);
      toast.success('Invoice PDF downloaded successfully');
    } catch (err) {
      console.error('Error downloading invoice PDF:', err);
      toast.error(err.response?.data?.message || 'Failed to download invoice PDF');
    }
  };

  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Draft': 'status-draft',
      'Submitted': 'status-submitted',
      'Approved': 'status-approved',
      'Paid': 'status-paid',
      'Cancelled': 'status-cancelled'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h1>Invoice Management</h1>
          <p className="page-subtitle">Generate and manage project invoices</p>
        </div>
        <button
          className="btn-generate"
          onClick={() => setShowGenerateModal(true)}
        >
          + Generate Invoice
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <h3>No invoices found</h3>
          <p>Click "Generate Invoice" to create your first invoice</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Project</th>
                  <th>Team</th>
                  <th>Period</th>
                  <th>Billing Hours</th>
                  <th>Leave Hours</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong className="invoice-number">{invoice.invoice_number}</strong>
                    </td>
                    <td>{invoice.project_team_name}</td>
                    <td>{invoice.team_name || 'All Teams'}</td>
                    <td>
                      {getMonthName(invoice.invoice_month)} {invoice.invoice_year}
                    </td>
                    <td className="hours-cell">{parseFloat(invoice.total_billing_hours).toFixed(1)}</td>
                    <td className="hours-cell">{parseFloat(invoice.total_leave_hours).toFixed(1)}</td>
                    <td className="amount-cell">
                      <strong>{formatCurrency(invoice.total_amount)}</strong>
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-pdf"
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                          title="Download PDF"
                        >
                          <i className="pi pi-file-pdf"></i>
                        </button>
                        <button
                          className="btn-action btn-view"
                          onClick={() => handleView(invoice.id)}
                          title="View Invoice"
                        >
                          <i className="pi pi-eye"></i>
                        </button>
                        {hasPermission('invoices.edit') && (
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(invoice.id)}
                            title="Edit Invoice"
                          >
                            <i className="pi pi-pencil"></i>
                          </button>
                        )}
                        {hasPermission('invoices.delete') && (
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteClick(invoice.id)}
                            title="Delete Invoice"
                          >
                            <i className="pi pi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {showGenerateModal && (
        <GenerateInvoice
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}

      {showViewModal && selectedInvoiceId && (
        <ViewInvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInvoiceId(null);
          }}
        />
      )}

      {showEditModal && selectedInvoiceId && (
        <EditInvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInvoiceId(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="close-button" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this invoice?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
