import axios from 'axios';

// COMMENTA la riga sotto temporaneamente per testare
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// USA QUESTA riga fissa per essere sicuro:
const API_URL = 'https://homework-tracker-oano.onrender.com/api';

const API = axios.create({
  baseURL: API_URL,
});

// Aggiungi il token per le chiamate protette
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getTasks = () => API.get('/tasks');
export const createTask  = (taskData)      => api.post('/tasks', taskData);
export const updateTask  = (id, taskData)  => api.put(`/tasks/${id}`, taskData);
export const toggleTask  = (id, completed) => api.patch(`/tasks/${id}/complete`, { completed });
export const deleteTask  = (id)            => api.delete(`/tasks/${id}`);

// Settings
export const getSettings    = ()                        => api.get('/settings');
export const updateSettings = (subjects, categories)    => api.put('/settings', { subjects, categories });