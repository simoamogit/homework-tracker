const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Scheduler per eliminare definitivamente i compiti scaduti da oltre 30 giorni
 * (eliminazione sia dal database che dal filesystem locale)
 */
const startAutoDeleteScheduler = (intervalMs = 60 * 1000) => {
  // esegui subito una pulizia e poi ripeti ogni intervalMs
  deleteExpiredTasks();
  const timer = setInterval(deleteExpiredTasks, intervalMs);
  console.log(`[scheduler] Auto-delete avviato (ogni ${intervalMs / 1000} secondi)`);
  return timer;
};

const deleteExpiredTasks = async () => {
  try {
    // 1. Recupera gli allegati dei compiti scaduti da oltre 30 giorni
    const attachmentsResult = await pool.query(`
      SELECT a.public_id, a.url
      FROM task_attachments a
      JOIN tasks t ON t.id = a.task_id
      WHERE t.due_date < NOW() - INTERVAL '30 days'
    `);

    // 2. Elimina i file fisici
    for (const att of attachmentsResult.rows) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', att.public_id);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[scheduler] File eliminato: ${att.public_id}`);
        }
      } catch (err) {
        console.error(`[scheduler] Errore eliminazione file ${att.public_id}:`, err.message);
      }
    }

    // 3. Elimina i record dal database (gli allegati e i compiti)
    await pool.query(`
      DELETE FROM task_attachments
      WHERE task_id IN (
        SELECT id FROM tasks WHERE due_date < NOW() - INTERVAL '30 days'
      )
    `);
    await pool.query(`
      DELETE FROM tasks WHERE due_date < NOW() - INTERVAL '30 days'
    `);

    const deletedCount = attachmentsResult.rowCount;
    if (deletedCount > 0) {
      console.log(`[scheduler] Pulizia completata: eliminati ${deletedCount} allegati e i relativi compiti.`);
    }
  } catch (err) {
    console.error('[scheduler] Errore durante la pulizia automatica:', err.message);
  }
};

module.exports = { startAutoDeleteScheduler };