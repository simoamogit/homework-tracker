const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const pool   = require('../config/db');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crea la cartella se non esiste
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// POST /api/tasks/:taskId/attachments
const uploadAttachment = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto.' });

    const { taskId } = req.params;

    const check = await pool.query(
      'SELECT id FROM tasks WHERE id=$1 AND user_id=$2',
      [taskId, req.user.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Compito non trovato.' });

    try {
      // URL relativo — il frontend costruisce l'URL assoluto con BACKEND_URL
      const url = `/uploads/${req.file.filename}`;

      const result = await pool.query(
        `INSERT INTO task_attachments
           (task_id, filename, url, public_id, size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          taskId,
          req.file.originalname,
          url,
          req.file.filename, // nome file su disco, usato per cancellazione
          req.file.size,
          req.file.mimetype,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Errore durante il caricamento.' });
    }
  },
];

// DELETE /api/tasks/:taskId/attachments/:attId
const deleteAttachment = async (req, res) => {
  try {
    const att = await pool.query(
      `SELECT a.* FROM task_attachments a
       JOIN tasks t ON t.id = a.task_id
       WHERE a.id=$1 AND t.user_id=$2`,
      [req.params.attId, req.user.id]
    );
    if (!att.rows.length) return res.status(404).json({ error: 'Allegato non trovato.' });

    const filePath = path.join(uploadsDir, att.rows[0].public_id);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (fsErr) {
      console.error('Errore cancellazione file:', fsErr.message);
      // Non bloccare la risposta se il file non esiste già
    }

    await pool.query('DELETE FROM task_attachments WHERE id=$1', [req.params.attId]);
    res.json({ message: 'Allegato eliminato.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

module.exports = { uploadAttachment, deleteAttachment };