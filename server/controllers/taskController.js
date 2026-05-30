const taskModel = require('../models/taskModel');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30 }); // 30 secondi

const getTasks = async (req, res) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const tasks = await taskModel.getAllTasks(req.user.id);
    cache.set(cacheKey, tasks);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

const createTask = async (req, res) => {
  const { date, subject, category, description, notes } = req.body;
  if (!date || !subject || !category || !description) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
  }
  try {
    const task = await taskModel.createTask(req.user.id, { date, subject, category, description, notes });
    cache.del(`tasks_${req.user.id}`);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

const updateTask = async (req, res) => {
  const { date, subject, category, description, notes } = req.body;
  try {
    const task = await taskModel.updateTask(req.params.id, req.user.id, { date, subject, category, description, notes });
    if (!task) return res.status(404).json({ error: 'Compito non trovato.' });
    cache.del(`tasks_${req.user.id}`);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

const toggleTask = async (req, res) => {
  try {
    const task = await taskModel.toggleTask(req.params.id, req.user.id, req.body.completed);
    if (!task) return res.status(404).json({ error: 'Compito non trovato.' });
    cache.del(`tasks_${req.user.id}`);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const deleted = await taskModel.deleteTask(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Compito non trovato.' });
    cache.del(`tasks_${req.user.id}`);
    res.json({ message: 'Compito eliminato.', id: deleted.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

const reorderTasks = async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds deve essere un array.' });
  }
  try {
    await taskModel.reorderTasks(req.user.id, orderedIds);
    cache.del(`tasks_${req.user.id}`);
    res.json({ message: 'Ordine aggiornato.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

module.exports = { getTasks, createTask, updateTask, toggleTask, deleteTask, reorderTasks };