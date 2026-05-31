import axios from 'axios';

const API = axios.create({
  // In sviluppo locale → Vite proxy → localhost:5000
  // In produzione (Netlify) → URL Render diretto
  baseURL: import.meta.env.DEV
    ? '/api'
    : 'https://homework-tracker-oano.onrender.com/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const loginUser    = (email, password) => API.post('/auth/login',    { email, password });
export const registerUser = (email, password) => API.post('/auth/register', { email, password });

// Tasks
export const getTasks   = ()              => API.get('/tasks');
export const createTask = (data)          => API.post('/tasks', data);
export const updateTask = (id, data)      => API.put(`/tasks/${id}`, data);
export const toggleTask = (id, completed) => API.patch(`/tasks/${id}/complete`, { completed });
export const deleteTask = (id)            => API.delete(`/tasks/${id}`);
export const reorderTasks = (orderedIds)  => API.patch('/tasks/reorder', { orderedIds });

// Attachments
export const uploadAttachment = (taskId, formData) =>
  API.post(`/tasks/${taskId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteAttachment = (taskId, attId) =>
  API.delete(`/tasks/${taskId}/attachments/${attId}`);

// Settings
export const getSettings    = ()                     => API.get('/settings');
export const updateSettings = (subjects, categories) => API.put('/settings', { subjects, categories });

export default API;