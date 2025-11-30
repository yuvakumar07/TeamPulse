const db = require('../config/database');

// Helper function to calculate visa status based on dates
const calculateVisaStatus = (visaType, startDate, endDate) => {
  if (!visaType || visaType === 'None' || visaType === 'US Citizen' || visaType === 'Green Card') {
    return 'Not Applicable';
  }

  if (!startDate && !endDate) {
    return 'In Process';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    if (start > today) {
      return 'In Process';
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      return 'Expired';
    }
  }

  return 'Active';
};

// Get all visa history for an employee
const getVisaHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // First check if employee exists
    const [employee] = await db.query('SELECT id, name FROM employees WHERE id = ?', [employeeId]);

    if (employee.length === 0) {
      console.error('Employee not found:', employeeId);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const [history] = await db.query(
      `SELECT vh.*, a.username as created_by_name
       FROM visa_history vh
       LEFT JOIN admin_users a ON vh.created_by = a.id
       WHERE vh.employee_id = ?
       ORDER BY vh.start_date DESC`,
      [employeeId]
    );

    // Calculate visa_status for each record
    const historyWithStatus = history.map(record => ({
      ...record,
      visa_status: calculateVisaStatus(record.visa_type, record.start_date, record.end_date)
    }));

    res.json({
      success: true,
      data: historyWithStatus
    });
  } catch (error) {
    console.error('Error fetching visa history:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching visa history',
      error: error.message
    });
  }
};

// Get single visa history record
const getVisaHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await db.query(
      `SELECT vh.*, a.username as created_by_name
       FROM visa_history vh
       LEFT JOIN admin_users a ON vh.created_by = a.id
       WHERE vh.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visa history record not found'
      });
    }

    const record = records[0];
    record.visa_status = calculateVisaStatus(record.visa_type, record.start_date, record.end_date);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching visa history record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visa history record',
      error: error.message
    });
  }
};

// Create new visa history record
const createVisaHistory = async (req, res) => {
  try {
    const {
      employee_id,
      visa_type,
      start_date,
      end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      petition_number,
      receipt_number,
      approval_notice_number,
      filed_date,
      approved_date,
      denial_date,
      denial_reason,
      extension_count,
      is_current,
      notes,
      documents_path
    } = req.body;

    // Validation
    if (!employee_id || !visa_type || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, visa type, and start date are required'
      });
    }

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type, start_date, end_date);

    // If this is marked as current, unmark all other records for this employee
    if (is_current) {
      await db.query(
        'UPDATE visa_history SET is_current = FALSE WHERE employee_id = ?',
        [employee_id]
      );
    }

    const [result] = await db.query(
      `INSERT INTO visa_history
      (employee_id, visa_type, visa_status, start_date, end_date, i94_expiry_date,
       passport_number, passport_expiry_date, sponsor_company, petition_number, receipt_number,
       approval_notice_number, filed_date, approved_date, denial_date, denial_reason,
       extension_count, is_current, notes, documents_path, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, visa_type, computedVisaStatus, start_date, end_date, i94_expiry_date,
       passport_number, passport_expiry_date, sponsor_company, petition_number, receipt_number,
       approval_notice_number, filed_date, approved_date, denial_date, denial_reason,
       extension_count || 0, is_current || false, notes, documents_path,
       req.admin ? req.admin.id : null]
    );

    // If this is current, update the employee's main visa fields
    if (is_current) {
      await db.query(
        `UPDATE employees
        SET visa_type = ?, visa_status = ?, current_visa_start_date = ?, current_visa_end_date = ?,
            i94_expiry_date = ?, passport_number = ?, passport_expiry_date = ?, sponsor_company = ?
        WHERE id = ?`,
        [visa_type, computedVisaStatus, start_date, end_date, i94_expiry_date,
         passport_number, passport_expiry_date, sponsor_company, employee_id]
      );
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'CREATE',
          'visa_history',
          result.insertId,
          `Added visa history record for employee ID: ${employee_id}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Visa history record created successfully',
      data: {
        id: result.insertId,
        employee_id,
        visa_type
      }
    });
  } catch (error) {
    console.error('Error creating visa history:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating visa history',
      error: error.message
    });
  }
};

// Update visa history record
const updateVisaHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      visa_type,
      start_date,
      end_date,
      i94_expiry_date,
      passport_number,
      passport_expiry_date,
      sponsor_company,
      petition_number,
      receipt_number,
      approval_notice_number,
      filed_date,
      approved_date,
      denial_date,
      denial_reason,
      extension_count,
      is_current,
      notes,
      documents_path
    } = req.body;

    // Check if record exists
    const [existing] = await db.query(
      'SELECT * FROM visa_history WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visa history record not found'
      });
    }

    const oldEmployeeId = existing[0].employee_id;

    // Calculate visa status based on dates
    const computedVisaStatus = calculateVisaStatus(visa_type, start_date, end_date);

    // If this is marked as current, unmark all other records for this employee
    if (is_current) {
      await db.query(
        'UPDATE visa_history SET is_current = FALSE WHERE employee_id = ? AND id != ?',
        [employee_id, id]
      );
    }

    const [result] = await db.query(
      `UPDATE visa_history
      SET employee_id = ?, visa_type = ?, visa_status = ?, start_date = ?, end_date = ?,
          i94_expiry_date = ?, passport_number = ?, passport_expiry_date = ?, sponsor_company = ?,
          petition_number = ?, receipt_number = ?, approval_notice_number = ?, filed_date = ?,
          approved_date = ?, denial_date = ?, denial_reason = ?, extension_count = ?,
          is_current = ?, notes = ?, documents_path = ?
      WHERE id = ?`,
      [employee_id, visa_type, computedVisaStatus, start_date, end_date, i94_expiry_date,
       passport_number, passport_expiry_date, sponsor_company, petition_number, receipt_number,
       approval_notice_number, filed_date, approved_date, denial_date, denial_reason,
       extension_count, is_current, notes, documents_path, id]
    );

    // If this is current, update the employee's main visa fields
    if (is_current) {
      await db.query(
        `UPDATE employees
        SET visa_type = ?, visa_status = ?, current_visa_start_date = ?, current_visa_end_date = ?,
            i94_expiry_date = ?, passport_number = ?, passport_expiry_date = ?, sponsor_company = ?
        WHERE id = ?`,
        [visa_type, computedVisaStatus, start_date, end_date, i94_expiry_date,
         passport_number, passport_expiry_date, sponsor_company, employee_id]
      );
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'UPDATE',
          'visa_history',
          id,
          `Updated visa history record for employee ID: ${employee_id}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Visa history record updated successfully'
    });
  } catch (error) {
    console.error('Error updating visa history:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visa history',
      error: error.message
    });
  }
};

// Delete visa history record
const deleteVisaHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Get record details before deletion
    const [records] = await db.query(
      'SELECT employee_id, visa_type FROM visa_history WHERE id = ?',
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visa history record not found'
      });
    }

    const record = records[0];

    await db.query('DELETE FROM visa_history WHERE id = ?', [id]);

    // Log the action if admin is authenticated
    if (req.admin) {
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'DELETE',
          'visa_history',
          id,
          `Deleted visa history record (${record.visa_type}) for employee ID: ${record.employee_id}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Visa history record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting visa history:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting visa history',
      error: error.message
    });
  }
};

// Get upcoming visa expirations
const getUpcomingExpirations = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;

    const [expirations] = await db.query(
      `SELECT * FROM upcoming_visa_expirations
       WHERE days_until_visa_expiry <= ?
          OR days_until_i94_expiry <= ?
          OR days_until_passport_expiry <= ?`,
      [days, days, days]
    );

    res.json({
      success: true,
      data: expirations
    });
  } catch (error) {
    console.error('Error fetching upcoming expirations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming expirations',
      error: error.message
    });
  }
};

module.exports = {
  getVisaHistory,
  getVisaHistoryById,
  createVisaHistory,
  updateVisaHistory,
  deleteVisaHistory,
  getUpcomingExpirations
};
