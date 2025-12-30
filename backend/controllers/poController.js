const db = require('../config/database');
const XLSX = require('xlsx');

// Get all POs with pagination, filtering, and sorting
const getAllPos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'po_number', 'po_owner_name', 'status', 'start_date', 'end_date', 'amount', 'created_at', 'updated_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM pos p';
    let dataQuery = `
      SELECT p.*,
             pr.project_team_name as project_name
      FROM pos p
      LEFT JOIN projects pr ON p.project_id = pr.id
    `;
    const queryParams = [];
    const countParams = [];
    const conditions = [];

    // Add status filter if provided
    if (status && status !== 'All') {
      conditions.push('p.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push('(p.po_number LIKE ? OR p.po_owner_name LIKE ? OR p.description LIKE ? OR pr.name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    // Get total count for pagination
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add ordering and pagination
    dataQuery += ` ORDER BY p.${validSortField} ${validSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Get paginated POs
    const [pos] = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: pos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching POs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase orders',
      error: error.message
    });
  }
};

// Get single PO by ID
const getPoById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get PO details with project info
    const [pos] = await db.query(
      `SELECT p.*,
              pr.name as project_name,
              pr.project_code as project_code
       FROM pos p
       LEFT JOIN projects pr ON p.project_id = pr.id
       WHERE p.id = ?`,
      [id]
    );

    if (pos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: pos[0]
    });
  } catch (error) {
    console.error('Error fetching PO:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order',
      error: error.message
    });
  }
};

// Create new PO
const createPo = async (req, res) => {
  try {
    const {
      po_number,
      po_owner_name,
      project_id,
      start_date,
      end_date,
      amount,
      status,
      description
    } = req.body;

    // Validate required fields
    if (!po_number || !po_owner_name) {
      return res.status(400).json({
        success: false,
        message: 'PO number and PO owner name are required'
      });
    }

    // Insert PO
    const [result] = await db.query(
      `INSERT INTO pos (
        po_number, po_owner_name, project_id, start_date, end_date,
        amount, status, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        po_number,
        po_owner_name,
        project_id || null,
        start_date || null,
        end_date || null,
        amount || null,
        status || 'Active',
        description
      ]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'CREATE', 'po', ?, ?, ?, ?)`,
        [
          req.admin.id,
          result.insertId,
          `Created PO: ${po_number}`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating PO:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'PO number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating purchase order',
      error: error.message
    });
  }
};

// Update existing PO
const updatePo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      po_number,
      po_owner_name,
      project_id,
      start_date,
      end_date,
      amount,
      status,
      description
    } = req.body;

    // Check if PO exists
    const [existing] = await db.query('SELECT * FROM pos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Validate required fields
    if (!po_number || !po_owner_name) {
      return res.status(400).json({
        success: false,
        message: 'PO number and PO owner name are required'
      });
    }

    // Update PO
    await db.query(
      `UPDATE pos SET
        po_number = ?, po_owner_name = ?, project_id = ?, start_date = ?,
        end_date = ?, amount = ?, status = ?, description = ?
       WHERE id = ?`,
      [
        po_number,
        po_owner_name,
        project_id || null,
        start_date || null,
        end_date || null,
        amount || null,
        status,
        description,
        id
      ]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'UPDATE', 'po', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Updated PO: ${po_number}`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Purchase order updated successfully'
    });
  } catch (error) {
    console.error('Error updating PO:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'PO number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating purchase order',
      error: error.message
    });
  }
};

// Delete PO
const deletePo = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if PO exists and get details for audit log
    const [pos] = await db.query('SELECT * FROM pos WHERE id = ?', [id]);
    if (pos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    const po = pos[0];

    // Delete PO
    await db.query('DELETE FROM pos WHERE id = ?', [id]);

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'DELETE', 'po', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Deleted PO: ${po.po_number} (Owner: ${po.po_owner_name})`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PO:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase order',
      error: error.message
    });
  }
};

// Get POs by project
const getPosByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const [pos] = await db.query(
      `SELECT p.*
       FROM pos p
       WHERE p.project_id = ?
       ORDER BY p.created_at DESC`,
      [project_id]
    );

    res.json({
      success: true,
      data: pos
    });
  } catch (error) {
    console.error('Error fetching project POs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project purchase orders',
      error: error.message
    });
  }
};

// Import POs from CSV/Excel file
const importPos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse the uploaded file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The file is empty or has no valid data'
      });
    }

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and first row is header

      try {
        // Validate required fields
        if (!row.po_number || !row.po_owner_name) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields: po_number or po_owner_name'
          });
          continue;
        }

        // Prepare data
        const poData = {
          po_number: String(row.po_number).trim(),
          po_owner_name: String(row.po_owner_name).trim(),
          start_date: row.start_date ? formatDate(row.start_date) : null,
          end_date: row.end_date ? formatDate(row.end_date) : null,
          amount: row.amount ? parseFloat(row.amount) : null,
          status: row.status || 'Active',
          description: row.description || null
        };

        // Validate status
        const validStatuses = ['Active', 'Closed', 'Pending', 'Expired'];
        if (!validStatuses.includes(poData.status)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Invalid status: ${poData.status}. Must be one of: ${validStatuses.join(', ')}`
          });
          continue;
        }

        // Insert PO
        await db.query(
          `INSERT INTO pos (
            po_number, po_owner_name, start_date, end_date,
            amount, status, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            poData.po_number,
            poData.po_owner_name,
            poData.start_date,
            poData.end_date,
            poData.amount,
            poData.status,
            poData.description
          ]
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        let errorMsg = error.message;

        if (error.code === 'ER_DUP_ENTRY') {
          errorMsg = `PO number '${row.po_number}' already exists`;
        }

        results.errors.push({
          row: rowNumber,
          error: errorMsg
        });
      }
    }

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'IMPORT', 'po', ?, ?, ?, ?)`,
        [
          req.admin.id,
          null,
          `Imported ${results.successful} POs (${results.failed} failed)`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error importing POs:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing purchase orders',
      error: error.message
    });
  }
};

// Helper function to format dates from Excel
const formatDate = (excelDate) => {
  if (!excelDate) return null;

  // If it's already a date string in YYYY-MM-DD format
  if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
    return excelDate;
  }

  // If it's an Excel serial date number
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  // Try to parse as date
  try {
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    return null;
  }

  return null;
};

module.exports = {
  getAllPos,
  getPoById,
  createPo,
  updatePo,
  deletePo,
  getPosByProject,
  importPos
};
