import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { getAllInvoices, deleteInvoice, downloadInvoicePDF, getAllProjects, getProjectById } from '../services/api';
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
  const [projectFilter, setProjectFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, statusFilter, projectFilter, teamFilter]);

  useEffect(() => {
    if (projectFilter && projectFilter !== 'All') {
      fetchTeams(projectFilter);
    } else {
      setTeams([]);
      setTeamFilter('All');
    }
  }, [projectFilter]);

  const fetchProjects = async () => {
    try {
      const response = await getAllProjects(1, 1000, 'All');
      setProjects(response.data.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to load projects');
    }
  };

  const fetchTeams = async (projectId) => {
    try {
      const response = await getProjectById(projectId);
      const projectData = response.data.data;
      setTeams(projectData.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      toast.error('Failed to load teams');
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // Build params object
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }
      if (projectFilter !== 'All') {
        params.projectId = projectFilter;
      }
      if (teamFilter !== 'All') {
        params.teamId = teamFilter;
      }

      const response = await getAllInvoices(
        params.page,
        params.limit,
        params.status || null,
        params.projectId || null,
        params.teamId || null
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

  // PrimeReact column templates
  const invoiceNumberTemplate = (rowData) => {
    return <strong className="invoice-number">{rowData.invoice_number}</strong>;
  };

  const teamTemplate = (rowData) => {
    return rowData.team_name || 'All Teams';
  };

  const periodTemplate = (rowData) => {
    return `${getMonthName(rowData.invoice_month)} ${rowData.invoice_year}`;
  };

  const balanceHoursTemplate = (rowData) => {
    const balance = parseFloat(rowData.total_billing_hours) - parseFloat(rowData.total_leave_hours);
    return <strong>{balance.toFixed(1)}</strong>;
  };

  const amountTemplate = (rowData) => {
    return <strong>{formatCurrency(rowData.total_amount)}</strong>;
  };

  const statusTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Paid': return 'success';
        case 'Approved': return 'info';
        case 'Submitted': return 'warning';
        case 'Draft': return 'secondary';
        case 'Cancelled': return 'danger';
        default: return null;
      }
    };

    return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
  };

  const createdTemplate = (rowData) => {
    return new Date(rowData.created_at).toLocaleDateString();
  };

  const actionsTemplate = (rowData) => {
    const hasPermission = authService.hasPermission;

    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-file-pdf"
          className="p-button-rounded p-button-danger p-button-sm"
          onClick={() => handleDownloadPDF(rowData.id, rowData.invoice_number)}
          tooltip="Download PDF"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          onClick={() => handleView(rowData.id)}
          tooltip="View Invoice"
          tooltipOptions={{ position: 'top' }}
        />
        {hasPermission('invoices.update') && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-warning p-button-sm"
            onClick={() => handleEdit(rowData.id)}
            tooltip="Edit Invoice"
            tooltipOptions={{ position: 'top' }}
          />
        )}
        {hasPermission('invoices.delete') && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-danger p-button-sm"
            onClick={() => handleDeleteClick(rowData.id)}
            tooltip="Delete Invoice"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    );
  };

  // Filter options
  const statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

  const projectOptions = [
    { label: 'All Projects', value: 'All' },
    ...projects.map(project => ({
      label: project.project_team_name,
      value: project.id
    }))
  ];

  const teamOptions = [
    { label: 'All Teams', value: 'All' },
    ...teams.map(team => ({
      label: team.agile_board_name,
      value: team.id
    }))
  ];

  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h1>Invoice Management</h1>
          <p className="page-subtitle">Generate and manage project invoices</p>
        </div>
        <Button
          label="Generate Invoice"
          icon="pi pi-plus"
          className="p-button-warning"
          onClick={() => setShowGenerateModal(true)}
        />
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => {
              setStatusFilter(e.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            placeholder="Filter by Status"
          />
        </div>

        <div className="filter-group">
          <label>Project:</label>
          <Dropdown
            value={projectFilter}
            options={projectOptions}
            onChange={(e) => {
              setProjectFilter(e.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            placeholder="Filter by Project"
          />
        </div>

        <div className="filter-group">
          <label>Team:</label>
          <Dropdown
            value={teamFilter}
            options={teamOptions}
            onChange={(e) => {
              setTeamFilter(e.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            placeholder="Filter by Team"
            disabled={projectFilter === 'All' || teams.length === 0}
          />
        </div>
      </div>

      <DataTable
        value={invoices}
        loading={loading}
        emptyMessage="No invoices found. Click 'Generate Invoice' to create your first invoice"
        className="p-datatable-gridlines"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="invoice_number" header="Invoice Number" body={invoiceNumberTemplate} sortable />
        <Column field="project_team_name" header="Project" sortable />
        <Column header="Team" body={teamTemplate} />
        <Column header="Period" body={periodTemplate} />
        <Column field="total_billing_hours" header="Billing Hours" sortable />
        <Column field="total_leave_hours" header="Leave Hours" sortable />
        <Column header="Balance Hours" body={balanceHoursTemplate} />
        <Column header="Total Amount" body={amountTemplate} sortable />
        <Column header="Status" body={statusTemplate} sortable />
        <Column header="Created" body={createdTemplate} sortable />
        <Column header="Actions" body={actionsTemplate} style={{ width: '12rem' }} />
      </DataTable>

      <div className="pagination-container">
        <Button
          label="Previous"
          icon="pi pi-chevron-left"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="p-button-text"
        />
        <span className="pagination-info">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
        </span>
        <Button
          label="Next"
          icon="pi pi-chevron-right"
          iconPos="right"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="p-button-text"
        />
      </div>

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

      <Dialog
        header="Confirm Delete"
        visible={showDeleteConfirm}
        style={{ width: '450px' }}
        onHide={() => setShowDeleteConfirm(false)}
        footer={
          <>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowDeleteConfirm(false)}
              className="p-button-text"
              disabled={deleting}
            />
            <Button
              label={deleting ? 'Deleting...' : 'Delete'}
              icon="pi pi-check"
              onClick={handleDeleteConfirm}
              className="p-button-danger"
              disabled={deleting}
            />
          </>
        }
      >
        <p>Are you sure you want to delete this invoice?</p>
        <p className="warning-text"><strong>This action cannot be undone.</strong></p>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
