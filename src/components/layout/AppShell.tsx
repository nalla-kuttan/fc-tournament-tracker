'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import Divider from '@mui/material/Divider';

const NAV_ITEMS = [
  { label: 'Tournaments', path: '/', icon: <EmojiEventsIcon /> },
  { label: 'Players', path: '/players', icon: <PeopleIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (path: string) => {
    router.push(path);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        sx={{
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <SportsSoccerIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => router.push('/')}
          >
            FC Tournament Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: '#12121a',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsSoccerIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700}>
            FC Tracker
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                selected={pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderRight: '3px solid #00d4ff',
                  },
                }}
              >
                <ListItemIcon sx={{ color: pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          maxWidth: 1200,
          mx: 'auto',
          width: '100%',
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
