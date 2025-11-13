# Quick Start Guide - Admin Panel

## Step 1: Install Dependencies

The required backend dependencies have already been installed:
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing

## Step 2: Setup Database

Run the admin schema SQL file to create the admin tables:

```bash
# Option 1: Using mysql command line
mysql -u root -p employee_management < backend/config/admin_schema.sql

# Option 2: Using a MySQL client
# Copy and paste the contents of backend/config/admin_schema.sql
```

This creates:
- `admin_users` table
- `audit_logs` table
- Default admin account (username: `admin`, password: `admin123`)

## Step 3: Start the Servers

**Backend:**
```bash
cd backend
npm start
```
Server runs on http://localhost:5000

**Frontend:**
```bash
cd frontend
npm start
```
App runs on http://localhost:3000

## Step 4: Access Admin Panel

1. Open http://localhost:3000
2. Click "Admin Panel" in the navigation
3. Login with:
   - Username: `admin`
   - Password: `admin123`
4. You'll be redirected to the Admin Dashboard

## Step 5: Change Default Password

**IMPORTANT:** Change the default password immediately!

1. Go to "Manage Users" from the dashboard
2. Click edit (✏️) on the admin user
3. Enter a new secure password
4. Click "Update Admin"

## Features Available

### Admin Dashboard (`/admin/dashboard`)
- View employee statistics (total, active, inactive, at-risk, critical)
- See role distribution across the organization
- View admin user counts
- Review recent employee activities

### Admin Users Management (`/admin/users`)
- Create new admin users
- Edit existing admin users (details, password, status)
- Delete admin users (except your own account)
- View audit logs of all admin actions

## API Endpoints Overview

**Public:**
- `POST /api/auth/login` - Admin login

**Protected (requires JWT token):**
- `GET /api/auth/profile` - Get current admin profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout (logs the action)
- `GET /api/admin/users` - List all admins
- `POST /api/admin/users` - Create admin
- `PUT /api/admin/users/:id` - Update admin
- `DELETE /api/admin/users/:id` - Delete admin
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/dashboard/stats` - Dashboard statistics

## Security Features

✅ JWT authentication with 24-hour token expiration
✅ Bcrypt password hashing (10 salt rounds)
✅ Protected routes with middleware verification
✅ Audit logging for all admin actions
✅ Cannot delete or deactivate your own account
✅ Status checks - only active admins can login

## Troubleshooting

**Cannot login:**
- Verify the admin_users table was created
- Check backend console for errors
- Ensure backend is running on port 5000

**Token expired errors:**
- Tokens expire after 24 hours
- Simply login again to get a new token

**CORS errors:**
- Backend must be on port 5000
- Frontend must be on port 3000
- CORS is enabled in server.js

## Next Steps

1. ✅ Change default admin password
2. Create additional admin users as needed
3. Review the audit logs regularly
4. Set up JWT_SECRET in .env for production
5. Implement additional security measures for production

## File Structure

**Backend:**
```
backend/
├── config/
│   └── admin_schema.sql          # Database schema
├── middleware/
│   └── authMiddleware.js         # JWT verification
├── controllers/
│   ├── authController.js         # Auth logic
│   └── adminController.js        # Admin management
├── routes/
│   ├── authRoutes.js            # Auth endpoints
│   └── adminRoutes.js           # Admin endpoints
└── server.js                     # Updated with new routes
```

**Frontend:**
```
frontend/src/
├── services/
│   └── authService.js           # API client with JWT
├── components/
│   └── ProtectedRoute.js        # Route guard
├── pages/
│   ├── AdminLogin.js            # Login page
│   ├── AdminDashboard.js        # Dashboard
│   └── AdminUsersManagement.js  # User management
└── App.js                        # Routes configured
```

## Support

For detailed documentation, see `ADMIN_SETUP.md`
