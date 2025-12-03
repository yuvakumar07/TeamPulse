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
      path.join(__dirname, '../migrations/revert_invoices_to_month_year.sql'),
      'utf8'
    );

    console.log('Running migration to revert to month/year...');
    await connection.query(migrationSQL);

    console.log('✓ Migration completed successfully!');
    console.log('✓ Invoices table now uses invoice_month and invoice_year instead of date_from and date_to');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
