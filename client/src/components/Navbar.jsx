import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Navbar.module.css';

const APPS = [
  {
    href:  'https://orarioscolastico.netlify.app',
    icon:  'bi-calendar-week',
    label: 'Orario Scolastico',
  },
  // Aggiungere altre app qui
];

export default function Navbar() {
  const { user, logout }         = useAuth();
  const { theme, toggleTheme }   = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]  = useState(false);
  const [appsOpen, setAppsOpen]  = useState(false);
  const menuRef = useRef(null);
  const appsRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (appsRef.current && !appsRef.current.contains(e.target)) setAppsOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const links = [
    { path: '/dashboard',  icon: 'bi-journals',   label: 'Compiti'     },
    { path: '/archive',    icon: 'bi-archive',    label: 'Archivio'    },
    { path: '/statistics', icon: 'bi-bar-chart',  label: 'Statistiche' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.side} />

      {/* Center links */}
      <div className={styles.center}>
        {links.map(l => (
          <button
            key={l.path}
            className={`${styles.navLink} ${location.pathname === l.path ? styles.active : ''}`}
            onClick={() => navigate(l.path)}
            title={l.label}
          >
            <i className={`bi ${l.icon} ${styles.navIcon}`}></i>
            <span className={styles.navLabel}>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Right: apps + theme + user */}
      <div className={`${styles.side} ${styles.sideRight}`}>

        {/* App suite button */}
        <div className={styles.appsWrap} ref={appsRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setAppsOpen(v => !v)}
            title="Suite scolastica"
          >
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </button>

          {appsOpen && (
            <div className={styles.appsMenu}>
              <p className={styles.appsTitle}>Suite scolastica</p>
              <div className={styles.appsGrid}>
                {APPS.map(app => (
                  /* FIX: Aggiunto il tag <a> che mancava prima degli attributi */
                  <a
                    key={app.href}
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.appItem}
                    onClick={() => setAppsOpen(false)}
                  >
                    <div className={styles.appIconBox}>
                      <i className={`bi ${app.icon}`} style={{ fontSize: '1.4rem', color: 'var(--text-1)' }}></i>
                    </div>
                    <span className={styles.appLabel}>{app.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Cambia tema">
          <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`}></i>
        </button>

        {/* User menu */}
        <div className={styles.userWrap} ref={menuRef}>
          <button
            className={`${styles.avatarBtn} ${menuOpen ? styles.avatarOpen : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            title="Account"
          >
            <i className="bi bi-person-circle"></i>
          </button>

          {menuOpen && (
            <div className={styles.userMenu}>
              <div className={styles.userEmail}>
                <i className="bi bi-envelope"></i>
                <span>{user?.email}</span>
              </div>
              <div className={styles.menuDivider} />
              <button className={styles.menuItem}
                onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
                <i className="bi bi-gear"></i>
                Impostazioni
              </button>
              <button className={styles.menuItem}
                onClick={() => { logout(); setMenuOpen(false); }}>
                <i className="bi bi-box-arrow-right"></i>
                Esci
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}