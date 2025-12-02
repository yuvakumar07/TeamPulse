const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'employee_management',
      multipleStatements: true
    });

    console.log('Connected to database...');

    const migrationPath = path.join(__dirname, '../migrations/add_managers_to_invoices.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await connection.query(sql);

    console.log('✓ Migration completed successfully!');
    console.log('✓ Added offshore_manager and onsite_manager columns to invoices table');

  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Columns already exist - migration was already applied.');
    } else {
      console.error('✗ Migration error:', err.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
