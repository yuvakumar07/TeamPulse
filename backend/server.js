const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const roleRoutes = require('./routes/roleRoutes');
const projectRoutes = require('./routes/projectRoutes');
const visaRoutes = require('./routes/visaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', roleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/visa', visaRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'TeamPulse API',
    version: '2.0.0',
    endpoints: {
      employees: '/api/employees',
      auth: '/api/auth',
      admin: '/api/admin',
      roles: '/api/roles',
      permissions: '/api/permissions',
      projects: '/api/projects',
      visa: '/api/visa'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
