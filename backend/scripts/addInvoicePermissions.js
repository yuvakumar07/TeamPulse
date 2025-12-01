const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Adding invoice permissions...');

    const migrationPath = path.join(__dirname, '../migrations/add_invoice_permissions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.query(statement);
        console.log('✓ Executed statement');
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log('⚠ Permission already exists (skipped)');
        } else {
          console.error('✗ Error executing statement:', error.message);
          throw error;
        }
      }
    }

    console.log('✓ Invoice permissions added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
