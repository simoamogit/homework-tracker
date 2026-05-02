import { useState, useEffect } from 'react';
import { createTask, getSettings } from '../services/api';
import styles from './AddTaskForm.module.css';

export default function AddTaskForm({ onTaskAdded }) {
  const today = new Date().toLocaleDateString('en-CA');

  const [date,        setDate]        = useState(today);
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);

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
      reset();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className={styles.openBtn} onClick={() => setOpen(true)}>
        + Aggiungi compito
      </button>
    );
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>Nuovo compito</h3>
        <button className={styles.closeBtn} onClick={() => { reset(); setOpen(false); }}>
          &#x2715;
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Data</label>
          <input
            type="date"
            className={styles.input}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Materia</label>
            {subjects.length === 0 ? (
              <p className={styles.noItems}>
                Nessuna materia. Aggiungile nelle <a href="/settings" className={styles.settingsLink}>Impostazioni</a>.
              </p>
            ) : (
              <select
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
              <p className={styles.noItems}>
                Nessuna categoria. Aggiungile nelle <a href="/settings" className={styles.settingsLink}>Impostazioni</a>.
              </p>
            ) : (
              <select
                className={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => { reset(); setOpen(false); }}
          >
            Annulla
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva compito'}
          </button>
        </div>
      </form>
    </div>
  );
}