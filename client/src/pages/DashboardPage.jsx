import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [view,              setView]              = useState('list');
  const [search,            setSearch]            = useState('');
  const [hideCompletedDays, setHideCompletedDays] = useState(false);
  const [filtriOpen,        setFiltriOpen]        = useState(false);
  const filtriRef = useRef(null);

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

  // Close filtri panel on outside click
  useEffect(() => {
    function handler(e) {
      if (filtriRef.current && !filtriRef.current.contains(e.target)) {
        setFiltriOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const presentTasks = useMemo(() =>
    tasks.filter(t => new Date(t.date).toLocaleDateString('en-CA') >= today),
    [tasks, today]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return presentTasks;
    const q = search.toLowerCase();
    return presentTasks.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }, [presentTasks, search]);

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
  return !grouped[key].every(t => t.completed);
});

  const filtersActive = search || hideCompletedDays || view !== 'list';

  const handleTaskAdded   = t   => setTasks(p => [...p, t]);
  const handleTaskUpdated = upd => setTasks(p => p.map(t => t.id === upd.id ? upd : t));
  const handleTaskDeleted = id  => setTasks(p => p.filter(t => t.id !== id));

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>

        <div className={styles.topBar}>
          {/* Filtri dropdown */}
          <div className={styles.filtriWrap} ref={filtriRef}>
            <button
              className={`${styles.filtriBtn} ${filtriOpen ? styles.filtriOpen : ''}`}
              onClick={() => setFiltriOpen(v => !v)}
            >
              <i className="bi bi-sliders"></i>
              Filtri
              {filtersActive && <span className={styles.filtriDot} />}
            </button>

            {filtriOpen && (
              <div className={styles.filtriPanel}>
                {/* View */}
                <div className={styles.filtriSection}>
                  <p className={styles.filtriLabel}>Vista</p>
                  <div className={styles.tabs}>
                    {[['list','Lista'],['week','Settimana'],['month','Mese']].map(([v,label]) => (
                      <button
                        key={v}
                        className={`${styles.tab} ${view === v ? styles.tabActive : ''}`}
                        onClick={() => setView(v)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className={styles.filtriSection}>
                  <p className={styles.filtriLabel}>Cerca</p>
                  <div className={styles.searchWrap}>
                    <i className={`bi bi-search ${styles.searchIcon}`}></i>
                    <input
                      type="text"
                      className={styles.search}
                      placeholder="Materia, categoria, descrizione..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                    />
                    {search && (
                      <button className={styles.searchClear} onClick={() => setSearch('')}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className={styles.topBarRight}>
            <button
              className={`${styles.eyeBtn} ${hideCompletedDays ? styles.eyeActive : ''}`}
              onClick={() => setHideCompletedDays(v => !v)}
              title={hideCompletedDays ? 'Mostra tutti i giorni' : 'Nascondi giorni completati'}
            >
              <i className={`bi ${hideCompletedDays ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
            <AddTaskForm onTaskAdded={handleTaskAdded} />
          </div>
        </div>

        {loading && <SkeletonLoader />}
        {error   && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && (view === 'week' || view === 'month') && (
          <CalendarView tasks={tasks} mode={view} />
        )}

        {!loading && !error && view === 'list' && sortedDates.length === 0 && (
          <div className={styles.empty}>
            <i className={`bi bi-inbox ${styles.emptyIcon}`}></i>
            <p className={styles.emptyTitle}>
              {search ? 'Nessun risultato' : hideCompletedDays ? 'Tutto completato' : 'Nessun compito'}
            </p>
            <p className={styles.emptySubtitle}>
              {search
                ? 'Prova con un termine diverso.'
                : hideCompletedDays
                  ? 'Tutti i prossimi giorni sono completati.'
                  : 'Aggiungi un compito con il pulsante +'}
            </p>
          </div>
        )}

        {!loading && !error && view === 'list' && sortedDates.map(dateKey => {
          const dayTasks  = grouped[dateKey];
          const doneCount = dayTasks.filter(t => t.completed).length;
          const total     = dayTasks.length;
          const percent   = Math.round((doneCount / total) * 100);
          const allDone   = doneCount === total;

          return (
            <section key={dateKey} className={styles.group}>
              <div className={styles.groupHeader}>
                <h3 className={`${styles.dateLabel} ${allDone ? styles.dateLabelDone : ''}`}>
                  {formatDate(dateKey)}
                </h3>
                <span className={styles.progress}>{doneCount}/{total}</span>
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