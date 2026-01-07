const db = require('../config/database');

async function addAllocationColumns() {
  try {
    console.log('Adding allocation columns to projects and project_teams tables...');

    // Add allocation columns to projects table for managers
    await db.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS offshore_manager_allocation DECIMAL(5,2) DEFAULT 0.00 AFTER offshore_manager_id,
      ADD COLUMN IF NOT EXISTS onsite_manager_allocation DECIMAL(5,2) DEFAULT 0.00 AFTER onsite_manager_id
    `);
    console.log('✓ Added manager allocation columns to projects table');

    // Add allocation columns to project_teams table for team leads
    await db.query(`
      ALTER TABLE project_teams
      ADD COLUMN IF NOT EXISTS offshore_team_lead_allocation DECIMAL(5,2) DEFAULT 0.00 AFTER offshore_team_lead_id,
      ADD COLUMN IF NOT EXISTS onsite_team_lead_allocation DECIMAL(5,2) DEFAULT 0.00 AFTER onsite_team_lead_id
    `);
    console.log('✓ Added team lead allocation columns to project_teams table');

    console.log('\nAllocation columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding allocation columns:', error);
    process.exit(1);
  }
}

addAllocationColumns();
