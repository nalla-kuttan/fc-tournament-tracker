import type { Metadata, Viewport } from 'next';
import { Chakra_Petch } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { AdminProvider } from '@/contexts/AdminContext';
import AppShell from '@/components/layout/AppShell';
import DeferredMusicPlayer from '@/components/layout/DeferredMusicPlayer';
import PwaManager from '@/components/pwa/PwaManager';
import DataProvider from '@/components/providers/DataProvider';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FC Tournament Tracker',
  description: 'Manage and track FIFA/FC tournaments with detailed stats and analytics',
  applicationName: 'FC Tracker',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FC Tracker',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={chakraPetch.className}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <DataProvider>
              <AdminProvider>
                <AppShell>{children}</AppShell>
                <DeferredMusicPlayer />
                <PwaManager />
              </AdminProvider>
            </DataProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
