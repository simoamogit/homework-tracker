import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout }     = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Compiti',       path: '/dashboard' },
    { label: 'Archivio',      path: '/archive'   },
    { label: 'Impostazioni',  path: '/settings'  },
  ];

  const close = () => setOpen(false);

  return (
    <nav className={styles.nav}>
      <span className={styles.brand} onClick={() => { navigate('/dashboard'); close(); }}>
        I Miei Compiti
      </span>

      {/* Desktop */}
      <div className={styles.right}>
        {links.map(l => (
          <button
            key={l.path}
            className={`${styles.navLink} ${location.pathname === l.path ? styles.active : ''}`}
            onClick={() => navigate(l.path)}
          >
            {l.label}
          </button>
        ))}
        <button className={styles.themeBtn} onClick={toggleTheme} title="Cambia tema">
          {theme === 'light' ? '◑' : '◐'}
        </button>
        <span className={styles.email}>{user?.email}</span>
        <button onClick={logout} className={styles.logoutBtn}>Esci</button>
      </div>

      {/* Mobile */}
      <div className={styles.mobileRight}>
        <button className={styles.themeBtn} onClick={toggleTheme}>{theme === 'light' ? '◑' : '◐'}</button>
        <button className={styles.hamburger} onClick={() => setOpen(v => !v)}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className={styles.mobileMenu}>
          {links.map(l => (
            <button
              key={l.path}
              className={`${styles.mobileLink} ${location.pathname === l.path ? styles.active : ''}`}
              onClick={() => { navigate(l.path); close(); }}
            >
              {l.label}
            </button>
          ))}
          <div className={styles.mobileDivider} />
          <span className={styles.mobileEmail}>{user?.email}</span>
          <button className={styles.mobileLogout} onClick={() => { logout(); close(); }}>Esci</button>
        </div>
      )}
    </nav>
  );
}