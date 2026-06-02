import { useState, useEffect, useRef, useCallback } from 'react';
import { updateTask, getSettings, uploadAttachment, deleteAttachment } from '../services/api';
import styles from './EditTaskModal.module.css';

// Riusa i componenti da AddTaskForm
function FullscreenEditor({ value, onChange, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.fsOverlay} onClick={onClose}>
      <div className={styles.fsModal} onClick={e => e.stopPropagation()}>
        <div className={styles.fsHeader}>
          <span>Descrizione e note (Markdown)</span>
          <button className={styles.fsClose} onClick={onClose} title="Chiudi">
            <i className="bi bi-fullscreen-exit" />
          </button>
        </div>
        <textarea
          className={styles.fsTextarea}
          value={value}
          onChange={onChange}
          autoFocus
        />
        <div className={styles.fsFooter}>
          <span className={styles.fsHint}>Esc per chiudere</span>
          <button className={styles.fsDone} onClick={onClose}>
            <i className="bi bi-check2" /> Fatto
          </button>
        </div>
      </div>
    </div>
  );
}

function FileDropZone({ files, onFilesChange, label = 'Aggiungi allegati' }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    onFilesChange(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  }, [onFilesChange]);

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div
        className={`${styles.fileArea} ${isDragging ? styles.fileAreaDrag : ''}`}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileRef.current?.click()}
      >
        <i className={`bi ${isDragging ? 'bi-cloud-arrow-down' : 'bi-paperclip'}`} />
        <span>
          {isDragging ? 'Rilascia i file qui'
            : files.length ? `${files.length} file selezionat${files.length > 1 ? 'i' : 'o'}`
            : 'Trascina qui o clicca per allegare'}
        </span>
        <input ref={fileRef} type="file" multiple hidden
          onChange={e => onFilesChange(prev => [...prev, ...Array.from(e.target.files)])} />
      </div>
      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <i className="bi bi-file-earmark" />
              <span>{f.name}</span>
              <button type="button" className={styles.fileRemove}
                onClick={() => onFilesChange(p => p.filter((_, j) => j !== i))}>
                <i className="bi bi-x" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EditTaskModal({ task, onClose, onUpdate }) {
  const initialContent = [task.description, task.notes?.trim() ? task.notes : null]
    .filter(Boolean).join('\n\n');

  const [date,        setDate]        = useState(() => new Date(task.date).toLocaleDateString('en-CA'));
  const [subject,     setSubject]     = useState(task.subject);
  const [category,    setCategory]    = useState(task.category);
  const [description, setDescription] = useState(initialContent);
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [newFiles,    setNewFiles]    = useState([]);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [showFs,      setShowFs]      = useState(false);

  useEffect(() => {
    getSettings().then(res => {
      const subs = res.data.subjects   || [];
      const cats = res.data.categories || [];
      setSubjects(subs.includes(task.subject)   ? subs : [...subs, task.subject]);
      setCategories(cats.includes(task.category) ? cats : [...cats, task.category]);
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
      const res = await updateTask(task.id, {
        date, subject, category, description: description.trim(), notes: '',
      });
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
    <>
      {showFs && (
        <FullscreenEditor
          value={description}
          onChange={e => setDescription(e.target.value)}
          onClose={() => setShowFs(false)}
        />
      )}

      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <h3 className={styles.title}>Modifica compito</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="bi bi-x-lg" />
            </button>
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

            {/* Descrizione + fullscreen */}
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Descrizione e note (Markdown)</label>
                <button type="button" className={styles.fsBtn}
                  onClick={() => setShowFs(true)} title="Fullscreen">
                  <i className="bi bi-fullscreen" />
                </button>
              </div>
              <textarea className={`${styles.input} ${styles.textarea}`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6} required />
            </div>

            {/* Allegati esistenti */}
            {attachments.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label}>Allegati salvati</label>
                <ul className={styles.fileList}>
                  {attachments.map(a => (
                    <li key={a.id} className={styles.fileItem}>
                      <i className="bi bi-file-earmark" />
                      <a href={a.url} target="_blank" rel="noopener noreferrer"
                        className={styles.fileLink}>{a.filename}</a>
                      <button type="button" className={styles.fileRemove}
                        onClick={() => handleDeleteAttachment(a)}>
                        <i className="bi bi-x" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FileDropZone
              files={newFiles}
              onFilesChange={setNewFiles}
              label="Aggiungi nuovi allegati"
            />

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
    </>
  );
}