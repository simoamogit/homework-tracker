import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getSettings, updateSettings } from '../services/api';
import styles from './SettingsPage.module.css';

function ListEditor({ title, items, onAdd, onDelete }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim().toUpperCase();
    if (!val || items.includes(val)) return;
    onAdd(val);
    setInput('');
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder="Aggiungi voce..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.addBtn} onClick={handleAdd}>
          Aggiungi
        </button>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>Nessuna voce aggiunta.</p>
      ) : (
        <ul className={styles.list}>
          {items.map(item => (
            <li key={item} className={styles.listItem}>
              <span>{item}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(item)}
              >
                &#x2715;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const [subjects,   setSubjects]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSubjects(res.data.subjects || []);
        setCategories(res.data.categories || []);
      } catch (err) {
        setError('Impossibile caricare le impostazioni.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateSettings(subjects, categories);
      setMessage('Impostazioni salvate.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            ← Torna ai compiti
          </button>
          <div className={styles.titleRow}>
            <h2 className={styles.heading}>Impostazioni</h2>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
          {message && <p className={styles.successMsg}>{message}</p>}
          {error   && <p className={styles.errorMsg}>{error}</p>}
        </div>

        {loading ? (
          <p className={styles.loadingMsg}>Caricamento...</p>
        ) : (
          <div className={styles.card}>
            <ListEditor
              title="Le mie materie"
              items={subjects}
              onAdd={(val)    => setSubjects([...subjects, val])}
              onDelete={(val) => setSubjects(subjects.filter(s => s !== val))}
            />
            <div className={styles.divider} />
            <ListEditor
              title="Le mie categorie"
              items={categories}
              onAdd={(val)    => setCategories([...categories, val])}
              onDelete={(val) => setCategories(categories.filter(c => c !== val))}
            />
          </div>
        )}
      </main>
    </div>
  );
}