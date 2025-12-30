import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { toast } from 'react-toastify';
import { importPos } from '../../services/api';

const PoImportDialog = ({ visible, onHide, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileUploadRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.files[0];

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload CSV or Excel file.');
      return;
    }

    setUploading(true);
    setImportResults(null);

    try {
      const response = await importPos(file);
      const results = response.data.data;

      setImportResults(results);

      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.successful} purchase orders!`);
      } else {
        toast.warning(
          `Import completed: ${results.successful} successful, ${results.failed} failed. Check details below.`
        );
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing POs:', error);
      toast.error(error.response?.data?.message || 'Failed to import purchase orders');
    } finally {
      setUploading(false);
      if (fileUploadRef.current) {
        fileUploadRef.current.clear();
      }
    }
  };

  const handleClose = () => {
    setImportResults(null);
    setUploading(false);
    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }
    onHide();
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = ['po_number', 'po_owner_name', 'start_date', 'end_date', 'amount', 'status', 'description'];
    const sampleData = [
      'PO-2025-001,John Doe,2025-01-01,2025-12-31,50000,Active,Sample purchase order'
    ];

    const csvContent = headers.join(',') + '\n' + sampleData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'po_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const errorRowTemplate = (rowData) => {
    return (
      <div>
        <div><strong>Row {rowData.row}:</strong></div>
        <div style={{ color: '#e74c3c', marginTop: '4px' }}>{rowData.error}</div>
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Close"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-text"
        disabled={uploading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '700px' }}
      header="Import Purchase Orders"
      modal
      className="p-fluid"
      footer={dialogFooter}
      onHide={handleClose}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Instructions:</h4>
        <ol style={{ marginTop: 0, paddingLeft: '1.5rem' }}>
          <li>Download the CSV template below</li>
          <li>Fill in your purchase order data</li>
          <li>Required columns: <strong>po_number</strong>, <strong>po_owner_name</strong></li>
          <li>Optional columns: start_date, end_date, amount, status, description</li>
          <li>Date format: YYYY-MM-DD (e.g., 2025-01-15)</li>
          <li>Status values: Active, Closed, Pending, or Expired</li>
          <li>Upload the completed file using the button below</li>
        </ol>

        <Button
          label="Download Template"
          icon="pi pi-download"
          onClick={downloadTemplate}
          className="p-button-secondary"
          style={{ marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Upload File:</h4>
        <FileUpload
          ref={fileUploadRef}
          mode="basic"
          name="file"
          accept=".csv,.xlsx,.xls"
          maxFileSize={5000000}
          onSelect={handleFileSelect}
          auto
          chooseLabel="Choose File"
          disabled={uploading}
          customUpload={true}
        />
        <small className="p-text-secondary">
          Maximum file size: 5MB. Accepted formats: CSV, Excel (.xlsx, .xls)
        </small>
      </div>

      {uploading && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Uploading and processing file...</h4>
          <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
        </div>
      )}

      {importResults && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Import Results:</h4>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>Total Rows</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                {importResults.total}
              </div>
            </div>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#d5f4e6', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#27ae60' }}>Successful</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
                {importResults.successful}
              </div>
            </div>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#fadbd8', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#e74c3c' }}>Failed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {importResults.failed}
              </div>
            </div>
          </div>

          {importResults.errors && importResults.errors.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Errors:</h4>
              <DataTable
                value={importResults.errors}
                scrollable
                scrollHeight="300px"
                emptyMessage="No errors"
              >
                <Column
                  body={errorRowTemplate}
                  style={{ width: '100%' }}
                />
              </DataTable>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default PoImportDialog;
