const express        = require('express');
const cors           = require('cors');
const path           = require('path');
const fs             = require('fs');
require('dotenv').config();

const authRoutes      = require('./routes/authRoutes');
const taskRoutes      = require('./routes/taskRoutes');
const settingsRoutes  = require('./routes/settingsRoutes');
const uploadRoutes    = require('./routes/uploadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // ← nuovo
const { startAutoDeleteScheduler } = require('./middleware/deleteScheduler');

const app  = express();
const PORT = process.env.PORT || 5000;

// Crea cartella uploads se non esiste
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // ← aggiunto x-api-key
}));

app.use(express.json());

app.use('/api/auth',                      authRoutes);
app.use('/api/tasks',                     taskRoutes);
app.use('/api/settings',                  settingsRoutes);
app.use('/api/tasks/:taskId/attachments', uploadRoutes);
app.use('/api/dashboard',                 dashboardRoutes); // ← nuovo

app.use('/uploads', express.static(uploadsDir));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  startAutoDeleteScheduler();
});