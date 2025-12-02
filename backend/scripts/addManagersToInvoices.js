const db = require('../config/database');

async function addManagersToInvoices() {
  try {
    console.log('Adding manager columns to invoices table...');

    // Add offshore_manager column
    await db.query(`
      ALTER TABLE invoices
      ADD COLUMN offshore_manager VARCHAR(100) DEFAULT NULL
    `);

    console.log('✓ Added offshore_manager column');

    // Add onsite_manager column
    await db.query(`
      ALTER TABLE invoices
      ADD COLUMN onsite_manager VARCHAR(100) DEFAULT NULL
    `);

    console.log('✓ Added onsite_manager column');
    console.log('✓ Successfully added manager columns to invoices table');

    process.exit(0);
  } catch (error) {
    // If error is "Duplicate column name", it means columns already exist
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Manager columns already exist in invoices table');
      process.exit(0);
    } else {
      console.error('✗ Error adding manager columns:', error.message);
      process.exit(1);
    }
  }
}

addManagersToInvoices();
