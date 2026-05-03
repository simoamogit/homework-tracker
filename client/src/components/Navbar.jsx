import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout }         = useAuth();
  const { theme, toggleTheme }   = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]  = useState(false);
  const menuRef   = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const links = [
    { path: '/dashboard', icon: 'bi-journals', label: 'Compiti'  },
    { path: '/archive',   icon: 'bi-archive',  label: 'Archivio' },
  ];

  return (
    <nav className={styles.nav}>
      {/* Left spacer */}
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

      {/* Right: theme + user */}
      <div className={`${styles.side} ${styles.sideRight}`}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="Cambia tema">
          <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`}></i>
        </button>

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
              <button
                className={styles.menuItem}
                onClick={() => { navigate('/settings'); setMenuOpen(false); }}
              >
                <i className="bi bi-gear"></i>
                Impostazioni
              </button>
              <button
                className={styles.menuItem}
                onClick={() => { logout(); setMenuOpen(false); }}
              >
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