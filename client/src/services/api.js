import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (email, password) =>
  api.post('/auth/register', { email, password });

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

// Tasks
export const getTasks    = ()              => api.get('/tasks');
export const createTask  = (taskData)      => api.post('/tasks', taskData);
export const updateTask  = (id, taskData)  => api.put(`/tasks/${id}`, taskData);
export const toggleTask  = (id, completed) => api.patch(`/tasks/${id}/complete`, { completed });
export const deleteTask  = (id)            => api.delete(`/tasks/${id}`);

// Settings
export const getSettings    = ()                        => api.get('/settings');
export const updateSettings = (subjects, categories)    => api.put('/settings', { subjects, categories });