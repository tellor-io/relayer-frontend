import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DataFeed from './components/DataFeed';
import './styles/fonts.css';
import './styles/surface-tokens.css';
import { createTellorTheme } from './theme/tellorTheme';
import { ThemeModeContext } from './context/ThemeModeContext';

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('tellor-theme') ?? 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('tellor-theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  const theme = useMemo(() => createTellorTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DataFeed />
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default App;
