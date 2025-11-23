import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ImportEmployeesDialog = ({ visible, onHide, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const fileUploadRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.files[0];
    setFile(selectedFile);
    setImportResults(null);

    // Preview first few rows
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Show first 5 rows as preview
        setPreviewData(jsonData.slice(0, 5));
      } catch (error) {
        toast.error('Error reading file preview');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFileClear = () => {
    setFile(null);
    setPreviewData([]);
    setImportResults(null);
  };

  const handleFileRemove = () => {
    setFile(null);
    setPreviewData([]);
    setImportResults(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/employees/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setImportResults(response.data.data);
        toast.success(response.data.message);
        if (response.data.data.success > 0) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.message || 'Error importing employees';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImportResults(null);
    setUploading(false);
    if (fileUploadRef.current) {
      fileUploadRef.current.clear();
    }
    onHide();
  };

  const downloadTemplate = () => {
    // Create sample template with headers
    const template = [
      {
        'SSO': 'SSO001',
        'Name': 'John Doe',
        'Role': 'Software Engineer',
        'Role Type': 'DEV',
        'Phone': '555-0101',
        'Location': 'New York',
        'Criticality': 'High',
        'Status': 'Active',
        'Skills': 'Java, Python, React',
        'Last Working Day': '',
        'Possible Candidate': '',
        'Asset ID': 'ASSET001',
        'Asset Return ID': '',
        'Comments': 'Example employee',
        'Attrition': 'No',
        'Visa Type': 'H1B',
        'Current Visa Start Date': '2024-01-01',
        'Current Visa End Date': '2026-12-31',
        'I94 Expiry Date': '2026-12-31',
        'Passport Number': 'A12345678',
        'Passport Expiry Date': '2030-12-31',
        'Sponsor Company': 'ABC Corp',
        'Visa Notes': 'Active visa status'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');

    // Set column widths
    const colWidths = [
      { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 18 },
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 12 },
      { wch: 15 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 20 }, { wch: 30 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'employee_import_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const renderPreview = () => {
    if (previewData.length === 0) return null;

    const columns = Object.keys(previewData[0]).slice(0, 5); // Show first 5 columns

    return (
      <div className="mt-3">
        <h4>Preview (First 5 rows, First 5 columns)</h4>
        <DataTable value={previewData} size="small" stripedRows>
          {columns.map(col => (
            <Column key={col} field={col} header={col} style={{ minWidth: '150px' }} />
          ))}
        </DataTable>
      </div>
    );
  };

  const renderResults = () => {
    if (!importResults) return null;

    return (
      <div className="mt-3">
        <h4>Import Results</h4>
        <div className="grid">
          <div className="col-6">
            <Message severity="success" text={`Successfully imported: ${importResults.success}`} />
          </div>
          <div className="col-6">
            <Message severity="error" text={`Failed: ${importResults.failed}`} />
          </div>
        </div>

        {importResults.errors && importResults.errors.length > 0 && (
          <div className="mt-3">
            <h5>Errors</h5>
            <DataTable value={importResults.errors} size="small" stripedRows scrollable scrollHeight="200px">
              <Column field="row" header="Row #" style={{ width: '100px' }} />
              <Column field="name" header="Name" style={{ width: '200px' }} />
              <Column field="error" header="Error" />
            </DataTable>
          </div>
        )}
      </div>
    );
  };

  const footerContent = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={handleClose} className="p-button-text" />
      <Button
        label="Upload"
        icon="pi pi-upload"
        onClick={handleUpload}
        disabled={!file || uploading}
        loading={uploading}
      />
    </div>
  );

  return (
    <Dialog
      header="Import Employees"
      visible={visible}
      style={{ width: '70vw' }}
      onHide={handleClose}
      footer={footerContent}
      modal
    >
      <div className="p-fluid">
        <div className="mb-3">
          <Message
            severity="info"
            text="Upload an Excel (.xlsx, .xls) or CSV file with employee data. The file should contain headers matching the employee fields."
          />
        </div>

        <div className="mb-3">
          <Button
            label="Download Template"
            icon="pi pi-download"
            onClick={downloadTemplate}
            className="p-button-outlined p-button-secondary"
          />
        </div>

        <div className="mb-3">
          <FileUpload
            ref={fileUploadRef}
            name="file"
            accept=".xlsx,.xls,.csv"
            maxFileSize={10000000}
            customUpload
            auto={false}
            chooseLabel="Select File"
            uploadLabel="Import"
            cancelLabel="Clear"
            onSelect={handleFileSelect}
            onClear={handleFileClear}
            onRemove={handleFileRemove}
            emptyTemplate={<p className="m-0">Drag and drop file here or click to browse.</p>}
          />
        </div>

        {uploading && (
          <div className="mb-3">
            <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
            <p className="text-center mt-2">Importing employees...</p>
          </div>
        )}

        {renderPreview()}
        {renderResults()}
      </div>
    </Dialog>
  );
};

export default ImportEmployeesDialog;
