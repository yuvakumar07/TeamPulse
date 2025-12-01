const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function addInvoiceEditDeletePermissions() {
  let connection;

  try {
    connection = await db.getConnection();
    console.log('🔌 Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../migrations/add_invoice_edit_delete_permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('\n📝 Adding invoice edit and delete permissions...\n');

    for (const statement of statements) {
      try {
        await connection.query(statement);
        console.log('✅ Statement executed successfully');
      } catch (error) {
        // Handle duplicate entry errors gracefully
        if (error.code === 'ER_DUP_ENTRY') {
          console.log('⚠ Permission already exists (skipped)');
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Invoice edit and delete permissions added successfully!');
    console.log('\nPermissions added:');
    console.log('  - edit_invoice: Can edit invoices');
    console.log('  - delete_invoice: Can delete invoices');
    console.log('\nRole assignments:');
    console.log('  - super_admin: edit_invoice, delete_invoice');
    console.log('  - admin: edit_invoice, delete_invoice');
    console.log('  - manager: edit_invoice');

  } catch (error) {
    console.error('❌ Error adding permissions:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
}

// Run the script
addInvoiceEditDeletePermissions();
