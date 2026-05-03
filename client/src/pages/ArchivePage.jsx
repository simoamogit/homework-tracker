import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../services/api';
import Navbar        from '../components/Navbar';
import TaskItem      from '../components/TaskItem';
import SkeletonLoader from '../components/SkeletonLoader';
import styles        from './ArchivePage.module.css';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ArchivePage() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    getTasks()
      .then(res => setTasks(res.data))
      .catch(() => setError('Impossibile caricare i compiti.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const k = new Date(t.date).toLocaleDateString('en-CA');
      if (k >= today) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) ||
             t.category.toLowerCase().includes(q) ||
             t.description.toLowerCase().includes(q);
    });
  }, [tasks, today, search]);

  const grouped = useMemo(() =>
    filtered.reduce((acc, t) => {
      const k = new Date(t.date).toLocaleDateString('en-CA');
      if (!acc[k]) acc[k] = [];
      acc[k].push(t);
      return acc;
    }, {}),
    [filtered]
  );

  // Most recent first
  const sortedDates = Object.keys(grouped).sort().reverse();

  const handleUpdate = upd => setTasks(p => p.map(t => t.id === upd.id ? upd : t));
  const handleDelete = id  => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2 className={styles.heading}>Archivio</h2>
          <input
            type="text"
            className={styles.search}
            placeholder="Cerca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <SkeletonLoader />}
        {error   && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && sortedDates.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {search ? 'Nessun risultato.' : 'Archivio vuoto'}
            </p>
            <p className={styles.emptySubtitle}>
              {!search && 'I compiti dei giorni passati appariranno qui.'}
            </p>
          </div>
        )}

        {!loading && !error && sortedDates.map(dateKey => {
          const dayTasks  = grouped[dateKey];
          const done      = dayTasks.filter(t => t.completed).length;
          const total     = dayTasks.length;
          const percent   = Math.round((done / total) * 100);
          const allDone   = done === total;
          return (
            <section key={dateKey} className={styles.group}>
              <div className={styles.groupHeader}>
                <h3 className={`${styles.dateLabel} ${allDone ? styles.dateLabelDone : ''}`}>
                  {formatDate(dateKey)}
                </h3>
                <span className={styles.progress}>{done}/{total}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${percent}%` }} />
              </div>
              <div className={styles.taskList}>
                {dayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}