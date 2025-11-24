const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

// Get database path from environment or use default
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'data', 'employee_management.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create/open SQLite database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Initializing SQLite database...');
console.log('Database path:', dbPath);

// Migration files in order
const migrations = [
  'schema.sql',
  'admin_schema.sql',
  'roles_permissions_schema.sql',
  'create_projects.sql',
  'add_h1b_visa_tracking.sql',
  'create_assets.sql',
  'add_project_permissions.sql'
];

const migrationsDir = path.join(__dirname, '..', 'migrations', 'sqlite');

try {
  // Run each migration file
  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);

    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migration} - skipping`);
      continue;
    }

    console.log(`Running migration: ${migration}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error) {
        // Some statements might fail if they already exist, which is okay
        if (!error.message.includes('already exists') &&
            !error.message.includes('duplicate') &&
            !error.message.includes('UNIQUE constraint failed')) {
          console.error(`Error in statement: ${statement.substring(0, 50)}...`);
          throw error;
        }
      }
    }

    console.log(`✓ Completed migration: ${migration}`);
  }

  // Add visa columns to employees table if they don't exist
  console.log('Adding visa columns to employees table...');
  try {
    const alterStatements = [
      "ALTER TABLE employees ADD COLUMN visa_type TEXT DEFAULT 'None' CHECK(visa_type IN ('H1B', 'L1', 'L2', 'Green Card', 'US Citizen', 'Other', 'None'))",
      "ALTER TABLE employees ADD COLUMN visa_status TEXT DEFAULT 'Not Applicable' CHECK(visa_status IN ('Active', 'Expired', 'In Process', 'Not Applicable'))",
      "ALTER TABLE employees ADD COLUMN current_visa_start_date TEXT",
      "ALTER TABLE employees ADD COLUMN current_visa_end_date TEXT",
      "ALTER TABLE employees ADD COLUMN i94_expiry_date TEXT",
      "ALTER TABLE employees ADD COLUMN passport_number TEXT",
      "ALTER TABLE employees ADD COLUMN passport_expiry_date TEXT",
      "ALTER TABLE employees ADD COLUMN sponsor_company TEXT",
      "ALTER TABLE employees ADD COLUMN visa_notes TEXT"
    ];

    for (const stmt of alterStatements) {
      try {
        db.exec(stmt);
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          console.log(`Note: ${error.message}`);
        }
      }
    }

    // Add indexes for visa columns
    const indexStatements = [
      "CREATE INDEX IF NOT EXISTS idx_employees_visa_type ON employees(visa_type)",
      "CREATE INDEX IF NOT EXISTS idx_employees_visa_status ON employees(visa_status)",
      "CREATE INDEX IF NOT EXISTS idx_employees_visa_end_date ON employees(current_visa_end_date)",
      "CREATE INDEX IF NOT EXISTS idx_employees_i94_expiry ON employees(i94_expiry_date)"
    ];

    for (const stmt of indexStatements) {
      db.exec(stmt);
    }

    console.log('✓ Visa columns added successfully');
  } catch (error) {
    console.log('Note: Some visa columns may already exist');
  }

  // Add role_id column to admin_users if it doesn't exist
  console.log('Adding role_id to admin_users table...');
  try {
    db.exec("ALTER TABLE admin_users ADD COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL");
    console.log('✓ role_id column added to admin_users');
  } catch (error) {
    if (!error.message.includes('duplicate column name')) {
      console.log(`Note: ${error.message}`);
    }
  }

  console.log('\n✅ SQLite database initialized successfully!');
  console.log(`Database location: ${dbPath}`);
  console.log('\nDefault admin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('\n⚠️  Please change the default password after first login!\n');

  // Display some stats
  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  const permissionCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get();

  console.log('Database Statistics:');
  console.log(`- Employees: ${employeeCount.count}`);
  console.log(`- Admin Users: ${adminCount.count}`);
  console.log(`- Roles: ${roleCount.count}`);
  console.log(`- Permissions: ${permissionCount.count}`);

} catch (error) {
  console.error('❌ Error initializing SQLite database:', error);
  process.exit(1);
} finally {
  db.close();
}
