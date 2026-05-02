import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>I Miei Compiti</span>
      <div className={styles.right}>
        <button
          className={styles.settingsBtn}
          onClick={() => navigate('/settings')}
        >
          Impostazioni
        </button>
        <span className={styles.email}>{user?.email}</span>
        <button onClick={logout} className={styles.logoutBtn}>
          Esci
        </button>
      </div>
    </nav>
  );
}