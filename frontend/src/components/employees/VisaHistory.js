import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getVisaHistory, createVisaHistory, updateVisaHistory, deleteVisaHistory } from '../../services/api';
import ConfirmationModal from '../modals/ConfirmationModal';
import PermissionGuard from '../auth/PermissionGuard';
import { EditIcon, DeleteIcon, AddIcon } from '../icons/ActionIcons';
import './VisaHistory.css';

const VisaHistory = ({ employeeId, employeeName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [formData, setFormData] = useState({
    visa_type: 'H1B',
    start_date: '',
    end_date: '',
    i94_expiry_date: '',
    passport_number: '',
    passport_expiry_date: '',
    sponsor_company: '',
    petition_number: '',
    receipt_number: '',
    approval_notice_number: '',
    filed_date: '',
    approved_date: '',
    denial_date: '',
    denial_reason: '',
    extension_count: 0,
    is_current: false,
    notes: '',
    documents_path: ''
  });

  useEffect(() => {
    fetchHistory();
  }, [employeeId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getVisaHistory(employeeId);
      setHistory(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch visa history');
      console.error('Error fetching visa history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        employee_id: employeeId,
        ...formData,
        end_date: formData.end_date || null,
        i94_expiry_date: formData.i94_expiry_date || null,
        passport_expiry_date: formData.passport_expiry_date || null,
        filed_date: formData.filed_date || null,
        approved_date: formData.approved_date || null,
        denial_date: formData.denial_date || null
      };

      if (editingRecord) {
        await updateVisaHistory(editingRecord.id, dataToSubmit);
        toast.success('Visa record updated successfully!');
      } else {
        await createVisaHistory(dataToSubmit);
        toast.success('Visa record added successfully!');
      }

      resetForm();
      fetchHistory();
    } catch (err) {
      toast.error('Failed to save visa record');
      console.error('Error saving visa record:', err);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      visa_type: record.visa_type,
      start_date: record.start_date ? record.start_date.split('T')[0] : '',
      end_date: record.end_date ? record.end_date.split('T')[0] : '',
      i94_expiry_date: record.i94_expiry_date ? record.i94_expiry_date.split('T')[0] : '',
      passport_number: record.passport_number || '',
      passport_expiry_date: record.passport_expiry_date ? record.passport_expiry_date.split('T')[0] : '',
      sponsor_company: record.sponsor_company || '',
      petition_number: record.petition_number || '',
      receipt_number: record.receipt_number || '',
      approval_notice_number: record.approval_notice_number || '',
      filed_date: record.filed_date ? record.filed_date.split('T')[0] : '',
      approved_date: record.approved_date ? record.approved_date.split('T')[0] : '',
      denial_date: record.denial_date ? record.denial_date.split('T')[0] : '',
      denial_reason: record.denial_reason || '',
      extension_count: record.extension_count || 0,
      is_current: record.is_current || false,
      notes: record.notes || '',
      documents_path: record.documents_path || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteVisaHistory(recordToDelete.id);
      toast.success('Visa record deleted successfully!');
      setShowConfirmation(false);
      setRecordToDelete(null);
      fetchHistory();
    } catch (err) {
      toast.error('Failed to delete visa record');
      console.error('Error deleting visa record:', err);
      setShowConfirmation(false);
      setRecordToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setRecordToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      visa_type: 'H1B',
      start_date: '',
      end_date: '',
      i94_expiry_date: '',
      passport_number: '',
      passport_expiry_date: '',
      sponsor_company: '',
      petition_number: '',
      receipt_number: '',
      approval_notice_number: '',
      filed_date: '',
      approved_date: '',
      denial_date: '',
      denial_reason: '',
      extension_count: 0,
      is_current: false,
      notes: '',
      documents_path: ''
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusClass = (status) => {
    const classes = {
      'Active': 'visa-status-active',
      'Expired': 'visa-status-expired',
      'In Process': 'visa-status-process',
      'Not Applicable': 'visa-status-na'
    };
    return classes[status] || '';
  };

  if (loading) return <div className="loading">Loading visa history...</div>;

  return (
    <div className="modal-overlay">
      <div className="modal-content visa-history-modal">
        <div className="modal-header">
          <h2>Visa History - {employeeName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="visa-history-content">
          {!showForm ? (
            <>
              <div className="visa-history-header">
                <h3>Visa Records</h3>
                <PermissionGuard permission="employees.update">
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <AddIcon className="btn-icon-inline" />
                    Add Visa Record
                  </button>
                </PermissionGuard>
              </div>

              {history.length === 0 ? (
                <p className="no-data">No visa records found</p>
              ) : (
                <div className="visa-records-list">
                  {history.map((record) => (
                    <div key={record.id} className={`visa-record-card ${record.is_current ? 'current-visa' : ''}`}>
                      <div className="visa-record-header">
                        <div>
                          <h4>{record.visa_type}</h4>
                          {record.is_current && <span className="current-badge">Current</span>}
                        </div>
                        <div className="visa-record-actions">
                          <PermissionGuard permission="employees.update">
                            <button
                              className="btn-icon btn-icon-edit"
                              onClick={() => handleEdit(record)}
                              title="Edit Record"
                            >
                              <EditIcon />
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="employees.delete">
                            <button
                              className="btn-icon btn-icon-delete"
                              onClick={() => handleDeleteClick(record)}
                              title="Delete Record"
                            >
                              <DeleteIcon />
                            </button>
                          </PermissionGuard>
                        </div>
                      </div>

                      <div className="visa-record-details">
                        <div className="detail-row">
                          <span className="detail-label">Status:</span>
                          <span className={`visa-status ${getStatusClass(record.visa_status)}`}>
                            {record.visa_status}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Validity:</span>
                          <span>{formatDate(record.start_date)} - {formatDate(record.end_date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">I-94 Expiry:</span>
                          <span>{formatDate(record.i94_expiry_date)}</span>
                        </div>
                        {record.sponsor_company && (
                          <div className="detail-row">
                            <span className="detail-label">Sponsor:</span>
                            <span>{record.sponsor_company}</span>
                          </div>
                        )}
                        {record.petition_number && (
                          <div className="detail-row">
                            <span className="detail-label">Petition #:</span>
                            <span>{record.petition_number}</span>
                          </div>
                        )}
                        {record.receipt_number && (
                          <div className="detail-row">
                            <span className="detail-label">Receipt #:</span>
                            <span>{record.receipt_number}</span>
                          </div>
                        )}
                        {record.extension_count > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Extensions:</span>
                            <span>{record.extension_count}</span>
                          </div>
                        )}
                        {record.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span>{record.notes}</span>
                          </div>
                        )}
                        <div className="detail-row meta-info">
                          <span className="detail-label">Created by:</span>
                          <span>{record.created_by_name || 'Unknown'} on {formatDate(record.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="visa-form-container">
              <h3>{editingRecord ? 'Edit Visa Record' : 'Add Visa Record'}</h3>
              <form onSubmit={handleSubmit} className="visa-form">
                <div className="form-group">
                  <label htmlFor="visa_type">Visa Type *</label>
                  <select
                    id="visa_type"
                    name="visa_type"
                    value={formData.visa_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="H1B">H1B</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="Green Card">Green Card</option>
                    <option value="US Citizen">US Citizen</option>
                    <option value="Other">Other</option>
                  </select>
                  <small style={{ marginTop: '0.25rem', color: '#666', fontSize: '0.85rem' }}>
                    Visa status will be automatically calculated based on start and end dates
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date">Start Date *</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="i94_expiry_date">I-94 Expiry Date</label>
                    <input
                      type="date"
                      id="i94_expiry_date"
                      name="i94_expiry_date"
                      value={formData.i94_expiry_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="passport_expiry_date">Passport Expiry Date</label>
                    <input
                      type="date"
                      id="passport_expiry_date"
                      name="passport_expiry_date"
                      value={formData.passport_expiry_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="passport_number">Passport Number</label>
                    <input
                      type="text"
                      id="passport_number"
                      name="passport_number"
                      value={formData.passport_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sponsor_company">Sponsor Company</label>
                    <input
                      type="text"
                      id="sponsor_company"
                      name="sponsor_company"
                      value={formData.sponsor_company}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="petition_number">Petition Number</label>
                    <input
                      type="text"
                      id="petition_number"
                      name="petition_number"
                      value={formData.petition_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="receipt_number">Receipt Number</label>
                    <input
                      type="text"
                      id="receipt_number"
                      name="receipt_number"
                      value={formData.receipt_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="approval_notice_number">Approval Notice Number</label>
                  <input
                    type="text"
                    id="approval_notice_number"
                    name="approval_notice_number"
                    value={formData.approval_notice_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="filed_date">Filed Date</label>
                    <input
                      type="date"
                      id="filed_date"
                      name="filed_date"
                      value={formData.filed_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="approved_date">Approved Date</label>
                    <input
                      type="date"
                      id="approved_date"
                      name="approved_date"
                      value={formData.approved_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {formData.visa_status === 'Expired' && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="denial_date">Denial Date</label>
                        <input
                          type="date"
                          id="denial_date"
                          name="denial_date"
                          value={formData.denial_date}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="extension_count">Extension Count</label>
                        <input
                          type="number"
                          id="extension_count"
                          name="extension_count"
                          value={formData.extension_count}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="denial_reason">Denial Reason</label>
                      <textarea
                        id="denial_reason"
                        name="denial_reason"
                        value={formData.denial_reason}
                        onChange={handleChange}
                        rows="2"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="extension_count">Extension Count</label>
                  <input
                    type="number"
                    id="extension_count"
                    name="extension_count"
                    value={formData.extension_count}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes about this visa record"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_current"
                      checked={formData.is_current}
                      onChange={handleChange}
                    />
                    <span>Mark as current visa</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRecord ? 'Update Record' : 'Add Record'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showConfirmation}
          title="Delete Visa Record"
          message="Are you sure you want to delete this visa record?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};

export default VisaHistory;
