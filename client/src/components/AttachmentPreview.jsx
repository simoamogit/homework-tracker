import { useEffect } from 'react';
import styles from './AttachmentPreview.module.css';

export default function AttachmentPreview({ attachment, onClose }) {
  const { url, filename, mime_type } = attachment;

  const isImage = mime_type?.startsWith('image/');
  const isVideo = mime_type?.startsWith('video/');
  const isPdf   = mime_type === 'application/pdf';
  const isAudio = mime_type?.startsWith('audio/');

  // Chiudi con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <i className={`bi ${
              isImage ? 'bi-image' :
              isVideo ? 'bi-camera-video' :
              isPdf   ? 'bi-file-pdf' :
              isAudio ? 'bi-music-note' :
                        'bi-file-earmark'
            }`} />
            <span className={styles.filename} title={filename}>{filename}</span>
          </div>
          <div className={styles.headerRight}>
            <a href={url} download={filename} className={styles.headerBtn} title="Scarica">
              <i className="bi bi-download" />
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className={styles.headerBtn} title="Apri in nuova scheda">
              <i className="bi bi-box-arrow-up-right" />
            </a>
            <button className={styles.headerBtn} onClick={onClose} title="Chiudi">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Contenuto */}
        <div className={styles.content}>
          {isImage && (
            <img src={url} alt={filename} className={styles.image} />
          )}

          {isVideo && (
            <video
              src={url}
              controls
              autoPlay
              className={styles.video}
            />
          )}

          {isAudio && (
            <div className={styles.audioWrap}>
              <i className="bi bi-music-note-beamed" style={{ fontSize: '3rem', color: 'var(--text-3)' }} />
              <audio src={url} controls className={styles.audio} />
            </div>
          )}

          {isPdf && (
            <object
              data={url}
              type="application/pdf"
              className={styles.pdf}
            >
              {/* Fallback se il browser blocca l'embed */}
              <div className={styles.fallback}>
                <i className="bi bi-file-pdf" style={{ fontSize: '3rem' }} />
                <p>Il PDF non può essere visualizzato inline.</p>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className={styles.openBtn}>
                  <i className="bi bi-box-arrow-up-right" />
                  Apri il PDF
                </a>
              </div>
            </object>
          )}

          {!isImage && !isVideo && !isPdf && !isAudio && (
            <div className={styles.fallback}>
              <i className="bi bi-file-earmark" style={{ fontSize: '3rem' }} />
              <p className={styles.fallbackName}>{filename}</p>
              <a href={url} download={filename} className={styles.openBtn}>
                <i className="bi bi-download" />
                Scarica il file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}