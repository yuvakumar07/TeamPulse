import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllInvoices } from '../services/api';
import GenerateInvoice from '../components/invoices/GenerateInvoice';
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
    </div>
  );
};

export default InvoicesPage;
