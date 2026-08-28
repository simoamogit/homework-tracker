const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Cancella SOLO gli allegati (NON i task) per i task completati da più di 1 ora.
 * I task rimangono nell'archivio senza allegati.
 */
async function deleteExpiredAttachments() {
  try {
    const result = await pool.query(`
      SELECT a.id, a.public_id, a.filename
      FROM task_attachments a
      JOIN tasks t ON t.id = a.task_id
      WHERE t.completed      = true
        AND t.completed_at   IS NOT NULL
        AND t.completed_at + INTERVAL '1 hour' <= NOW()
    `);

    if (result.rows.length === 0) return;

    console.log(`[scheduler] ${result.rows.length} allegat${result.rows.length > 1 ? 'i' : 'o'} da eliminare`);

    for (const att of result.rows) {
      // 1. Cancella file dal disco
      const filePath = path.join(uploadsDir, att.public_id);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[scheduler] File rimosso: ${att.filename}`);
        }
      } catch (fsErr) {
        console.error(`[scheduler] Errore rimozione file ${att.public_id}:`, fsErr.message);
      }

      // 2. Cancella record dal DB
      try {
        await pool.query('DELETE FROM task_attachments WHERE id = $1', [att.id]);
      } catch (dbErr) {
        console.error(`[scheduler] Errore DB per allegato ${att.id}:`, dbErr.message);
      }
    }
  } catch (err) {
    console.error('[scheduler] Errore query:', err.message);
  }
}

function startAutoDeleteScheduler(intervalMs = 60 * 1000) {
  console.log(`[scheduler] Auto-delete avviato (ogni ${intervalMs / 1000}s, 1h dopo completamento)`);
  deleteExpiredAttachments(); // Controlla subito all'avvio
  return setInterval(deleteExpiredAttachments, intervalMs);
}

module.exports = { startAutoDeleteScheduler };