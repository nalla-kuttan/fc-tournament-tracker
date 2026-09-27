'use client';

import { createTheme } from '@mui/material/styles';
import { BRAND_COLORS } from '@/design-tokens';

export { BRAND_COLORS } from '@/design-tokens';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: BRAND_COLORS.coral,
      light: BRAND_COLORS.coralLight,
      dark: BRAND_COLORS.coralDark,
      contrastText: BRAND_COLORS.ink,
    },
    secondary: {
      main: BRAND_COLORS.frenchBlue,
      light: BRAND_COLORS.frenchBlueLight,
      dark: BRAND_COLORS.frenchBlueDark,
      contrastText: BRAND_COLORS.text,
    },
    success: {
      main: BRAND_COLORS.coral,
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: BRAND_COLORS.frenchBlue,
      contrastText: BRAND_COLORS.text,
    },
    background: {
      default: BRAND_COLORS.background,
      paper: BRAND_COLORS.surface,
    },
    text: {
      primary: BRAND_COLORS.text,
      secondary: BRAND_COLORS.textSecondary,
    },
    divider: 'rgba(201, 185, 190, 0.08)',
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
    // Letter avatars for players without a photo: MUI's default grey with
    // dark text was 4.3:1; ice on French Blue Dark is 12.8:1.
    MuiAvatar: {
      styleOverrides: {
        colorDefault: {
          backgroundColor: BRAND_COLORS.frenchBlueDark,
          color: BRAND_COLORS.text,
          fontWeight: 700,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: BRAND_COLORS.background,
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: BRAND_COLORS.surface,
          border: '1px solid rgba(201, 185, 190, 0.12)',
          boxShadow: 'none',
          borderRadius: 16,
          transition: 'background-color 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: BRAND_COLORS.surface,
          backgroundImage: 'none',
          border: '1px solid rgba(201, 185, 190, 0.12)',
          boxShadow: 'none',
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
          minHeight: 44,
          transition: 'background-color 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        containedPrimary: {
          background: BRAND_COLORS.coral,
          color: BRAND_COLORS.ink,
          boxShadow: '0 3px 8px rgba(234, 108, 86, 0.22)',
          '&:hover': {
            background: BRAND_COLORS.coralLight,
            boxShadow: '0 4px 8px rgba(234, 108, 86, 0.28)',
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            background: 'rgba(234, 108, 86, 0.3)',
            color: 'rgba(18, 8, 12, 0.55)',
          },
        },
        outlined: {
          borderColor: 'rgba(201, 185, 190, 0.2)',
          color: BRAND_COLORS.text,
          '&:hover': {
            borderColor: BRAND_COLORS.coral,
            backgroundColor: 'rgba(234, 108, 86, 0.05)',
          },
        },
        text: {
          color: BRAND_COLORS.coral,
          '&:hover': {
            backgroundColor: 'rgba(234, 108, 86, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          transition: 'background-color 180ms ease, color 180ms ease, transform 180ms ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          background: 'rgba(201, 185, 190, 0.08)',
          border: '1px solid rgba(201, 185, 190, 0.12)',
        },
        filled: {
          background: 'rgba(201, 185, 190, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(201, 185, 190, 0.06)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 700,
          color: '#C9B9BE',
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
          letterSpacing: '0.12em',
          background: 'rgba(201, 185, 190, 0.03)',
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
            color: '#EA6C56',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#EA6C56',
          height: 3,
          borderRadius: '4px 4px 0 0',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: BRAND_COLORS.nightBordeaux,
          border: 'none',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#FFF7F6',
            background: BRAND_COLORS.surfaceRaised,
            borderRadius: 12,
            transition: 'background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
            '& fieldset': {
              borderColor: 'rgba(201, 185, 190, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(201, 185, 190, 0.25)',
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.coral,
              boxShadow: '0 0 0 3px rgba(234, 108, 86, 0.1)',
            },
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: '#C9B9BE',
            opacity: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: 'rgba(36, 16, 25, 0.5)',
          borderRadius: 12,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: 'rgba(36, 16, 25, 0.4)',
          border: '1px solid rgba(201, 185, 190, 0.06)',
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
            background: 'linear-gradient(90deg, #EA6C56, #334075)',
          },
          '& .MuiSlider-thumb': {
            background: '#EA6C56',
            boxShadow: '0 2px 8px rgba(234, 108, 86, 0.3)',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#EA6C56',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root': {
            color: 'rgba(201, 185, 190, 0.2)',
            '&.Mui-active': {
              color: '#EA6C56',
            },
            '&.Mui-completed': {
              color: '#EA6C56',
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(201, 185, 190, 0.12)',
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
          color: '#C9B9BE',
          '&.Mui-selected': {
            color: '#EA6C56',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(201, 185, 190, 0.15)',
          color: '#C9B9BE',
          fontWeight: 600,
          '&.Mui-selected': {
            background: 'rgba(234, 108, 86, 0.12)',
            color: '#EA6C56',
            borderColor: '#EA6C56',
            '&:hover': {
              background: 'rgba(234, 108, 86, 0.18)',
            },
          },
        },
      },
    },
  },
});

export default theme;
