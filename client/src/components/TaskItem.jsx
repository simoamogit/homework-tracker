import { useState } from 'react';
import { toggleTask, deleteTask } from '../services/api';
import EditTaskModal from './EditTaskModal';
import ConfirmModal  from './ConfirmModal';
import styles from './TaskItem.module.css';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [loading,     setLoading]     = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const today    = new Date().toLocaleDateString('en-CA');
  const taskDate = new Date(task.date).toLocaleDateString('en-CA');
  const isToday   = taskDate === today  && !task.completed;
  const isOverdue = taskDate <  today   && !task.completed;

  const handleToggle = async () => {
    if (loading) return;
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
    try {
      await deleteTask(task.id);
      onDelete(task.id);
    } catch (err) {
      console.error('Errore delete:', err);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <>
      {/* The whole row is clickable to toggle, except the actions area */}
      <div
        className={`${styles.item} ${task.completed ? styles.completed : ''} ${loading ? styles.busy : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleToggle()}
      >
        {/* Bootstrap checkbox — click stopped so parent doesn't double-fire */}
        <div
          className="form-check"
          style={{ marginTop: '2px', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <input
            className={`form-check-input ${styles.check}`}
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={loading}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.subject}>{task.subject}</span>
            <span className={styles.separator}>·</span>
            <span className={styles.category}>{task.category}</span>
            {isToday   && <span className={styles.badgeToday}>Oggi</span>}
            {isOverdue && <span className={styles.badgeOverdue}>Scaduto</span>}
          </div>
          <p className={styles.description}>{task.description}</p>
        </div>

        {/* Actions — stop propagation so clicks here don't toggle */}
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          <button
            className={styles.actionBtn}
            onClick={() => setShowEdit(true)}
            title="Modifica"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => setShowConfirm(true)}
            title="Elimina"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onUpdate={onUpdate}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          message="Eliminare questo compito?"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}