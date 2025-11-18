import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, employeeName }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-header">
          <h3>{title}</h3>
        </div>

        <div className="confirmation-body">
          <div className="confirmation-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="#f44336" strokeWidth="3" fill="#fff"/>
              <path d="M30 18v15" stroke="#f44336" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="30" cy="42" r="2" fill="#f44336"/>
            </svg>
          </div>
          <p className="confirmation-message">{message}</p>
          {employeeName && (
            <div className="employee-info">
              <strong>{employeeName}</strong>
            </div>
          )}
          <p className="confirmation-warning">This action cannot be undone.</p>
        </div>

        <div className="confirmation-actions">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-confirm-delete" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
