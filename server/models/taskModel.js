const pool = require('../config/db');

const getAllTasks = async (userId) => {
  const result = await pool.query(
    `SELECT t.*, 
      COALESCE(
        json_agg(a ORDER BY a.created_at) FILTER (WHERE a.id IS NOT NULL), 
        '[]'
      ) AS attachments
     FROM tasks t
     LEFT JOIN task_attachments a ON a.task_id = t.id
     WHERE t.user_id = $1
     GROUP BY t.id
     ORDER BY t.date ASC, t.sort_order ASC, t.created_at ASC`,
    [userId]
  );
  return result.rows;
};

const createTask = async (userId, { date, subject, category, description, notes = '' }) => {
  const maxRes = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM tasks WHERE user_id = $1 AND date = $2',
    [userId, date]
  );
  const sortOrder = maxRes.rows[0].next;

  const result = await pool.query(
    `INSERT INTO tasks (user_id, date, subject, category, description, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, date, subject, category, description, notes, sortOrder]
  );
  return { ...result.rows[0], attachments: [] };
};

const updateTask = async (taskId, userId, { date, subject, category, description, notes = '' }) => {
  const result = await pool.query(
    `UPDATE tasks
     SET date=$1, subject=$2, category=$3, description=$4, notes=$5
     WHERE id=$6 AND user_id=$7 RETURNING *`,
    [date, subject, category, description, notes, taskId, userId]
  );
  if (!result.rows.length) return null;

  const atts = await pool.query(
    'SELECT * FROM task_attachments WHERE task_id=$1 ORDER BY created_at',
    [taskId]
  );
  return { ...result.rows[0], attachments: atts.rows };
};

const toggleTask = async (taskId, userId, completed) => {
  const result = await pool.query(
    'UPDATE tasks SET completed=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
    [completed, taskId, userId]
  );
  if (!result.rows.length) return null;

  const atts = await pool.query(
    'SELECT * FROM task_attachments WHERE task_id=$1 ORDER BY created_at',
    [taskId]
  );
  return { ...result.rows[0], attachments: atts.rows };
};

const deleteTask = async (taskId, userId) => {
  const result = await pool.query(
    'DELETE FROM tasks WHERE id=$1 AND user_id=$2 RETURNING id',
    [taskId, userId]
  );
  return result.rows[0];
};

const reorderTasks = async (userId, orderedIds) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        'UPDATE tasks SET sort_order=$1 WHERE id=$2 AND user_id=$3',
        [i, orderedIds[i], userId]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAllTasks, createTask, updateTask, toggleTask, deleteTask, reorderTasks };