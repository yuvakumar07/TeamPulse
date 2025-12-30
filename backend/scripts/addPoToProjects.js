const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function addPoToProjects() {
  try {
    console.log('Adding po_id column to projects table...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_po_to_projects.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon to execute multiple statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addPoToProjects();
