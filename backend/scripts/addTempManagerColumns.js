const db = require('../config/database');

async function addTempManagerColumns() {
  try {
    console.log('Adding temporary manager name columns to projects table...');

    // Add temp_offshore_manager_name column
    await db.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS temp_offshore_manager_name VARCHAR(255) DEFAULT NULL
    `);
    console.log('✓ Added temp_offshore_manager_name column');

    // Add temp_onsite_manager_name column
    await db.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS temp_onsite_manager_name VARCHAR(255) DEFAULT NULL
    `);
    console.log('✓ Added temp_onsite_manager_name column');

    console.log('\n✓ Migration completed successfully!');
    console.log('\nThese columns will store manager names when:');
    console.log('1. Manager name is provided during import');
    console.log('2. But the employee is not found in the employees table');
    console.log('3. This prevents data loss and allows for later matching');

    process.exit(0);
  } catch (error) {
    console.error('Error adding temporary manager columns:', error);
    process.exit(1);
  }
}

addTempManagerColumns();
