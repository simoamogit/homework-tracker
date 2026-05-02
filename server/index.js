const express        = require('express');
const cors           = require('cors');
require('dotenv').config();

const authRoutes     = require('./routes/authRoutes');
const taskRoutes     = require('./routes/taskRoutes');
const settingsRoutes = require('./routes/settingsRoutes'); // ← aggiungi

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/settings', settingsRoutes); // ← aggiungi

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server attivo ✅' });
});

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});