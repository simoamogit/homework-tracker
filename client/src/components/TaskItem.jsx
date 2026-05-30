import { useState } from 'react';
import { toggleTask } from '../services/api';
import EditTaskModal from './EditTaskModal';
import styles from './TaskItem.module.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

function NotesPreview({ notes }) {
  if (!notes?.trim()) return null;
  const html = DOMPurify.sanitize(marked.parse(notes));
  return (
    <div
      className={styles.notes}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function TaskItem({ task, onUpdate, onDeleteRequest }) {
  const [loading,  setLoading]  = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const hasNotes = task.notes?.trim().length > 0;
  const hasAttachments = task.attachments?.length > 0;
  const hasExtra = hasNotes || hasAttachments;

  return (
    <>
      <div
        className={`${styles.item} ${task.completed ? styles.completed : ''} ${loading ? styles.busy : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleToggle()}
      >
        <div className="form-check" onClick={e => e.stopPropagation()} style={{ marginTop: '2px', flexShrink: 0 }}>
          <input
            className={`form-check-input ${styles.check}`}
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            disabled={loading}
            onClick={e => e.stopPropagation()}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.subject}>{task.subject}</span>
            <span className={styles.separator}>·</span>
            <span className={styles.category}>{task.category}</span>
          </div>
          <p className={styles.description}>{task.description}</p>

          {/* Note espandibili */}
          {hasExtra && (
            <button
              className={styles.expandBtn}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            >
              <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
              {hasNotes && <span>Note</span>}
              {hasAttachments && <span>{task.attachments.length} allegat{task.attachments.length > 1 ? 'i' : 'o'}</span>}
            </button>
          )}

          {expanded && (
            <div className={styles.expandedArea} onClick={e => e.stopPropagation()}>
              {hasNotes && <NotesPreview notes={task.notes} />}
              {hasAttachments && (
                <div className={styles.attachmentList}>
                  {task.attachments.map(a => (
                    
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentLink}
                    >
                      <i className="bi bi-paperclip" />
                      {a.filename}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          <button className={styles.actionBtn} onClick={() => setShowEdit(true)} title="Modifica">
            <i className="bi bi-pencil" />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => onDeleteRequest(task.id)}
            title="Elimina"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      </div>

      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onUpdate={upd => { onUpdate(upd); setShowEdit(false); }}
        />
      )}
    </>
  );
}