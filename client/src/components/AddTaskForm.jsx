import { useState, useEffect, useRef } from 'react';
import { createTask, getSettings, uploadAttachment } from '../services/api';
import styles from './AddTaskForm.module.css';

export default function AddTaskForm({ onTaskAdded, prefilledDate }) {
  const today = new Date().toLocaleDateString('en-CA');
  const [open,        setOpen]        = useState(false);
  const [date,        setDate]        = useState(prefilledDate || today);
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [notes,       setNotes]       = useState('');
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [files,       setFiles]       = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    if (prefilledDate) setDate(prefilledDate);
  }, [prefilledDate]);

  useEffect(() => {
    if (!open) return;
    getSettings().then(res => {
      setSubjects(res.data.subjects   || []);
      setCategories(res.data.categories || []);
    }).catch(() => {});
  }, [open]);

  const reset = () => {
    setDate(prefilledDate || today);
    setSubject(''); setCategory(''); setDescription('');
    setNotes(''); setFiles([]); setError('');
  };

  const handleClose = () => { reset(); setOpen(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !subject || !category || !description.trim()) {
      return setError('Data, materia, categoria e descrizione sono obbligatorie.');
    }
    setLoading(true);
    try {
      const res = await createTask({ date, subject, category, description: description.trim(), notes });
      const newTask = res.data;

      // Upload allegati
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const attRes = await uploadAttachment(newTask.id, fd);
          newTask.attachments = [...(newTask.attachments || []), attRes.data];
        } catch (uploadErr) {
          console.error('Errore upload allegato:', uploadErr);
        }
      }

      onTaskAdded(newTask);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.addBtn} onClick={() => setOpen(true)} title="Aggiungi compito">
        <i className="bi bi-plus-lg" />
      </button>

      {open && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>Nuovo compito</h3>
              <button className={styles.closeBtn} onClick={handleClose}>
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

              <div className={styles.field}>
                <label className={styles.label}>Descrizione</label>
                <textarea className={`${styles.input} ${styles.textarea}`}
                  placeholder="Es. Rispondi a Test pag 415"
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={2} required />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Note (Markdown supportato)</label>
                <textarea className={`${styles.input} ${styles.textarea} ${styles.notesArea}`}
                  placeholder={`# Titolo\n- punto 1\n- punto 2\n\n**grassetto**, *corsivo*`}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={4} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Allegati</label>
                <div className={styles.fileArea} onClick={() => fileRef.current?.click()}>
                  <i className="bi bi-paperclip" />
                  <span>{files.length ? `${files.length} file selezionat${files.length > 1 ? 'i' : 'o'}` : 'Clicca per allegare file'}</span>
                  <input ref={fileRef} type="file" multiple hidden
                    onChange={e => setFiles(Array.from(e.target.files))} />
                </div>
                {files.length > 0 && (
                  <ul className={styles.fileList}>
                    {files.map((f, i) => (
                      <li key={i} className={styles.fileItem}>
                        <i className="bi bi-file-earmark" />
                        <span>{f.name}</span>
                        <button type="button" className={styles.fileRemove}
                          onClick={() => setFiles(p => p.filter((_, j) => j !== i))}>
                          <i className="bi bi-x" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={handleClose}>Annulla</button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Salvataggio...' : 'Salva compito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}