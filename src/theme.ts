'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    // Apple-inspired colors (dark mode)
    primary: {
      main: '#0A84FF', // Apple Blue
      light: '#3498FF',
      dark: '#0056B3',
    },
    secondary: {
      main: '#5AC8FA', // Apple Cyan
      light: '#7AD9FF',
      dark: '#0084FF',
    },
    success: {
      main: '#34C759', // Apple Green
    },
    error: {
      main: '#FF3B30', // Apple Red
    },
    warning: {
      main: '#FF9500', // Apple Orange
    },
    background: {
      default: '#000000', // Pure black (iOS style)
      paper: '#1C1C1E', // Dark gray (macOS style)
    },
    text: {
      primary: '#FFFFFF', // White text
      secondary: '#8E8E93', // Gray text (Apple's secondary gray)
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.3px',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12, // Apple's standard radius
  },
  spacing: 8, // 8px base unit (Apple style)
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#000000',
          minHeight: '100vh',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#1C1C1E', // Apple dark gray
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#1C1C1E',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          background: '#0A84FF',
          color: '#FFFFFF',
          '&:hover': {
            background: '#0056B3',
            boxShadow: '0 8px 24px rgba(10, 132, 255, 0.3)',
          },
          '&:disabled': {
            background: 'rgba(10, 132, 255, 0.5)',
            color: 'rgba(255, 255, 255, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: '#FFFFFF',
          '&:hover': {
            borderColor: '#0A84FF',
            backgroundColor: 'rgba(10, 132, 255, 0.05)',
          },
        },
        text: {
          color: '#0A84FF',
          '&:hover': {
            backgroundColor: 'rgba(10, 132, 255, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.875rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        filled: {
          background: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(255, 255, 255, 0.05)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          color: '#8E8E93',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          background: 'rgba(255, 255, 255, 0.03)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          transition: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            borderBottomColor: '#0A84FF',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#1C1C1E',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#FFFFFF',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0A84FF',
              boxShadow: '0 0 0 3px rgba(10, 132, 255, 0.1)',
            },
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: '#8E8E93',
            opacity: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-track': {
            background: '#0A84FF',
          },
          '& .MuiSlider-thumb': {
            background: '#0A84FF',
            boxShadow: '0 2px 8px rgba(10, 132, 255, 0.3)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#0A84FF',
        },
      },
    },
  },
});

export default theme;
