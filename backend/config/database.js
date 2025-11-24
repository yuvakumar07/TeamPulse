const mysql = require('mysql2');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

let db;

if (DB_TYPE === 'sqlite') {
  // Use SQLite
  const sqliteConnection = require('./sqlite');
  db = sqliteConnection;
  console.log('Database configured to use SQLite');
} else {
  // Use MySQL (default)
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employee_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Get promise-based connection
  const promisePool = pool.promise();

  // Test connection
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err.message);
      return;
    }
    console.log('Successfully connected to MySQL database');
    connection.release();
  });

  db = promisePool;
  console.log('Database configured to use MySQL');
}

module.exports = db;
