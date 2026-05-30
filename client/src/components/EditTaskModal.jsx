import { useState, useEffect, useRef } from 'react';
import { updateTask, getSettings, uploadAttachment, deleteAttachment } from '../services/api';
import styles from './EditTaskModal.module.css';

export default function EditTaskModal({ task, onClose, onUpdate }) {
  const [date,        setDate]        = useState(() => new Date(task.date).toLocaleDateString('en-CA'));
  const [subject,     setSubject]     = useState(task.subject);
  const [category,    setCategory]    = useState(task.category);
  const [description, setDescription] = useState(task.description);
  const [notes,       setNotes]       = useState(task.notes || '');
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [newFiles,    setNewFiles]    = useState([]);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const fileRef = useRef(null);

  useEffect(() => {
    getSettings().then(res => {
      setSubjects((res.data.subjects || []).includes(task.subject)
        ? res.data.subjects
        : [...(res.data.subjects || []), task.subject]);
      setCategories((res.data.categories || []).includes(task.category)
        ? res.data.categories
        : [...(res.data.categories || []), task.category]);
    }).catch(() => {});
  }, [task.subject, task.category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !subject || !category || !description.trim()) {
      return setError('Tutti i campi sono obbligatori.');
    }
    setLoading(true);
    try {
      const res = await updateTask(task.id, { date, subject, category, description: description.trim(), notes });
      const updatedTask = { ...res.data, attachments };

      for (const file of newFiles) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const attRes = await uploadAttachment(task.id, fd);
          updatedTask.attachments = [...updatedTask.attachments, attRes.data];
          setAttachments(updatedTask.attachments);
        } catch (err) { console.error('Upload error:', err); }
      }

      onUpdate(updatedTask);
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (att) => {
    try {
      await deleteAttachment(task.id, att.id);
      setAttachments(p => p.filter(a => a.id !== att.id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Modifica compito</h3>
          <button className={styles.closeBtn} onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Data</label>
            <input type="date" className={styles.input} value={date}
              onChange={e => setDate(e.target.value)} required />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Materia</label>
              <select className={styles.input} value={subject}
                onChange={e => setSubject(e.target.value)} required>
                <option value="">Seleziona...</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Categoria</label>
              <select className={styles.input} value={category}
                onChange={e => setCategory(e.target.value)} required>
                <option value="">Seleziona...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrizione</label>
            <textarea className={`${styles.input} ${styles.textarea}`}
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Note (Markdown)</label>
            <textarea className={`${styles.input} ${styles.textarea} ${styles.notesArea}`}
              placeholder="Note, link, dettagli..."
              value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
          </div>

          {/* Allegati esistenti */}
          {attachments.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Allegati salvati</label>
              <ul className={styles.fileList}>
                {attachments.map(a => (
                  <li key={a.id} className={styles.fileItem}>
                    <i className="bi bi-file-earmark" />
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                      {a.filename}
                    </a>
                    <button type="button" className={styles.fileRemove}
                      onClick={() => handleDeleteAttachment(a)}>
                      <i className="bi bi-x" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Nuovi allegati */}
          <div className={styles.field}>
            <label className={styles.label}>Aggiungi allegati</label>
            <div className={styles.fileArea} onClick={() => fileRef.current?.click()}>
              <i className="bi bi-paperclip" />
              <span>{newFiles.length ? `${newFiles.length} file` : 'Clicca per allegare'}</span>
              <input ref={fileRef} type="file" multiple hidden
                onChange={e => setNewFiles(Array.from(e.target.files))} />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Annulla</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}