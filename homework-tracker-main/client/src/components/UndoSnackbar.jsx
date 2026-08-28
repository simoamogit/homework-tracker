import { useEffect, useState } from 'react';
import styles from './UndoSnackbar.module.css';

export default function UndoSnackbar({ message, onUndo, onExpire, duration = 5000 }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start  = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) { clearInterval(interval); onExpire(); }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onExpire]);

  return (
    <div className={styles.snackbar}>
      <span className={styles.message}>{message}</span>
      <button className={styles.undoBtn} onClick={onUndo}>
        Annulla
      </button>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}