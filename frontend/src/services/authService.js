import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token to headers
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth service functions
const authService = {
  // Login
  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    if (response.data.success) {
      localStorage.setItem('adminToken', response.data.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.data.admin));

      // Fetch and store user permissions
      try {
        const permResponse = await authApi.get('/my-permissions');
        if (permResponse.data.success) {
          localStorage.setItem('adminPermissions', JSON.stringify(permResponse.data.data.permissions));
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await authApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminPermissions');
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken');
    return !!token;
  },

  // Get user permissions
  getPermissions: () => {
    const permStr = localStorage.getItem('adminPermissions');
    if (permStr) {
      try {
        return JSON.parse(permStr);
      } catch (error) {
        return [];
      }
    }
    return [];
  },

  // Check if user has a specific permission
  hasPermission: (permission) => {
    const permissions = authService.getPermissions();
    return permissions.includes(permission);
  },

  // Check if user has any of the specified permissions
  hasAnyPermission: (permissionArray) => {
    const permissions = authService.getPermissions();
    return permissionArray.some(perm => permissions.includes(perm));
  },

  // Check if user has all specified permissions
  hasAllPermissions: (permissionArray) => {
    const permissions = authService.getPermissions();
    return permissionArray.every(perm => permissions.includes(perm));
  },

  // Refresh permissions (call after role changes)
  refreshPermissions: async () => {
    try {
      const response = await authApi.get('/my-permissions');
      if (response.data.success) {
        localStorage.setItem('adminPermissions', JSON.stringify(response.data.data.permissions));
        return response.data.data.permissions;
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
    return [];
  },

  // Get profile
  getProfile: async () => {
    const response = await authApi.get('/auth/profile');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await authApi.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await authApi.get('/admin/dashboard/stats');
    return response.data;
  },

  // Admin user management
  getAllAdmins: async (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) {
      params.append('status', status);
    }
    const response = await authApi.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  getAdminById: async (id) => {
    const response = await authApi.get(`/admin/users/${id}`);
    return response.data;
  },

  createAdmin: async (data) => {
    const response = await authApi.post('/admin/users', data);
    return response.data;
  },

  updateAdmin: async (id, data) => {
    const response = await authApi.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteAdmin: async (id) => {
    const response = await authApi.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Audit logs
  getAuditLogs: async (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.admin_id) {
      params.append('admin_id', filters.admin_id);
    }
    if (filters.action) {
      params.append('action', filters.action);
    }
    if (filters.entity_type) {
      params.append('entity_type', filters.entity_type);
    }
    const response = await authApi.get(`/admin/audit-logs?${params.toString()}`);
    return response.data;
  },

  // Role management
  getAllRoles: async () => {
    const response = await authApi.get('/roles');
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await authApi.get(`/roles/${id}`);
    return response.data;
  },

  createRole: async (data) => {
    const response = await authApi.post('/roles', data);
    return response.data;
  },

  updateRole: async (id, data) => {
    const response = await authApi.put(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await authApi.delete(`/roles/${id}`);
    return response.data;
  },

  getAllPermissions: async () => {
    const response = await authApi.get('/permissions');
    return response.data;
  }
};

export default authService;
