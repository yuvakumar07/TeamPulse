import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
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
api.interceptors.response.use(
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

// Employee API calls
export const getAllEmployees = (page = 1, limit = 10, roleType = null, sortField = 'created_at', sortOrder = 'DESC') => {
  const params = { page, limit };
  if (roleType && roleType !== 'All') {
    params.role_type = roleType;
  }
  if (sortField) {
    params.sortField = sortField;
  }
  if (sortOrder) {
    params.sortOrder = sortOrder;
  }
  return api.get('/employees', { params });
};
export const getEmployeeById = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// Project API calls
export const getAllProjects = (page = 1, limit = 10, status = null, sortField = 'created_at', sortOrder = 'DESC') => {
  const params = { page, limit };
  if (status && status !== 'All') {
    params.status = status;
  }
  if (sortField) {
    params.sortField = sortField;
  }
  if (sortOrder) {
    params.sortOrder = sortOrder;
  }
  return api.get('/projects', { params });
};
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const assignEmployeesToProject = (projectId, data) => api.put(`/projects/${projectId}/employees`, data);

// Visa History API calls
export const getVisaHistory = (employeeId) => api.get(`/visa/employee/${employeeId}`);
export const getVisaHistoryById = (id) => api.get(`/visa/${id}`);
export const createVisaHistory = (data) => api.post('/visa', data);
export const updateVisaHistory = (id, data) => api.put(`/visa/${id}`, data);
export const deleteVisaHistory = (id) => api.delete(`/visa/${id}`);
export const getUpcomingVisaExpirations = (days = 90) => api.get('/visa/expirations', { params: { days } });

export default api;
