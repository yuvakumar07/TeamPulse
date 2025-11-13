const jwt = require('jsonwebtoken');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'teampulse_jwt_secret_key_change_in_production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add admin info to request object
    req.admin = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate token.'
    });
  }
};

// Middleware to check if admin is active
const checkAdminStatus = (req, res, next) => {
  if (req.admin.status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is not active. Please contact the system administrator.'
    });
  }
  next();
};

// Generate JWT token
const generateToken = (adminData) => {
  const payload = {
    id: adminData.id,
    username: adminData.username,
    email: adminData.email,
    full_name: adminData.full_name,
    status: adminData.status,
    role_id: adminData.role_id || null,
    role_name: adminData.role_name || null
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h' // Token expires in 24 hours
  });
};

module.exports = {
  verifyToken,
  checkAdminStatus,
  generateToken,
  JWT_SECRET
};
