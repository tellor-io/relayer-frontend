import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DataFeed from './components/DataFeed';
import './styles/fonts.css';

const darkTheme = createTheme({
  typography: {
    fontFamily: '"Neue Montreal", sans-serif',
    h4: {
      fontWeight: 'bold',
    },
    subtitle1: {
      fontWeight: 500,
    },
    body2: {
      fontWeight: 400,
    }
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#f6f7f9',
      paper: '#0E5353'
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <DataFeed />
    </ThemeProvider>
  );
}

export default App; 