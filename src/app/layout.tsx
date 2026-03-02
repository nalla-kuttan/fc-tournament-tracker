import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { AdminProvider } from '@/contexts/AdminContext';
import AppShell from '@/components/layout/AppShell';
import MusicPlayer from '@/components/layout/MusicPlayer';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Tournament Tracker',
  description: 'Manage and track FIFA/FC tournaments with detailed stats and analytics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AdminProvider>
              <AppShell>{children}</AppShell>
              <MusicPlayer />
            </AdminProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
