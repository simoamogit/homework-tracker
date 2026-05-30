const cloudinary = require('../config/cloudinary');
const pool       = require('../config/db');
const multer     = require('multer');
const { Readable } = require('stream');

const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadAttachment = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto.' });

    const taskId = req.params.taskId;

    // Verifica che il task appartenga all'utente
    const taskCheck = await pool.query(
      'SELECT id FROM tasks WHERE id=$1 AND user_id=$2',
      [taskId, req.user.id]
    );
    if (!taskCheck.rows.length) {
      return res.status(404).json({ error: 'Compito non trovato.' });
    }

    try {
      // Upload su Cloudinary via stream
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `imieicompiti/${req.user.id}`, resource_type: 'auto' },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        Readable.from(req.file.buffer).pipe(stream);
      });

      const result = await pool.query(
        `INSERT INTO task_attachments (task_id, filename, url, public_id, size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [taskId, req.file.originalname, uploadResult.secure_url, uploadResult.public_id,
         req.file.size, req.file.mimetype]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({ error: 'Errore durante il caricamento.' });
    }
  }
];

const deleteAttachment = async (req, res) => {
  try {
    const att = await pool.query(
      `SELECT a.* FROM task_attachments a
       JOIN tasks t ON t.id = a.task_id
       WHERE a.id=$1 AND t.user_id=$2`,
      [req.params.attId, req.user.id]
    );
    if (!att.rows.length) return res.status(404).json({ error: 'Allegato non trovato.' });

    await cloudinary.uploader.destroy(att.rows[0].public_id, { resource_type: 'auto' });
    await pool.query('DELETE FROM task_attachments WHERE id=$1', [req.params.attId]);
    res.json({ message: 'Allegato eliminato.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno.' });
  }
};

module.exports = { uploadAttachment, deleteAttachment };