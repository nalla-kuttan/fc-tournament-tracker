'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Paper from '@mui/material/Paper';

const NAV_ITEMS = [
  { label: 'Tournaments', path: '/', icon: <EmojiEventsIcon /> },
  { label: 'Players', path: '/players', icon: <PeopleIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab
  const activeTab = NAV_ITEMS.findIndex((item) => {
    if (item.path === '/') return pathname === '/';
    return pathname.startsWith(item.path);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Premium frosted glass top bar */}
      <AppBar
        position="sticky"
        sx={{
          background: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 60 }, px: { xs: 1.5, sm: 2.5 } }}>
          {/* Back Button (Conditional) */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {!['/', '/players', '/analytics'].includes(pathname) && (
              <Button
                variant="text"
                startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => router.back()}
                sx={{
                  color: '#22C55E',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    background: 'rgba(34, 197, 94, 0.08)',
                  },
                }}
              >
                Back
              </Button>
            )}
          </Box>

          {/* Title with gradient accent */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <SportsSoccerIcon
              sx={{
                fontSize: 22,
                color: '#22C55E',
                filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))',
              }}
            />
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                color: '#F8FAFC',
                letterSpacing: '0.02em',
                transition: 'color 200ms ease',
                '&:hover': { color: '#22C55E' },
              }}
              onClick={() => router.push('/')}
            >
              FC Tracker
            </Typography>
          </Box>

          {/* Right Spacer for balanced centering */}
          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          pt: 2.5,
          pb: 14,
          maxWidth: 960,
          mx: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Box>

      {/* Premium frosted glass bottom tab bar */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.06)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.3)',
          borderRadius: 0,
        }}
        elevation={0}
      >
        <BottomNavigation
          value={activeTab >= 0 ? activeTab : 0}
          onChange={(_, newValue) => {
            router.push(NAV_ITEMS[newValue].path);
          }}
          sx={{
            background: 'transparent',
            height: 80,
            pb: 2,
            '& .MuiBottomNavigationAction-root': {
              color: '#475569',
              minWidth: 'auto',
              gap: 0,
              pt: 1,
              transition: 'color 200ms ease',
              '&.Mui-selected': {
                color: '#22C55E',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                mt: 0.25,
                '&.Mui-selected': {
                  fontSize: '0.65rem',
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: 26,
                transition: 'transform 200ms ease',
              },
              '&.Mui-selected .MuiSvgIcon-root': {
                filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.3))',
              },
            },
          }}
          showLabels
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
