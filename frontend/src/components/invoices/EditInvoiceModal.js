import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getInvoiceById, updateInvoice } from '../../services/api';
import './EditInvoiceModal.css';

const EditInvoiceModal = ({ invoiceId, onClose, onSuccess }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await getInvoiceById(invoiceId);
      const invoiceData = response.data.data;
      setInvoice(invoiceData);
      setStatus(invoiceData.status);
      setItems(invoiceData.items || []);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const calculateTotal = (item) => {
    const billingHours = parseFloat(item.billing_hours) || 0;
    const leaveHours = parseFloat(item.leave_hours) || 0;
    const balanceHours = billingHours - leaveHours;
    const rate = parseFloat(item.cost_per_hour) || 0;
    let total = balanceHours * rate;

    // Add 0.11% bonus for Offshore Managers
    if (item.manager_type === 'Offshore') {
      total = total * 1.0011;
    }

    return total.toFixed(2);
  };

  const calculateGrandTotals = () => {
    let totalBillingHours = 0;
    let totalLeaveHours = 0;
    let totalAmount = 0;

    items.forEach(item => {
      totalBillingHours += parseFloat(item.billing_hours) || 0;
      totalLeaveHours += parseFloat(item.leave_hours) || 0;
      totalAmount += parseFloat(calculateTotal(item));
    });

    return {
      billing: totalBillingHours.toFixed(1),
      leave: totalLeaveHours.toFixed(1),
      amount: totalAmount.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const hasInvalidItems = items.some(item => {
      const hours = parseFloat(item.billing_hours);
      const leave = parseFloat(item.leave_hours);
      const rate = parseFloat(item.cost_per_hour);
      return isNaN(hours) || hours < 0 || isNaN(leave) || leave < 0 || isNaN(rate) || rate <= 0;
    });

    if (hasInvalidItems) {
      toast.error('Please ensure all hours and costs are valid positive numbers');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        status,
        items: items.map(item => ({
          employee_id: item.employee_id,
          billing_hours: parseFloat(item.billing_hours) || 0,
          leave_hours: parseFloat(item.leave_hours) || 0,
          cost_per_hour: parseFloat(item.cost_per_hour) || 0,
          manager_type: item.manager_type || null
        }))
      };

      await updateInvoice(invoiceId, updateData);
      toast.success('Invoice updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content edit-invoice-modal">
          <div className="modal-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const totals = calculateGrandTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-invoice-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>Edit Invoice</h2>
            <button type="button" className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {/* Invoice Info */}
            <div className="invoice-info">
              <div className="info-row">
                <div className="info-item">
                  <label>Invoice Number:</label>
                  <span className="invoice-number">{invoice.invoice_number}</span>
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
              </div>

              <div className="status-select-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Editable Items Table */}
            <div className="invoice-items-section">
              <h3>Invoice Items</h3>
              <div className="table-wrapper">
                <table className="edit-items-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Type</th>
                      <th>Billing Hours</th>
                      <th>Leave Hours</th>
                      <th>Balance Hours</th>
                      <th>Cost/Hour ($)</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.employee_name}</td>
                        <td>{item.employee_role}</td>
                        <td>
                          {item.manager_type ? (
                            <span className={`manager-type-badge ${item.manager_type.toLowerCase()}`}>
                              {item.manager_type} Mgr
                              {item.manager_type === 'Offshore' && <span className="bonus-indicator" title="Includes 0.11% bonus"> ★</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.85em' }}>Emp</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.billing_hours}
                            onChange={(e) => handleItemChange(index, 'billing_hours', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.leave_hours}
                            onChange={(e) => handleItemChange(index, 'leave_hours', e.target.value)}
                            required
                          />
                        </td>
                        <td className="balance-hours-cell">
                          <strong>{(parseFloat(item.billing_hours || 0) - parseFloat(item.leave_hours || 0)).toFixed(1)}</strong>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cost_per_hour}
                            onChange={(e) => handleItemChange(index, 'cost_per_hour', e.target.value)}
                            required
                          />
                        </td>
                        <td className="total-cell">{formatCurrency(calculateTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="3"><strong>Totals:</strong></td>
                      <td><strong>{totals.billing}</strong></td>
                      <td><strong>{totals.leave}</strong></td>
                      <td className="balance-hours-cell"><strong>{(parseFloat(totals.billing) - parseFloat(totals.leave)).toFixed(1)}</strong></td>
                      <td></td>
                      <td className="total-cell"><strong>{formatCurrency(totals.amount)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoiceModal;
