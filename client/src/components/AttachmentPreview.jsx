import { useEffect } from 'react';
import { buildFileUrl, BACKEND_URL } from '../services/api';
import styles from './AttachmentPreview.module.css';

// Tipi Office che il browser non può mostrare nativamente
const OFFICE_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword',                                                        // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
  'application/vnd.ms-excel',                                                  // .xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',// .pptx
  'application/vnd.ms-powerpoint',                                             // .ppt
]);

export default function AttachmentPreview({ attachment, onClose }) {
  const { url, filename, mime_type } = attachment;
  const fileUrl = buildFileUrl(url);

  const isImage  = mime_type?.startsWith('image/');
  const isVideo  = mime_type?.startsWith('video/');
  const isPdf    = mime_type === 'application/pdf';
  const isAudio  = mime_type?.startsWith('audio/');
  const isText   = mime_type?.startsWith('text/');
  const isOffice = OFFICE_TYPES.has(mime_type);

  // Google Docs Viewer funziona solo con URL pubblici (non localhost)
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const canUseGdocs = isOffice && !isLocalhost && BACKEND_URL !== '';

  // Chiudi con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const fileIcon = isImage  ? 'bi-image'
                 : isVideo  ? 'bi-camera-video'
                 : isPdf    ? 'bi-file-pdf'
                 : isAudio  ? 'bi-music-note'
                 : isOffice ? 'bi-file-earmark-richtext'
                 : isText   ? 'bi-file-text'
                            : 'bi-file-earmark';

  // Background chiaro per PDF/Office, scuro per immagini/video
  const darkBg = isImage || isVideo;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <i className={`bi ${fileIcon}`} />
            <span className={styles.filename} title={filename}>{filename}</span>
          </div>
          <div className={styles.headerRight}>
            <a href={fileUrl} download={filename} className={styles.headerBtn} title="Scarica">
              <i className="bi bi-download" />
            </a>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className={styles.headerBtn} title="Apri in nuova scheda">
              <i className="bi bi-box-arrow-up-right" />
            </a>
            <button className={styles.headerBtn} onClick={onClose} title="Chiudi">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Contenuto */}
        <div className={`${styles.content} ${darkBg ? styles.contentDark : styles.contentLight}`}>

          {/* Immagine */}
          {isImage && (
            <img src={fileUrl} alt={filename} className={styles.image} />
          )}

          {/* Video */}
          {isVideo && (
            <video src={fileUrl} controls autoPlay className={styles.video} />
          )}

          {/* Audio */}
          {isAudio && (
            <div className={styles.audioWrap}>
              <i className="bi bi-music-note-beamed" style={{ fontSize: '3rem', color: 'var(--text-3)' }} />
              <p className={styles.audioName}>{filename}</p>
              <audio src={fileUrl} controls className={styles.audio} />
            </div>
          )}

          {/* PDF → iframe */}
          {isPdf && (
            <iframe
              src={fileUrl}
              title={filename}
              className={styles.pdf}
            >
              <div className={styles.fallback}>
                <i className="bi bi-file-pdf" style={{ fontSize: '2.5rem' }} />
                <p>Il browser non riesce a mostrare il PDF.</p>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>
                  <i className="bi bi-box-arrow-up-right" /> Apri il PDF
                </a>
              </div>
            </iframe>
          )}

          {/* File di testo */}
          {isText && (
            <iframe
              src={fileUrl}
              title={filename}
              className={styles.pdf}
            />
          )}

          {/* Office docs: Google Docs Viewer (solo in produzione) */}
          {canUseGdocs && (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              title={filename}
              className={styles.pdf}
            />
          )}

          {/* Office docs in locale OPPURE file non prevedibili */}
          {(isOffice && !canUseGdocs) || (!isImage && !isVideo && !isPdf && !isAudio && !isText && !isOffice) ? (
            <div className={styles.fallback}>
              <i className={`bi ${fileIcon}`} style={{ fontSize: '3rem' }} />
              <p className={styles.fallbackName}>{filename}</p>
              {isOffice && !isLocalhost && (
                <p className={styles.fallbackHint}>
                  Apri in una nuova scheda per visualizzarlo
                </p>
              )}
              {isOffice && isLocalhost && (
                <p className={styles.fallbackHint}>
                  In produzione sarà visualizzabile tramite Google Docs Viewer
                </p>
              )}
              <div className={styles.fallbackActions}>
                <a href={fileUrl} download={filename} className={styles.openBtn}>
                  <i className="bi bi-download" /> Scarica
                </a>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className={`${styles.openBtn} ${styles.openBtnSecondary}`}>
                  <i className="bi bi-box-arrow-up-right" /> Apri
                </a>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}