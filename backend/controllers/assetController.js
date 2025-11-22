const db = require('../config/database');

// Get all assets with pagination, filtering, and sorting
const getAllAssets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const assetType = req.query.asset_type;
    const search = req.query.search;
    const sortField = req.query.sortField || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Whitelist of allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'asset_tag', 'asset_type', 'brand', 'model', 'status', 'serial_number', 'created_at', 'updated_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Build query based on filters
    let countQuery = 'SELECT COUNT(*) as total FROM assets a';
    let dataQuery = `
      SELECT a.*,
             e.name as assigned_employee_name,
             e.sso as assigned_employee_sso
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to = e.id
    `;
    const queryParams = [];
    const countParams = [];
    const conditions = [];

    // Add status filter if provided
    if (status && status !== 'All') {
      conditions.push('a.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    // Add asset type filter if provided
    if (assetType && assetType !== 'All') {
      conditions.push('a.asset_type = ?');
      queryParams.push(assetType);
      countParams.push(assetType);
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      conditions.push('(a.asset_tag LIKE ? OR a.brand LIKE ? OR a.model LIKE ? OR a.serial_number LIKE ? OR e.name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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
    dataQuery += ` ORDER BY a.${validSortField} ${validSortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Get paginated assets
    const [assets] = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assets',
      error: error.message
    });
  }
};

// Get single asset by ID
const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get asset details with assigned employee info
    const [assets] = await db.query(
      `SELECT a.*,
              e.name as assigned_employee_name,
              e.sso as assigned_employee_sso,
              e.role as assigned_employee_role
       FROM assets a
       LEFT JOIN employees e ON a.assigned_to = e.id
       WHERE a.id = ?`,
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: assets[0]
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching asset',
      error: error.message
    });
  }
};

// Create new asset
const createAsset = async (req, res) => {
  try {
    const {
      asset_tag,
      asset_type,
      brand,
      model,
      serial_number,
      specifications,
      status,
      assigned_to,
      assigned_date,
      notes
    } = req.body;

    // Validate required fields
    if (!asset_tag || !asset_type) {
      return res.status(400).json({
        success: false,
        message: 'Asset tag and asset type are required'
      });
    }

    // Insert asset
    const [result] = await db.query(
      `INSERT INTO assets (
        asset_tag, asset_type, brand, model, serial_number, specifications,
        status, assigned_to, assigned_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_tag, asset_type, brand, model, serial_number, specifications,
        status || 'Available', assigned_to || null, assigned_date || null, notes
      ]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'CREATE', 'asset', ?, ?, ?, ?)`,
        [
          req.admin.id,
          result.insertId,
          `Created asset: ${asset_tag}`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating asset:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Asset tag or serial number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating asset',
      error: error.message
    });
  }
};

// Update existing asset
const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      asset_tag,
      asset_type,
      brand,
      model,
      serial_number,
      specifications,
      status,
      assigned_to,
      assigned_date,
      notes
    } = req.body;

    // Check if asset exists
    const [existing] = await db.query('SELECT * FROM assets WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Validate required fields
    if (!asset_tag || !asset_type) {
      return res.status(400).json({
        success: false,
        message: 'Asset tag and asset type are required'
      });
    }

    // Update asset
    await db.query(
      `UPDATE assets SET
        asset_tag = ?, asset_type = ?, brand = ?, model = ?, serial_number = ?,
        specifications = ?, status = ?, assigned_to = ?, assigned_date = ?, notes = ?
       WHERE id = ?`,
      [
        asset_tag, asset_type, brand, model, serial_number, specifications,
        status, assigned_to || null, assigned_date || null, notes, id
      ]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'UPDATE', 'asset', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Updated asset: ${asset_tag}`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Asset updated successfully'
    });
  } catch (error) {
    console.error('Error updating asset:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Asset tag or serial number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating asset',
      error: error.message
    });
  }
};

// Delete asset
const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset exists and get details for audit log
    const [assets] = await db.query('SELECT * FROM assets WHERE id = ?', [id]);
    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assets[0];

    // Delete asset
    await db.query('DELETE FROM assets WHERE id = ?', [id]);

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'DELETE', 'asset', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Deleted asset: ${asset.asset_tag} (${asset.asset_type})`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting asset',
      error: error.message
    });
  }
};

// Assign asset to employee
const assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, assigned_date } = req.body;

    // Validate inputs
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Check if asset exists
    const [assets] = await db.query('SELECT * FROM assets WHERE id = ?', [id]);
    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if employee exists
    const [employees] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const asset = assets[0];
    const employee = employees[0];

    // Update asset assignment
    await db.query(
      `UPDATE assets SET
        assigned_to = ?,
        assigned_date = ?,
        status = 'Assigned'
       WHERE id = ?`,
      [employee_id, assigned_date || new Date(), id]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'UPDATE', 'asset', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Assigned asset ${asset.asset_tag} to employee ${employee.name} (${employee.sso})`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Asset assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning asset',
      error: error.message
    });
  }
};

// Unassign asset from employee
const unassignAsset = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const [assets] = await db.query('SELECT * FROM assets WHERE id = ?', [id]);
    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const asset = assets[0];

    // Update asset to unassign
    await db.query(
      `UPDATE assets SET
        assigned_to = NULL,
        assigned_date = NULL,
        status = 'Available'
       WHERE id = ?`,
      [id]
    );

    // Audit log
    if (req.admin) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent)
         VALUES (?, 'UPDATE', 'asset', ?, ?, ?, ?)`,
        [
          req.admin.id,
          id,
          `Unassigned asset: ${asset.asset_tag}`,
          req.ip,
          req.headers['user-agent']
        ]
      );
    }

    res.json({
      success: true,
      message: 'Asset unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning asset',
      error: error.message
    });
  }
};

// Get assets assigned to a specific employee
const getAssetsByEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const [assets] = await db.query(
      `SELECT a.*
       FROM assets a
       WHERE a.assigned_to = ?
       ORDER BY a.assigned_date DESC`,
      [employee_id]
    );

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching employee assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee assets',
      error: error.message
    });
  }
};

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  getAssetsByEmployee
};
