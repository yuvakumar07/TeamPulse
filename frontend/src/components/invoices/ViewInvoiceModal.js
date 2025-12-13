import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { getInvoiceById } from '../../services/api';
import './ViewInvoiceModal.css';

const ViewInvoiceModal = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await getInvoiceById(invoiceId);
      setInvoice(response.data.data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
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

  if (!invoice && !loading) {
    return null;
  }

  return (
    <Dialog
      header="Invoice Details"
      visible={true}
      onHide={onClose}
      style={{ width: '90vw' }}
      maximizable
      modal
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          <p>Loading invoice details...</p>
        </div>
      ) : invoice ? (
        <>
          <div className="modal-body">
            {/* Invoice Header Info */}
            <div className="invoice-header-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Invoice Number:</label>
                <span className="invoice-number">{invoice.invoice_number}</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                {getStatusBadge(invoice.status)}
              </div>
              <div className="info-item">
                <label>Project:</label>
                <span>{invoice.project_team_name}</span>
              </div>
              <div className="info-item">
                <label>Team:</label>
                <span>{invoice.team_name || 'All Teams'}</span>
              </div>
              <div className="info-item">
                <label>Period:</label>
                <span>{getMonthName(invoice.invoice_month)} {invoice.invoice_year}</span>
              </div>
              <div className="info-item">
                <label>Offshore Manager:</label>
                <span>{invoice.offshore_manager || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Onsite Manager:</label>
                <span>{invoice.onsite_manager || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Created:</label>
                <span>{new Date(invoice.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="invoice-items-section">
            <h3>Invoice Items</h3>
            <div className="table-container">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Type</th>
                    <th>Billing Hours</th>
                    <th>Leave Hours</th>
                    <th>Balance Hours</th>
                    <th>Cost/Hour</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.employee_name}</td>
                        <td>{item.employee_role}</td>
                        <td>
                          {item.manager_type ? (
                            <span className={`manager-type-badge ${item.manager_type.toLowerCase()}`}>
                              {item.manager_type} Manager
                              {item.manager_type === 'Offshore' && <span className="bonus-indicator" title="Includes 0.11% bonus"> ★</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>Employee</span>
                          )}
                        </td>
                        <td className="hours-cell">{parseFloat(item.billing_hours).toFixed(1)}</td>
                        <td className="hours-cell">{parseFloat(item.leave_hours).toFixed(1)}</td>
                        <td className="balance-hours-cell">
                          <strong>{(parseFloat(item.billing_hours) - parseFloat(item.leave_hours)).toFixed(1)}</strong>
                        </td>
                        <td className="amount-cell">{formatCurrency(item.cost_per_hour)}</td>
                        <td className="amount-cell"><strong>{formatCurrency(item.total_amount)}</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-items">No items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="invoice-totals">
            <div className="totals-grid">
              <div className="total-item">
                <label>Total Billing Hours:</label>
                <span className="total-value">{parseFloat(invoice.total_billing_hours).toFixed(1)}</span>
              </div>
              <div className="total-item">
                <label>Total Leave Hours:</label>
                <span className="total-value">{parseFloat(invoice.total_leave_hours).toFixed(1)}</span>
              </div>
              <div className="total-item">
                <label>Total Balance Hours:</label>
                <span className="total-value balance-hours">
                  <strong>{(parseFloat(invoice.total_billing_hours) - parseFloat(invoice.total_leave_hours)).toFixed(1)}</strong>
                </span>
              </div>
              <div className="total-item total-amount-item">
                <label>Total Amount:</label>
                <span className="total-amount">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

          <div className="modal-footer">
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={onClose}
              className="p-button-secondary"
            />
          </div>
        </>
      ) : null}
    </Dialog>
  );
};

export default ViewInvoiceModal;
