require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

/**
 * Query helper utilities to handle differences between MySQL and SQLite
 */

/**
 * Get the GROUP_CONCAT equivalent for the current database
 * @param {string} column - The column to concatenate
 * @param {string} separator - The separator to use (default: ',')
 * @param {string} orderBy - Optional order by clause
 * @returns {string} - The appropriate GROUP_CONCAT/GROUP_CONCAT syntax
 */
function groupConcat(column, separator = ',', orderBy = null) {
  if (DB_TYPE === 'sqlite') {
    // SQLite uses GROUP_CONCAT
    let query = `GROUP_CONCAT(${column}`;
    if (separator !== ',') {
      query += `, '${separator}'`;
    }
    query += ')';
    return query;
  } else {
    // MySQL uses GROUP_CONCAT with SEPARATOR
    let query = `GROUP_CONCAT(${column}`;
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    query += ` SEPARATOR '${separator}')`;
    return query;
  }
}

/**
 * Get the current timestamp function for the database
 * @returns {string} - CURRENT_TIMESTAMP or datetime('now')
 */
function currentTimestamp() {
  return DB_TYPE === 'sqlite' ? "datetime('now')" : 'CURRENT_TIMESTAMP';
}

/**
 * Get the auto-increment syntax for the database
 * @returns {string} - AUTO_INCREMENT or AUTOINCREMENT
 */
function autoIncrement() {
  return DB_TYPE === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';
}

/**
 * Get the limit/offset clause for pagination
 * @param {number} limit - Number of rows to return
 * @param {number} offset - Number of rows to skip
 * @returns {string} - The appropriate LIMIT/OFFSET clause
 */
function limitOffset(limit, offset) {
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Convert MySQL ENUM to SQLite CHECK constraint
 * @param {string} columnName - Name of the column
 * @param {Array} values - Array of enum values
 * @returns {string} - The appropriate constraint syntax
 */
function enumConstraint(columnName, values) {
  if (DB_TYPE === 'sqlite') {
    const valuesList = values.map(v => `'${v}'`).join(', ');
    return `CHECK(${columnName} IN (${valuesList}))`;
  } else {
    const valuesList = values.map(v => `'${v}'`).join(', ');
    return `ENUM(${valuesList})`;
  }
}

/**
 * Get the appropriate data type for the database
 * @param {string} mysqlType - MySQL data type
 * @returns {string} - Equivalent SQLite or MySQL type
 */
function getDataType(mysqlType) {
  if (DB_TYPE === 'sqlite') {
    const typeMap = {
      'INT': 'INTEGER',
      'VARCHAR': 'TEXT',
      'TEXT': 'TEXT',
      'DATE': 'TEXT',
      'DATETIME': 'TEXT',
      'TIMESTAMP': 'TEXT',
      'BOOLEAN': 'INTEGER',
      'TINYINT': 'INTEGER',
      'SMALLINT': 'INTEGER',
      'MEDIUMINT': 'INTEGER',
      'BIGINT': 'INTEGER',
      'DECIMAL': 'REAL',
      'FLOAT': 'REAL',
      'DOUBLE': 'REAL'
    };

    // Extract base type (e.g., VARCHAR(50) -> VARCHAR)
    const baseType = mysqlType.toUpperCase().split('(')[0].trim();
    return typeMap[baseType] || mysqlType;
  }
  return mysqlType;
}

/**
 * Build a query with database-specific syntax
 * This is a helper to build queries that work with both databases
 */
function buildQuery(template, replacements = {}) {
  let query = template;

  // Replace placeholders with database-specific syntax
  for (const [key, value] of Object.entries(replacements)) {
    query = query.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return query;
}

/**
 * Get database type
 * @returns {string} - 'mysql' or 'sqlite'
 */
function getDbType() {
  return DB_TYPE;
}

/**
 * Handle INSERT queries and return consistent results
 * @param {Object} result - Database query result
 * @returns {Object} - Normalized result with insertId and affectedRows
 */
function normalizeInsertResult(result) {
  if (DB_TYPE === 'sqlite') {
    return result;
  } else {
    // MySQL result format
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  }
}

module.exports = {
  groupConcat,
  currentTimestamp,
  autoIncrement,
  limitOffset,
  enumConstraint,
  getDataType,
  buildQuery,
  getDbType,
  normalizeInsertResult
};
