import { useState, useMemo } from 'react';
import { toggleTask } from '../services/api';
import { AddTaskModal } from './AddTaskForm';
import EditTaskModal from './EditTaskModal';
import styles from './CalendarView.module.css';

const DAYS_IT   = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                   'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Day detail panel ──────────────────────────────────────────────────────
function DayDetail({ dateKey, tasks, onAddDay, onToggle, onEdit }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <p className={styles.detailTitle}>{formatDateLong(dateKey)}</p>
        <button className={styles.addDayBtn} onClick={onAddDay} title="Aggiungi compito">
          <i className="bi bi-plus" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className={styles.detailEmpty}>Nessun compito. Clicca + per aggiungerne uno.</p>
      ) : (
        <div className={styles.detailTasks}>
          {tasks.map(t => (
            <div key={t.id} className={`${styles.miniTask} ${t.completed ? styles.miniDone : ''}`}>
              <input
                type="checkbox"
                className={`form-check-input ${styles.miniCheck}`}
                checked={t.completed}
                onChange={() => onToggle(t)}
                onClick={e => e.stopPropagation()}
              />
              <div className={styles.miniContent}>
                <span className={styles.miniMeta}>{t.subject} · {t.category}</span>
                <span className={styles.miniDesc}>{t.description}</span>
              </div>
              <button className={styles.miniEditBtn} onClick={() => onEdit(t)} title="Modifica">
                <i className="bi bi-pencil" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Week grid ─────────────────────────────────────────────────────────────
function WeekGrid({ cursor, setCursor, byDate, today, selectedDay, toggleDay, onAddDay }) {
  const monday = getMonday(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const label = `${days[0].getDate()} ${MONTHS_IT[days[0].getMonth()]} — ${days[6].getDate()} ${MONTHS_IT[days[6].getMonth()]} ${days[6].getFullYear()}`;
  const shift = (n) => { const d = new Date(cursor); d.setDate(d.getDate() + n * 7); setCursor(d); };

  return (
    <>
      <div className={styles.navRow}>
        <button className={styles.navBtn} onClick={() => shift(-1)}>←</button>
        <span className={styles.navLabel}>{label}</span>
        <button className={styles.navBtn} onClick={() => shift(1)}>→</button>
      </div>
      <div className={styles.weekGrid}>
        {days.map(d => {
          const key  = d.toLocaleDateString('en-CA');
          const list = byDate[key] || [];
          const done = list.filter(t => t.completed).length;
          const isT  = key === today;
          const isSel = key === selectedDay;
          return (
            <div key={key}
              className={`${styles.weekCell} ${isT ? styles.isToday : ''} ${isSel ? styles.isSelected : ''} ${styles.clickable}`}
              onClick={() => toggleDay(key)}>
              <span className={styles.weekDayName}>{DAYS_IT[d.getDay() === 0 ? 6 : d.getDay() - 1]}</span>
              <span className={styles.weekDayNum}>{d.getDate()}</span>
              {list.length > 0
                ? <span className={styles.weekCount}>{done}/{list.length}</span>
                : (
                  <button className={styles.addCellBtn}
                    onClick={e => { e.stopPropagation(); onAddDay(key); }}
                    title="Aggiungi">
                    <i className="bi bi-plus" />
                  </button>
                )
              }
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Month grid ────────────────────────────────────────────────────────────
function MonthGrid({ cursor, setCursor, byDate, today, selectedDay, toggleDay, onAddDay }) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDay    = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  let startPad = firstDay.getDay() - 1;
  if (startPad < 0) startPad = 6;
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shift = (n) => { const d = new Date(cursor); d.setMonth(d.getMonth() + n); setCursor(d); };

  return (
    <>
      <div className={styles.navRow}>
        <button className={styles.navBtn} onClick={() => shift(-1)}>←</button>
        <span className={styles.navLabel}>{MONTHS_IT[m]} {y}</span>
        <button className={styles.navBtn} onClick={() => shift(1)}>→</button>
      </div>
      <div className={styles.monthDayNames}>
        {DAYS_IT.map(d => <span key={d} className={styles.monthDayName}>{d}</span>)}
      </div>
      <div className={styles.monthGrid}>
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className={styles.monthCell} />;
          const key  = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const list = byDate[key] || [];
          const done = list.filter(t => t.completed).length;
          const allDone = list.length > 0 && done === list.length;
          const isT   = key === today;
          const isSel = key === selectedDay;
          return (
            <div key={key}
              className={`${styles.monthCell} ${styles.monthCellFilled} ${isT ? styles.isToday : ''} ${isSel ? styles.isSelected : ''}`}
              onClick={() => toggleDay(key)}>
              <span className={styles.monthNum}>{day}</span>
              {list.length > 0
                ? <span className={`${styles.dot} ${allDone ? styles.dotDone : styles.dotPending}`} />
                : (
                  <button className={styles.addCellBtnMonth}
                    onClick={e => { e.stopPropagation(); onAddDay(key); }}
                    title="Aggiungi">
                    <i className="bi bi-plus" style={{ fontSize: '0.65rem' }} />
                  </button>
                )
              }
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Componente principale ─────────────────────────────────────────────────
export default function CalendarView({ tasks, mode, onTaskAdded, onTaskUpdated }) {
  const [cursor,       setCursor]       = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [addingForDate, setAddingForDate] = useState(null);
  const [editingTask,   setEditingTask]   = useState(null);
  const today = new Date().toLocaleDateString('en-CA');

  const byDate = useMemo(() => tasks.reduce((acc, t) => {
    const k = new Date(t.date).toLocaleDateString('en-CA');
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {}), [tasks]);

  const handleToggle = async (task) => {
    try {
      const res = await toggleTask(task.id, !task.completed);
      onTaskUpdated?.(res.data);
    } catch (err) {
      console.error('Errore toggle:', err);
    }
  };

  const toggleDay = (key) => setSelectedDay(s => s === key ? null : key);

  const GridComponent = mode === 'week' ? WeekGrid : MonthGrid;

  return (
    <>
      <div className={styles.container}>
        <GridComponent
          cursor={cursor}
          setCursor={setCursor}
          byDate={byDate}
          today={today}
          selectedDay={selectedDay}
          toggleDay={toggleDay}
          onAddDay={setAddingForDate}
        />

        {selectedDay && (
          <DayDetail
            dateKey={selectedDay}
            tasks={byDate[selectedDay] || []}
            onAddDay={() => setAddingForDate(selectedDay)}
            onToggle={handleToggle}
            onEdit={setEditingTask}
          />
        )}
      </div>

      {addingForDate && (
        <AddTaskModal
          prefilledDate={addingForDate}
          onTaskAdded={(task) => { onTaskAdded?.(task); setAddingForDate(null); }}
          onClose={() => setAddingForDate(null)}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdate={(task) => { onTaskUpdated?.(task); setEditingTask(null); }}
        />
      )}
    </>
  );
}