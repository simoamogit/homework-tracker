const taskModel = require('../models/taskModel');

// GET /api/tasks — tutti i compiti dell'utente loggato
const getTasks = async (req, res) => {
  try {
    const tasks = await taskModel.getTasksByUser(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error('Errore getTasks:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// POST /api/tasks — crea un nuovo compito
const createTask = async (req, res) => {
  const { date, subject, category, description } = req.body;

  if (!date || !subject || !category || !description) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    const task = await taskModel.createTask({
      userId: req.user.id,
      date,
      subject,
      category,
      description,
    });
    res.status(201).json(task);
  } catch (err) {
    console.error('Errore createTask:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// PATCH /api/tasks/:id/complete — segna come fatto/non fatto
const toggleComplete = async (req, res) => {
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Il campo "completed" deve essere true o false.' });
  }

  try {
    const task = await taskModel.updateTaskCompleted(req.params.id, req.user.id, completed);
    if (!task) return res.status(404).json({ error: 'Compito non trovato.' });
    res.json(task);
  } catch (err) {
    console.error('Errore toggleComplete:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// PUT /api/tasks/:id — modifica un compito
const updateTask = async (req, res) => {
  const { date, subject, category, description } = req.body;

  if (!date || !subject || !category || !description) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
  }

  try {
    const task = await taskModel.updateTask(req.params.id, req.user.id, {
      date, subject, category, description,
    });
    if (!task) return res.status(404).json({ error: 'Compito non trovato.' });
    res.json(task);
  } catch (err) {
    console.error('Errore updateTask:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// DELETE /api/tasks/:id — elimina un compito
const deleteTask = async (req, res) => {
  try {
    const task = await taskModel.deleteTask(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Compito non trovato.' });
    res.json({ message: 'Compito eliminato con successo.', id: task.id });
  } catch (err) {
    console.error('Errore deleteTask:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

module.exports = { getTasks, createTask, toggleComplete, updateTask, deleteTask };