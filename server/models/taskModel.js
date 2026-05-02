const pool = require('../config/db');

// Recupera tutti i compiti di un utente, ordinati per data
const getTasksByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM tasks
     WHERE user_id = $1
     ORDER BY date ASC, created_at ASC`,
    [userId]
  );
  return result.rows;
};

// Crea un nuovo compito
const createTask = async ({ userId, date, subject, category, description }) => {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, date, subject, category, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, date, subject, category, description]
  );
  return result.rows[0];
};

// Aggiorna lo stato "completato" di un compito
const updateTaskCompleted = async (taskId, userId, completed) => {
  const result = await pool.query(
    `UPDATE tasks
     SET completed = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [completed, taskId, userId]
  );
  return result.rows[0];
};

// Aggiorna i dati di un compito (modifica)
const updateTask = async (taskId, userId, { date, subject, category, description }) => {
  const result = await pool.query(
    `UPDATE tasks
     SET date = $1, subject = $2, category = $3, description = $4
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [date, subject, category, description, taskId, userId]
  );
  return result.rows[0];
};

// Elimina un compito
const deleteTask = async (taskId, userId) => {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [taskId, userId]
  );
  return result.rows[0];
};

module.exports = {
  getTasksByUser,
  createTask,
  updateTaskCompleted,
  updateTask,
  deleteTask,
};