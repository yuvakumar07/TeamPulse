const db = require('../config/database');

async function addAllocationPercentage() {
  const connection = await db.getConnection();

  try {
    console.log('Starting migration to add allocation_percentage column...');

    // Check if column exists
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM project_employees LIKE 'allocation_percentage'
    `);

    if (columns.length > 0) {
      console.log('Column allocation_percentage already exists. Skipping migration.');
      return;
    }

    // Add allocation_percentage column
    await connection.query(`
      ALTER TABLE project_employees
      ADD COLUMN allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00
    `);
    console.log('✓ Added allocation_percentage column');

    // Add check constraint (for MySQL 8.0.16+, ignored in older versions)
    try {
      await connection.query(`
        ALTER TABLE project_employees
        ADD CONSTRAINT check_allocation_percentage
        CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
      `);
      console.log('✓ Added check constraint for allocation_percentage');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
        console.log('  Check constraint already exists, skipping');
      } else if (err.errno === 1031) {
        console.log('  Check constraints not supported in this MySQL/MariaDB version, skipping');
      } else {
        throw err;
      }
    }

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

addAllocationPercentage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
