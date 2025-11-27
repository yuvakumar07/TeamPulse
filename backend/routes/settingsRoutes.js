const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken, checkAdminStatus } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionsMiddleware');

// Get current database configuration
router.get('/database', verifyToken, checkAdminStatus, requirePermission('admin_users.view'), (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || 'mysql';

    res.json({
      success: true,
      data: {
        currentDatabase: dbType,
        availableDatabases: ['mysql', 'sqlite'],
        mysqlConfig: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          database: process.env.DB_NAME || 'employee_management'
        },
        sqliteConfig: {
          dbPath: process.env.SQLITE_DB_PATH || './data/employee_management.db'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching database settings',
      error: error.message
    });
  }
});

// Update database configuration
router.post('/database', verifyToken, checkAdminStatus, requirePermission('admin_users.update'), (req, res) => {
  try {
    const { dbType } = req.body;

    if (!['mysql', 'sqlite'].includes(dbType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid database type. Must be either "mysql" or "sqlite"'
      });
    }

    // Read the .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add DB_TYPE
    const dbTypeRegex = /^DB_TYPE=.*/m;
    if (dbTypeRegex.test(envContent)) {
      envContent = envContent.replace(dbTypeRegex, `DB_TYPE=${dbType}`);
    } else {
      envContent = `DB_TYPE=${dbType}\n${envContent}`;
    }

    // Write back to .env file
    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({
      success: true,
      message: `Database configuration updated to ${dbType}. Please restart the server for changes to take effect.`,
      data: {
        dbType,
        requiresRestart: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating database settings',
      error: error.message
    });
  }
});

// Initialize SQLite database
router.post('/database/initialize-sqlite', verifyToken, checkAdminStatus, requirePermission('admin_users.update'), async (req, res) => {
  try {
    const { spawn } = require('child_process');
    const scriptPath = path.join(__dirname, '..', 'scripts', 'initializeSqlite.js');

    const child = spawn('node', [scriptPath]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        res.json({
          success: true,
          message: 'SQLite database initialized successfully',
          output: output
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error initializing SQLite database',
          error: errorOutput
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initializing SQLite database',
      error: error.message
    });
  }
});

// Check database status
router.get('/database/status', verifyToken, checkAdminStatus, (req, res) => {
  try {
    const dbType = process.env.DB_TYPE || 'mysql';
    const db = require('../config/database');

    // Simple health check query
    db.query('SELECT 1 as test')
      .then(() => {
        res.json({
          success: true,
          data: {
            dbType,
            status: 'connected',
            message: `Successfully connected to ${dbType} database`
          }
        });
      })
      .catch((error) => {
        res.json({
          success: false,
          data: {
            dbType,
            status: 'disconnected',
            message: `Failed to connect to ${dbType} database`,
            error: error.message
          }
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking database status',
      error: error.message
    });
  }
});

module.exports = router;
