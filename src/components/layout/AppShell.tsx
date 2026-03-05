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
      {/* iOS-style top bar */}
      <AppBar
        position="sticky"
        sx={{
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 } }}>
          {/* Back Button (Conditional) */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {!['/', '/players', '/analytics'].includes(pathname) && (
              <Button
                variant="text"
                startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '1.2rem', ml: 0.5 }} />}
                onClick={() => router.back()}
                sx={{
                  color: '#0A84FF',
                  textTransform: 'none',
                  fontWeight: 400,
                  fontSize: '1rem',
                  p: 0,
                  minWidth: 'auto',
                }}
              >
                Back
              </Button>
            )}
          </Box>

          {/* Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <SportsSoccerIcon sx={{ fontSize: 20, color: '#0A84FF' }} />
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                color: '#FFFFFF',
                letterSpacing: '-0.3px',
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
          px: { xs: 2, sm: 2.5 },
          pt: 2,
          pb: 12, // Space for bottom nav
          maxWidth: 960,
          mx: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Box>

      {/* iOS-style bottom tab bar */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.15)',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
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
              color: '#8E8E93',
              minWidth: 'auto',
              gap: 0,
              pt: 1,
              '&.Mui-selected': {
                color: '#0A84FF',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                fontWeight: 500,
                mt: 0.25,
                '&.Mui-selected': {
                  fontSize: '0.65rem',
                },
              },
              '& .MuiSvgIcon-root': {
                fontSize: 26,
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
