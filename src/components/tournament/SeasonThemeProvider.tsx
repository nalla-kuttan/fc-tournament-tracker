'use client';

import { useMemo, type ReactNode } from 'react';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import baseTheme from '@/theme';
import { BRAND_COLORS } from '@/design-tokens';
import { getSeasonKit } from '@/lib/season-theme';

// Re-colours a tournament's pages in its season kit. Only the accent
// changes; surfaces and text stay the app's own.
export default function SeasonThemeProvider({ tournament, children }: { tournament: { id: string; name: string }; children: ReactNode }) {
  const kit = getSeasonKit(tournament);
  const theme = useMemo(() => createTheme(baseTheme, {
    palette: {
      primary: { main: kit.accent, light: kit.accentLight, dark: kit.accentDark, contrastText: BRAND_COLORS.ink },
      success: { main: kit.accent },
    },
    // The base theme writes coral into these directly, so they follow the kit here.
    components: {
      MuiButton: {
        styleOverrides: {
          containedPrimary: {
            background: kit.accent,
            boxShadow: `0 3px 8px ${alpha(kit.accent, 0.22)}`,
            '&:hover': { background: kit.accentLight, boxShadow: `0 4px 8px ${alpha(kit.accent, 0.28)}` },
            '&:disabled': { background: alpha(kit.accent, 0.3) },
          },
          outlined: { '&:hover': { borderColor: kit.accent, backgroundColor: alpha(kit.accent, 0.05) } },
          text: { color: kit.accentLight, '&:hover': { backgroundColor: alpha(kit.accent, 0.08) } },
        },
      },
      MuiTab: { styleOverrides: { root: { '&.Mui-selected': { color: kit.accentLight } } } },
      MuiTabs: { styleOverrides: { indicator: { backgroundColor: kit.accent } } },
    },
  }), [kit]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
