const pool = require('../config/db');

const getSettings = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM settings WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    // Prima volta: crea riga vuota per l'utente
    const created = await pool.query(
      'INSERT INTO settings (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return created.rows[0];
  }
  return result.rows[0];
};

const updateSettings = async (userId, subjects, categories) => {
  const result = await pool.query(
    `INSERT INTO settings (user_id, subjects, categories, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET subjects = $2, categories = $3, updated_at = NOW()
     RETURNING *`,
    [userId, subjects, categories]
  );
  return result.rows[0];
};

module.exports = { getSettings, updateSettings };