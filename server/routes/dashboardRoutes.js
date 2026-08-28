const express       = require('express');
const router        = express.Router();
const dashboardAuth = require('../middleware/dashboardAuth');
const taskModel     = require('../models/taskModel');
const pool          = require('../config/db');

router.use(dashboardAuth);

// ── GET /api/dashboard/tasks ──────────────────────────────────────────────
// Ritorna i compiti nel formato richiesto dalla Dashboard.
// Parametri opzionali:
//   ?user_id=<uuid>      → filtra per utente (obbligatorio con API Key)
//   ?completed=true|false → filtra per stato
//   ?subject=Fisica       → filtra per materia
router.get('/tasks', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({
        error: 'Specifica ?user_id=<uuid> quando usi la API Key.',
      });
    }

    let query = `
      SELECT id, description AS title, subject, date AS "dueDate",
             completed, category, notes, completed_at
      FROM tasks
      WHERE user_id = $1
    `;
    const params = [userId];

    // Filtri opzionali
    if (req.query.completed !== undefined) {
      params.push(req.query.completed === 'true');
      query += ` AND completed = $${params.length}`;
    }
    if (req.query.subject) {
      params.push(req.query.subject);
      query += ` AND subject ILIKE $${params.length}`;
    }

    query += ' ORDER BY date ASC, created_at ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[dashboard/tasks GET]', err);
    res.status(500).json({ error: 'Errore interno.' });
  }
});

// ── PATCH /api/dashboard/tasks/:id ───────────────────────────────────────
// Aggiorna solo il campo completed.
// Body: { "completed": boolean }
router.patch('/tasks/:id', async (req, res) => {
  const { completed } = req.body;

  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: '`completed` deve essere true o false.' });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({
      error: 'Specifica ?user_id=<uuid> quando usi la API Key.',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET completed    = $1,
           completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END
       WHERE id = $2 AND user_id = $3
       RETURNING id, description AS title, subject,
                 date AS "dueDate", completed, completed_at`,
      [completed, req.params.id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Compito non trovato.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[dashboard/tasks PATCH]', err);
    res.status(500).json({ error: 'Errore interno.' });
  }
});

// ── GET /api/dashboard/stats ──────────────────────────────────────────────
// Statistiche riassuntive per widget della Dashboard.
router.get('/stats', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(400).json({ error: 'Specifica ?user_id=<uuid>.' });
  }

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)                                          AS total,
         COUNT(*) FILTER (WHERE completed = true)         AS completed,
         COUNT(*) FILTER (WHERE completed = false
                            AND date < CURRENT_DATE)      AS overdue,
         COUNT(*) FILTER (WHERE date = CURRENT_DATE)      AS due_today,
         COUNT(*) FILTER (WHERE date = CURRENT_DATE
                            AND completed = false)        AS pending_today
       FROM tasks
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    res.json({
      total:        Number(row.total),
      completed:    Number(row.completed),
      pending:      Number(row.total) - Number(row.completed),
      overdue:      Number(row.overdue),
      dueToday:     Number(row.due_today),
      pendingToday: Number(row.pending_today),
    });
  } catch (err) {
    console.error('[dashboard/stats]', err);
    res.status(500).json({ error: 'Errore interno.' });
  }
});

module.exports = router;