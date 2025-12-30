import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { getAllPos, deletePo } from '../../services/api';
import PermissionGuard from '../auth/PermissionGuard';
import PoImportDialog from './PoImportDialog';

const PoListPrime = ({ onEdit, onAdd }) => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [lazyState, setlazyState] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'created_at',
    sortOrder: -1
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const dt = useRef(null);

  const statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Expired', value: 'Expired' }
  ];

  useEffect(() => {
    loadPos();
  }, [lazyState, statusFilter, globalFilter]);

  const loadPos = async () => {
    try {
      setLoading(true);
      const page = lazyState.page + 1;
      const limit = lazyState.rows;
      const sortField = lazyState.sortField || 'created_at';
      const sortOrder = lazyState.sortOrder === 1 ? 'ASC' : 'DESC';

      const response = await getAllPos(
        page,
        limit,
        statusFilter,
        sortField,
        sortOrder,
        globalFilter
      );
      setPos(response.data.data);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      toast.error('Failed to fetch purchase orders');
      console.error('Error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  const onPage = (event) => {
    setlazyState(event);
  };

  const onSort = (event) => {
    setlazyState(event);
  };

  const handleDelete = (po) => {
    confirmDialog({
      message: `Are you sure you want to delete PO ${po.po_number}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deletePo(po.id);
          toast.success('Purchase order deleted successfully!');
          loadPos();
        } catch (error) {
          toast.error('Failed to delete purchase order');
          console.error('Error deleting PO:', error);
        }
      }
    });
  };

  const statusBodyTemplate = (rowData) => {
    const statusColors = {
      'Active': 'success',
      'Closed': 'secondary',
      'Pending': 'warning',
      'Expired': 'danger'
    };

    return (
      <Tag
        value={rowData.status}
        severity={statusColors[rowData.status] || 'info'}
      />
    );
  };

  const amountBodyTemplate = (rowData) => {
    if (!rowData.amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(rowData.amount);
  };

  const dateBodyTemplate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const actionsBodyTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <PermissionGuard permission="pos.update">
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-warning"
            onClick={() => onEdit(rowData)}
            tooltip="Edit"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="pos.delete">
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Delete"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="p-d-flex p-ai-center">
        <h2 className="p-m-0">Purchase Orders</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <PermissionGuard permission="pos.create">
          <Button
            label="Import"
            icon="pi pi-upload"
            className="p-button-secondary"
            onClick={() => setShowImportDialog(true)}
          />
        </PermissionGuard>
        <PermissionGuard permission="pos.create">
          <Button
            label="New PO"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={onAdd}
          />
        </PermissionGuard>
      </div>
    );
  };

  const header = (
    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search POs..."
            style={{ minWidth: '250px' }}
          />
        </span>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Status"
          style={{ minWidth: '150px' }}
        />
      </div>
    </div>
  );

  return (
    <div className="po-list-container">
      <ConfirmDialog />

      <Toolbar
        className="p-mb-4"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      <DataTable
        ref={dt}
        value={pos}
        lazy
        paginator
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyState.sortField}
        sortOrder={lazyState.sortOrder}
        loading={loading}
        header={header}
        responsiveLayout="scroll"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} POs"
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No purchase orders found"
        className="datatable-responsive"
      >
        <Column
          field="po_number"
          header="PO Number"
          sortable
          style={{ minWidth: '150px' }}
        />
        <Column
          field="po_owner_name"
          header="PO Owner"
          sortable
          style={{ minWidth: '200px' }}
        />
        <Column
          field="status"
          header="Status"
          body={statusBodyTemplate}
          sortable
          style={{ minWidth: '120px' }}
        />
        <Column
          field="start_date"
          header="Start Date"
          body={(rowData) => dateBodyTemplate(rowData.start_date)}
          sortable
          style={{ minWidth: '130px' }}
        />
        <Column
          field="end_date"
          header="End Date"
          body={(rowData) => dateBodyTemplate(rowData.end_date)}
          sortable
          style={{ minWidth: '130px' }}
        />
        <Column
          field="amount"
          header="Amount"
          body={amountBodyTemplate}
          sortable
          style={{ minWidth: '130px' }}
        />
        <Column
          body={actionsBodyTemplate}
          exportable={false}
          style={{ minWidth: '120px', textAlign: 'center' }}
          header="Actions"
        />
      </DataTable>

      <PoImportDialog
        visible={showImportDialog}
        onHide={() => setShowImportDialog(false)}
        onSuccess={() => {
          setShowImportDialog(false);
          loadPos();
        }}
      />
    </div>
  );
};

export default PoListPrime;
