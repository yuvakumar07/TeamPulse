const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_management'
};

async function runMigration() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected successfully!');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/rename_employee_manager_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('\nExecuting migration to rename employee manager ID fields...\n');

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Executing: ${statement.substring(0, 80)}...`);
          await connection.query(statement);
          console.log('✓ Success\n');
        } catch (error) {
          // If column doesn't exist, continue (it might have been already renamed)
          if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.log('⚠ Warning: Column might not exist or already renamed, continuing...\n');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('\nThe offshore_manager_id and onsite_manager_id fields have been renamed to:');
    console.log('  - temp_offshore_manager_id');
    console.log('  - temp_onsite_manager_id');

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the migration
runMigration();
