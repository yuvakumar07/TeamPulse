const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'teampulse',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add_managers_to_projects.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_managers_to_projects.sql');

    // Execute migration
    await connection.query(sql);

    console.log('✓ Migration completed successfully');
    console.log('✓ Added offshore_manager_id and onsite_manager_id columns to projects table');

  } catch (error) {
    console.error('Migration error:', error.message);

    // Check if columns already exist
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Manager columns already exist in projects table');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runMigration()
  .then(() => {
    console.log('\nMigration process completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nMigration process failed:', err);
    process.exit(1);
  });
