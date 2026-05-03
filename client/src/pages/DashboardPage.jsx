import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../services/api';
import api           from '../services/api';
import Navbar        from '../components/Navbar';
import TaskItem      from '../components/TaskItem';
import AddTaskForm   from '../components/AddTaskForm';
import CalendarView  from '../components/CalendarView';
import SkeletonLoader from '../components/SkeletonLoader';
import styles        from './Dashboard.module.css';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function DashboardPage() {
  const [tasks,             setTasks]             = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState('');
  const [view,              setView]              = useState('list'); // list | week | month
  const [search,            setSearch]            = useState('');
  const [hideCompletedDays, setHideCompletedDays] = useState(false);

  const today = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    getTasks()
      .then(res => setTasks(res.data))
      .catch(() => setError('Impossibile caricare i compiti.'))
      .finally(() => setLoading(false));
  }, []);

  // Keep-alive Render
  useEffect(() => {
    const id = setInterval(() => api.get('/health').catch(() => {}), 14 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Today + future only (past → Archive)
  const presentTasks = useMemo(() =>
    tasks.filter(t => new Date(t.date).toLocaleDateString('en-CA') >= today),
    [tasks, today]
  );

  // Apply search
  const filtered = useMemo(() => {
    if (!search.trim()) return presentTasks;
    const q = search.toLowerCase();
    return presentTasks.filter(t =>
      t.subject.toLowerCase().includes(q)     ||
      t.category.toLowerCase().includes(q)    ||
      t.description.toLowerCase().includes(q)
    );
  }, [presentTasks, search]);

  // Group by date
  const grouped = useMemo(() =>
    filtered.reduce((acc, t) => {
      const k = new Date(t.date).toLocaleDateString('en-CA');
      if (!acc[k]) acc[k] = [];
      acc[k].push(t);
      return acc;
    }, {}),
    [filtered]
  );

  const sortedDates = Object.keys(grouped).sort().filter(key => {
    if (!hideCompletedDays) return true;
    if (key === today) return true; // today always visible
    return !grouped[key].every(t => t.completed);
  });

  const handleTaskAdded   = t   => setTasks(p => [...p, t]);
  const handleTaskUpdated = upd => setTasks(p => p.map(t => t.id === upd.id ? upd : t));
  const handleTaskDeleted = id  => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <h2 className={styles.heading}>Compiti</h2>
          <AddTaskForm onTaskAdded={handleTaskAdded} />
        </div>

        {/* View tabs + search */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {['list','week','month'].map(v => (
              <button
                key={v}
                className={`${styles.tab} ${view === v ? styles.tabActive : ''}`}
                onClick={() => setView(v)}
              >
                {{ list: 'Lista', week: 'Settimana', month: 'Mese' }[v]}
              </button>
            ))}
          </div>
          <div className={styles.toolbarRight}>
            {view === 'list' && (
              <button
                className={`${styles.toggleBtn} ${hideCompletedDays ? styles.toggleActive : ''}`}
                onClick={() => setHideCompletedDays(v => !v)}
              >
                {hideCompletedDays ? 'Mostra tutti' : 'Nascondi completati'}
              </button>
            )}
            <input
              type="text"
              className={styles.search}
              placeholder="Cerca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading && <SkeletonLoader />}
        {error   && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && (view === 'week' || view === 'month') && (
          <CalendarView tasks={tasks} mode={view} />
        )}

        {!loading && !error && view === 'list' && sortedDates.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nessun compito</p>
            <p className={styles.emptySubtitle}>
              {search
                ? 'Nessun risultato per la ricerca.'
                : hideCompletedDays
                  ? 'Tutti i prossimi giorni sono completati.'
                  : 'Aggiungi il tuo primo compito con il pulsante qui sopra.'}
            </p>
          </div>
        )}

        {!loading && !error && view === 'list' && sortedDates.map(dateKey => {
          const dayTasks   = grouped[dateKey];
          const doneCount  = dayTasks.filter(t => t.completed).length;
          const totalCount = dayTasks.length;
          const percent    = Math.round((doneCount / totalCount) * 100);
          const allDone    = doneCount === totalCount;

          return (
            <section key={dateKey} className={styles.group}>
              <div className={styles.groupHeader}>
                <h3 className={`${styles.dateLabel} ${allDone ? styles.dateLabelDone : ''}`}>
                  {formatDate(dateKey)}
                </h3>
                <span className={styles.progress}>{doneCount}/{totalCount}</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${percent}%` }} />
              </div>
              <div className={styles.taskList}>
                {dayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdated}
                    onDelete={handleTaskDeleted}
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