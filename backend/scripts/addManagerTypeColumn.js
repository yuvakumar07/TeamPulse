const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Adding manager_type column to invoice_items table...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_manager_type_to_invoice_items.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon to get individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      try {
        await db.query(statement);
        console.log('✓ Executed statement');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠ Column already exists (skipped)');
        } else {
          console.error('✗ Error executing statement:', error.message);
          throw error;
        }
      }
    }

    console.log('✓ Manager type column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
