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
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Employee API calls
export const getAllEmployees = (page = 1, limit = 10, roleType = null, sortField = 'created_at', sortOrder = 'DESC', search = null, project = null, team = null) => {
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
  if (search && search.trim() !== '') {
    params.search = search.trim();
  }
  if (project && project !== 'All') {
    params.project = project;
  }
  if (team && team !== 'All') {
    params.team = team;
  }
  return api.get('/employees', { params });
};
export const getEmployeeById = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);

// Project API calls
export const getAllProjects = (page = 1, limit = 10, status = null, sortField = 'created_at', sortOrder = 'DESC', search = null) => {
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
  if (search && search.trim() !== '') {
    params.search = search.trim();
  }
  return api.get('/projects', { params });
};
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const assignEmployeesToProject = (projectId, data) => api.put(`/projects/${projectId}/employees`, data);

// Project Teams API calls
export const getAllTeams = () => api.get('/projects/teams/all');
export const getProjectTeams = (projectId) => api.get(`/projects/${projectId}/teams`);
export const createProjectTeam = (projectId, data) => api.post(`/projects/${projectId}/teams`, data);
export const updateProjectTeam = (teamId, data) => api.put(`/projects/teams/${teamId}`, data);
export const deleteProjectTeam = (teamId) => api.delete(`/projects/teams/${teamId}`);

// Project Team Employees API calls
export const getTeamEmployees = (teamId) => api.get(`/projects/teams/${teamId}/employees`);
export const assignEmployeesToTeam = (teamId, data) => api.put(`/projects/teams/${teamId}/employees`, data);
export const removeEmployeeFromTeam = (assignmentId) => api.delete(`/projects/team-employees/${assignmentId}`);

// Visa History API calls
export const getVisaHistory = (employeeId) => api.get(`/visa/employee/${employeeId}`);
export const getVisaHistoryById = (id) => api.get(`/visa/${id}`);
export const createVisaHistory = (data) => api.post('/visa', data);
export const updateVisaHistory = (id, data) => api.put(`/visa/${id}`, data);
export const deleteVisaHistory = (id) => api.delete(`/visa/${id}`);
export const getUpcomingVisaExpirations = (days = 90) => api.get('/visa/expirations', { params: { days } });

// Asset Management API calls
export const getAllAssets = (page = 1, limit = 10, status = null, assetType = null, sortField = 'created_at', sortOrder = 'DESC', search = null) => {
  const params = { page, limit };
  if (status && status !== 'All') {
    params.status = status;
  }
  if (assetType && assetType !== 'All') {
    params.asset_type = assetType;
  }
  if (sortField) {
    params.sortField = sortField;
  }
  if (sortOrder) {
    params.sortOrder = sortOrder;
  }
  if (search && search.trim() !== '') {
    params.search = search.trim();
  }
  return api.get('/assets', { params });
};
export const getAssetById = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
export const assignAsset = (id, data) => api.put(`/assets/${id}/assign`, data);
export const unassignAsset = (id) => api.put(`/assets/${id}/unassign`);
export const getAssetsByEmployee = (employeeId) => api.get(`/assets/employee/${employeeId}`);

// Invoice Management API calls
export const getEmployeesForInvoice = (projectId, teamId = null) => {
  const params = { projectId };
  if (teamId) {
    params.teamId = teamId;
  }
  return api.get('/invoices/employees', { params });
};
export const getAllInvoices = (page = 1, limit = 10, status = null, projectId = null) => {
  const params = { page, limit };
  if (status && status !== 'All') {
    params.status = status;
  }
  if (projectId) {
    params.projectId = projectId;
  }
  return api.get('/invoices', { params });
};
export const getInvoiceById = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);

export default api;
