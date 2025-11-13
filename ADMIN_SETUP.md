# Admin Panel Setup Guide

This guide will help you set up the admin panel with JWT authentication for TeamPulse.

## Database Setup

### 1. Run the Admin Schema SQL

Execute the admin schema SQL file to create the necessary tables:

```bash
mysql -u root -p employee_management < backend/config/admin_schema.sql
```

Or manually run the SQL commands in your MySQL client:

```sql
-- Run all commands from backend/config/admin_schema.sql
```

This will create:
- `admin_users` table for administrator accounts
- `audit_logs` table for tracking admin actions
- Default admin user with credentials: `admin` / `admin123`

### 2. Update Environment Variables (Optional)

You can add a custom JWT secret to your `.env` file:

```
JWT_SECRET=your_custom_secret_key_here
```

If not provided, a default secret will be used (change in production).

## Default Admin Credentials

**Username:** `admin`
**Password:** `admin123`

**IMPORTANT:** Change this password immediately after first login!

## Features

### Admin Authentication
- JWT-based authentication with 24-hour token expiration
- Secure password hashing using bcryptjs
- Protected routes that require authentication
- Automatic token refresh and expiration handling

### Admin Dashboard
- **Employee Statistics:** View total, active, inactive, at-risk, and critical employees
- **Role Distribution:** Visual breakdown of employees by role type
- **Admin User Stats:** Count of total and active admin users
- **Recent Activities:** Last 10 employee create/update actions with timestamps

### Admin User Management
- **Create Admin Users:** Add new administrator accounts
- **Edit Admin Users:** Update admin details, change status, reset passwords
- **Delete Admin Users:** Remove admin accounts (cannot delete your own account)
- **View Audit Logs:** Complete history of all admin actions with timestamps and IP addresses

### Audit Logging
Every admin action is logged with:
- Admin ID and username
- Action type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE)
- Entity type and ID
- Description
- IP address
- User agent
- Timestamp

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/login           - Admin login
GET    /api/auth/profile         - Get current admin profile (protected)
POST   /api/auth/change-password - Change password (protected)
POST   /api/auth/logout          - Admin logout (protected)
```

### Admin Management Endpoints (All Protected)

```
GET    /api/admin/users          - Get all admin users (paginated)
GET    /api/admin/users/:id      - Get admin user by ID
POST   /api/admin/users          - Create new admin user
PUT    /api/admin/users/:id      - Update admin user
DELETE /api/admin/users/:id      - Delete admin user

GET    /api/admin/audit-logs     - Get audit logs (paginated, filterable)
GET    /api/admin/dashboard/stats - Get dashboard statistics
```

## Frontend Routes

```
/admin/login          - Admin login page
/admin/dashboard      - Admin dashboard (protected)
/admin/users          - Admin user management (protected)
```

## Security Features

1. **JWT Authentication:** Tokens expire after 24 hours
2. **Password Hashing:** bcrypt with salt rounds
3. **Protected Routes:** Middleware validates tokens on all protected endpoints
4. **Self-Protection:** Admins cannot delete or deactivate their own accounts
5. **Status Checks:** Only active admins can access protected routes
6. **Audit Trail:** All actions are logged with IP and user agent

## Password Requirements

- Minimum 6 characters
- Required for new admin users
- Optional when updating (leave blank to keep current password)

## Testing the Setup

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to http://localhost:3000/admin/login

4. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

5. You should be redirected to the Admin Dashboard

6. Change the default password:
   - Go to Admin User Management
   - Edit the admin user
   - Set a new secure password

## Troubleshooting

### Cannot login / Token errors
- Check that the admin_users table exists
- Verify the default admin user was created
- Check backend console for errors

### Database connection issues
- Verify MySQL is running
- Check .env database credentials
- Ensure employee_management database exists

### CORS errors
- Backend should be running on port 5000
- Frontend should be running on port 3000
- CORS is enabled in server.js

### Audit logs not showing
- Verify audit_logs table exists
- Check that foreign key constraint is satisfied
- Look for errors in backend console

## Production Deployment

Before deploying to production:

1. **Change JWT Secret:**
   ```
   JWT_SECRET=generate_a_long_random_secret_key_here
   ```

2. **Update Default Password:** Delete or change the default admin account

3. **Enable HTTPS:** Use HTTPS for all admin panel access

4. **Implement Rate Limiting:** Add rate limiting to prevent brute force attacks

5. **Regular Backups:** Backup the admin_users and audit_logs tables

6. **Monitor Audit Logs:** Regularly review audit logs for suspicious activity

## Maintenance

### Creating New Admin Users
Use the Admin User Management interface or API:

```javascript
POST /api/admin/users
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword",
  "full_name": "New Admin Name",
  "status": "Active"
}
```

### Reviewing Audit Logs
Filter audit logs by:
- Admin ID
- Action type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE)
- Entity type (admin_users, employees)
- Date range (via pagination)

### Changing Admin Status
Update admin status via the interface:
- **Active:** Can login and perform all actions
- **Inactive:** Cannot login
- **Suspended:** Cannot login (for temporary suspension)

## Architecture Overview

### Backend Components
- `middleware/authMiddleware.js` - JWT verification and token generation
- `controllers/authController.js` - Login, profile, password management
- `controllers/adminController.js` - Admin CRUD, audit logs, dashboard stats
- `routes/authRoutes.js` - Authentication routes
- `routes/adminRoutes.js` - Admin management routes (protected)

### Frontend Components
- `services/authService.js` - API client with JWT interceptors
- `components/ProtectedRoute.js` - Route wrapper for authentication check
- `pages/AdminLogin.js` - Login form with validation
- `pages/AdminDashboard.js` - Statistics and recent activities
- `pages/AdminUsersManagement.js` - CRUD interface with audit logs

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
