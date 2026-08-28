import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    icon: 'bi-check2-square',
    title: 'Checklist interattiva',
    desc:  'Segna i compiti completati con un clic. Il progresso giornaliero è sempre visibile.',
  },
  {
    icon: 'bi-calendar3',
    title: 'Vista calendario',
    desc:  'Passa dalla lista alla vista settimanale o mensile con un clic.',
  },
  {
    icon: 'bi-archive',
    title: 'Archivio storico',
    desc:  'I compiti passati vengono archiviati automaticamente e restano sempre consultabili.',
  },
  {
    icon: 'bi-person-lock',
    title: 'Accesso sicuro',
    desc:  'Login con email e password. I tuoi dati sono privati e accessibili da qualsiasi dispositivo.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>

      {/* Minimal top bar */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.brand}>
            <i className="bi bi-journals"></i>
            I Miei Compiti
          </span>
          <div className={styles.headerActions}>
            <button className={styles.btnOutline} onClick={() => navigate('/login')}>
              Accedi
            </button>
            <button className={styles.btnFilled} onClick={() => navigate('/register')}>
              Inizia gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <i className={`bi bi-journals ${styles.heroIcon}`}></i>
        <h1 className={styles.heroTitle}>I tuoi compiti, sempre con te</h1>
        <p className={styles.heroSub}>
          Organizza i compiti scolastici in modo semplice. Accessibile da qualsiasi dispositivo,
          in qualsiasi momento.
        </p>
        <div className={styles.heroCtas}>
          <button className={styles.btnFilled} onClick={() => navigate('/register')}>
            Inizia ora — gratis
          </button>
          <button className={styles.btnOutline} onClick={() => navigate('/login')}>
            Ho già un account
          </button>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Tutto quello che ti serve</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.icon} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <i className={`bi ${f.icon} ${styles.featureIcon}`}></i>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Android — coming soon */}
      <section className={styles.android}>
        <div className={styles.androidInner}>
          <div className={styles.androidLeft}>
            <i className={`bi bi-android2 ${styles.androidIcon}`}></i>
            <div>
              <h2 className={styles.androidTitle}>App Android — In arrivo</h2>
              <p className={styles.androidDesc}>
                L&apos;app nativa per Android e&apos; in sviluppo. Scarica l&apos;APK quando sara&apos; disponibile.
              </p>
            </div>
          </div>
          <button className={styles.androidBtn} disabled>
            <i className="bi bi-download"></i>
            <span>Scarica APK</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>I Miei Compiti &mdash; Tutti i diritti riservati</p>
      </footer>

    </div>
  );
}