import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { getVisaHistory, createVisaHistory, updateVisaHistory, deleteVisaHistory } from '../../services/api';
import PermissionGuard from '../auth/PermissionGuard';

const VisaHistoryPrime = ({ employeeId, employeeName, visible, onHide }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    visa_type: 'H1B',
    start_date: null,
    end_date: null,
    i94_expiry_date: null,
    passport_number: '',
    passport_expiry_date: null,
    sponsor_company: '',
    petition_number: '',
    receipt_number: '',
    approval_notice_number: '',
    filed_date: null,
    approved_date: null,
    denial_date: null,
    denial_reason: '',
    extension_count: 0,
    is_current: false,
    notes: '',
    documents_path: ''
  });

  useEffect(() => {
    if (visible && employeeId) {
      console.log('Fetching visa history for employee:', employeeId);
      setShowForm(false); // Always show list view when dialog opens
      setEditingRecord(null); // Clear any editing record
      fetchHistory();
    }
  }, [visible, employeeId]);

  const fetchHistory = async () => {
    if (!employeeId) {
      console.error('No employee ID provided');
      toast.error('No employee selected');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling getVisaHistory API for employee:', employeeId);
      const response = await getVisaHistory(employeeId);
      console.log('Visa history response:', response.data);
      setHistory(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch visa history');
      console.error('Error fetching visa history:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const dataToSubmit = {
        employee_id: employeeId,
        ...formData,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
        i94_expiry_date: formData.i94_expiry_date ? formData.i94_expiry_date.toISOString().split('T')[0] : null,
        passport_expiry_date: formData.passport_expiry_date ? formData.passport_expiry_date.toISOString().split('T')[0] : null,
        filed_date: formData.filed_date ? formData.filed_date.toISOString().split('T')[0] : null,
        approved_date: formData.approved_date ? formData.approved_date.toISOString().split('T')[0] : null,
        denial_date: formData.denial_date ? formData.denial_date.toISOString().split('T')[0] : null
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
      start_date: record.start_date ? new Date(record.start_date) : null,
      end_date: record.end_date ? new Date(record.end_date) : null,
      i94_expiry_date: record.i94_expiry_date ? new Date(record.i94_expiry_date) : null,
      passport_number: record.passport_number || '',
      passport_expiry_date: record.passport_expiry_date ? new Date(record.passport_expiry_date) : null,
      sponsor_company: record.sponsor_company || '',
      petition_number: record.petition_number || '',
      receipt_number: record.receipt_number || '',
      approval_notice_number: record.approval_notice_number || '',
      filed_date: record.filed_date ? new Date(record.filed_date) : null,
      approved_date: record.approved_date ? new Date(record.approved_date) : null,
      denial_date: record.denial_date ? new Date(record.denial_date) : null,
      denial_reason: record.denial_reason || '',
      extension_count: record.extension_count || 0,
      is_current: record.is_current || false,
      notes: record.notes || '',
      documents_path: record.documents_path || ''
    });
    setShowForm(true);
  };

  const handleDelete = (record) => {
    confirmDialog({
      message: `Are you sure you want to delete this ${record.visa_type} record?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await deleteVisaHistory(record.id);
          toast.success('Visa record deleted successfully!');
          fetchHistory();
        } catch (err) {
          toast.error('Failed to delete visa record');
          console.error('Error deleting visa record:', err);
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      visa_type: 'H1B',
      start_date: null,
      end_date: null,
      i94_expiry_date: null,
      passport_number: '',
      passport_expiry_date: null,
      sponsor_company: '',
      petition_number: '',
      receipt_number: '',
      approval_notice_number: '',
      filed_date: null,
      approved_date: null,
      denial_date: null,
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

  const visaStatusBodyTemplate = (rowData) => {
    const getSeverity = (status) => {
      switch (status) {
        case 'Active': return 'success';
        case 'Expired': return 'danger';
        case 'In Process': return 'warning';
        default: return 'secondary';
      }
    };
    return <Tag value={rowData.visa_status} severity={getSeverity(rowData.visa_status)} />;
  };

  const currentBadgeTemplate = (rowData) => {
    return rowData.is_current ? <Tag value="Current" severity="success" icon="pi pi-check" /> : null;
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <PermissionGuard permission="employees.update">
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-success"
            onClick={() => handleEdit(rowData)}
            tooltip="Edit"
          />
        </PermissionGuard>
        <PermissionGuard permission="employees.delete">
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            severity="danger"
            onClick={() => handleDelete(rowData)}
            tooltip="Delete"
          />
        </PermissionGuard>
      </div>
    );
  };

  const visaTypeOptions = [
    { label: 'H1B', value: 'H1B' },
    { label: 'L1', value: 'L1' },
    { label: 'L2', value: 'L2' },
    { label: 'Green Card', value: 'Green Card' },
    { label: 'US Citizen', value: 'US Citizen' },
    { label: 'Other', value: 'Other' }
  ];

  const formFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={resetForm} className="p-button-text" />
      <Button label="Save" icon="pi pi-check" onClick={handleSubmit} />
    </div>
  );

  const mainDialogFooter = (
    <div>
      <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" />
    </div>
  );

  return (
    <>
      <ConfirmDialog />
      <Dialog
        visible={visible}
        style={{ width: '80vw' }}
        breakpoints={{ '960px': '90vw', '641px': '95vw' }}
        header={`Visa History - ${employeeName}`}
        modal
        className="p-fluid"
        footer={mainDialogFooter}
        onHide={onHide}
      >
        <div className="mb-3">
          <PermissionGuard permission="employees.update">
            <Button
              label="Add Visa Record"
              icon="pi pi-plus"
              onClick={() => setShowForm(true)}
              className="mb-3"
            />
          </PermissionGuard>
        </div>

        {!showForm ? (
          <DataTable
            value={history}
            loading={loading}
            emptyMessage="No visa records found"
            responsiveLayout="scroll"
            stripedRows
            showGridlines
          >
            <Column field="visa_type" header="Visa Type" style={{ minWidth: '120px' }} />
            <Column field="visa_status" header="Status" body={visaStatusBodyTemplate} style={{ minWidth: '120px' }} />
            <Column header="Current" body={currentBadgeTemplate} style={{ minWidth: '100px' }} />
            <Column field="start_date" header="Start Date" body={(rowData) => formatDate(rowData.start_date)} style={{ minWidth: '120px' }} />
            <Column field="end_date" header="End Date" body={(rowData) => formatDate(rowData.end_date)} style={{ minWidth: '120px' }} />
            <Column field="sponsor_company" header="Sponsor" style={{ minWidth: '150px' }} />
            <Column field="petition_number" header="Petition #" style={{ minWidth: '130px' }} />
            <Column field="extension_count" header="Extensions" style={{ minWidth: '100px' }} />
            <Column header="Actions" body={actionBodyTemplate} style={{ minWidth: '150px' }} />
          </DataTable>
        ) : (
          <Card title={editingRecord ? 'Edit Visa Record' : 'Add Visa Record'}>
            <div className="formgrid grid">
              <div className="field col-12">
                <label htmlFor="visa_type">Visa Type *</label>
                <Dropdown
                  id="visa_type"
                  value={formData.visa_type}
                  options={visaTypeOptions}
                  onChange={(e) => handleChange('visa_type', e.value)}
                  required
                />
                <small className="block mt-1">Visa status will be automatically calculated based on start and end dates</small>
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="start_date">Start Date *</label>
                <Calendar
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                  required
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="end_date">End Date</label>
                <Calendar
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="i94_expiry_date">I-94 Expiry Date</label>
                <Calendar
                  id="i94_expiry_date"
                  value={formData.i94_expiry_date}
                  onChange={(e) => handleChange('i94_expiry_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="passport_expiry_date">Passport Expiry Date</label>
                <Calendar
                  id="passport_expiry_date"
                  value={formData.passport_expiry_date}
                  onChange={(e) => handleChange('passport_expiry_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="passport_number">Passport Number</label>
                <InputText
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleChange('passport_number', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="sponsor_company">Sponsor Company</label>
                <InputText
                  id="sponsor_company"
                  value={formData.sponsor_company}
                  onChange={(e) => handleChange('sponsor_company', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="petition_number">Petition Number</label>
                <InputText
                  id="petition_number"
                  value={formData.petition_number}
                  onChange={(e) => handleChange('petition_number', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="receipt_number">Receipt Number</label>
                <InputText
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => handleChange('receipt_number', e.target.value)}
                />
              </div>

              <div className="field col-12">
                <label htmlFor="approval_notice_number">Approval Notice Number</label>
                <InputText
                  id="approval_notice_number"
                  value={formData.approval_notice_number}
                  onChange={(e) => handleChange('approval_notice_number', e.target.value)}
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="filed_date">Filed Date</label>
                <Calendar
                  id="filed_date"
                  value={formData.filed_date}
                  onChange={(e) => handleChange('filed_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="approved_date">Approved Date</label>
                <Calendar
                  id="approved_date"
                  value={formData.approved_date}
                  onChange={(e) => handleChange('approved_date', e.value)}
                  dateFormat="yy-mm-dd"
                  showIcon
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="extension_count">Extension Count</label>
                <InputNumber
                  id="extension_count"
                  value={formData.extension_count}
                  onValueChange={(e) => handleChange('extension_count', e.value)}
                  min={0}
                  showButtons
                />
              </div>

              <div className="field col-12">
                <label htmlFor="notes">Notes</label>
                <InputTextarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes about this visa record"
                />
              </div>

              <div className="field col-12">
                <div className="flex align-items-center">
                  <Checkbox
                    inputId="is_current"
                    checked={formData.is_current}
                    onChange={(e) => handleChange('is_current', e.checked)}
                  />
                  <label htmlFor="is_current" className="ml-2">Mark as current visa</label>
                </div>
              </div>

              <div className="col-12">
                <div className="flex justify-content-end gap-2">
                  <Button label="Cancel" icon="pi pi-times" onClick={resetForm} className="p-button-text" />
                  <Button label="Save" icon="pi pi-check" onClick={handleSubmit} />
                </div>
              </div>
            </div>
          </Card>
        )}
      </Dialog>
    </>
  );
};

export default VisaHistoryPrime;
