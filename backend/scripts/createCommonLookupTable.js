const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'migrations', 'create_common_lookup_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments (lines starting with --)
    const lines = migrationSQL.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('--');
    });
    const cleanedSQL = cleanedLines.join('\n');

    // Split by semicolons and filter out empty statements
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await db.query(statement);
      }
    }

    console.log('Migration completed successfully!');
    console.log('Common lookup table created and populated with the following categories:');
    console.log('  - Role Type (DEV, QA, Team Lead, Manager)');
    console.log('  - Attrition (No, Yes, At Risk)');
    console.log('  - Work Location (Offshore, Onsite)');
    console.log('  - Criticality (Low, Medium, High, Critical)');
    console.log('  - Status (Active, Inactive, On Leave, Terminated)');
    console.log('  - Visa Type (None, H1B, L1, L2, Green Card, US Citizen, Other)');
    console.log('  - Project Status (Active, On Hold, Completed, Cancelled)');
    console.log('  - Asset Type (Laptop, Desktop, Monitor, etc.)');
    console.log('  - Asset Status (Available, Assigned, Under Repair, Retired, Lost)');
    console.log('  - Invoice Status (Draft, Pending, Approved, Paid, Cancelled)');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
