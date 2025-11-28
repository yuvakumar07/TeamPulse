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
import { getAllAssets, deleteAsset } from '../../services/api';
import PermissionGuard from '../auth/PermissionGuard';

const AssetListPrime = ({ onEdit, onAdd }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assetTypeFilter, setAssetTypeFilter] = useState('All');
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
    { label: 'Available', value: 'Available' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'Under Repair', value: 'Under Repair' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Lost', value: 'Lost' }
  ];

  const assetTypeOptions = [
    { label: 'All', value: 'All' },
    { label: 'Laptop', value: 'Laptop' },
    { label: 'Desktop', value: 'Desktop' },
    { label: 'Monitor', value: 'Monitor' },
    { label: 'Phone', value: 'Phone' },
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Keyboard', value: 'Keyboard' },
    { label: 'Mouse', value: 'Mouse' },
    { label: 'Headset', value: 'Headset' },
    { label: 'Dock', value: 'Dock' },
    { label: 'Other', value: 'Other' }
  ];

  useEffect(() => {
    loadAssets();
  }, [lazyState, statusFilter, assetTypeFilter, globalFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const page = lazyState.page + 1;
      const limit = lazyState.rows;
      const sortField = lazyState.sortField || 'created_at';
      const sortOrder = lazyState.sortOrder === 1 ? 'ASC' : 'DESC';

      const response = await getAllAssets(
        page,
        limit,
        statusFilter,
        assetTypeFilter,
        sortField,
        sortOrder,
        globalFilter
      );
      setAssets(response.data.data);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      toast.error('Failed to fetch assets');
      console.error('Error fetching assets:', err);
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

  const handleDelete = (asset) => {
    confirmDialog({
      message: `Are you sure you want to delete asset ${asset.asset_tag}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteAsset(asset.id);
          toast.success('Asset deleted successfully!');
          loadAssets();
        } catch (err) {
          toast.error('Failed to delete asset');
          console.error('Error deleting asset:', err);
        }
      }
    });
  };

  // Column templates
  const statusBodyTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Available': return 'success';
        case 'Assigned': return 'info';
        case 'Under Repair': return 'warning';
        case 'Retired': return 'secondary';
        case 'Lost': return 'danger';
        default: return null;
      }
    };
    return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
  };

  const assignedEmployeeTemplate = (rowData) => {
    if (rowData.assigned_employee_name) {
      return (
        <span>
          {rowData.assigned_employee_name}
          {rowData.assigned_employee_sso && <small> ({rowData.assigned_employee_sso})</small>}
        </span>
      );
    }
    return <span className="text-500">Unassigned</span>;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="assets.update">
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-success"
            onClick={() => onEdit(rowData)}
            tooltip="Edit"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
        <PermissionGuard permission="assets.delete">
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Delete"
            tooltipOptions={{ position: 'top' }}
          />
        </PermissionGuard>
      </div>
    );
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <h2 className="m-0">Asset Directory</h2>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="assets.create">
          <Button
            label="Add Asset"
            icon="pi pi-plus"
            onClick={onAdd}
          />
        </PermissionGuard>
      </div>
    );
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <span className="p-input-icon-right" style={{ width: '300px' }}>
        <i className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setlazyState({ ...lazyState, first: 0, page: 0 });
          }}
          placeholder="Search assets..."
          style={{ width: '100%' }}
        />
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <label htmlFor="assetTypeFilter">Type:</label>
        <Dropdown
          id="assetTypeFilter"
          value={assetTypeFilter}
          onChange={(e) => {
            setAssetTypeFilter(e.value);
            setlazyState({ ...lazyState, first: 0, page: 0 });
          }}
          options={assetTypeOptions}
          placeholder="Select Type"
          style={{ width: '150px' }}
        />
        <label htmlFor="statusFilter">Status:</label>
        <Dropdown
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.value);
            setlazyState({ ...lazyState, first: 0, page: 0 });
          }}
          options={statusOptions}
          placeholder="Select Status"
          style={{ width: '150px' }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <ConfirmDialog />
      <Toolbar className="" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <DataTable
        ref={dt}
        value={assets}
        lazy
        dataKey="id"
        paginator={totalRecords > 10}
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyState.sortField}
        sortOrder={lazyState.sortOrder}
        loading={loading}
        globalFilter={globalFilter}
        header={header}
        emptyMessage="No assets found"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Assets"
        rowsPerPageOptions={[5, 10, 25, 50]}
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" sortable style={{ minWidth: '80px' }} />
        <Column field="asset_tag" header="Asset Tag" sortable style={{ minWidth: '150px' }} />
        <Column field="asset_type" header="Type" sortable style={{ minWidth: '120px' }} />
        <Column field="brand" header="Brand" sortable style={{ minWidth: '120px' }} />
        <Column field="model" header="Model" sortable style={{ minWidth: '150px' }} />
        <Column field="serial_number" header="Serial Number" sortable style={{ minWidth: '150px' }} />
        <Column
          field="status"
          header="Status"
          body={statusBodyTemplate}
          sortable
          style={{ minWidth: '120px' }}
        />
        <Column
          field="assigned_employee_name"
          header="Assigned To"
          body={assignedEmployeeTemplate}
          style={{ minWidth: '200px' }}
        />
        <Column
          header="Actions"
          body={actionBodyTemplate}
          exportable={false}
          style={{ minWidth: '120px' }}
        />
      </DataTable>
    </div>
  );
};

export default AssetListPrime;
