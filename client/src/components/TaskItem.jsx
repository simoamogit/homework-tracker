import { useState } from 'react';
import { toggleTask, deleteTask } from '../services/api';
import styles from './TaskItem.module.css';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await toggleTask(task.id, !task.completed);
      onUpdate(res.data);
    } catch (err) {
      console.error('Errore toggle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Eliminare questo compito?')) return;
    try {
      await deleteTask(task.id);
      onDelete(task.id);
    } catch (err) {
      console.error('Errore delete:', err);
    }
  };

  return (
    <div className={`${styles.item} ${task.completed ? styles.completed : ''}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={task.completed}
        onChange={handleToggle}
        disabled={loading}
      />
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.subject}>{task.subject}</span>
          <span className={styles.separator}>·</span>
          <span className={styles.category}>{task.category}</span>
        </div>
        <p className={styles.description}>{task.description}</p>
      </div>
      <button onClick={handleDelete} className={styles.deleteBtn} title="Elimina">
        &#x2715;
      </button>
    </div>
  );
}