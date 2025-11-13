import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
