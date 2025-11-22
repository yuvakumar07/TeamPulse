import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { getAssetsByEmployee } from '../../services/api';
import { toast } from 'react-toastify';

const AssetsByEmployeeModal = ({ employeeId, employeeName, isOpen, onClose }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) {
      loadAssets();
    }
  }, [isOpen, employeeId]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await getAssetsByEmployee(employeeId);
      setAssets(response.data.data);
    } catch (error) {
      console.error('Error fetching employee assets:', error);
      toast.error('Failed to fetch employee assets');
    } finally {
      setLoading(false);
    }
  };

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

  const dateBodyTemplate = (rowData, field) => {
    const dateValue = rowData[field];
    if (!dateValue) return <span className="text-500">N/A</span>;
    return new Date(dateValue).toLocaleDateString();
  };

  const footer = (
    <div>
      <Button
        label="Close"
        icon="pi pi-times"
        onClick={onClose}
        className="p-button-text"
        aria-label="Cancel"
      />
    </div>
  );

  return (
    <Dialog
      visible={isOpen}
      style={{ width: '70vw' }}
      header={`Assets Assigned to ${employeeName}`}
      modal
      onHide={onClose}
      footer={footer}
    >
      <DataTable
        value={assets}
        loading={loading}
        emptyMessage="No assets assigned to this employee"
        paginator={assets.length > 10}
        rows={10}
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <Column field="id" header="ID" style={{ width: '80px' }} />
        <Column field="asset_tag" header="Asset Tag" style={{ minWidth: '150px' }} />
        <Column field="asset_type" header="Type" style={{ minWidth: '120px' }} />
        <Column field="brand" header="Brand" style={{ minWidth: '120px' }} />
        <Column field="model" header="Model" style={{ minWidth: '150px' }} />
        <Column field="serial_number" header="Serial Number" style={{ minWidth: '150px' }} />
        <Column
          field="status"
          header="Status"
          body={statusBodyTemplate}
          style={{ minWidth: '120px' }}
        />
        <Column
          field="assigned_date"
          header="Assigned Date"
          body={(rowData) => dateBodyTemplate(rowData, 'assigned_date')}
          style={{ minWidth: '140px' }}
        />
      </DataTable>
    </Dialog>
  );
};

export default AssetsByEmployeeModal;
