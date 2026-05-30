import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  // Segui il sistema se non c'è preferenza salvata
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme]         = useState(getInitialTheme);
  const [followSystem, setFollow] = useState(() => !localStorage.getItem('theme'));

  // Ascolta i cambiamenti del tema di sistema
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (followSystem) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [followSystem]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (!followSystem) localStorage.setItem('theme', theme);
  }, [theme, followSystem]);

  const setThemeMode = (mode) => {
    if (mode === 'system') {
      localStorage.removeItem('theme');
      setFollow(true);
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      setFollow(false);
      setTheme(mode);
      localStorage.setItem('theme', mode);
    }
  };

  const toggleTheme = () => setThemeMode(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, followSystem, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}