const db = require('../config/database');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(
      'SELECT * FROM employees ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// Get single employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [employees] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employees[0]
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      salary,
      hire_date,
      status
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO employees
      (first_name, last_name, email, phone, department, position, salary, hire_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, department, position, salary, hire_date, status || 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: result.insertId,
        first_name,
        last_name,
        email
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);

    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      salary,
      hire_date,
      status
    } = req.body;

    // Check if employee exists
    const [existing] = await db.query(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const [result] = await db.query(
      `UPDATE employees
      SET first_name = ?, last_name = ?, email = ?, phone = ?,
          department = ?, position = ?, salary = ?, hire_date = ?, status = ?
      WHERE id = ?`,
      [first_name, last_name, email, phone, department, position, salary, hire_date, status, id]
    );

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        id,
        first_name,
        last_name,
        email
      }
    });
  } catch (error) {
    console.error('Error updating employee:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM employees WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
