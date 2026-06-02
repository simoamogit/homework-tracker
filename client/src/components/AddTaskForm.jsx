import { useState, useEffect, useRef, useCallback } from 'react';
import { createTask, getSettings, uploadAttachment } from '../services/api';
import styles from './AddTaskForm.module.css';

// ── Fullscreen textarea ────────────────────────────────────────────────────
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
          <button className={styles.fsClose} onClick={onClose} title="Chiudi fullscreen">
            <i className="bi bi-fullscreen-exit" />
          </button>
        </div>
        <textarea
          className={styles.fsTextarea}
          value={value}
          onChange={onChange}
          autoFocus
          placeholder={`# Titolo\n\nCosa devi fare?\n\n- Punto 1\n- Punto 2\n\n**Grassetto**, *corsivo*, \`codice\``}
        />
        <div className={styles.fsFooter}>
          <span className={styles.fsHint}>Esc per chiudere • Markdown supportato</span>
          <button className={styles.fsDone} onClick={onClose}>
            <i className="bi bi-check2" /> Fatto
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drop zone con drag&drop ────────────────────────────────────────────────
function FileDropZone({ files, onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange(prev => [...prev, ...dropped]);
  }, [onFilesChange]);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = ()  => setIsDragging(false);

  return (
    <div className={styles.field}>
      <label className={styles.label}>Allegati</label>
      <div
        className={`${styles.fileArea} ${isDragging ? styles.fileAreaDrag : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        <i className={`bi ${isDragging ? 'bi-cloud-arrow-down' : 'bi-paperclip'}`} />
        <span>
          {isDragging
            ? 'Rilascia i file qui'
            : files.length
              ? `${files.length} file selezionat${files.length > 1 ? 'i' : 'o'}`
              : 'Trascina qui o clicca per allegare'}
        </span>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={e => onFilesChange(prev => [...prev, ...Array.from(e.target.files)])}
        />
      </div>
      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((f, i) => (
            <li key={i} className={styles.fileItem}>
              <i className="bi bi-file-earmark" />
              <span>{f.name}</span>
              <span className={styles.fileSize}>
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                className={styles.fileRemove}
                onClick={() => onFilesChange(p => p.filter((_, j) => j !== i))}
              >
                <i className="bi bi-x" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Modale standalone (usato da CalendarView) ──────────────────────────────
export function AddTaskModal({ prefilledDate, onTaskAdded, onClose }) {
  const today = new Date().toLocaleDateString('en-CA');
  const [date,        setDate]        = useState(prefilledDate || today);
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [files,       setFiles]       = useState([]);
  const [showFs,      setShowFs]      = useState(false);

  useEffect(() => {
    getSettings().then(res => {
      setSubjects(res.data.subjects   || []);
      setCategories(res.data.categories || []);
    }).catch(() => {});
  }, []);

  const reset = () => {
    setDate(prefilledDate || today);
    setSubject(''); setCategory(''); setDescription('');
    setFiles([]); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !subject || !category || !description.trim()) {
      return setError('Tutti i campi sono obbligatori.');
    }
    setLoading(true);
    try {
      const res = await createTask({ date, subject, category, description: description.trim(), notes: '' });
      const newTask = res.data;

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const attRes = await uploadAttachment(newTask.id, fd);
          newTask.attachments = [...(newTask.attachments || []), attRes.data];
        } catch (uploadErr) {
          console.error('Upload allegato:', uploadErr);
        }
      }

      onTaskAdded(newTask);
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
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
            <h3 className={styles.title}>Nuovo compito</h3>
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
                {subjects.length === 0
                  ? <p className={styles.noItems}>Aggiungile nelle Impostazioni.</p>
                  : <select className={styles.input} value={subject}
                      onChange={e => setSubject(e.target.value)} required>
                      <option value="">Seleziona...</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                }
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Categoria</label>
                {categories.length === 0
                  ? <p className={styles.noItems}>Aggiungile nelle Impostazioni.</p>
                  : <select className={styles.input} value={category}
                      onChange={e => setCategory(e.target.value)} required>
                      <option value="">Seleziona...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                }
              </div>
            </div>

            {/* Descrizione + fullscreen */}
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Descrizione e note (Markdown)</label>
                <button
                  type="button"
                  className={styles.fsBtn}
                  onClick={() => setShowFs(true)}
                  title="Fullscreen"
                >
                  <i className="bi bi-fullscreen" />
                </button>
              </div>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder={`Cosa devi fare?\n\n**Grassetto**, *corsivo*, - lista`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                required
              />
            </div>

            <FileDropZone files={files} onFilesChange={setFiles} />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Annulla</button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva compito'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Pulsante + modale (Dashboard) ──────────────────────────────────────────
export default function AddTaskForm({ onTaskAdded }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.addBtn} onClick={() => setOpen(true)} title="Aggiungi compito">
        <i className="bi bi-plus-lg" />
      </button>
      {open && (
        <AddTaskModal
          onTaskAdded={(task) => { onTaskAdded(task); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}