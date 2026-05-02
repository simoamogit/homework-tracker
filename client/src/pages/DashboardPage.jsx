import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../services/api';
import Navbar       from '../components/Navbar';
import TaskItem     from '../components/TaskItem';
import AddTaskForm  from '../components/AddTaskForm';
import styles       from './Dashboard.module.css';

// Formatta "2025-05-04" → "Lunedì 4 Maggio 2025"
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

export default function DashboardPage() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getTasks();
        setTasks(res.data);
      } catch (err) {
        setError('Impossibile caricare i compiti.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Raggruppa i compiti per data → { "2025-05-04": [...], "2025-05-05": [...] }
  const grouped = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const dateKey = new Date(task.date).toLocaleDateString('en-CA');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const sortedDates = Object.keys(grouped).sort();

  const handleTaskAdded = (newTask) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskDeleted = (deletedId) => {
    setTasks(prev => prev.filter(t => t.id !== deletedId));
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <h2 className={styles.heading}>Compiti</h2>
          <AddTaskForm onTaskAdded={handleTaskAdded} />
        </div>

        {loading && <p className={styles.message}>Caricamento...</p>}
        {error   && <p className={styles.errorMsg}>{error}</p>}

        {!loading && !error && sortedDates.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Nessun compito</p>
            <p className={styles.emptySubtitle}>Aggiungi il tuo primo compito con il pulsante qui sopra.</p>
          </div>
        )}

        {sortedDates.map(dateKey => {
          const dayTasks   = grouped[dateKey];
          const doneCount  = dayTasks.filter(t => t.completed).length;
          const totalCount = dayTasks.length;

          return (
            <section key={dateKey} className={styles.group}>
              <div className={styles.groupHeader}>
                <h3 className={styles.dateLabel}>{formatDate(dateKey)}</h3>
                <span className={styles.progress}>
                  {doneCount}/{totalCount}
                </span>
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