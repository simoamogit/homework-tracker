import { useState } from 'react';
import { toggleTask } from '../services/api';
import EditTaskModal      from './EditTaskModal';
import AttachmentPreview  from './AttachmentPreview';
import styles from './TaskItem.module.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({ breaks: true, gfm: true });

// Thumbnail via Openinary (/t/transforms/path)
function buildThumbUrl(url, transforms = 'w_120,h_90,c_fill,q_auto') {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/public\//, '');
    return `${u.origin}/t/${transforms}/${path}`;
  } catch {
    return url;
  }
}

function AttachmentItem({ att, onPreview }) {
  const isImage = att.mime_type?.startsWith('image/');
  const isVideo = att.mime_type?.startsWith('video/');
  const isPdf   = att.mime_type === 'application/pdf';

  const icon = isVideo ? 'bi-camera-video'
             : isPdf   ? 'bi-file-pdf'
                       : 'bi-paperclip';

  return (
    <button
      className={`${styles.attachmentBtn} ${isImage ? styles.attachmentImgBtn : ''}`}
      onClick={() => onPreview(att)}
      title={`Anteprima: ${att.filename}`}
    >
      {isImage ? (
        <img
          src={buildThumbUrl(att.url)}
          alt={att.filename}
          className={styles.attachmentThumb}
        />
      ) : (
        <>
          <i className={`bi ${icon}`} />
          <span>{att.filename}</span>
        </>
      )}
    </button>
  );
}

function MarkdownContent({ description, notes }) {
  const content = [description, notes?.trim() ? notes : null].filter(Boolean).join('\n\n');
  if (!content?.trim()) return null;
  const html = DOMPurify.sanitize(marked.parse(content));
  return <div className={styles.mdContent} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TaskItem({ task, onUpdate, onDeleteRequest }) {
  const [loading,    setLoading]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [previewAtt, setPreviewAtt] = useState(null);

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

  const hasAttachments = task.attachments?.length > 0;

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

          <MarkdownContent description={task.description} notes={task.notes} />

          {hasAttachments && (
            <div className={styles.attachmentList} onClick={e => e.stopPropagation()}>
              {task.attachments.map(a => (
                <AttachmentItem key={a.id} att={a} onPreview={setPreviewAtt} />
              ))}
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

      {previewAtt && (
        <AttachmentPreview
          attachment={previewAtt}
          onClose={() => setPreviewAtt(null)}
        />
      )}
    </>
  );
}