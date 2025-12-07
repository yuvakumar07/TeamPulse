const db = require('../config/database');

// Get all lookup values for a specific category
const getLookupsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const [lookups] = await db.query(
      'SELECT id, category, type_id, type_name, description, sort_order FROM common_lookups WHERE category = ? AND is_active = TRUE ORDER BY sort_order ASC, type_name ASC',
      [category]
    );

    res.json({
      success: true,
      data: lookups
    });
  } catch (error) {
    console.error('Error fetching lookups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lookup values',
      error: error.message
    });
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT DISTINCT category FROM common_lookups WHERE is_active = TRUE ORDER BY category ASC'
    );

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get all lookups (grouped by category)
const getAllLookups = async (req, res) => {
  try {
    const [lookups] = await db.query(
      'SELECT id, category, type_id, type_name, description, sort_order FROM common_lookups WHERE is_active = TRUE ORDER BY category ASC, sort_order ASC, type_name ASC'
    );

    // Group by category
    const grouped = {};
    lookups.forEach(lookup => {
      if (!grouped[lookup.category]) {
        grouped[lookup.category] = [];
      }
      grouped[lookup.category].push({
        id: lookup.id,
        type_id: lookup.type_id,
        type_name: lookup.type_name,
        description: lookup.description,
        sort_order: lookup.sort_order
      });
    });

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching all lookups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all lookups',
      error: error.message
    });
  }
};

// Create a new lookup value
const createLookup = async (req, res) => {
  try {
    const { category, type_id, type_name, description, sort_order } = req.body;

    if (!category || !type_id || !type_name) {
      return res.status(400).json({
        success: false,
        message: 'Category, type_id, and type_name are required'
      });
    }

    const [result] = await db.query(
      'INSERT INTO common_lookups (category, type_id, type_name, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      [category, type_id, type_name, description || null, sort_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Lookup value created successfully',
      data: {
        id: result.insertId,
        category,
        type_id,
        type_name,
        description,
        sort_order: sort_order || 0
      }
    });
  } catch (error) {
    console.error('Error creating lookup:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'A lookup value with this category and type_id already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating lookup value',
      error: error.message
    });
  }
};

// Update a lookup value
const updateLookup = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, description, sort_order, is_active } = req.body;

    const updates = [];
    const values = [];

    if (type_name !== undefined) {
      updates.push('type_name = ?');
      values.push(type_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE common_lookups SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Lookup value updated successfully'
    });
  } catch (error) {
    console.error('Error updating lookup:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lookup value',
      error: error.message
    });
  }
};

// Delete a lookup value (soft delete by setting is_active = false)
const deleteLookup = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE common_lookups SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Lookup value deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lookup:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lookup value',
      error: error.message
    });
  }
};

module.exports = {
  getLookupsByCategory,
  getAllCategories,
  getAllLookups,
  createLookup,
  updateLookup,
  deleteLookup
};
