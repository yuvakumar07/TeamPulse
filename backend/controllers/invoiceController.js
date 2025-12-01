const db = require('../config/database');

// Generate invoice number
const generateInvoiceNumber = (projectId, month, year) => {
  const paddedMonth = String(month).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `INV-${projectId}-${year}${paddedMonth}-${timestamp}`;
};

// Get employees for invoice generation
const getEmployeesForInvoice = async (req, res) => {
  try {
    const { projectId, teamId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Get project details
    const [projects] = await db.query(
      'SELECT id, project_team_name FROM projects WHERE id = ?',
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    let employees = [];

    if (teamId) {
      // Get employees for specific team including team leads
      const [team] = await db.query(
        `SELECT pt.*, p.project_team_name,
                otl.id as offshore_tl_id, otl.name as offshore_tl_name,
                otl.role as offshore_tl_role, otl.role_type as offshore_tl_role_type,
                ostl.id as onsite_tl_id, ostl.name as onsite_tl_name,
                ostl.role as onsite_tl_role, ostl.role_type as onsite_tl_role_type
         FROM project_teams pt
         JOIN projects p ON pt.project_id = p.id
         LEFT JOIN employees otl ON pt.offshore_team_lead_id = otl.id
         LEFT JOIN employees ostl ON pt.onsite_team_lead_id = ostl.id
         WHERE pt.id = ? AND pt.project_id = ?`,
        [teamId, projectId]
      );

      if (team.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Get team employees
      const [teamEmployees] = await db.query(
        `SELECT DISTINCT e.id, e.name, e.sso, e.role, e.role_type
         FROM project_employees pe
         JOIN employees e ON pe.employee_id = e.id
         WHERE pe.team_id = ?
         ORDER BY e.name`,
        [teamId]
      );

      employees = [...teamEmployees];

      // Add team leads if not already in list
      if (team[0].offshore_tl_id && !employees.some(emp => emp.id === team[0].offshore_tl_id)) {
        employees.push({
          id: team[0].offshore_tl_id,
          name: team[0].offshore_tl_name,
          sso: null,
          role: team[0].offshore_tl_role,
          role_type: team[0].offshore_tl_role_type
        });
      }

      if (team[0].onsite_tl_id && !employees.some(emp => emp.id === team[0].onsite_tl_id)) {
        employees.push({
          id: team[0].onsite_tl_id,
          name: team[0].onsite_tl_name,
          sso: null,
          role: team[0].onsite_tl_role,
          role_type: team[0].onsite_tl_role_type
        });
      }
    } else {
      // Get all employees for project including managers and team leads
      const [project] = await db.query(
        `SELECT p.*,
                om.id as offshore_mgr_id, om.name as offshore_mgr_name,
                om.role as offshore_mgr_role, om.role_type as offshore_mgr_role_type,
                osm.id as onsite_mgr_id, osm.name as onsite_mgr_name,
                osm.role as onsite_mgr_role, osm.role_type as onsite_mgr_role_type
         FROM projects p
         LEFT JOIN employees om ON p.offshore_manager_id = om.id
         LEFT JOIN employees osm ON p.onsite_manager_id = osm.id
         WHERE p.id = ?`,
        [projectId]
      );

      // Get all employees assigned to the project
      const [projectEmployees] = await db.query(
        `SELECT DISTINCT e.id, e.name, e.sso, e.role, e.role_type
         FROM project_employees pe
         JOIN employees e ON pe.employee_id = e.id
         WHERE pe.project_id = ?
         ORDER BY e.name`,
        [projectId]
      );

      employees = [...projectEmployees];

      // Add managers if not already in list
      if (project[0].offshore_mgr_id && !employees.some(emp => emp.id === project[0].offshore_mgr_id)) {
        employees.push({
          id: project[0].offshore_mgr_id,
          name: project[0].offshore_mgr_name,
          sso: null,
          role: project[0].offshore_mgr_role,
          role_type: project[0].offshore_mgr_role_type
        });
      }

      if (project[0].onsite_mgr_id && !employees.some(emp => emp.id === project[0].onsite_mgr_id)) {
        employees.push({
          id: project[0].onsite_mgr_id,
          name: project[0].onsite_mgr_name,
          sso: null,
          role: project[0].onsite_mgr_role,
          role_type: project[0].onsite_mgr_role_type
        });
      }

      // Get all team leads for the project
      const [teamLeads] = await db.query(
        `SELECT DISTINCT
                otl.id as id, otl.name as name, otl.role as role, otl.role_type as role_type
         FROM project_teams pt
         LEFT JOIN employees otl ON pt.offshore_team_lead_id = otl.id
         WHERE pt.project_id = ? AND otl.id IS NOT NULL
         UNION
         SELECT DISTINCT
                ostl.id as id, ostl.name as name, ostl.role as role, ostl.role_type as role_type
         FROM project_teams pt
         LEFT JOIN employees ostl ON pt.onsite_team_lead_id = ostl.id
         WHERE pt.project_id = ? AND ostl.id IS NOT NULL`,
        [projectId, projectId]
      );

      // Add team leads if not already in list
      teamLeads.forEach(tl => {
        if (!employees.some(emp => emp.id === tl.id)) {
          employees.push({
            id: tl.id,
            name: tl.name,
            sso: null,
            role: tl.role,
            role_type: tl.role_type
          });
        }
      });
    }

    // Sort employees by name
    employees.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees for invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Create invoice
const createInvoice = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      project_id,
      team_id,
      invoice_month,
      invoice_year,
      employees, // Array of {employee_id, employee_name, employee_role, role_type, billing_hours, leave_hours, cost_per_hour}
      notes
    } = req.body;

    // Validation
    if (!project_id || !invoice_month || !invoice_year) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Project, month, and year are required'
      });
    }

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one employee is required'
      });
    }

    // Check for duplicate invoice
    const [existingInvoice] = await connection.query(
      `SELECT id FROM invoices
       WHERE project_id = ? AND invoice_month = ? AND invoice_year = ?
       AND (team_id = ? OR (team_id IS NULL AND ? IS NULL))`,
      [project_id, invoice_month, invoice_year, team_id, team_id]
    );

    if (existingInvoice.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this project/team and period'
      });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(project_id, invoice_month, invoice_year);

    // Calculate totals
    let totalBillingHours = 0;
    let totalLeaveHours = 0;
    let totalAmount = 0;

    employees.forEach(emp => {
      const billingHours = parseFloat(emp.billing_hours) || 0;
      const leaveHours = parseFloat(emp.leave_hours) || 0;
      const costPerHour = parseFloat(emp.cost_per_hour) || 0;

      totalBillingHours += billingHours;
      totalLeaveHours += leaveHours;
      totalAmount += billingHours * costPerHour;
    });

    // Create invoice
    const [invoiceResult] = await connection.query(
      `INSERT INTO invoices
       (invoice_number, project_id, team_id, invoice_month, invoice_year,
        total_billing_hours, total_leave_hours, total_amount, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        project_id,
        team_id || null,
        invoice_month,
        invoice_year,
        totalBillingHours,
        totalLeaveHours,
        totalAmount,
        notes || null,
        req.admin?.id || null
      ]
    );

    const invoiceId = invoiceResult.insertId;

    // Create invoice items
    for (const emp of employees) {
      const billingHours = parseFloat(emp.billing_hours) || 0;
      const leaveHours = parseFloat(emp.leave_hours) || 0;
      const costPerHour = parseFloat(emp.cost_per_hour) || 0;
      const itemTotal = billingHours * costPerHour;

      await connection.query(
        `INSERT INTO invoice_items
         (invoice_id, employee_id, employee_name, employee_role, role_type,
          billing_hours, leave_hours, cost_per_hour, total_amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          emp.employee_id,
          emp.employee_name,
          emp.employee_role || null,
          emp.role_type || null,
          billingHours,
          leaveHours,
          costPerHour,
          itemTotal,
          emp.notes || null
        ]
      );
    }

    // Log the action if admin is authenticated
    if (req.admin) {
      await connection.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.admin.id,
          'CREATE',
          'invoices',
          invoiceId,
          `Created invoice ${invoiceNumber}`,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent'] || 'Unknown'
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        id: invoiceId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);

    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get all invoices with pagination and filters
const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const projectId = req.query.projectId;

    let countQuery = 'SELECT COUNT(*) as total FROM invoices i';
    let dataQuery = `
      SELECT i.*,
             p.project_team_name,
             pt.agile_board_name as team_name
      FROM invoices i
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN project_teams pt ON i.team_id = pt.id
    `;

    const queryParams = [];
    const countParams = [];
    const conditions = [];

    if (status && status !== 'All') {
      conditions.push('i.status = ?');
      queryParams.push(status);
      countParams.push(status);
    }

    if (projectId) {
      conditions.push('i.project_id = ?');
      queryParams.push(projectId);
      countParams.push(projectId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    // Get total count
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add ordering and pagination
    dataQuery += ' ORDER BY i.invoice_year DESC, i.invoice_month DESC, i.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Get invoices
    const [invoices] = await db.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// Get invoice by ID with items
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice
    const [invoices] = await db.query(
      `SELECT i.*,
              p.project_team_name,
              pt.agile_board_name as team_name
       FROM invoices i
       JOIN projects p ON i.project_id = p.id
       LEFT JOIN project_teams pt ON i.team_id = pt.id
       WHERE i.id = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get invoice items
    const [items] = await db.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY employee_name',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...invoices[0],
        items
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

module.exports = {
  getEmployeesForInvoice,
  createInvoice,
  getAllInvoices,
  getInvoiceById
};
