const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Running PO management migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_pos.sql');
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
        if (error.code === 'ER_TABLE_EXISTS_EXISTS' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠ Statement already executed (skipped)');
        } else {
          console.error('✗ Error executing statement:', error.message);
          throw error;
        }
      }
    }

    console.log('✓ PO management migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
