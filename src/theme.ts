'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#22C55E', // Green CTA (esports energy)
      light: '#4ADE80',
      dark: '#16A34A',
    },
    secondary: {
      main: '#3B82F6', // Electric blue accent
      light: '#60A5FA',
      dark: '#2563EB',
    },
    success: {
      main: '#22C55E',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    background: {
      default: '#020617', // OLED deep navy-black
      paper: '#0F172A', // Slate-900
    },
    text: {
      primary: '#F8FAFC', // Slate-50
      secondary: '#94A3B8', // Slate-400
    },
    divider: 'rgba(148, 163, 184, 0.08)',
  },
  typography: {
    fontFamily: '"Chakra Petch", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.2px',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
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
    borderRadius: 16,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#020617',
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          borderRadius: 16,
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(34, 197, 94, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.6)',
          backgroundImage: 'none',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          letterSpacing: '0.01em',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.35)',
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            background: 'rgba(34, 197, 94, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: '#F8FAFC',
          '&:hover': {
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34, 197, 94, 0.05)',
          },
        },
        text: {
          color: '#22C55E',
          '&:hover': {
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          backdropFilter: 'blur(8px)',
        },
        filled: {
          background: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(148, 163, 184, 0.06)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          color: '#64748B',
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
          letterSpacing: '0.12em',
          background: 'rgba(148, 163, 184, 0.03)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          transition: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            color: '#22C55E',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#22C55E',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#F8FAFC',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 12,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.25)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#22C55E',
              boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)',
            },
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: '#64748B',
            opacity: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 12,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(148, 163, 184, 0.06)',
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
            background: 'linear-gradient(90deg, #22C55E, #3B82F6)',
          },
          '& .MuiSlider-thumb': {
            background: '#22C55E',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#22C55E',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root': {
            color: 'rgba(148, 163, 184, 0.2)',
            '&.Mui-active': {
              color: '#22C55E',
            },
            '&.Mui-completed': {
              color: '#22C55E',
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(148, 163, 184, 0.12)',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: 'transparent',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#64748B',
          '&.Mui-selected': {
            color: '#22C55E',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(148, 163, 184, 0.15)',
          color: '#94A3B8',
          fontWeight: 600,
          '&.Mui-selected': {
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#22C55E',
            borderColor: '#22C55E',
            '&:hover': {
              background: 'rgba(34, 197, 94, 0.18)',
            },
          },
        },
      },
    },
  },
});

export default theme;
