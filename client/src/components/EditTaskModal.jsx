import { useState, useEffect } from 'react';
import { updateTask, getSettings } from '../services/api';
import styles from './EditTaskModal.module.css';

export default function EditTaskModal({ task, onClose, onUpdate }) {
  const [date,        setDate]        = useState(() => new Date(task.date).toLocaleDateString('en-CA'));
  const [subject,     setSubject]     = useState(task.subject);
  const [category,    setCategory]    = useState(task.category);
  const [description, setDescription] = useState(task.description);
  const [subjects,    setSubjects]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    getSettings()
      .then(res => {
        setSubjects(res.data.subjects   || []);
        setCategories(res.data.categories || []);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !subject || !category || !description.trim()) {
      return setError('Tutti i campi sono obbligatori.');
    }
    setLoading(true);
    try {
      const res = await updateTask(task.id, { date, subject, category, description: description.trim() });
      onUpdate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Modifica compito</h3>
          <button className={styles.closeBtn} onClick={onClose}>&#x2715;</button>
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
              <select
                className={styles.input}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              >
                <option value="">Seleziona...</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Categoria</label>
              <select
                className={styles.input}
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Seleziona...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrizione</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}