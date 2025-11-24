const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Get database path from environment or use default
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'data', 'employee_management.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database connection
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test connection
try {
  db.prepare('SELECT 1').get();
  console.log('Successfully connected to SQLite database');
} catch (err) {
  console.error('Error connecting to SQLite database:', err.message);
}

// Wrapper to make SQLite interface similar to MySQL promise pool
const sqliteWrapper = {
  query: async (sql, params = []) => {
    try {
      // Detect query type
      const queryType = sql.trim().toLowerCase().split(' ')[0];

      if (queryType === 'select' || queryType === 'pragma') {
        // For SELECT queries, return rows
        const stmt = db.prepare(sql);
        const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
        return [rows, null];
      } else if (queryType === 'insert') {
        // For INSERT queries, return insert info
        const stmt = db.prepare(sql);
        const info = params.length > 0 ? stmt.run(...params) : stmt.run();
        return [{
          insertId: info.lastInsertRowid,
          affectedRows: info.changes
        }, null];
      } else {
        // For UPDATE, DELETE queries
        const stmt = db.prepare(sql);
        const info = params.length > 0 ? stmt.run(...params) : stmt.run();
        return [{
          affectedRows: info.changes
        }, null];
      }
    } catch (error) {
      throw error;
    }
  },

  execute: async (sql, params = []) => {
    return sqliteWrapper.query(sql, params);
  },

  // Transaction support
  transaction: (callback) => {
    return db.transaction(callback);
  },

  // Close connection
  close: () => {
    db.close();
  },

  // Get raw database instance for advanced operations
  getDatabase: () => {
    return db;
  }
};

module.exports = sqliteWrapper;
