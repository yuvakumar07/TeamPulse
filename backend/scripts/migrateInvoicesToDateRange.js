const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
  });

  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/modify_invoices_for_date_range.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await connection.query(migrationSQL);

    console.log('✓ Migration completed successfully!');
    console.log('✓ Invoices table now uses date_from and date_to instead of invoice_month and invoice_year');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
