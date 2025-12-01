const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Running migration to remove manager allocation columns...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/remove_manager_allocation_columns.sql');
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
        if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log('⚠ Column does not exist (already removed or never existed)');
        } else {
          console.error('✗ Error executing statement:', error.message);
          throw error;
        }
      }
    }

    console.log('✓ Manager allocation columns removed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
