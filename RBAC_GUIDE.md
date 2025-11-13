# Role-Based Access Control (RBAC) Guide

## Overview

TeamPulse now implements a comprehensive Role-Based Access Control (RBAC) system with four predefined roles and granular permissions across all modules.

## System Roles

### 1. Super Administrator (`super_admin`)
- **Full system access** with all permissions
- Can manage users, roles, permissions, employees, and view all audit logs
- **Default admin account** has this role
- System role (cannot be modified or deleted)

### 2. Administrator (`admin`)
- Full access to **employee management** and reporting
- Can **create and manage regular admin users**
- View dashboard and audit logs
- Cannot manage roles or delete super admins
- System role (cannot be modified or deleted)

### 3. Manager (`manager`)
- Can **view and manage employees**
- Access to dashboard statistics
- View audit logs
- Cannot manage admin users or roles
- System role (cannot be modified or deleted)

### 4. Viewer (`viewer`)
- **Read-only access** to employee data
- Can view dashboard and reports
- Can view audit logs
- Cannot create, update, or delete anything
- System role (cannot be modified or deleted)

## Permission Matrix

| Module | Permission | Super Admin | Admin | Manager | Viewer |
|--------|-----------|-------------|-------|---------|--------|
| **Employees** |
| | `employees.view` | ✅ | ✅ | ✅ | ✅ |
| | `employees.create` | ✅ | ✅ | ✅ | ❌ |
| | `employees.update` | ✅ | ✅ | ✅ | ❌ |
| | `employees.delete` | ✅ | ✅ | ✅ | ❌ |
| | `employees.export` | ✅ | ✅ | ✅ | ❌ |
| **Admin Users** |
| | `admin_users.view` | ✅ | ✅ | ❌ | ❌ |
| | `admin_users.create` | ✅ | ✅ | ❌ | ❌ |
| | `admin_users.update` | ✅ | ✅ | ❌ | ❌ |
| | `admin_users.delete` | ✅ | ❌ | ❌ | ❌ |
| | `admin_users.change_role` | ✅ | ❌ | ❌ | ❌ |
| **Roles** |
| | `roles.view` | ✅ | ❌ | ❌ | ❌ |
| | `roles.create` | ✅ | ❌ | ❌ | ❌ |
| | `roles.update` | ✅ | ❌ | ❌ | ❌ |
| | `roles.delete` | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** |
| | `audit_logs.view` | ✅ | ✅ | ✅ | ✅ |
| | `audit_logs.export` | ✅ | ❌ | ❌ | ❌ |
| **Dashboard** |
| | `dashboard.view` | ✅ | ✅ | ✅ | ✅ |
| | `dashboard.view_analytics` | ✅ | ✅ | ❌ | ❌ |

## Database Schema

### Tables Created

1. **`roles`** - Stores role definitions
2. **`permissions`** - Stores available permissions
3. **`role_permissions`** - Junction table linking roles to permissions
4. **`admin_users.role_id`** - Foreign key added to link users to roles

### Setup

```bash
# Run the roles and permissions schema
mysql -u root -p employee_management < backend/config/roles_permissions_schema.sql
```

This will:
- Create all necessary tables
- Insert 4 system roles
- Insert all permissions (23 total)
- Assign permissions to each role
- Update existing admin user to Super Admin role

## API Endpoints

### Authentication & Profile
```
POST   /api/auth/login              - Login (returns role info in token)
GET    /api/auth/profile            - Get current user profile
GET    /api/my-permissions          - Get current user's permissions
```

### Role Management (Super Admin Only)
```
GET    /api/roles                   - List all roles
GET    /api/roles/:id               - Get role with permissions
POST   /api/roles                   - Create custom role
PUT    /api/roles/:id               - Update custom role
DELETE /api/roles/:id               - Delete custom role

GET    /api/permissions             - List all permissions
```

### Employee Management (Permission-Based)
```
GET    /api/employees               - Requires: employees.view
GET    /api/employees/:id           - Requires: employees.view
POST   /api/employees               - Requires: employees.create
PUT    /api/employees/:id           - Requires: employees.update
DELETE /api/employees/:id           - Requires: employees.delete
```

### Admin User Management (Permission-Based)
```
GET    /api/admin/users             - Requires: admin_users.view
GET    /api/admin/users/:id         - Requires: admin_users.view
POST   /api/admin/users             - Requires: admin_users.create
PUT    /api/admin/users/:id         - Requires: admin_users.update
DELETE /api/admin/users/:id         - Requires: admin_users.delete
```

### Dashboard & Audit (Permission-Based)
```
GET    /api/admin/dashboard/stats   - Requires: dashboard.view
GET    /api/admin/audit-logs        - Requires: audit_logs.view
```

## How It Works

### 1. Token-Based Authentication

When a user logs in:
```javascript
{
  "token": "jwt_token_here",
  "admin": {
    "id": 1,
    "username": "admin",
    "role_id": 1,
    "role_name": "super_admin",
    "role_display_name": "Super Administrator"
  }
}
```

The JWT token includes:
- User ID
- Username
- Email
- Role ID
- Role name
- Status

### 2. Permission Checking

Every protected endpoint checks permissions:

```javascript
// Middleware checks if user has required permission
router.get('/employees', requirePermission('employees.view'), getAllEmployees);
```

### 3. Permission Cache

Permissions are cached for 5 minutes to improve performance:
- Reduces database queries
- Cache automatically refreshes
- Cache clears when roles/permissions are modified

### 4. Response on Forbidden Access

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "required_permission": "employees.create"
}
```

## Creating Custom Roles

### Via API

```javascript
POST /api/roles
{
  "name": "hr_specialist",
  "display_name": "HR Specialist",
  "description": "HR team member with employee management access",
  "permission_ids": [1, 2, 3, 4, 5, 13, 14]
}
```

### Restrictions

- System roles cannot be modified or deleted
- Custom roles can be created, updated, and deleted
- Roles with assigned users cannot be deleted
- Only Super Admins can manage roles

## Assigning Roles to Users

### When Creating Admin User

```javascript
POST /api/admin/users
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "status": "Active",
  "role_id": 3  // Assign Manager role
}
```

### When Updating Admin User

```javascript
PUT /api/admin/users/5
{
  "role_id": 4  // Change to Viewer role
}
```

**Note:** Only users with `admin_users.change_role` permission can change roles.

## Frontend Implementation

### Checking Permissions in Components

```javascript
// Get user permissions from token/state
const userPermissions = authService.getCurrentUser()?.permissions || [];

// Check if user has permission
const canCreateEmployee = userPermissions.includes('employees.create');
const canDeleteEmployee = userPermissions.includes('employees.delete');

// Conditionally render UI
{canCreateEmployee && (
  <button onClick={handleCreate}>Add Employee</button>
)}

{canDeleteEmployee && (
  <button onClick={handleDelete}>Delete</button>
)}
```

### API Calls with Permission Handling

```javascript
try {
  await api.post('/employees', employeeData);
} catch (error) {
  if (error.response?.status === 403) {
    // Show permission denied message
    alert('You do not have permission to create employees');
  }
}
```

## Audit Logging

All role-related actions are logged:
- Role creation
- Role updates
- Role deletion
- Role permission changes

View audit logs:
```
GET /api/admin/audit-logs?entity_type=roles
```

## Security Features

### ✅ Implemented

1. **Token-Based Authentication** - JWT with role information
2. **Permission Caching** - Performance optimization
3. **Granular Permissions** - 23 specific permissions across 5 modules
4. **System Role Protection** - System roles cannot be modified
5. **User Protection** - Admins can't delete/modify themselves
6. **Audit Trail** - All actions logged with admin attribution
7. **Cascading Deletes** - Role deletion cascades to role_permissions
8. **Foreign Key Constraints** - Data integrity enforced

### 🔒 Best Practices

1. **Assign Minimal Permissions** - Give users only what they need
2. **Regular Audit Reviews** - Review audit logs regularly
3. **Custom Roles for Teams** - Create team-specific roles
4. **Test Permission Changes** - Verify before deploying
5. **Document Custom Roles** - Keep role descriptions updated

## Testing Roles

### Test as Different Roles

1. **Create test users with different roles:**

```javascript
// Super Admin (already exists)
username: admin, password: admin123

// Create an Admin
POST /api/admin/users
{ "username": "admin_test", "role_id": 2, ... }

// Create a Manager
POST /api/admin/users
{ "username": "manager_test", "role_id": 3, ... }

// Create a Viewer
POST /api/admin/users
{ "username": "viewer_test", "role_id": 4, ... }
```

2. **Login as each user and test permissions:**
   - Try creating/updating/deleting employees
   - Try accessing admin user management
   - Try viewing audit logs
   - Verify forbidden actions return 403 errors

## Troubleshooting

### Permission Denied Errors

**Problem:** User gets 403 even though they should have permission

**Solutions:**
1. Check if user has a role assigned: `SELECT role_id FROM admin_users WHERE id = ?`
2. Check role permissions: `SELECT * FROM role_permissions WHERE role_id = ?`
3. Clear permission cache: Restart server or wait 5 minutes
4. Verify token has role information: Decode JWT token

### Role Not Updating

**Problem:** Changed role permissions but user still has old permissions

**Solutions:**
1. User needs to **logout and login** again for new token
2. Permission cache refreshes every 5 minutes
3. Server restart clears cache immediately

### Cannot Delete Role

**Problem:** "Cannot delete role. X user(s) are assigned to this role"

**Solution:** Reassign users to different role first:
```sql
UPDATE admin_users SET role_id = ? WHERE role_id = ?
```

## Migration from v1.0

Users upgrading from previous version:

1. **Backup database:**
   ```bash
   mysqldump -u root -p employee_management > backup.sql
   ```

2. **Run roles schema:**
   ```bash
   mysql -u root -p employee_management < backend/config/roles_permissions_schema.sql
   ```

3. **Restart backend server**

4. **Existing admin user** will be automatically assigned Super Admin role

5. **Other admin users** will have no role initially:
   - Login as super admin
   - Assign appropriate roles to each user

## API Response Examples

### Successful Permission Check
```json
{
  "success": true,
  "data": { ... }
}
```

### Permission Denied
```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "required_permission": "employees.delete"
}
```

### Get My Permissions
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 3,
      "name": "manager",
      "display_name": "Manager"
    },
    "permissions": [
      "employees.view",
      "employees.create",
      "employees.update",
      "employees.delete",
      "employees.export",
      "dashboard.view",
      "audit_logs.view"
    ]
  }
}
```

## Future Enhancements

Possible additions:
- **Permission groups** - Organize permissions into categories
- **Time-based permissions** - Permissions valid during specific hours
- **IP-based restrictions** - Limit access by IP address
- **Multi-factor authentication** - Additional security layer
- **Permission inheritance** - Child roles inherit parent permissions
- **Dynamic permission assignment** - Assign individual permissions to users

## Support

For questions about RBAC:
- Review this guide
- Check API endpoint documentation
- View audit logs for permission-related actions
- Contact system administrator

---

**Version:** 2.0.0
**Last Updated:** 2025-01-13
