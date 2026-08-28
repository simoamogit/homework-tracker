import axios from 'axios';

// In sviluppo: '' → usa il proxy Vite per /uploads e /api
// In produzione: URL assoluto del backend Render
export const BACKEND_URL = import.meta.env.DEV
  ? ''
  : 'https://homework-tracker-oano.onrender.com';

/**
 * Costruisce l'URL assoluto di un allegato.
 * In dev:  '/uploads/file.pdf' → '/uploads/file.pdf' (via Vite proxy)
 * In prod: '/uploads/file.pdf' → 'https://render-url.onrender.com/uploads/file.pdf'
 */
export function buildFileUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath; // già assoluto
  return `${BACKEND_URL}${relativePath}`;
}

const API = axios.create({
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
export const getTasks     = ()              => API.get('/tasks');
export const createTask   = (data)          => API.post('/tasks', data);
export const updateTask   = (id, data)      => API.put(`/tasks/${id}`, data);
export const toggleTask   = (id, completed) => API.patch(`/tasks/${id}/complete`, { completed });
export const deleteTask   = (id)            => API.delete(`/tasks/${id}`);
export const reorderTasks = (orderedIds)    => API.patch('/tasks/reorder', { orderedIds });

// Attachments
export const uploadAttachment = (taskId, formData) =>
  API.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteAttachment = (taskId, attId) =>
  API.delete(`/tasks/${taskId}/attachments/${attId}`);

// Settings
export const getSettings    = ()                     => API.get('/settings');
export const updateSettings = (subjects, categories) => API.put('/settings', { subjects, categories });

export default API;