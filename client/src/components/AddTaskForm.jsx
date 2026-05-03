import { useState, useEffect } from 'react';
import { createTask, getSettings } from '../services/api';
import styles from './AddTaskForm.module.css';

export default function AddTaskForm({ onTaskAdded }) {
  const today = new Date().toLocaleDateString('en-CA');

  const [open,        setOpen]        = useState(false);
  const [date,        setDate]        = useState(today);
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!open) return;
    getSettings()
      .then(res => {
        setSubjects(res.data.subjects   || []);
        setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, [open]);

  const reset = () => {
    setDate(today);
    setSubject('');
    setCategory('');
    setDescription('');
    setError('');
  };

  const handleClose = () => { reset(); setOpen(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !subject || !category || !description.trim()) {
      return setError('Tutti i campi sono obbligatori.');
    }
    setLoading(true);
    try {
      const res = await createTask({ date, subject, category, description: description.trim() });
      onTaskAdded(res.data);
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
        <i className="bi bi-plus-lg"></i>
      </button>

      {open && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>Nuovo compito</h3>
              <button className={styles.closeBtn} onClick={handleClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Data</label>
                <input
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Materia</label>
                  {subjects.length === 0 ? (
                    <p className={styles.noItems}>Nessuna materia nelle Impostazioni.</p>
                  ) : (
                    <select
                      className={styles.input}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    >
                      <option value="">Seleziona...</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Categoria</label>
                  {categories.length === 0 ? (
                    <p className={styles.noItems}>Nessuna categoria nelle Impostazioni.</p>
                  ) : (
                    <select
                      className={styles.input}
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Seleziona...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descrizione</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Es. Rispondi a Test pag 415 416"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={handleClose}>
                  Annulla
                </button>
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