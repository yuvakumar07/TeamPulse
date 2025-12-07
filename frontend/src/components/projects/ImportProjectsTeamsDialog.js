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

const ImportProjectsTeamsDialog = ({ visible, onHide, onSuccess }) => {
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

        // Show first 10 rows as preview
        setPreviewData(jsonData.slice(0, 10));
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
      const response = await axios.post('/api/projects/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setImportResults(response.data.results);
        toast.success(response.data.message);
        if (response.data.results.projectsImported > 0 || response.data.results.teamsImported > 0) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.message || 'Error importing projects and teams';
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
    // Create sample template with headers and examples
    const template = [
      {
        'project_team_name': 'Project Alpha',
        'project_status': 'Active',
        'offshore_manager': 'John Doe',
        'onsite_manager': 'Jane Smith',
        'agile_board_name': 'Alpha Team 1',
        'agile_team_jira_key': 'ALPHA1'
      },
      {
        'project_team_name': 'Project Alpha',
        'project_status': 'Active',
        'offshore_manager': 'John Doe',
        'onsite_manager': 'Jane Smith',
        'agile_board_name': 'Alpha Team 2',
        'agile_team_jira_key': 'ALPHA2'
      },
      {
        'project_team_name': 'Project Beta',
        'project_status': 'Planning',
        'offshore_manager': 'Robert Johnson',
        'onsite_manager': '',
        'agile_board_name': 'Beta Development Team',
        'agile_team_jira_key': 'BETA'
      },
      {
        'project_team_name': 'Project Gamma',
        'project_status': 'On Hold',
        'offshore_manager': 'SSO005',
        'onsite_manager': 'SSO006',
        'agile_board_name': 'Gamma Core Team',
        'agile_team_jira_key': 'GAMMA'
      },
      {
        'project_team_name': 'Project Delta',
        'project_status': 'Completed',
        'offshore_manager': '',
        'onsite_manager': '',
        'agile_board_name': 'Delta Team',
        'agile_team_jira_key': 'DELTA'
      },
      {
        'project_team_name': 'Project Epsilon',
        'project_status': 'Planning',
        'offshore_manager': 'Michael Brown',
        'onsite_manager': 'Sarah Davis',
        'agile_board_name': '',
        'agile_team_jira_key': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects and Teams');

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // project_team_name
      { wch: 18 }, // project_status
      { wch: 22 }, // offshore_manager
      { wch: 22 }, // onsite_manager
      { wch: 30 }, // agile_board_name
      { wch: 22 }  // agile_team_jira_key
    ];

    XLSX.writeFile(wb, 'projects_teams_import_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const renderPreview = () => {
    if (previewData.length === 0) return null;

    return (
      <div className="mt-3">
        <h4>Preview (First 10 rows)</h4>
        <DataTable value={previewData} size="small" stripedRows scrollable scrollHeight="300px">
          <Column field="project_team_name" header="Project Team Name" style={{ minWidth: '200px' }} />
          <Column field="project_status" header="Project Status" style={{ minWidth: '150px' }} />
          <Column field="offshore_manager" header="Offshore Manager" style={{ minWidth: '180px' }} />
          <Column field="onsite_manager" header="Onsite Manager" style={{ minWidth: '180px' }} />
          <Column field="agile_board_name" header="Agile Board Name" style={{ minWidth: '200px' }} />
          <Column field="agile_team_jira_key" header="Jira Key" style={{ minWidth: '150px' }} />
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
          <div className="col-3">
            <Message severity="info" text={`Total Rows: ${importResults.total}`} />
          </div>
          <div className="col-3">
            <Message severity="success" text={`Projects: ${importResults.projectsImported}`} />
          </div>
          <div className="col-3">
            <Message severity="success" text={`Teams: ${importResults.teamsImported}`} />
          </div>
          <div className="col-3">
            <Message severity="warn" text={`Skipped: ${importResults.skipped}`} />
          </div>
        </div>

        {importResults.errors && importResults.errors.length > 0 && (
          <div className="mt-3">
            <h5>Errors and Warnings</h5>
            <DataTable value={importResults.errors} size="small" stripedRows scrollable scrollHeight="250px">
              <Column field="row" header="Row #" style={{ width: '100px' }} />
              <Column field="error" header="Error/Warning" />
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
      header="Import Projects and Teams"
      visible={visible}
      style={{ width: '80vw' }}
      onHide={handleClose}
      footer={footerContent}
      modal
    >
      <div className="p-fluid">
        <div className="mb-3">
          <Message
            severity="info"
            text="Upload an Excel (.xlsx, .xls) or CSV file with project and team data. Each row can contain a project and its team information."
          />
        </div>

        <div className="mb-3">
          <Message
            severity="warn"
            text="Required: project_team_name. Optional: project_status, offshore_manager, onsite_manager, agile_board_name, agile_team_jira_key"
          />
        </div>

        <div className="mb-3">
          <h5>Field Specifications:</h5>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li><strong>project_team_name:</strong> Required - Name of the project</li>
            <li><strong>project_status:</strong> Optional - Planning, Active, On Hold, Completed, or Cancelled (default: Planning)</li>
            <li><strong>offshore_manager:</strong> Optional - Employee name or SSO of offshore manager</li>
            <li><strong>onsite_manager:</strong> Optional - Employee name or SSO of onsite manager</li>
            <li><strong>agile_board_name:</strong> Optional - Name of the agile board/team</li>
            <li><strong>agile_team_jira_key:</strong> Optional - Jira project key</li>
          </ul>
        </div>

        <div className="mb-3">
          <h5>Import Behavior:</h5>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Multiple rows with the same project_team_name will create one project with multiple teams</li>
            <li>Manager names or SSOs will be looked up in the employee database</li>
            <li>If a manager is not found, the project will be created without that manager assignment</li>
            <li>If agile_board_name is empty, only the project will be created</li>
            <li>Existing projects will be updated with manager information if provided</li>
            <li>Duplicate team names within the same project will be skipped</li>
          </ul>
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
            <p className="text-center mt-2">Importing projects and teams...</p>
          </div>
        )}

        {renderPreview()}
        {renderResults()}
      </div>
    </Dialog>
  );
};

export default ImportProjectsTeamsDialog;
