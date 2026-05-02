import axios from 'axios';

// Usa l'URL di Render (o la variabile d'ambiente)
const API_URL = import.meta.env.VITE_API_URL || 'https://homework-tracker-oano.onrender.com/api';

const API = axios.create({
  baseURL: API_URL,
});

// Aggiungiamo il token se presente
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- CONTROLLA BENE QUESTI NOMI ---
export const loginUser = (formData) => API.post('/auth/login', formData);
export const registerUser = (formData) => API.post('/auth/register', formData);

// ... (resto del codice sopra invariato)

export const getTasks = () => API.get('/tasks');
export const createTask = (data) => API.post('/tasks', data);

// MODIFICA QUESTA RIGA: esportiamo updateTask ma creiamo anche l'alias toggleTask
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const toggleTask = (id, data) => API.put(`/tasks/${id}`, data); // Aggiungi questa!

export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// ... (resto del codice sotto invariato)
export const getSettings = () => API.get('/settings');
export const updateSettings = (data) => API.post('/settings', data);

export default API;