import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTasks, deleteTask } from '../services/api';
import Navbar        from '../components/Navbar';
import TaskItem      from '../components/TaskItem';
import AddTaskForm   from '../components/AddTaskForm';
import CalendarView  from '../components/CalendarView';
import SkeletonLoader from '../components/SkeletonLoader';
import UndoSnackbar  from '../components/UndoSnackbar';
import styles        from './Dashboard.module.css';
import API           from '../services/api';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: allTasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => getTasks().then(r => r.data),
  });

  const [localTasks,        setLocalTasks]        = useState([]);
  const [view,              setView]              = useState('list');
  const [search,            setSearch]            = useState('');
  const [hideCompletedDays, setHideCompletedDays] = useState(false);
  const [filtriOpen,        setFiltriOpen]        = useState(false);
  const [undoQueue,         setUndoQueue]         = useState([]);
  const filtriRef = useRef(null);

  useEffect(() => { setLocalTasks(allTasks); }, [allTasks]);

  // Keep-alive Render
  useEffect(() => {
    const id = setInterval(() => API.get('/health').catch(() => {}), 14 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Close filtri on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filtriRef.current && !filtriRef.current.contains(e.target)) setFiltriOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date().toLocaleDateString('en-CA');

  const presentTasks = useMemo(() =>
    localTasks.filter(t => new Date(t.date).toLocaleDateString('en-CA') >= today),
    [localTasks, today]
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
    if (key === today) return true;
    return !grouped[key].every(t => t.completed);
  });

  const handleTaskAdded   = t   => { setLocalTasks(p => [...p, t]); queryClient.invalidateQueries(['tasks']); };
  const handleTaskUpdated = upd => setLocalTasks(p => p.map(t => t.id === upd.id ? upd : t));

  // Undo delete
  const handleDeleteRequest = useCallback((taskId) => {
    const task = localTasks.find(t => t.id === taskId);
    if (!task) return;

    setLocalTasks(p => p.filter(t => t.id !== taskId));

    const timer = setTimeout(async () => {
      try {
        await deleteTask(taskId);
        queryClient.invalidateQueries(['tasks']);
      } catch {
        setLocalTasks(p => [...p, task]);
      }
      setUndoQueue(p => p.filter(u => u.id !== taskId));
    }, 5000);

    setUndoQueue(p => [...p, { id: taskId, task, timer }]);
  }, [localTasks, queryClient]);

  const handleUndo = useCallback((taskId) => {
    const entry = undoQueue.find(u => u.id === taskId);
    if (!entry) return;
    clearTimeout(entry.timer);
    setLocalTasks(p => [...p, entry.task]);
    setUndoQueue(p => p.filter(u => u.id !== taskId));
  }, [undoQueue]);

  const handleUndoExpire = useCallback((taskId) => {
    setUndoQueue(p => p.filter(u => u.id !== taskId));
  }, []);

  const viewLabels = { list: 'Lista', week: 'Settimana', month: 'Mese' };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>

        {/* Top bar */}
        <div className={styles.topBar}>
          {/* Filtri */}
          <div className={styles.filtriWrap} ref={filtriRef}>
            <button
              className={`${styles.filtriBtn} ${filtriOpen ? styles.filtriOpen : ''}`}
              onClick={() => setFiltriOpen(v => !v)}
            >
              <i className="bi bi-sliders" />
              Filtri
              {(search || hideCompletedDays || view !== 'list') && <span className={styles.filtriDot} />}
            </button>

            {filtriOpen && (
              <div className={styles.filtriPanel}>
                <div className={styles.filtriSection}>
                  <p className={styles.filtriLabel}>Vista</p>
                  <div className={styles.tabs}>
                    {Object.entries(viewLabels).map(([v, label]) => (
                      <button key={v}
                        className={`${styles.tab} ${view === v ? styles.tabActive : ''}`}
                        onClick={() => setView(v)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.filtriSection}>
                  <p className={styles.filtriLabel}>Cerca</p>
                  <div className={styles.searchWrap}>
                    <i className={`bi bi-search ${styles.searchIcon}`} />
                    <input type="text" className={styles.search}
                      placeholder="Materia, descrizione..."
                      value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                    {search && (
                      <button className={styles.searchClear} onClick={() => setSearch('')}>
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.topBarRight}>
            <button
              className={`${styles.eyeBtn} ${hideCompletedDays ? styles.eyeActive : ''}`}
              onClick={() => setHideCompletedDays(v => !v)}
              title={hideCompletedDays ? 'Mostra tutti' : 'Nascondi completati'}
            >
              <i className={`bi ${hideCompletedDays ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
            <AddTaskForm onTaskAdded={handleTaskAdded} />
          </div>
        </div>

        {isLoading && <SkeletonLoader />}
        {error     && <p className={styles.errorMsg}>Impossibile caricare i compiti.</p>}

        {/* Calendar views */}
        {!isLoading && !error && (view === 'week' || view === 'month') && (
          <CalendarView
            tasks={localTasks}
            mode={view}
            onTaskAdded={handleTaskAdded}
            onTaskUpdated={handleTaskUpdated}
          />
        )}

        {/* List view — empty state */}
        {!isLoading && !error && view === 'list' && sortedDates.length === 0 && (
          <div className={styles.empty}>
            <i className={`bi bi-inbox ${styles.emptyIcon}`} />
            <p className={styles.emptyTitle}>
              {search ? 'Nessun risultato' : hideCompletedDays ? 'Tutto completato' : 'Nessun compito'}
            </p>
            <p className={styles.emptySubtitle}>
              {search ? 'Prova con un termine diverso.'
                : hideCompletedDays ? 'Tutti i giorni futuri sono completati.'
                : 'Aggiungi un compito con il pulsante +'}
            </p>
          </div>
        )}

        {/* List view — task groups */}
        {!isLoading && !error && view === 'list' && sortedDates.map(dateKey => {
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
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {undoQueue.length > 0 && (
        <UndoSnackbar
          key={undoQueue[undoQueue.length - 1].id}
          message="Compito eliminato"
          onUndo={() => handleUndo(undoQueue[undoQueue.length - 1].id)}
          onExpire={() => handleUndoExpire(undoQueue[undoQueue.length - 1].id)}
        />
      )}
    </div>
  );
}