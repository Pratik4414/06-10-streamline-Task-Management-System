
import axios from 'axios';

// The base URL for all our backend API calls
const API_URL = 'http://localhost:5000/api';

// We create an instance of axios to reuse the base URL
const api = axios.create({
  baseURL: API_URL,
});

// This interceptor automatically adds the JWT token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTHENTICATION API CALLS ---
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, error: 'A network error occurred.' };
  }
};

export const registerUser = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      return error.response?.data || { success: false, error: 'A network error occurred.' };
    }
  };

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, error: 'A network error occurred.' };
  }
};

// --- PROJECTS API CALLS ---
export const getProjects = () => api.get('/projects');
export const createProject = (projectData) => api.post('/projects', projectData);

// --- TASKS API CALLS ---
export const getTasks = () => api.get('/tasks');
export const createTask = (taskData) => api.post('/tasks', taskData);

// --- TEAM API CALLS (Manager Only) ---
export const getTeamMembers = () => api.get('/team');
export const addTeamMember = (memberData) => api.post('/team/add', memberData);


// --- Reports API Calls ---
export const getDashboardStats = () => api.get('/reports/dashboard-stats');

export default api;