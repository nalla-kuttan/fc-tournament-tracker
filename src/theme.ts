'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#5ce1ff',
      dark: '#009fcc',
    },
    secondary: {
      main: '#a855f7',
      light: '#c084fc',
      dark: '#7c3aed',
    },
    warning: {
      main: '#ffd700',
      light: '#ffe44d',
      dark: '#ccac00',
    },
    success: {
      main: '#22c55e',
    },
    error: {
      main: '#ef4444',
    },
    background: {
      default: '#0a0a0f',
      paper: '#12121a',
    },
    text: {
      primary: '#e4e4e7',
      secondary: '#a1a1aa',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(168, 85, 247, 0.03) 0%, transparent 50%)',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'transform 250ms ease, box-shadow 250ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00e5ff, #00aadd)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(255, 255, 255, 0.06)',
        },
        head: {
          fontWeight: 700,
          color: '#a1a1aa',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#1a1a2e',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
            },
          },
        },
      },
    },
  },
});

export default theme;
