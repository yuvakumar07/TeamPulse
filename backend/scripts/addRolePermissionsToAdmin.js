const db = require('../config/database');

async function addRolePermissionsToAdmin() {
  try {
    console.log('Adding role management permissions to Admin role...');

    // Add roles permissions (view, create, update) to Admin role
    const query = `
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT
        r.id as role_id,
        p.id as permission_id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'admin'
        AND p.module = 'roles'
        AND p.action IN ('view', 'create', 'update')
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `;

    const [result] = await db.query(query);

    console.log(`✓ Added ${result.affectedRows} role permissions to Admin role`);
    console.log('✓ Admin users can now view, create, and update roles');
    console.log('⚠ Note: Super Admin still has exclusive access to delete roles');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error adding permissions:', error);
    process.exit(1);
  }
}

addRolePermissionsToAdmin();
